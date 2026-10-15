import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ __loaded: false, init: vi.fn(), opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn() }));
vi.mock("posthog-js", () => ({ default: client }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  client.__loaded = false;
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("localStorage", { getItem: vi.fn(() => null), setItem: vi.fn() });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("deferred analytics", () => {
  it("does not initialise analytics without consent", async () => {
    const analytics = await import("./analytics");
    analytics.startAnalytics();
    analytics.setConsent("denied");
    await vi.dynamicImportSettled();
    expect(client.init).not.toHaveBeenCalled();
  });

  it("initialises once after consent, even if startup is requested twice", async () => {
    const analytics = await import("./analytics");
    analytics.setConsent("granted");
    analytics.startAnalytics();
    await vi.dynamicImportSettled();
    expect(client.init).toHaveBeenCalledTimes(1);
  });

  it("respects consent withdrawn while the SDK is loading", async () => {
    const analytics = await import("./analytics");
    analytics.setConsent("granted");
    analytics.setConsent("denied");
    await vi.dynamicImportSettled();
    expect(client.init).not.toHaveBeenCalled();
  });

  it("opts out an already initialised client", async () => {
    const analytics = await import("./analytics");
    analytics.setConsent("granted");
    await vi.dynamicImportSettled();
    client.__loaded = true;
    analytics.setConsent("denied");
    expect(client.opt_out_capturing).toHaveBeenCalledOnce();
  });

  it("keeps the visitor's choice for this page if storage is blocked", async () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Blocked"); } });
    const analytics = await import("./analytics");
    analytics.setConsent("granted");
    await vi.dynamicImportSettled();
    expect(analytics.getConsent()).toBe("granted");
    expect(client.init).toHaveBeenCalledOnce();
  });
});
