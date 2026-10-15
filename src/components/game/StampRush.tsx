"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { confetti, playSound } from "@/lib/game/fx";
import { emit, useCalm, useGame } from "@/store/useGame";
import { Button } from "../ui/button";

const ROUND_SECONDS = 30;
const LIVES = 3;
const PLAYER = 52;

type Rarity = "common" | "rare" | "epic" | "legendary";
const RARITIES: { rarity: Rarity; chance: number; points: number }[] = [
  { rarity: "legendary", chance: 0.04, points: 150 },
  { rarity: "epic", chance: 0.12, points: 50 },
  { rarity: "rare", chance: 0.3, points: 25 },
  { rarity: "common", chance: 1, points: 10 },
];

/** The desk the game is played on, in the brand's light and dark tones. */
interface Theme {
  bg: string;
  rule: string;
  ink: string;
  muted: string;
  tape: string;
  tapeInk: string;
  stamp: Record<Rarity, { fill: string; ink: string }>;
}
const LIGHT: Theme = {
  bg: "#F8F7FF",
  rule: "#E5DEF4",
  ink: "#242039",
  muted: "#625B75",
  tape: "#9B3B31",
  tapeInk: "#FFFFFF",
  stamp: {
    legendary: { fill: "#805012", ink: "#FFFFFF" },
    epic: { fill: "#5934CF", ink: "#FFFFFF" },
    rare: { fill: "#C6F4DC", ink: "#5934CF" },
    common: { fill: "#FFFFFF", ink: "#242039" },
  },
};
const DARK: Theme = {
  bg: "#201B30",
  rule: "#2C253D",
  ink: "#F4F0FF",
  muted: "#BEB4D2",
  tape: "#FFB4A5",
  tapeInk: "#361913",
  stamp: {
    legendary: { fill: "#F5CD86", ink: "#141120" },
    epic: { fill: "#C3AAFF", ink: "#141120" },
    rare: { fill: "#244C40", ink: "#B5F1D2" },
    common: { fill: "#35264F", ink: "#F4F0FF" },
  },
};
const theme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
const RED_TAPE = ["Missing form", "Wrong route", "Expired CoS", "Unpaid fee", "Typo in name", "Lost passport", "B-rated", "No reply"];
const FALLBACK = [
  { id: "", name: "Visa Vibes Ltd" },
  { id: "", name: "Sponsor & Sons" },
  { id: "", name: "Totally Real PLC" },
  { id: "", name: "Certificate Co" },
  { id: "", name: "Big Tech Ltd" },
  { id: "", name: "NHS Trust" },
];

interface Sponsorish {
  id: string;
  name: string;
}

interface Item {
  kind: "stamp" | "tape";
  x: number;
  y: number;
  vy: number;
  rot: number; // Base tilt; stamps wobble around it rather than spinning
  wobble: number;
  w: number;
  h: number;
  label: string;
  rarity: Rarity;
  sponsor?: Sponsorish;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Pop {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface World {
  w: number;
  h: number;
  t: number;
  px: number;
  target: number;
  items: Item[];
  particles: Particle[];
  pops: Pop[];
  spawnIn: number;
  score: number;
  combo: number;
  lives: number;
  shake: number;
  ouch: number;
  keys: { left: boolean; right: boolean };
  legendary: Sponsorish[];
}

function newWorld(w: number, h: number): World {
  return {
    w,
    h,
    t: 0,
    px: w / 2,
    target: w / 2,
    items: [],
    particles: [],
    pops: [],
    spawnIn: 0.4,
    score: 0,
    combo: 0,
    lives: LIVES,
    shake: 0,
    ouch: 0,
    keys: { left: false, right: false },
    legendary: [],
  };
}

function short(name: string) {
  const clean = name.replace(/\s+(limited|ltd|plc|llp|uk|group)\b\.?/gi, "").trim();
  return clean.length > 15 ? `${clean.slice(0, 14)}…` : clean;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHorus(ctx: CanvasRenderingContext2D, x: number, y: number, look: number, ouch: boolean, t: number) {
  const s = PLAYER;
  const bob = Math.sin(t * 8) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#5934CF";
  roundRect(ctx, -s / 2, -s / 2, s, s, 18);
  ctx.fill();
  ctx.fillStyle = "#F8F7FF";
  ctx.beginPath();
  if (ouch) {
    // X_X
    ctx.strokeStyle = "#F8F7FF";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const dx of [-10, 10]) {
      ctx.moveTo(dx - 5, -8);
      ctx.lineTo(dx + 5, 2);
      ctx.moveTo(dx + 5, -8);
      ctx.lineTo(dx - 5, 2);
    }
    ctx.stroke();
  } else {
    ctx.ellipse(0, -4, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#C6F4DC";
    ctx.beginPath();
    ctx.arc(look * 7, -6, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#242039";
    ctx.beginPath();
    ctx.arc(look * 7, -6, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F8F7FF";
    ctx.beginPath();
    ctx.arc(look * 7 + 2.5, -8.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#F8F7FF";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 15);
  ctx.quadraticCurveTo(0, 20, -6, 20);
  ctx.stroke();
  ctx.restore();
}

function drawItem(ctx: CanvasRenderingContext2D, it: Item, t: Theme) {
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate(it.rot + Math.sin(it.wobble) * 0.18);
  if (it.kind === "tape") {
    ctx.fillStyle = t.tape;
    roundRect(ctx, -it.w / 2, -it.h / 2, it.w, it.h, 4);
    ctx.fill();
    ctx.fillStyle = t.tapeInk;
    ctx.font = "bold 11px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`✕ ${it.label}`, 0, 1);
  } else {
    const r = t.stamp[it.rarity];
    ctx.fillStyle = r.fill;
    roundRect(ctx, -it.w / 2, -it.h / 2, it.w, it.h, 4);
    ctx.fill();
    if (it.rarity === "common") {
      ctx.strokeStyle = t.rule;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Perforated postage-stamp edge
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = r.ink;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    roundRect(ctx, -it.w / 2 + 4, -it.h / 2 + 4, it.w - 8, it.h - 8, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = r.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 8px ui-sans-serif, system-ui";
    ctx.fillText(it.rarity === "legendary" ? "★ APPROVED ★" : "VISA", 0, -it.h / 2 + 12);
    ctx.font = "bold 11px ui-sans-serif, system-ui";
    ctx.fillText(it.label, 0, 5);
  }
  ctx.restore();
}

/**
 * Stamp Rush: steer Horus to catch visa stamps from real sponsors while
 * dodging red tape. A canvas game with no dependencies; score turns into XP.
 */
export default function StampRush() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const pool = useRef<Sponsorish[]>(FALLBACK);
  const raf = useRef(0);
  const calm = useCalm();
  const sound = useGame((s) => s.sound);
  const best = useGame((s) => s.stats.bestScore);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [result, setResult] = useState<{ score: number; record: boolean; legendary: Sponsorish[] } | null>(null);
  const settings = useRef({ calm, sound });
  settings.current = { calm, sound };

  // Real A-rated Skilled Worker sponsors become the stamps. Results are alphabetical,
  // so mix a few random pages to avoid a sky full of "Apex …"
  useEffect(() => {
    const visa = encodeURIComponent("Skilled Worker");
    const pages = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 900));
    Promise.all(
      pages.map((page) =>
        fetch(`/api/companies?rating=A&visa=${visa}&limit=15&page=${page}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results: ({ items?: Sponsorish[] } | null)[]) => {
      const names = results.flatMap((d) => d?.items ?? []).map(({ id, name }) => ({ id, name }));
      if (names.length) pool.current = names;
    });
  }, []);

  const resize = useCallback(() => {
    const el = canvas.current;
    const box = wrap.current?.getBoundingClientRect();
    if (!el || !box) return;
    const dpr = window.devicePixelRatio || 1;
    const w = box.width;
    const h = Math.min(420, Math.max(320, w * 0.6));
    el.width = w * dpr;
    el.height = h * dpr;
    el.style.height = `${h}px`;
    el.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (world.current) Object.assign(world.current, { w, h });
    else world.current = newWorld(w, h);
  }, []);

  const finish = useCallback(() => {
    const w = world.current;
    if (!w) return;
    cancelAnimationFrame(raf.current);
    const prevBest = useGame.getState().stats.bestScore;
    const score = Math.round(w.score);
    const record = score > prevBest && score > 0;
    emit({ type: "game", score });
    setResult({ score, record, legendary: w.legendary.filter((s) => s.id).slice(0, 5) });
    setPhase("over");
    if (record) {
      confetti({ calm: settings.current.calm });
      playSound("levelup", settings.current.sound);
    }
  }, []);

  const step = useCallback(
    (dt: number) => {
      const w = world.current;
      if (!w) return;
      const { calm: still, sound: sfx } = settings.current;
      w.t += dt;

      const speed = 560;
      if (w.keys.left) w.target -= speed * dt;
      if (w.keys.right) w.target += speed * dt;
      w.target = Math.max(PLAYER / 2, Math.min(w.w - PLAYER / 2, w.target));
      w.px += (w.target - w.px) * Math.min(1, dt * 14);

      // Spawn faster and nastier as the round goes on
      w.spawnIn -= dt;
      if (w.spawnIn <= 0) {
        w.spawnIn = Math.max(0.3, 0.85 - w.t * 0.018) * (0.7 + Math.random() * 0.6);
        const tape = Math.random() < Math.min(0.42, 0.22 + w.t * 0.007);
        const roll = Math.random();
        const rarity = RARITIES.find((r) => roll < r.chance)!.rarity;
        const sponsor = pool.current[Math.floor(Math.random() * pool.current.length)];
        const label = tape ? RED_TAPE[Math.floor(Math.random() * RED_TAPE.length)] : short(sponsor.name);
        w.items.push({
          kind: tape ? "tape" : "stamp",
          x: 50 + Math.random() * (w.w - 100),
          y: -30,
          vy: 130 + w.t * 7 + Math.random() * 70,
          rot: (Math.random() - 0.5) * 0.3,
          wobble: Math.random() * Math.PI * 2,
          w: tape ? 112 : 100,
          h: tape ? 26 : 46,
          label,
          rarity,
          sponsor: tape ? undefined : sponsor,
        });
      }

      const py = w.h - 42;
      const keep: Item[] = [];
      for (const it of w.items) {
        it.y += it.vy * dt;
        it.wobble += dt * 3;
        const hit = Math.abs(it.x - w.px) < (it.w + PLAYER) / 2 - 10 && Math.abs(it.y - py) < (it.h + PLAYER) / 2 - 8;
        if (hit) {
          if (it.kind === "stamp") {
            const r = RARITIES.find((x) => x.rarity === it.rarity)!;
            const color = theme().stamp[it.rarity].fill;
            w.combo++;
            const mult = Math.min(5, 1 + Math.floor(w.combo / 5));
            const gained = r.points * mult;
            w.score += gained;
            w.pops.push({ x: it.x, y: it.y - 20, text: `+${gained}${mult > 1 ? ` ×${mult}` : ""}`, life: 0.9, color: it.rarity === "common" ? theme().ink : color });
            for (let i = 0; i < (still ? 4 : 10); i++) {
              const a = Math.random() * Math.PI * 2;
              const v = 60 + Math.random() * 200;
              w.particles.push({ x: it.x, y: it.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.6 + Math.random() * 0.4, color: it.rarity === "common" ? theme().muted : color });
            }
            if (it.rarity === "legendary" && it.sponsor && !w.legendary.some((s) => s.name === it.sponsor!.name)) {
              w.legendary.push(it.sponsor);
            }
            playSound(it.rarity === "legendary" ? "powerup" : "coin", sfx);
          } else {
            w.lives--;
            w.combo = 0;
            w.shake = still ? 0 : 0.35;
            w.ouch = 0.5;
            w.pops.push({ x: it.x, y: it.y - 20, text: "Ouch! −1 ♥", life: 1, color: theme().tape });
            playSound("bonk", sfx);
          }
          continue;
        }
        if (it.y > w.h + 40) {
          if (it.kind === "stamp") w.combo = 0;
          continue;
        }
        keep.push(it);
      }
      w.items = keep;

      w.particles = w.particles.filter((p) => (p.life -= dt) > 0);
      for (const p of w.particles) {
        p.vy += 500 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      w.pops = w.pops.filter((p) => (p.life -= dt) > 0);
      for (const p of w.pops) p.y -= 50 * dt;
      w.shake = Math.max(0, w.shake - dt);
      w.ouch = Math.max(0, w.ouch - dt);

      if (w.lives <= 0 || w.t >= ROUND_SECONDS) finish();
    },
    [finish]
  );

  const draw = useCallback(() => {
    const w = world.current;
    const ctx = canvas.current?.getContext("2d");
    if (!w || !ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, w.w, w.h);
    if (w.shake > 0) ctx.translate((Math.random() - 0.5) * 12 * w.shake, (Math.random() - 0.5) * 12 * w.shake);

    const t = theme();
    // A ruled desk blotter
    ctx.fillStyle = t.bg;
    ctx.fillRect(-10, -10, w.w + 20, w.h + 20);
    ctx.fillStyle = t.rule;
    for (let y = 28; y < w.h; y += 28) ctx.fillRect(0, y, w.w, 1);
    ctx.fillRect(0, w.h - 14, w.w, 1);

    for (const it of w.items) drawItem(ctx, it, t);
    for (const p of w.particles) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    ctx.globalAlpha = 1;

    const nearest = w.items.filter((i) => i.kind === "stamp").sort((a, b) => b.y - a.y)[0];
    const look = nearest ? Math.max(-1, Math.min(1, (nearest.x - w.px) / 120)) : 0;
    drawHorus(ctx, w.px, w.h - 42, look, w.ouch > 0, w.t);

    ctx.textAlign = "center";
    ctx.font = "bold 16px ui-sans-serif, system-ui";
    for (const p of w.pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    // HUD
    ctx.textAlign = "left";
    ctx.fillStyle = t.ink;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(Math.round(w.score).toLocaleString("en-GB"), 16, 32);
    ctx.font = "bold 12px ui-sans-serif, system-ui";
    ctx.fillStyle = t.stamp.epic.fill;
    if (w.combo >= 5) ctx.fillText(`COMBO ×${Math.min(5, 1 + Math.floor(w.combo / 5))}`, 16, 50);
    ctx.textAlign = "right";
    ctx.fillStyle = t.muted;
    ctx.font = "600 15px ui-sans-serif, system-ui";
    ctx.fillText(`⏱ ${Math.max(0, Math.ceil(ROUND_SECONDS - w.t))}s`, w.w - 16, 30);
    ctx.fillStyle = t.tape;
    ctx.fillText("♥".repeat(Math.max(0, w.lives)) + "♡".repeat(LIVES - Math.max(0, w.lives)), w.w - 16, 52);
    ctx.restore();
  }, []);

  const start = useCallback(() => {
    resize();
    const w = world.current!;
    world.current = newWorld(w.w, w.h);
    draw(); // Resizing cleared the canvas; don't wait for the first frame
    setResult(null);
    setPhase("playing");
    playSound("powerup", settings.current.sound);
    canvas.current?.focus();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        step(dt);
        draw();
      }
      if (world.current && world.current.lives > 0 && world.current.t < ROUND_SECONDS) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, [resize, step, draw]);

  // Size the canvas and draw an idle frame
  useEffect(() => {
    resize();
    draw();
    const onResize = () => {
      resize();
      draw();
    };
    // Repaint in the new palette if the OS switches between light and dark
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("resize", onResize);
    scheme.addEventListener("change", draw);
    return () => {
      window.removeEventListener("resize", onResize);
      scheme.removeEventListener("change", draw);
      cancelAnimationFrame(raf.current);
    };
  }, [resize, draw]);

  // Arrow keys / A-D steer while playing; Space starts a round
  useEffect(() => {
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const w = world.current;
      if (!w) return;
      if (phase !== "playing") {
        if (down && e.code === "Space" && document.activeElement === canvas.current) {
          e.preventDefault();
          start();
        }
        return;
      }
      if (["ArrowLeft", "KeyA"].includes(e.code)) w.keys.left = down;
      else if (["ArrowRight", "KeyD"].includes(e.code)) w.keys.right = down;
      else return;
      e.preventDefault();
    };
    const down = onKey(true);
    const up = onKey(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, start]);

  function onPointer(e: React.PointerEvent<HTMLCanvasElement>) {
    if (phase !== "playing" || !world.current) return;
    const box = e.currentTarget.getBoundingClientRect();
    world.current.target = e.clientX - box.left;
  }

  return (
    <div ref={wrap} className="game-surface relative overflow-hidden rounded-lg bg-card">
      <canvas
        ref={canvas}
        tabIndex={0}
        role="img"
        aria-label="Stamp Rush game. Use the left and right arrow keys or drag to move Horus, catch visa stamps, avoid red tape."
        className="block w-full touch-none outline-none"
        onPointerMove={onPointer}
        onPointerDown={onPointer}
      />

      {phase !== "playing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 p-6 text-center text-foreground">
          {phase === "idle" ? (
            <>
              <p className="font-display text-4xl font-semibold sm:text-5xl">
                Stamp <span className="text-primary">Rush</span>
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Catch visa stamps from <strong>real sponsors</strong>. Dodge the red tape. Gold stamps are legendary.
                <br />
                <span className="text-xs">← → or drag · {ROUND_SECONDS} seconds · 3 lives</span>
              </p>
              <Button size="lg" onClick={start}>
                Start
              </Button>
              {best > 0 && <p className="text-xs text-muted-foreground">Your best: {best.toLocaleString("en-GB")}</p>}
            </>
          ) : (
            result && (
              <div aria-live="polite" className="flex flex-col items-center gap-3">
                <p className="eyebrow">Game over</p>
                <p className="font-display text-5xl font-semibold">{result.score.toLocaleString("en-GB")}</p>
                {result.record ? (
                  <p className="rounded bg-gold/10 px-2.5 py-1 text-sm font-medium text-gold">New high score</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Best: {best.toLocaleString("en-GB")}</p>
                )}
                <p className="text-sm font-medium text-sage">+{Math.min(150, Math.floor(result.score / 10))} XP</p>
                {result.legendary.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Gold stamps you caught (they&apos;re real sponsors!):</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {result.legendary.map((s) => (
                        <Link
                          key={s.id}
                          href={`/sponsors?q=${encodeURIComponent(s.name)}`}
                          className="rounded border border-gold/40 px-2.5 py-1 text-gold hover:bg-gold/10"
                        >
                          ★ {s.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <Button size="lg" onClick={start} className="mt-1">
                  Play again
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
