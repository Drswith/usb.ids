import { describe, expect, it } from "vitest";
import { generateContentHash } from "../src/parser/hash";

describe("generateContentHash", () => {
  it("is stable sha256 hex", () => {
    const h = generateContentHash("hello");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).toBe(generateContentHash("hello"));
    expect(h).not.toBe(generateContentHash("Hello"));
  });
});
