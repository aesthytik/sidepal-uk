import { describe, expect, it } from "vitest";
import { keywordGap } from "./gap";

const AD = `We're hiring a backend engineer. You'll write Python and Go (Golang) services on AWS,
deploy with Kubernetes and Terraform, and work with PostgreSQL. Experience with Kafka is a plus. Python, Python.`;

describe("keywordGap", () => {
  it("splits the ad's skills into ones you have and ones you're missing", () => {
    const gap = keywordGap(AD, ["Python", "AWS", "Docker"]);
    expect(gap.have).toEqual(["Python", "AWS"]);
    expect(gap.missing).toEqual(expect.arrayContaining(["Go", "Kubernetes", "Terraform", "SQL", "Kafka"]));
    expect(gap.missing).not.toContain("Docker");
  });

  it("counts skills found in the CV text too", () => {
    const gap = keywordGap(AD, ["Python"], "Built Kafka pipelines and Terraform modules.");
    expect(gap.have).toEqual(expect.arrayContaining(["Python", "Kafka", "Terraform"]));
    expect(gap.missing).not.toContain("Kafka");
  });

  it("matches the user's own skills that aren't in the lexicon", () => {
    expect(keywordGap("Experience with Pulumi preferred", ["Pulumi"]).have).toEqual(["Pulumi"]);
  });

  it("matches aliases like PostgreSQL for SQL", () => {
    expect(keywordGap(AD, ["SQL"]).have).toContain("SQL");
  });
});
