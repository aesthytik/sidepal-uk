import { describe, expect, it } from "vitest";
import { ROLE_IDS, occupationPath } from "../seo";
import { OCCUPATIONS, occupationByCode } from "./index";
import { ROLE_OCCUPATIONS, hourly, occupationAnswer, occupationFaq, relatedOccupations } from "./content";

const occ = (code: string) => occupationByCode(code)!;

describe("occupationAnswer", () => {
  it("answers with the going rate and new-entrant rate", () => {
    const a = occupationAnswer(occ("2134"));
    expect(a).toMatch(/^For a Skilled Worker visa in SOC 2134 \(programmers and software development professionals\), you need a salary of at least/);
    expect(a).toContain(`£${occ("2134").goingRate!.toLocaleString("en-GB")}`);
    expect(a).toContain(`£${occ("2134").newEntrantRate!.toLocaleString("en-GB")}`);
  });
  it("says when the general minimum is higher than the going rate", () => {
    expect(occupationAnswer(occ("3544"))).toMatch(/general minimum, which is above/);
    expect(occupationAnswer(occ("3544"))).toMatch(/Temporary Shortage List/);
  });
  it("explains closed and ineligible occupations", () => {
    expect(occupationAnswer(occ("5434"))).toMatch(/no longer be sponsored for new Skilled Worker applicants/);
    expect(occupationAnswer(occ("8211"))).toMatch(/cannot be sponsored/);
    expect(occupationAnswer(occ("2237"))).toMatch(/£25,000/);
  });
  it("produces an answer for every occupation", () => {
    for (const o of OCCUPATIONS) expect(occupationAnswer(o).length).toBeGreaterThan(40);
  });
});

describe("occupation pages", () => {
  it("have unique paths that start with the code", () => {
    const paths = OCCUPATIONS.map(occupationPath);
    expect(new Set(paths).size).toBe(paths.length);
    expect(occupationPath(occ("2134"))).toBe("/visa-salary-checker/2134-programmers-and-software-development-professionals");
  });
  it("have FAQs and related links", () => {
    expect(occupationFaq(occ("2134")).length).toBeGreaterThanOrEqual(3);
    expect(relatedOccupations(occ("2134")).every((o) => o.code.startsWith("213"))).toBe(true);
  });
  it("map every role family to real codes", () => {
    for (const role of ROLE_IDS) for (const code of ROLE_OCCUPATIONS[role]) expect(occupationByCode(code), `${role} ${code}`).toBeDefined();
  });
  it("formats hourly rates for a 37.5-hour week", () => {
    expect(hourly(39_000)).toBe("£20.00");
  });
});
