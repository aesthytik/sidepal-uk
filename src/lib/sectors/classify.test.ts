import { describe, expect, it } from "vitest";
import { classifyByName } from "./classify";
import { isRoleId, isSectorId, roleFamily } from "./taxonomy";

describe("classifyByName", () => {
  it.each([
    ["Sunrise Care Homes Ltd", "health"],
    ["Acme Software Limited", "tech"],
    ["Smith & Jones Solicitors", "finance"],
    ["St Mary's Primary School", "education"],
    ["Royal Tandoori Restaurant", "hospitality"],
    ["ABC Recruitment Services", "recruitment"],
    ["Greenfield Construction", "engineering"],
    ["Grace Community Church", "charity"],
  ])("%s -> %s", (name, sector) => {
    expect(classifyByName(name)).toBe(sector);
  });
  it("lets specific sectors win over broad ones", () => {
    expect(classifyByName("Care Software Ltd")).toBe("health");
    expect(classifyByName("Tech Recruitment Ltd")).toBe("recruitment");
  });
  it("leaves unclear names unclassified", () => {
    expect(classifyByName("Acme Ltd")).toBeUndefined();
  });
});

describe("taxonomy", () => {
  it("validates ids and matches job titles", () => {
    expect(isSectorId("tech")).toBe(true);
    expect(isSectorId("nope")).toBe(false);
    expect(isRoleId("software")).toBe(true);
    expect(roleFamily("health")?.titles.test("Registered Nurse")).toBe(true);
    expect(roleFamily("software")?.titles.test("Senior Software Engineer")).toBe(true);
  });
});
