import { describe, expect, it } from "vitest";
import { lastJsonObject } from "./json";

describe("lastJsonObject nested responses", () => {
  it("returns the final complete outer object", () => {
    expect(lastJsonObject('Example {"a":1} then {"themes":[{"star":{"action":"Built it"}}]}')).toEqual({ themes: [{ star: { action: "Built it" } }] });
  });

  it("ignores braces and escaped quotes inside strings", () => {
    const value = { text: 'Explain {braces}, a "quote", and a backslash \\', star: { result: null } };
    expect(lastJsonObject(JSON.stringify(value))).toEqual(value);
  });

  it("recovers a valid response after invalid example braces", () => {
    expect(lastJsonObject('Thought {not JSON} and {"unclosed": then {"answer":{"valid":true}}')).toEqual({ answer: { valid: true } });
  });

  it("preserves flat response behaviour", () => {
    expect(lastJsonObject('prefix { "1": "x", ... } then {"1":"health"}')).toEqual({ "1": "health" });
    expect(lastJsonObject("nothing")).toBeNull();
  });
});
