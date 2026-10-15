"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { gaze, listenToPointer, pointer } from "@/lib/game/pointer";
import { type Mood, emit, useCalm, useGame } from "@/store/useGame";

const MOOD_MS = 2400;
const SLEEP_AFTER_MS = 60_000;
// How far the iris may travel inside the eye, in SVG units. The iris is clipped
// to the eye's outline, so it can reach the edge without spilling out.
const TRAVEL_X = 9;
const TRAVEL_Y = 4.5;
const EYE_CENTRE = { x: 32, y: 34 };

const INK = "#000000";
const PAPER = "#FFFFFF";
const TILE = "#224B17";
const IRIS = "#68E246";
const CLAY = "#C00000";
const GOLD = "#FFB82A";

const POKE_QUIPS = ["Ow!", "Hey!", "That's my eye!", "Rude.", "I'm watching you.", "Eye see you."];

const EYE_PATH = "M8 34C17 20 47 20 56 34C47 48 17 48 8 34Z";

function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/**
 * Horus, the eye: the brand mark come to life. On desktop the iris follows the
 * pointer, staying inside the eye; he blinks, dozes when ignored and reacts to
 * what you do. Tracking writes straight to the SVG, so moving the mouse never
 * re-renders React.
 */
export function Horus({
  size = 96,
  mood: forced,
  interactive = true,
  track,
  say,
  className,
}: {
  size?: number;
  mood?: Mood;
  interactive?: boolean;
  track?: boolean; // Defaults to on for mascots big enough to see the eye move
  say?: string;
  className?: string;
}) {
  const clip = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const iris = useRef<SVGGElement>(null);
  const lid = useRef<SVGGElement>(null);
  const calm = useCalm();
  const fine = useFinePointer();
  const globalMood = useGame((s) => s.mood);
  const moodAt = useGame((s) => s.moodAt);
  const [local, setLocal] = useState<Mood | null>(null);
  const [recent, setRecent] = useState(false);
  const [quip, setQuip] = useState<string | null>(null);
  const pokes = useRef<number[]>([]);

  const tracking = (track ?? size >= 56) && fine && !calm;
  const mood: Mood = forced ?? local ?? (recent ? globalMood : "curious");
  const eyeOpen = mood !== "delighted" && mood !== "party";
  const sleepy = mood === "sleepy";
  const canTrack = tracking && eyeOpen && mood !== "dizzy";

  // Show a mood from the game for a moment, then settle back to curious
  useEffect(() => {
    if (!moodAt) return;
    setRecent(true);
    const t = setTimeout(() => setRecent(false), MOOD_MS);
    return () => clearTimeout(t);
  }, [moodAt]);

  // Follow the pointer. Measures the static wrapper (never the animated SVG),
  // only while on screen, and eases toward the target each frame.
  useEffect(() => {
    if (!canTrack) {
      iris.current?.setAttribute("transform", "translate(0 0)");
      return;
    }
    const el = wrap.current;
    if (!el) return;
    const stop = listenToPointer();
    let centre = { x: 0, y: 0, scale: 1 };
    let visible = false;
    let raf = 0;
    let last = performance.now();
    const pos = { x: 0, y: 0 };

    const measure = () => {
      const box = el.getBoundingClientRect();
      // The eye sits 34/72 of the way down the mascot
      centre = { x: box.left + box.width / 2, y: box.top + (box.height * EYE_CENTRE.y) / 72, scale: box.width / 64 };
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = pointer();
      const target = p.seen ? gaze((p.x - centre.x) / centre.scale, (p.y - centre.y) / centre.scale, TRAVEL_X, TRAVEL_Y, 160) : { x: 0, y: 0 };
      const k = 1 - Math.exp(-dt * 14); // Frame-rate independent easing
      const nx = pos.x + (target.x - pos.x) * k;
      const ny = pos.y + (target.y - pos.y) * k;
      if (Math.abs(nx - pos.x) > 0.01 || Math.abs(ny - pos.y) > 0.01) {
        pos.x = nx;
        pos.y = ny;
        iris.current?.setAttribute("transform", `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`);
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      measure();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else pause();
    });
    io.observe(el);
    const onVisibility = () => (document.hidden ? pause() : start());
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      pause();
      io.disconnect();
      stop();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canTrack]);

  // Blink now and then, straight on the SVG (not while dozing: the lid is already half shut)
  useEffect(() => {
    if (calm || !eyeOpen || sleepy) return;
    let t: ReturnType<typeof setTimeout>;
    const close = `translate(0 ${EYE_CENTRE.y}) scale(1 0.08) translate(0 ${-EYE_CENTRE.y})`;
    const schedule = () => {
      t = setTimeout(() => {
        lid.current?.setAttribute("transform", close);
        setTimeout(() => lid.current?.removeAttribute("transform"), 120);
        schedule();
      }, 3000 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(t);
  }, [calm, eyeOpen, sleepy]);

  // Doze off after a minute without the pointer moving; wake when it does
  useEffect(() => {
    if (calm || !tracking) return;
    const stop = listenToPointer();
    const check = setInterval(() => {
      const idle = Date.now() - pointer().movedAt > SLEEP_AFTER_MS;
      setLocal((m) => (idle ? m ?? "sleepy" : m === "sleepy" ? null : m));
    }, 1500);
    return () => {
      clearInterval(check);
      stop();
    };
  }, [calm, tracking]);

  useEffect(() => {
    if (!quip) return;
    const t = setTimeout(() => setQuip(null), 1400);
    return () => clearTimeout(t);
  }, [quip]);

  function poke() {
    emit({ type: "poke" });
    const now = Date.now();
    pokes.current = [...pokes.current.filter((t) => now - t < 2500), now];
    if (pokes.current.length >= 5) {
      pokes.current = [];
      setLocal("dizzy");
      setQuip("@_@");
      setTimeout(() => setLocal(null), 2200);
    } else {
      setQuip(POKE_QUIPS[Math.floor(Math.random() * POKE_QUIPS.length)]);
      setLocal("shocked");
      setTimeout(() => setLocal((m) => (m === "shocked" ? null : m)), 700);
    }
  }

  const bubble = say ?? quip;
  const shocked = mood === "shocked";

  const svg = (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      aria-hidden="true"
      className={cn(
        "overflow-visible",
        !calm && mood === "party" && "animate-horus-bounce",
        !calm && mood === "delighted" && "animate-horus-hop",
        !calm && shocked && "animate-horus-shake"
      )}
    >
      <defs>
        <clipPath id={clip}>
          <path d={EYE_PATH} />
        </clipPath>
      </defs>
      <g className={!calm && mood === "curious" ? "animate-horus-float" : undefined}>
        {mood === "party" && (
          <g>
            <path d="M24 6 L32 -10 L40 6 Z" fill={CLAY} />
            <path d="M26.5 1 L37.5 1" stroke={GOLD} strokeWidth="2" />
            <circle cx="32" cy="-10" r="2.5" fill={GOLD} />
          </g>
        )}
        <rect x="0" y="4" width="64" height="64" rx="16" fill={TILE} />
        <path d="M48 10v8m-4-4h8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
        {!eyeOpen && (
          <>
            <ellipse cx="12" cy="46" rx="5" ry="3" fill={CLAY} opacity="0.45" />
            <ellipse cx="52" cy="46" rx="5" ry="3" fill={CLAY} opacity="0.45" />
            {/* Happy closed eye: ^ */}
            <path d="M14 38 Q32 20 50 38" fill="none" stroke={PAPER} strokeWidth="5" strokeLinecap="round" />
          </>
        )}
        {eyeOpen && (
          <g ref={lid} transform={sleepy ? `translate(0 ${EYE_CENTRE.y}) scale(1 0.35) translate(0 ${-EYE_CENTRE.y})` : undefined}>
            <path d={EYE_PATH} fill={PAPER} />
            <g clipPath={`url(#${clip})`}>
              <g ref={iris}>
                <g className={mood === "dizzy" && !calm ? "animate-horus-dizzy" : undefined}>
                  <circle cx="32" cy="34" r={shocked ? 7 : 9.5} fill={IRIS} />
                  <circle cx="32" cy="34" r={shocked ? 2.5 : 4.2} fill={INK} />
                  <circle cx="35" cy="31" r="1.6" fill={PAPER} />
                  {mood === "dizzy" && <path d="M27 34a5 5 0 1 1 5 5" fill="none" stroke={PAPER} strokeWidth="1.2" />}
                </g>
              </g>
            </g>
          </g>
        )}
        <path d="M32 45V54Q32 59 26 59" fill="none" stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
      </g>
      {sleepy && (
        <text x="52" y="6" fontSize="11" fontWeight="600" fill="currentColor" opacity="0.7">
          z
        </text>
      )}
    </svg>
  );

  return (
    <span ref={wrap} className={cn("relative inline-flex select-none", className)}>
      {interactive ? (
        <button type="button" onClick={poke} aria-label="Poke Horus" className="rounded-[22%]">
          {svg}
        </button>
      ) : (
        svg
      )}
      {bubble && (
        <span
          role="status"
          className="pointer-events-none absolute -top-2 left-full ml-2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground animate-in fade-in"
        >
          {bubble}
        </span>
      )}
    </span>
  );
}
