import { describe, expect, it } from "vitest";
import { nextCalVer } from "../src/calver";

describe("nextCalVer", () => {
  it("starts at .0 when current version is not matching CalVer", () => {
    expect(
      nextCalVer({
        upstreamVersion: "2026.05.06",
        currentReleaseVersion: "1.0.999",
        schemaMajor: 2,
      }),
    ).toBe("2.20260506.0");
  });

  it("increments N on the same upstream YMD", () => {
    expect(
      nextCalVer({
        upstreamVersion: "2026.05.06",
        currentReleaseVersion: "2.20260506.0",
        schemaMajor: 2,
      }),
    ).toBe("2.20260506.1");
    expect(
      nextCalVer({
        upstreamVersion: "2026.05.06",
        currentReleaseVersion: "2.20260506.9",
        schemaMajor: 2,
      }),
    ).toBe("2.20260506.10");
  });

  it("resets N when upstream YMD changes", () => {
    expect(
      nextCalVer({
        upstreamVersion: "2026.05.07",
        currentReleaseVersion: "2.20260506.5",
        schemaMajor: 2,
      }),
    ).toBe("2.20260507.0");
  });

  it("rejects invalid upstreamVersion", () => {
    expect(() =>
      nextCalVer({
        upstreamVersion: "bad",
        currentReleaseVersion: "2.20260506.0",
        schemaMajor: 2,
      }),
    ).toThrow(/Invalid upstreamVersion/);
  });
});
