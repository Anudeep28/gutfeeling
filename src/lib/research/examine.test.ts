import { describe, expect, it } from "vitest";
import { getExamineReference } from "./examine";

describe("getExamineReference", () => {
  it("returns a search-link reference for the given chemical", () => {
    const source = getExamineReference("Caffeine");
    expect(source.id).toBe("EXAMINE-1");
    expect(source.provider).toBe("Examine.com");
    expect(source.title).toContain("Caffeine");
    expect(source.url).toBe("https://examine.com/search/?q=Caffeine");
    expect(source.excerpt).toContain("No structured data was retrieved");
  });

  it("URL-encodes chemicals with spaces and special characters", () => {
    const source = getExamineReference("Ascorbic acid");
    expect(source.url).toBe("https://examine.com/search/?q=Ascorbic%20acid");
  });
});
