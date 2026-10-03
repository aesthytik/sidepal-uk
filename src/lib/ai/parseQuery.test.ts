import { describe, expect, it } from "vitest";
import { sanitise } from "./parseQuery";

const places = (name: string) => name;

describe("sanitise", () => {
  it("keeps valid filters", () => {
    expect(sanitise({ location: "Manchester", visa: "skilled worker", rating: "A" }, places)).toEqual({
      location: "Manchester",
      visa: "Skilled Worker",
      rating: "A",
    });
  });
  it("drops invalid visa and rating", () => {
    expect(sanitise({ visa: "Golden Ticket", rating: "B" }, places)).toEqual({});
  });
  it("drops unknown locations", () => {
    expect(sanitise({ location: "Atlantis" }, () => undefined)).toEqual({});
  });
  it("ignores non-objects", () => {
    expect(sanitise(null, places)).toEqual({});
    expect(sanitise("x", places)).toEqual({});
  });
});

import { lastJsonObject } from "./json";

describe("lastJsonObject", () => {
  it("takes the last valid object, ignoring thinking-aloud braces", () => {
    expect(lastJsonObject('e.g. { "1": "x", ... } then {"1":"health"}')).toEqual({ "1": "health" });
  });
  it("returns null when there is no JSON", () => {
    expect(lastJsonObject("nothing here")).toBeNull();
  });
});
