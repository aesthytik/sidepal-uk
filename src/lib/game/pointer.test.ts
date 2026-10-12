import { describe, expect, it } from "vitest";
import { clampToEllipse, gaze } from "./pointer";

const inside = (p: { x: number; y: number }, rx: number, ry: number) => (p.x * p.x) / (rx * rx) + (p.y * p.y) / (ry * ry) <= 1 + 1e-9;

describe("clampToEllipse", () => {
  it("leaves points inside alone", () => {
    expect(clampToEllipse(1, 1, 8, 4)).toEqual({ x: 1, y: 1 });
  });

  it("pulls points outside back onto the edge, keeping direction", () => {
    const p = clampToEllipse(100, 0, 8, 4);
    expect(p.x).toBeCloseTo(8);
    expect(p.y).toBeCloseTo(0);
    const q = clampToEllipse(30, 30, 8, 4);
    expect(inside(q, 8, 4)).toBe(true);
    expect(q.x / q.y).toBeCloseTo(1);
  });

  it("handles a degenerate ellipse", () => {
    expect(clampToEllipse(5, 5, 0, 4)).toEqual({ x: 0, y: 0 });
  });
});

describe("gaze", () => {
  it("looks straight ahead when the pointer is on the eye", () => {
    expect(gaze(0, 0, 8, 4)).toEqual({ x: 0, y: 0 });
  });

  it("never leaves the travel ellipse, wherever the pointer is", () => {
    for (const [dx, dy] of [[5000, 0], [0, -5000], [-3000, 3000], [120, 40], [-7, 2]]) {
      expect(inside(gaze(dx, dy, 8, 4), 8, 4)).toBe(true);
    }
  });

  it("moves further as the pointer moves away, up to the edge", () => {
    const near = gaze(50, 0, 8, 4).x;
    const far = gaze(200, 0, 8, 4).x;
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
    expect(gaze(10_000, 0, 8, 4).x).toBeCloseTo(8);
  });
});
