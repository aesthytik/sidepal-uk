import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { complete } from "./openrouter";

const ok = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

describe("complete", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("falls through to the next model when a reply is rejected", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok("bad")).mockResolvedValueOnce(ok("good"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(complete("s", "u", { accept: (r) => r === "good" })).resolves.toBe("good");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls through on HTTP errors such as a removed model", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 404 })).mockResolvedValueOnce(ok("reply"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(complete("s", "u")).resolves.toBe("reply");
  });

  it("throws when every model's reply is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ok("bad")));
    await expect(complete("s", "u", { accept: () => false })).rejects.toThrow(/Unusable reply/);
  });

  it("stops trying models once the overall budget is spent", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok("bad"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(complete("s", "u", { budgetMs: 500, accept: () => false })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("complete model order", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses a task's preferred models unless OPENROUTER_MODEL is set", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "");
    const fetchMock = vi.fn().mockImplementation(async () => ok("reply"));
    vi.stubGlobal("fetch", fetchMock);
    await complete("s", "u", { models: ["first/model"] });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("first/model");

    vi.stubEnv("OPENROUTER_MODEL", "env/model");
    await complete("s", "u", { models: ["first/model"] });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe("env/model");
  });
});

describe("complete race mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the first accepted reply and cancels the others", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "");
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model as string;
      signals.push(init.signal!);
      if (model === "slow") return new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
      return Promise.resolve(ok(model === "good" ? "good" : "bad"));
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(complete("s", "u", { models: ["slow", "bad", "good"], race: true, accept: (r) => r === "good" })).resolves.toBe("good");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(signals.every((s) => s.aborted)).toBe(true);
  });

  it("fails when no model's reply is accepted", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ok("bad")));
    await expect(complete("s", "u", { models: ["a", "b"], race: true, accept: () => false })).rejects.toThrow(/Unusable reply/);
  });
});
