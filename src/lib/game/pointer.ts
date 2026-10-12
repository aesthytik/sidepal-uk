/**
 * One shared pointer listener for every Horus on the page. Mascots read the
 * latest position from here inside their own animation frame instead of each
 * adding a listener and re-rendering on every move.
 */

export interface PointerState {
  x: number;
  y: number;
  seen: boolean; // False until the pointer has moved over the page
  movedAt: number; // ms timestamp of the last move
}

const state: PointerState = { x: 0, y: 0, seen: false, movedAt: 0 };
let users = 0;

function onMove(e: PointerEvent) {
  if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
  state.x = e.clientX;
  state.y = e.clientY;
  state.seen = true;
  state.movedAt = Date.now();
}

/** Starts listening (once, however many callers) and returns a function to stop. */
export function listenToPointer(): () => void {
  if (typeof window === "undefined") return () => {};
  if (users++ === 0) {
    state.movedAt = Date.now();
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  return () => {
    if (--users === 0) window.removeEventListener("pointermove", onMove);
  };
}

export function pointer(): Readonly<PointerState> {
  return state;
}

/** Scales (x, y) back onto the ellipse with radii (rx, ry) if it lies outside it. */
export function clampToEllipse(x: number, y: number, rx: number, ry: number): { x: number; y: number } {
  if (rx <= 0 || ry <= 0) return { x: 0, y: 0 };
  const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
  if (d <= 1) return { x, y };
  const k = 1 / Math.sqrt(d);
  return { x: x * k, y: y * k };
}

/**
 * Where the pupil should sit for a pointer at (dx, dy) from the eye's centre:
 * the direction of the pointer, reaching the edge of the travel ellipse once
 * the pointer is `reach` pixels away.
 */
export function gaze(dx: number, dy: number, rx: number, ry: number, reach = 260): { x: number; y: number } {
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: 0, y: 0 };
  const pull = Math.min(1, dist / reach);
  return clampToEllipse((dx / dist) * rx * pull, (dy / dist) * ry * pull, rx, ry);
}
