import { describe, expect, it } from "vitest";
import { parseUsbIds } from "../src/parser/parse-vendors";
import { MINI_USB_IDS } from "./fixtures/mini-usb.ids";

describe("parseUsbIds (legacy shape)", () => {
  it("returns v1 record from full parse", () => {
    const v1 = parseUsbIds(MINI_USB_IDS);
    expect(v1.aaaa?.name).toBe("Fixture Vendor");
    expect(v1.aaaa?.devices["1111"]?.devname).toBe("Fixture Device");
    expect(v1).not.toHaveProperty("schemaVersion");
  });
});
