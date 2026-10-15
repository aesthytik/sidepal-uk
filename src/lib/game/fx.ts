/**
 * Confetti and sound effects, with no dependencies. Both are no-ops when the
 * caller says the user wants calm, or when there is no browser.
 */

// Brand confetti: violet, mint, apricot, lilac and ink.
const COLORS = ["#68E246", "#FC57E5", "#10A3FF", "#FFB82A", "#BE77FF", "#224B17"];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  spin: number;
  angle: number;
  life: number;
  shape: "rect" | "circle" | "eye";
}

let canvas: HTMLCanvasElement | null = null;
let pieces: Piece[] = [];
let frame = 0;

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "100" });
    document.body.appendChild(canvas);
  }
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== innerWidth * dpr) {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  }
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function tick() {
  const ctx = ensureCanvas();
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces = pieces.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  for (const p of pieces) {
    p.vy += 0.25;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.spin;
    p.life -= 1;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 40);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === "eye") {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
      ctx.fillStyle = "#224B17";
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  }
  frame = pieces.length ? requestAnimationFrame(tick) : 0;
  if (!pieces.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
}

/** Bursts confetti from a point (defaults to the centre-top of the screen). */
export function confetti(opts: { x?: number; y?: number; count?: number; calm?: boolean } = {}) {
  if (opts.calm || typeof window === "undefined") return;
  const x = opts.x ?? innerWidth / 2;
  const y = opts.y ?? innerHeight / 3;
  const count = Math.round((opts.count ?? 140) * 0.6); // A gentle sprinkle, not a storm
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    pieces.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: 6 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      spin: (Math.random() - 0.5) * 0.4,
      angle: Math.random() * Math.PI,
      life: 120 + Math.random() * 60,
      shape: i % 17 === 0 ? "eye" : i % 3 === 0 ? "circle" : "rect",
    });
  }
  if (!frame) frame = requestAnimationFrame(tick);
}

let audio: AudioContext | null = null;

type Sound = "blip" | "coin" | "levelup" | "bonk" | "powerup";

const TUNES: Record<Sound, [number, number][]> = {
  blip: [[880, 0.06]],
  coin: [[988, 0.07], [1319, 0.18]],
  bonk: [[180, 0.12], [110, 0.18]],
  powerup: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.16]],
  levelup: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.1], [784, 0.08], [1047, 0.3]],
};

/** Plays a tiny square-wave tune. Browsers only allow audio after a user gesture. */
export function playSound(sound: Sound, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    audio ??= new AudioContext();
    let t = audio.currentTime;
    for (const [freq, dur] of TUNES[sound]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur * 0.9;
    }
  } catch {
    // Audio is a nicety
  }
}
