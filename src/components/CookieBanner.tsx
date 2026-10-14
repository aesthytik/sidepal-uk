"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getConsent, OPEN_CONSENT_EVENT, setConsent, type Consent } from "@/lib/analytics";

/** Asks once for analytics consent; PostHog doesn't run until the visitor accepts. */
export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (consent: Consent) => {
    setConsent(consent);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-[80] rounded-lg border border-border bg-card p-4 text-sm shadow-lg sm:right-auto sm:max-w-md"
    >
      <p className="font-medium text-foreground">Help us improve Horus?</p>
      <p className="mt-1 text-muted-foreground">
        We&apos;d like to use analytics cookies to see how people use the site, including anonymised session
        recordings. Nothing is tracked unless you accept.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => choose("granted")}>Accept</Button>
        <Button size="sm" variant="outline" onClick={() => choose("denied")}>Decline</Button>
      </div>
    </div>
  );
}

/** Footer link that reopens the banner so visitors can change their choice. */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className="text-left hover:text-foreground"
    >
      Cookie settings
    </button>
  );
}
