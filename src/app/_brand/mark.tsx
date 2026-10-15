/** Shared Horus eye badge. Keep icon.svg and the animated mascot in sync. */
export function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="22" fill="#5934CF" />
      <path d="M8 30C17 16 47 16 56 30C47 44 17 44 8 30Z" fill="#F8F7FF" />
      <circle cx="32" cy="30" r="10" fill="#C6F4DC" />
      <circle cx="32" cy="30" r="4.5" fill="#242039" />
      <circle cx="35" cy="27" r="1.8" fill="#FFFFFF" />
      <path d="M32 41V50Q32 55 26 55" fill="none" stroke="#F8F7FF" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 6v8m-4-4h8" stroke="#FFD6B0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const OG_SIZE = { width: 1200, height: 630 };

/** ImageResponse's built-in sans keeps social images independent of font services. */
export function SocialCard() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F8F7FF", color: "#242039", padding: "52px 64px", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", right: -50, top: -80, width: 510, height: 510, borderRadius: "50%", background: "#EDE6FF", display: "flex" }} />
      <div style={{ position: "absolute", right: 70, top: 92, width: 230, height: 230, borderRadius: 80, background: "#C6F4DC", transform: "rotate(12deg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Mark size={150} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mark size={64} />
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -2 }}>Horus</span>
        <span style={{ marginLeft: 24, border: "1px solid #8C819F", borderRadius: 40, padding: "10px 18px", fontSize: 20, color: "#4B259E" }}>Your next chapter</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 82, lineHeight: 1.05, fontWeight: 700, letterSpacing: -4 }}>Big plans.</span>
        <span style={{ fontSize: 82, lineHeight: 1.05, fontWeight: 700, letterSpacing: -4, color: "#5934CF" }}>Clear next steps.</span>
        <span style={{ marginTop: 10, fontSize: 32, color: "#625B75" }}>Find UK employers that can sponsor your work visa.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #DCD5EC", paddingTop: 22, fontSize: 22 }}>
        <span>Official sponsor data. A little momentum.</span>
        <span style={{ color: "#5934CF", fontWeight: 700 }}>horus.to</span>
      </div>
    </div>
  );
}
