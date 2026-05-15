import { describe, expect, it } from "vitest";
import { getPackageRoot } from "../src/paths";

describe("getPackageRoot", () => {
  it("resolves this repo root from module location", () => {
    const root = getPackageRoot();
    expect(root).toMatch(/usb\.ids$/);
  });
});
