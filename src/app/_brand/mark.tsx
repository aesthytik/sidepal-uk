/** The Horus mark for generated images (next/og renders a subset of HTML/SVG). */
export function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#1F5C4A" />
      <path d="M8 30C17 16 47 16 56 30C47 44 17 44 8 30Z" fill="#F6F3EC" />
      <circle cx="32" cy="30" r="9.5" fill="#3E7E68" />
      <circle cx="32" cy="30" r="4.2" fill="#1A1A17" />
      <circle cx="35" cy="27" r="1.6" fill="#F6F3EC" />
      <path d="M32 41V50Q32 55 26 55" fill="none" stroke="#F6F3EC" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export const OG_SIZE = { width: 1200, height: 630 };

/** The social card: paper background, mark, wordmark and the promise. */
export function SocialCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F6F3EC",
        color: "#1A1A17",
        padding: "72px 80px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Mark size={88} />
        <span style={{ fontSize: 56, fontWeight: 600 }}>Horus</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 600, letterSpacing: -1 }}>Stop searching blind.</span>
        <span style={{ fontSize: 44, lineHeight: 1.2, color: "#6B675E" }}>Find UK jobs that can sponsor your visa.</span>
      </div>
      <div style={{ display: "flex", borderTop: "2px solid #E2DDD2", paddingTop: 24, fontSize: 26, color: "#1F5C4A", fontFamily: "sans-serif" }}>
        Every licensed sponsor on the Home Office register · horus.to
      </div>
    </div>
  );
}
