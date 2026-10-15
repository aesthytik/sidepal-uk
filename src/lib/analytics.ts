import type { PostHog } from "posthog-js";

let posthog: PostHog | null = null;
let loading: Promise<void> | null = null;
let sessionConsent: Consent | null = null;

export type Consent = "granted" | "denied";

const CONSENT_KEY = "horus-analytics-consent";
/** Fired to reopen the cookie banner (e.g. from the footer's "Cookie settings" link). */
export const OPEN_CONSENT_EVENT = "horus:open-cookie-settings";

export function getConsent(): Consent | null {
  if (sessionConsent) return sessionConsent;
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(consent: Consent) {
  sessionConsent = consent;
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Storage blocked: the choice still applies for this page view
  }
  if (consent === "granted") startAnalytics();
  else if (posthog?.__loaded) posthog.opt_out_capturing();
}

/** Starts PostHog. Only called once the visitor has accepted analytics cookies. */
export function startAnalytics() {
  // Skipped in local dev so it doesn't pollute data
  if (process.env.NODE_ENV !== "production" || getConsent() !== "granted") return;
  if (posthog) {
    activateAnalytics(posthog);
    return;
  }
  // Keep the analytics SDK out of the first page load, including for visitors who decline.
  loading ??= import("posthog-js")
    .then(({ default: client }) => {
      posthog = client;
      // Consent may have changed while the chunk was downloading.
      if (getConsent() === "granted") activateAnalytics(client);
    })
    .catch(() => { /* Analytics failure must not affect the app. */ })
    .finally(() => { loading = null; });
}

function activateAnalytics(client: PostHog) {
  if (client.__loaded) {
    client.opt_in_capturing();
    return;
  }
  // Public project key (safe to ship to the browser)
  client.init("phc_AU2aBmvCCFh3r8oPrbYTeN3EnCV9xAYxaCkERztXRhk4", {
    // Proxied through our own domain (see next.config.ts) so ad blockers don't drop events
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
  });
}
