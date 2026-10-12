"use client";

import { emit } from "@/store/useGame";

/** An external link that counts toward the game when clicked (used from server components). */
export function TrackedLink({
  event,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { event: "apply-click" | "careers-click"; href: string }) {
  return <a {...props} onClick={() => emit({ type: event, url: props.href })} />;
}
