"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ElementType, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "./ui/icons";

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

/** Fades its content up 30px when it enters the viewport. `delay` staggers siblings. */
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

/** Square arrow buttons used by the carousels, which sit on forest-green bands. */
function ArrowButton({ dir, onClick, disabled, label }: { dir: "prev" | "next"; onClick: () => void; disabled: boolean; label: string }) {
  const Icon = dir === "prev" ? ArrowLeftIcon : ArrowRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-[11px] bg-white text-black transition-colors hover:bg-lime disabled:bg-white/50 disabled:text-black/50"
    >
      <Icon width={16} height={16} />
    </button>
  );
}

/**
 * A horizontal, snap-scrolling row of cards with arrow buttons and an optional "01 / 05" counter.
 * Children are the slides; they keep their own widths.
 */
export function Carousel({ children, label, counter = false, className }: { children: ReactNode[]; label: string; counter?: boolean; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const total = children.length;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.offsetWidth + 16 : el.clientWidth;
      setIndex(Math.min(total - 1, Math.round(el.scrollLeft / step)));
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [total]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    el.scrollBy({ left: dir * (first.offsetWidth + 16) });
  };

  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} className="carousel-track pb-1">
        {children.map((child, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${total}`}>
            {child}
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-end gap-6">
        {counter && (
          <p className="font-display text-2xl tabular-nums" aria-live="polite">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        )}
        <div className="flex gap-3">
          <ArrowButton dir="prev" label="Previous" onClick={() => go(-1)} disabled={index === 0} />
          <ArrowButton dir="next" label="Next" onClick={() => go(1)} disabled={atEnd} />
        </div>
      </div>
    </div>
  );
}

/** Arrow keys move between siblings in a tab list or accordion; Home/End jump to the ends. */
function rovingKeys(e: KeyboardEvent<HTMLElement>, count: number, current: number, select: (i: number) => void) {
  let to: number | null = null;
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") to = (current - 1 + count) % count;
  else if (e.key === "ArrowDown" || e.key === "ArrowRight") to = (current + 1) % count;
  else if (e.key === "Home") to = 0;
  else if (e.key === "End") to = count - 1;
  if (to === null) return;
  e.preventDefault();
  select(to);
  e.currentTarget.closest("[data-roving-group]")?.querySelectorAll<HTMLElement>("[data-roving]")[to]?.focus();
}

export type TabItem = { id: string; label: string; content: ReactNode };

/** Big text tabs down the left (grey until selected), the selected panel beside them. */
export function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  return (
    <div className="grid gap-10 lg:grid-cols-[20rem_1fr] lg:items-start">
      <div role="tablist" aria-label={label} aria-orientation="vertical" data-roving-group="" className="flex flex-col items-start gap-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-roving=""
            id={`${base}-tab-${item.id}`}
            aria-controls={`${base}-panel-${item.id}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => rovingKeys(e, items.length, active, setActive)}
            className={cn(
              "text-left font-display text-[28px] font-medium leading-tight tracking-[-0.02em] transition-colors sm:text-[34px]",
              i === active ? "text-black" : "text-black/45 hover:text-black/70"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div key={item.id} role="tabpanel" id={`${base}-panel-${item.id}`} aria-labelledby={`${base}-tab-${item.id}`} hidden={i !== active}>
          {item.content}
        </div>
      ))}
    </div>
  );
}

export type AccordionItem = { id: string; title: string; summary: string; icon: ReactNode; chip: string; body: ReactNode };

/** Rows of white cards; the open one turns forest green and shows its body. One open at a time. */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState(1);
  const base = useId();
  return (
    <div className="flex flex-col gap-4" data-roving-group="">
      {items.map((item, i) => {
        const isOpen = i === open;
        return (
          <div key={item.id} className={cn("rounded-[15px] transition-colors", isOpen ? "bg-primary text-white" : "bg-white text-black")}>
            <h3>
              <button
                type="button"
                data-roving=""
                id={`${base}-head-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-body-${item.id}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                onKeyDown={(e) => rovingKeys(e, items.length, i, setOpen)}
                className="flex w-full items-start gap-4 px-6 py-5 text-left"
              >
                <span className={cn("mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-black [&_svg]:size-5", item.chip)}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[22px] font-medium tracking-[-0.02em]">{item.title}</span>
                  <span className={cn("mt-0.5 block text-sm", isOpen ? "text-white/85" : "text-black/70")}>{item.summary}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn("mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-[8px]", isOpen ? "bg-white text-black" : "bg-muted")}
                >
                  <ArrowRightIcon width={14} height={14} className={cn("transition-transform", !isOpen && "rotate-90")} />
                </span>
              </button>
            </h3>
            <div id={`${base}-body-${item.id}`} role="region" aria-labelledby={`${base}-head-${item.id}`} hidden={!isOpen} className="px-6 pb-6 sm:pl-[4.75rem]">
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
