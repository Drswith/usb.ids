import { describe, expect, it } from "vitest";
import { parseUsbIdsFull } from "../src/parser/full-usb-ids";
import { MINI_USB_IDS } from "./fixtures/mini-usb.ids";

describe("parseUsbIdsFull", () => {
  it("parses vendors, subsystems, classes, and post-vendor sections", () => {
    const d = parseUsbIdsFull(MINI_USB_IDS);

    expect(d.schemaVersion).toBe(2);
    expect(d.vendors.aaaa?.name).toBe("Fixture Vendor");
    const dev = d.vendors.aaaa?.devices["1111"];
    expect(dev?.devname).toBe("Fixture Device");
    expect(dev?.subsystems).toEqual([
      expect.objectContaining({
        subvendor: "2222",
        subdevice: "3333",
        name: "Subsystem Name",
      }),
    ]);

    expect(d.classes["03"]?.name).toBe("Wireless Controller");
    expect(d.classes["03"]?.subclasses["01"]?.name).toBe("RF Controller");
    expect(d.classes["03"]?.subclasses["01"]?.protocols["01"]?.name).toBe("Bluetooth");

    expect(d.audioTerminals["0001"]).toBe("Audio Terminal");
    expect(d.hidDescriptors["01"]).toBe("HID Descriptor Type");
    expect(d.hidItemTypes["02"]).toBe("HID Item");
    expect(d.biasTypes["01"]).toBe("Bias");
    expect(d.phyTypes["02"]).toBe("PHY");
    expect(d.hidUsagePages["01"]?.usages["0001"]).toBe("Usage One");
    expect(d.languages["0409"]?.dialects?.["01"]).toBe("US");
    expect(d.hidCountryCodes["01"]).toBe("Country Code");
    expect(d.videoTerminals["0001"]).toBe("Video Terminal");
    expect(d.hcts["02"]).toBe("HCT Entry");
  });
});
