import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { aiEnabled, complete } from "@/lib/ai/openrouter";
import { allow } from "@/lib/ai/rateLimit";
import { POST } from "./route";

vi.mock("@/lib/ai/openrouter", () => ({ aiEnabled: vi.fn(), complete: vi.fn() }));
vi.mock("@/lib/ai/rateLimit", () => ({ allow: vi.fn() }));

const body = {
  title: "Engineer",
  company: "Acme Ltd",
  description: "A React engineering role, building reporting dashboards and collaborating with designers and other engineers to improve the product.",
  profile: { skills: ["React"], visaStatus: "graduate" },
};
const answer = {
  themes: [{
    theme: "Working on products",
    questions: ["technical", "behavioural"].map((type) => ({
      question: type === "technical" ? "How would you build a dashboard?" : "Tell me about collaborating with a designer.",
      type,
      evidence: null,
      star: { situation: null, task: null, action: null, result: null },
      gaps: ["Add a real example from your experience."],
    })),
  }],
  employerQuestions: ["What would success look like?", "Does this role offer sponsorship?"],
};
const request = (value: unknown) => new NextRequest("http://localhost/api/ai/interview-prep", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-forwarded-for": "192.0.2.1, 192.0.2.2" },
  body: JSON.stringify(value),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(allow).mockReturnValue(true);
  vi.mocked(aiEnabled).mockReturnValue(true);
  vi.mocked(complete).mockResolvedValue(JSON.stringify(answer));
});

describe("POST /api/ai/interview-prep", () => {
  it("validates the model response and adds a profile-specific visa script without caching", async () => {
    const res = await POST(request(body));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ ...answer, sponsorshipScript: expect.stringContaining("currently on a Graduate visa") });
    expect(allow).toHaveBeenCalledWith("interview-prep:192.0.2.1");
    expect(complete).toHaveBeenCalledOnce();
    expect(JSON.parse(vi.mocked(complete).mock.calls[0][1]).candidate.profile.visaStatus).toBe("graduate");
  });

  it("rejects insufficient input before using AI or the limiter", async () => {
    const res = await POST(request({ ...body, profile: null }));
    expect(res.status).toBe(400);
    expect(complete).not.toHaveBeenCalled();
    expect(allow).not.toHaveBeenCalled();
  });

  it("handles invalid JSON", async () => {
    const res = await POST(new NextRequest("http://localhost/api/ai/interview-prep", { method: "POST", body: "{broken" }));
    expect(res.status).toBe(400);
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns a rate-limit response before making a provider call", async () => {
    vi.mocked(allow).mockReturnValue(false);
    const res = await POST(request(body));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(complete).not.toHaveBeenCalled();
  });

  it("handles an unconfigured provider", async () => {
    vi.mocked(aiEnabled).mockReturnValue(false);
    expect((await POST(request(body))).status).toBe(503);
    expect(complete).not.toHaveBeenCalled();
  });

  it.each(["not JSON", JSON.stringify({ themes: [] })])("rejects malformed model replies", async (text) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      vi.mocked(complete).mockResolvedValue(text);
      expect((await POST(request(body))).status).toBe(503);
      expect(log).toHaveBeenCalledWith("AI interview prep failed");
    } finally {
      log.mockRestore();
    }
  });

  it("does not log or return provider errors that might contain CV data", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      vi.mocked(complete).mockRejectedValue(new Error("PRIVATE CV CONTENT"));
      const res = await POST(request(body));
      expect(res.status).toBe(503);
      expect(JSON.stringify(await res.json())).not.toContain("PRIVATE");
      expect(log).toHaveBeenCalledWith("AI interview prep failed");
    } finally {
      log.mockRestore();
    }
  });
});
