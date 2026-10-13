import { describe, expect, it } from "vitest";
import { extractProfile } from "./extract";
import { canonicalSkill, countMentions } from "./skills";
import { sanitizeProfile } from "./types";

const now = new Date("2026-10-13T12:00:00Z");

const ENGINEER_CV = `Priya Sharma
Senior Software Engineer
Manchester, UK · priya@example.com

Full-stack developer with 6+ years of experience building TypeScript and React apps on AWS.
Currently on a Graduate visa.

Experience
Software Engineer, Acme Ltd, London — Jan 2021 – Present
Built Node.js microservices, Docker, Kubernetes and PostgreSQL. Led the move to Next.js.
Junior Developer, Widgets, Manchester — Sep 2019 - Dec 2020
JavaScript, React, REST APIs and CI/CD with GitHub Actions.`;

const NURSE_CV = `Grace Okoro
Registered Nurse (NMC PIN 12A3456E)
Birmingham

Staff Nurse, City Hospital — 03/2018 to 06/2022
Patient care on a busy ICU ward, medication administration, care planning and safeguarding.
Nurse, General Hospital Lagos — 2014 - 2017
Phlebotomy and cannulation. Basic Life Support certified.`;

describe("extractProfile", () => {
  it("reads an engineer's CV", () => {
    const p = extractProfile(ENGINEER_CV, now);
    expect(p.skills).toEqual(expect.arrayContaining(["TypeScript", "React", "AWS", "Node.js", "Docker", "Kubernetes", "SQL", "Next.js", "CI/CD"]));
    expect(p.roles[0]).toBe("software");
    expect(p.places).toEqual(expect.arrayContaining(["manchester", "london"]));
    expect(p.yearsExperience).toBe(6);
    expect(p.visaStatus).toBe("graduate");
    expect(p.headline).toBe("Senior Software Engineer");
  });

  it("reads a nurse's CV, adding up experience from dates", () => {
    const p = extractProfile(NURSE_CV, now);
    expect(p.roles).toContain("health");
    expect(p.skills).toEqual(expect.arrayContaining(["NMC registration", "Patient care", "ICU", "Medication administration", "Safeguarding", "Phlebotomy"]));
    expect(p.places).toEqual(["birmingham"]);
    expect(p.yearsExperience).toBe(8); // 4y4m + 4y
    expect(p.visaStatus).toBe("unknown");
  });

  it("finds nothing in an empty CV", () => {
    expect(extractProfile("", now)).toMatchObject({ skills: [], roles: [], places: [], yearsExperience: undefined });
  });
});

describe("skills", () => {
  it("matches whole words, including symbols", () => {
    expect(countMentions("C++ and C# on .NET", "C++")).toBe(1);
    expect(countMentions("C++ and C# on .NET", "C#")).toBe(1);
    expect(countMentions("C++ and C# on .NET", ".NET")).toBe(1);
    expect(countMentions("JavaScript developer", "Java")).toBe(0);
  });
  it("ignores everyday words that are also skill names", () => {
    expect(countMentions("Swift is my favourite language", "Swift")).toBe(1);
    expect(countMentions("a swift reply to the rest of the team", "Swift")).toBe(0);
    expect(countMentions("the rest of the team", "REST APIs")).toBe(0);
    expect(countMentions("Let's go", "Go")).toBe(0);
    expect(countMentions("Golang services", "Go")).toBe(1);
  });
  it("matches skills the user typed that aren't in the table", () => {
    expect(countMentions("Experience with Pulumi is a plus", "Pulumi")).toBe(1);
  });
  it("normalises spelling", () => {
    expect(canonicalSkill("reactjs")).toBe("React");
    expect(canonicalSkill("Pulumi")).toBe("Pulumi");
  });
});

describe("sanitizeProfile", () => {
  it("drops unknown roles, places and bad numbers", () => {
    const p = sanitizeProfile({ skills: ["React", "React", 3], roles: ["software", "wizard"], places: ["london", "atlantis"], minSalary: -5, visaStatus: "alien" });
    expect(p).toMatchObject({ skills: ["React"], roles: ["software"], places: ["london"], minSalary: undefined, visaStatus: "unknown", remoteOk: true });
  });
});
