import posthog from "posthog-js";

// Public project key (safe to ship to the browser). Skipped in local dev so it doesn't pollute data
if (process.env.NODE_ENV === "production") {
  posthog.init("phc_AU2aBmvCCFh3r8oPrbYTeN3EnCV9xAYxaCkERztXRhk4", {
    // Proxied through our own domain (see next.config.ts) so ad blockers don't drop events
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
  });
}
