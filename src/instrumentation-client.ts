import { getConsent, startAnalytics } from "@/lib/analytics";

// Returning visitors who already accepted; everyone else waits for the cookie banner
if (getConsent() === "granted") startAnalytics();
