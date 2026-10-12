import { describe, expect, it } from "vitest";
import { placeOf } from "./geocode";

const id = (location: string) => {
  const p = placeOf(location);
  return p && p !== "remote" ? p.id : p;
};

describe("placeOf", () => {
  it("places the common ways of writing a UK city", () => {
    expect(id("London")).toBe("london");
    expect(id("London, England, United Kingdom")).toBe("london");
    expect(id("UK - London")).toBe("london");
    expect(id("London (Shoreditch)")).toBe("london");
    expect(id("City of London Corporation, GBR")).toBe("london");
    expect(id("Hybrid - Newcastle upon Tyne, England, United Kingdom")).toBe("newcastle");
    expect(id("Stoke-on-Trent, United Kingdom")).toBe("stoke");
    expect(id("Kingston-upon-Thames, Greater London")).toBe("london");
  });

  it("maps regions and counties to their main city", () => {
    expect(id("North West England")).toBe("manchester");
    expect(id("Gwynedd, North Wales")).toBe("bangor");
    expect(id("Ashby de la Zouch, Leicestershire")).toBe("leicester");
  });

  it("takes the first UK place in a multi-city list", () => {
    expect(id("London / Stockholm")).toBe("london");
    expect(id("Stockholm / London")).toBe("london");
    expect(id("New York, San Francisco, Munich or London")).toBe("london");
  });

  it("doesn't confuse foreign places with UK ones", () => {
    expect(id("Sydney, New South Wales, Australia")).toBeNull();
    expect(id("Perth, Western Australia, Australia")).toBeNull();
    expect(id("Somerville, MA / Durham, NC / London, UK")).toBe("london");
    expect(id("Montreal, Jersey, London, Warsaw")).toBe("london");
    expect(id("London / New York")).toBe("london");
    expect(id("North East Scotland")).toBe("remote");
  });

  it("trusts shared names when the UK is named or nothing foreign is", () => {
    expect(id("Cambridge, UK")).toBe("cambridge");
    expect(id("Cambridge")).toBe("cambridge");
    expect(id("Austin, Texas, United States; Cambridge, England, United Kingdom")).toBe("cambridge");
    expect(id("New York Office / Cambridge Office")).toBeNull();
  });

  it("treats UK-wide and remote roles as remote", () => {
    expect(id("United Kingdom")).toBe("remote");
    expect(id("Remote - UK")).toBe("remote");
    expect(id("Remote")).toBe("remote");
    expect(id("Germany (Remote)")).toBeNull();
  });
});
