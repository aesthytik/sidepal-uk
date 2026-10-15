"use client";

import { useEffect, useId, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** True when the OS asks for less motion or the user has switched on Calm mode. */
function prefersStill() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm");
}

/** Sets `data-in` on the element the first time it scrolls into view; CSS does the rest. */
function useRevealOnView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-in", "");
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Blurs, fades and lifts its content in when it enters the viewport. `delay` staggers siblings. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRevealOnView<HTMLElement>();
  return (
    <Tag ref={ref} data-reveal="" className={className} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Heading text whose words sharpen into place one after another. */
export function BlurWords({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: ElementType }) {
  const ref = useRevealOnView<HTMLElement>();
  return (
    <Tag ref={ref} data-blur-words="" className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ "--i": i } as CSSProperties}>
          {word}{" "}
        </span>
      ))}
    </Tag>
  );
}

/** A paragraph that fills in word by word as it scrolls through the viewport. */
export function ScrollFill({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersStill()) {
      el.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts filling as the paragraph enters the lower part of the screen; done by the time it nears the top
      const p = (vh * 0.85 - rect.top) / (rect.height + vh * 0.35);
      el.style.setProperty("--p", String(Math.min(1, Math.max(0, p))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <p ref={ref} data-scroll-fill="" className={className} style={{ "--n": words.length } as CSSProperties}>
      {words.map((word, i) => (
        <span key={i} style={{ "--i": i } as CSSProperties}>
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

const HOLD_MS = 2600;
const MORPH_MS = 1000;

/**
 * Cycles through `words`, melting one into the next with a blur and an SVG alpha threshold.
 * Screen readers and still-motion users only ever get the first word.
 */
export function MorphWord({ words, className }: { words: string[]; className?: string }) {
  // useId keeps the filter id identical on server and client; strip characters url(#…) can't take
  const id = `morph${useId().replace(/[^\w-]/g, "")}`;
  const a = useRef<HTMLSpanElement>(null);
  const b = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cur = a.current;
    const next = b.current;
    if (!cur || !next || words.length < 2 || prefersStill()) return;

    let index = 0;
    let start = performance.now();
    let frame = 0;
    const show = (el: HTMLSpanElement, f: number) => {
      // Classic morph curve: sharp at the ends, heavily blurred in the middle
      el.style.filter = f <= 0 ? "blur(100px)" : `blur(${Math.min(8 / f - 8, 100)}px)`;
      el.style.opacity = `${Math.pow(f, 0.4) * 100}%`;
    };
    cur.textContent = words[0];
    next.textContent = words[1];
    show(cur, 1);
    show(next, 0);

    const tick = (now: number) => {
      const t = now - start;
      if (t > HOLD_MS) {
        const f = Math.min(1, (t - HOLD_MS) / MORPH_MS);
        show(next, f);
        show(cur, 1 - f);
        if (f === 1) {
          index = (index + 1) % words.length;
          cur.textContent = words[index];
          next.textContent = words[(index + 1) % words.length];
          show(cur, 1);
          show(next, 0);
          start = now;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [words]);

  return (
    <span className={cn("relative inline-grid", className)}>
      <span className="sr-only">{words[0]}</span>
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <filter id={id}>
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
      {/* Every word sits in the same grid cell, so the line is as wide as the longest one and never jumps */}
      {words.map((w) => (
        <span key={w} aria-hidden="true" className="invisible col-start-1 row-start-1">
          {w}
        </span>
      ))}
      <span aria-hidden="true" className="relative col-start-1 row-start-1" style={{ filter: `url(#${id}) blur(0.6px)` }}>
        <span ref={a} className="absolute left-0 top-0">{words[0]}</span>
        <span ref={b} className="absolute left-0 top-0" style={{ opacity: 0 }} />
      </span>
    </span>
  );
}
