/** Shared Horus eye badge. Keep icon.svg and the animated mascot in sync. */
export function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#2C3235" />
      <path d="M8 30C17 16 47 16 56 30C47 44 17 44 8 30Z" fill="#FCFCFC" />
      <circle cx="32" cy="30" r="10" fill="#8FB2FF" />
      <circle cx="32" cy="30" r="4.5" fill="#16181D" />
      <circle cx="35" cy="27" r="1.8" fill="#FFFFFF" />
      <path d="M32 41V50Q32 55 26 55" fill="none" stroke="#FCFCFC" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 6v8m-4-4h8" stroke="#8FB2FF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const OG_SIZE = { width: 1200, height: 630 };

/** ImageResponse's built-in sans keeps social images independent of font services. */
export function SocialCard() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FCFCFC", color: "#16181D", padding: "52px 64px", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", right: -50, top: -80, width: 510, height: 510, borderRadius: "50%", background: "#E9E9FA", display: "flex" }} />
      <div style={{ position: "absolute", right: 70, top: 92, width: 230, height: 230, borderRadius: 80, background: "#FFFFFF", boxShadow: "0 40px 80px -40px rgba(39,95,206,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><Mark size={150} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mark size={64} />
        <span style={{ fontSize: 44, fontWeight: 400, letterSpacing: -1 }}>Horus</span>
        <span style={{ marginLeft: 24, border: "1px solid #868E94", borderRadius: 40, padding: "10px 18px", fontSize: 20, color: "#2A3C9C" }}>Your next chapter</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 86, lineHeight: 1.0, fontWeight: 400, letterSpacing: -3 }}>Big plans.</span>
        <span style={{ fontSize: 86, lineHeight: 1.0, fontWeight: 400, letterSpacing: -3, color: "#596167" }}>Clear next steps.</span>
        <span style={{ marginTop: 10, fontSize: 32, color: "#596167" }}>Find UK employers that can sponsor your work visa.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #E3E6E8", paddingTop: 22, fontSize: 22 }}>
        <span>Official sponsor data. A little momentum.</span>
        <span style={{ color: "#275FCE", fontWeight: 700 }}>horus.to</span>
      </div>
    </div>
  );
}
