import { describe, expect, it } from "vitest";
import { filterVendors } from "../src/browser";

describe("browser entry smoke", () => {
  it("exports pure query helpers without node:", async () => {
    const data = { abcd: { vendor: "abcd", name: "n", devices: {} } };
    expect(filterVendors(data).length).toBe(1);
    const mod = await import("../src/browser");
    expect(typeof mod.loadUsbDataFromUrl).toBe("function");
  });
});
