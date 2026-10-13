import { describe, expect, it } from "vitest";
import { OCCUPATIONS, occupationByCode, salaryRule } from "./index";
import { cleanTitle, matchOccupation, rankOccupations } from "./match";

const code = (title: string) => matchOccupation(title)?.occupation.code ?? null;

describe("snapshot", () => {
  it("has the key tables", () => {
    const count = (s: string) => OCCUPATIONS.filter((o) => o.status === s).length;
    expect(count("eligible")).toBeGreaterThan(80);
    expect(count("shortage")).toBeGreaterThan(40);
    expect(count("health-education")).toBeGreaterThan(20);
    expect(count("ineligible")).toBeGreaterThan(100);
    expect(occupationByCode("2134")).toMatchObject({ status: "eligible", goingRate: expect.any(Number), newEntrantRate: expect.any(Number) });
  });
});

describe("cleanTitle", () => {
  it("drops seniority, location and trailing detail", () => {
    expect(cleanTitle("Senior DevOps Engineer - London (Hybrid)")).toBe("devop engineer");
    expect(cleanTitle("Staff Software Engineer, Infrastructure - Python & Kubernetes")).toBe("software engineer");
  });
});

describe("matchOccupation", () => {
  it.each([
    ["Senior Software Engineer", "2134"],
    ["Staff Software Engineer, Infrastructure - Python & Kubernetes", "2134"],
    ["Senior Full Stack Engineer (Vue3, TypeScript)", "2134"],
    ["Frontend Developer", "2134"],
    ["Machine Learning Engineer", "2134"],
    ["Senior DevOps Engineer", "2139"],
    ["Site Reliability Engineer", "2139"],
    ["Data Engineer", "2133"],
    ["Solutions Architect", "2133"],
    ["Data Scientist", "2433"],
    ["Data Analyst", "3544"],
    ["QA Engineer", "2136"],
    ["Senior Security Engineer", "2135"],
    ["Engineering Manager", "2132"],
    ["Senior Product Manager", "2132"],
    ["Product Designer", "2141"],
    ["Registered Nurse", "2237"],
    ["Mental Health Nurse", "2235"],
    ["Primary school teacher", "2314"],
    ["Civil Engineer", "2121"],
    ["Structural Engineer", "2121"],
    ["Mechanical Engineer", "2122"],
    ["Quantity Surveyor", "2453"],
    ["Chartered Accountant", "2421"],
    ["Solicitor", "2412"],
    ["Care Worker", "6135"],
    ["HGV Class 1 Driver", "8211"],
    ["Head Chef", "5434"],
    ["Physiotherapist", "2221"],
    ["Pharmacist", "2251"],
    ["Architect", "2451"],
    ["Principal Architect", "2133"],
    ["Head of Sales", "1132"],
    ["Research Scientist", "2162"],
    ["Design Engineer", "2122"],
    ["Software Engineering Internship 2027", "2134"],
    ["Barista | Victoria Station", "9266"],
  ])("%s -> %s", (title, expected) => {
    expect(code(title)).toBe(expected);
  });

  it("returns null when nothing fits", () => {
    expect(code("Wizard of Light")).toBeNull();
    expect(code("")).toBeNull();
  });

  it("ranks candidates for the checker", () => {
    const top = rankOccupations("biomedical scientist", 3);
    expect(top[0].occupation.code).toBe("2113");
  });
});

describe("salaryRule", () => {
  const dev = occupationByCode("2134")!;
  it("uses the higher of the going rate and the general minimum", () => {
    expect(salaryRule(dev)).toMatchObject({ eligible: true, minimum: Math.max(41_700, dev.goingRate!) });
  });
  it("uses 70% of the going rate for new entrants", () => {
    expect(salaryRule(dev, { newEntrant: true }).minimum).toBe(dev.newEntrantRate);
  });
  it("only lets existing Skilled Workers use pre-July-2025 occupations", () => {
    const chef = occupationByCode("5434")!;
    expect(salaryRule(chef).eligible).toBe(false);
    expect(salaryRule(chef, { existingWorker: true }).eligible).toBe(true);
  });
  it("never allows ineligible occupations", () => {
    expect(salaryRule(occupationByCode("8211")!, { existingWorker: true }).eligible).toBe(false);
  });
  it("uses the £25,000 floor for health and education", () => {
    expect(salaryRule(occupationByCode("2237")!).minimum).toBe(25_000);
  });
});
