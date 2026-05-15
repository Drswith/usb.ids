import { describe, expect, it } from "vitest";
import { parseUsbIdsHeader } from "../src/parser/upstream-header";

describe("parseUsbIdsHeader", () => {
  it("reads Version and Date", () => {
    const raw = [
      "# Comment\r",
      "# Version: 2026.05.06\r",
      "# Date:    2026-05-06  some text \r",
      "#\r",
      "aaaa  Vendor\r",
    ].join("\n");
    expect(parseUsbIdsHeader(raw)).toEqual({
      version: "2026.05.06",
      date: "2026-05-06  some text",
    });
  });

  it("is case-insensitive on keys", () => {
    expect(parseUsbIdsHeader("# version: 2020.01.02\n")).toEqual({
      version: "2020.01.02",
      date: null,
    });
  });

  it("allows leading whitespace on line", () => {
    expect(parseUsbIdsHeader("  # Version: 2019.12.31\n")).toEqual({
      version: "2019.12.31",
      date: null,
    });
  });

  it("returns nulls when missing", () => {
    expect(parseUsbIdsHeader("aaaa  Vendor\n")).toEqual({ version: null, date: null });
  });

  it("accepts any DD.MM.YY digit triple (no calendar validation)", () => {
    expect(parseUsbIdsHeader("# Version: 2026.13.40\n")).toEqual({
      version: "2026.13.40",
      date: null,
    });
  });
});
