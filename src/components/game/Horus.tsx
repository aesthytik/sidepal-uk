"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type Mood, emit, useCalm, useGame } from "@/store/useGame";

const MOOD_MS = 2600;
const SLEEP_AFTER_MS = 60_000;

const POKE_QUIPS = ["Ow!", "Hey!", "That's my eye!", "Rude.", "I'm watching you.", "Stop it 😂", "Blink-182?", "Eye see you."];

/**
 * Horus, the Eye: the favicon come to life. The pupil follows the pointer,
 * he blinks, falls asleep when ignored and reacts to what you do.
 */
export function Horus({
  size = 96,
  mood: forced,
  interactive = true,
  say,
  className,
}: {
  size?: number;
  mood?: Mood;
  interactive?: boolean;
  say?: string;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const calm = useCalm();
  const globalMood = useGame((s) => s.mood);
  const moodAt = useGame((s) => s.moodAt);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [local, setLocal] = useState<Mood | null>(null);
  const [quip, setQuip] = useState<string | null>(null);
  const [recent, setRecent] = useState(false); // Showing a global mood
  const pokes = useRef<number[]>([]);
  const lastMove = useRef(0);

  // Show a mood from the game for a moment, then go back to curious
  useEffect(() => {
    if (!moodAt) return;
    setRecent(true);
    const t = setTimeout(() => setRecent(false), MOOD_MS);
    return () => clearTimeout(t);
  }, [moodAt]);

  // Follow the pointer; doze off when nothing happens for a while
  useEffect(() => {
    if (calm) return;
    let raf = 0;
    lastMove.current = Date.now();
    const onMove = (e: PointerEvent) => {
      lastMove.current = Date.now();
      setLocal((m) => (m === "sleepy" ? null : m));
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height * 0.47);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 300);
        setLook({ x: (dx / dist) * 6 * reach, y: (dy / dist) * 4 * reach });
      });
    };
    const sleepy = setInterval(() => {
      if (Date.now() - lastMove.current > SLEEP_AFTER_MS) setLocal((m) => m ?? "sleepy");
    }, 5000);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearInterval(sleepy);
      cancelAnimationFrame(raf);
    };
  }, [calm]);

  // Blink every few seconds
  useEffect(() => {
    if (calm) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, 2200 + Math.random() * 4200);
    };
    schedule();
    return () => clearTimeout(t);
  }, [calm]);

  useEffect(() => {
    if (!quip) return;
    const t = setTimeout(() => setQuip(null), 1400);
    return () => clearTimeout(t);
  }, [quip]);

  const mood: Mood = forced ?? local ?? (recent ? globalMood : "curious");

  function poke() {
    emit({ type: "poke" });
    const now = Date.now();
    pokes.current = [...pokes.current.filter((t) => now - t < 2500), now];
    if (pokes.current.length >= 5) {
      pokes.current = [];
      setLocal("dizzy");
      setQuip("@_@ ...");
      setTimeout(() => setLocal(null), 2400);
    } else {
      setQuip(POKE_QUIPS[Math.floor(Math.random() * POKE_QUIPS.length)]);
      setLocal("shocked");
      setTimeout(() => setLocal((m) => (m === "shocked" ? null : m)), 600);
    }
  }

  const bubble = say ?? quip;
  const pupil = mood === "dizzy" ? { x: 0, y: 0 } : look;
  const eyeOpen = mood === "shocked" ? 1.25 : mood === "sleepy" ? 0.35 : blink ? 0.08 : 1;

  const svg = (
    <svg
      ref={ref}
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      aria-hidden="true"
      className={cn(
        "overflow-visible",
        !calm && mood === "party" && "animate-horus-bounce",
        !calm && mood === "delighted" && "animate-horus-hop",
        !calm && mood === "shocked" && "animate-horus-shake",
        !calm && mood === "curious" && "animate-horus-float"
      )}
    >
      {/* Party hat */}
      {mood === "party" && (
        <g>
          <path d="M24 6 L32 -12 L40 6 Z" fill="#F472B6" />
          <path d="M26.5 1 L37.5 1" stroke="#FCD34D" strokeWidth="2" />
          <circle cx="32" cy="-12" r="2.5" fill="#FCD34D" />
        </g>
      )}
      <rect x="0" y="4" width="64" height="64" rx="15" fill="#3B5BFF" />
      {/* Cheeks */}
      {(mood === "delighted" || mood === "party") && (
        <>
          <ellipse cx="12" cy="46" rx="5" ry="3" fill="#F472B6" opacity="0.7" />
          <ellipse cx="52" cy="46" rx="5" ry="3" fill="#F472B6" opacity="0.7" />
        </>
      )}
      {mood === "delighted" || mood === "party" ? (
        // Happy closed eye: ^
        <path d="M14 38 Q32 18 50 38" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      ) : (
        <g style={{ transform: `scaleY(${eyeOpen})`, transformOrigin: "32px 34px", transition: "transform 90ms ease-out" }}>
          <path d="M8 34C17 20 47 20 56 34C47 48 17 48 8 34Z" fill="#fff" />
          <g
            style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)`, transition: "transform 120ms ease-out" }}
            className={mood === "dizzy" && !calm ? "animate-horus-dizzy" : undefined}
          >
            <circle cx="32" cy="34" r={mood === "shocked" ? 7 : 9.5} fill="#3B5BFF" />
            <circle cx="32" cy="34" r={mood === "shocked" ? 2.5 : 4} fill="#0B1020" />
            <circle cx="35" cy="31" r="1.7" fill="#fff" />
            {mood === "dizzy" && <path d="M27 34a5 5 0 1 1 5 5" fill="none" stroke="#fff" strokeWidth="1.2" />}
          </g>
        </g>
      )}
      <path d="M32 45V54Q32 59 26 59" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      {mood === "sleepy" && (
        <text x="50" y="6" fontSize="12" fontWeight="700" fill="currentColor" className={calm ? undefined : "animate-horus-zzz"}>
          z
        </text>
      )}
    </svg>
  );

  return (
    <span className={cn("relative inline-flex select-none", className)}>
      {interactive ? (
        <button
          type="button"
          onClick={poke}
          aria-label="Poke Horus"
          className="rounded-[22%] transition-transform active:scale-90"
        >
          {svg}
        </button>
      ) : (
        svg
      )}
      {bubble && (
        <span
          role="status"
          className="pointer-events-none absolute -top-2 left-full ml-1 whitespace-nowrap rounded-2xl rounded-bl-none border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-md animate-in fade-in zoom-in-90"
        >
          {bubble}
        </span>
      )}
    </span>
  );
}
