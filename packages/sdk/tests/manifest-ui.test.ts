import { describe, expect, it } from "vitest";
import { legacyV10FetchTimestampToUpstream, normalizeVersionInfoForUi } from "../src/manifest-ui";

describe("legacyV10FetchTimestampToUpstream", () => {
  it("maps v1.0.<ms> to UTC YYYY.MM.DD", () => {
    expect(legacyV10FetchTimestampToUpstream("v1.0.1766044470065")).toBe("2025.12.18");
  });

  it("returns null when third segment is not a long integer", () => {
    expect(legacyV10FetchTimestampToUpstream("2.20260101.0")).toBeNull();
  });
});

describe("normalizeVersionInfoForUi", () => {
  it("fills upstream from v1.0 timestamp when field absent", () => {
    const v = normalizeVersionInfoForUi({
      version: "v1.0.1766044470065",
      contentHash: "x",
      fetchTime: 1,
    });
    expect(v?.upstreamVersion).toBe("2025.12.18");
    expect(v?.releaseVersion).toBe("v1.0.1766044470065");
  });
});
