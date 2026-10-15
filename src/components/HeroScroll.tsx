"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The home hero. On wide screens with motion allowed, it pins while you scroll: the intro and its
 * floating labels blur out, the photo shrinks away, and the statement with its cards blurs in.
 * Everywhere else the statement simply follows the hero in normal flow.
 */
export function HeroScroll({ intro, statement }: { intro: ReactNode; statement: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || document.documentElement.classList.contains("calm")) return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)", () => {
      el.classList.add("hero-pinned");
      const q = gsap.utils.selector(el);
      const hidden = { opacity: 0, filter: "blur(15px)", scale: 0.85 };
      const shown = { opacity: 1, filter: "blur(0px)", scale: 1 };

      const tl = gsap.timeline({
        // Starts under the 72px sticky nav
        scrollTrigger: { trigger: el, start: "top 72px", end: "+=150%", scrub: 1, pin: true, anticipatePin: 1 },
        defaults: { ease: "none" },
      });
      tl.to(q("[data-hero-copy]"), { ...hidden, duration: 1 }, 0)
        .to(q("[data-hero-label]"), { ...hidden, duration: 0.8, stagger: 0.04 }, 0)
        .to(q("[data-hero-photo]"), { scale: 0.6, yPercent: -25, opacity: 0, filter: "blur(15px)", duration: 1.2 }, 0.3)
        .fromTo(q("[data-hero-statement] h2"), hidden, { ...shown, duration: 1 }, 0.9)
        .fromTo(q("[data-pain]"), hidden, { ...shown, duration: 0.8, stagger: 0.06 }, 1);

      return () => el.classList.remove("hero-pinned");
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="hero-scroll relative">
      <div className="hero-stage relative">
        <div data-hero-intro="">{intro}</div>
        <div data-hero-statement="">{statement}</div>
      </div>
    </section>
  );
}
