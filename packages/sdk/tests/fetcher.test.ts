import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadFile, downloadFromUrls } from "../src/fetcher";

describe("fetcher", () => {
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.mocked(console.warn).mockRestore();
    vi.stubGlobal("fetch", origFetch);
  });

  it("downloadFile returns text on 200", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "usb ids body",
    } as Response);

    await expect(downloadFile("https://example.com/usb.ids")).resolves.toBe("usb ids body");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("downloadFile retries on failure then succeeds", async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "ok",
      } as Response);

    await expect(downloadFile("https://example.com/x")).resolves.toBe("ok");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("downloadFromUrls tries next URL after failure", async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("fail a"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "from-b",
      } as Response);

    await expect(downloadFromUrls(["https://a.example/x", "https://b.example/x"])).resolves.toBe(
      "from-b",
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("downloadFromUrls throws if all URLs fail", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));

    await expect(downloadFromUrls(["https://a.example/x"])).rejects.toThrow("down");
  });
});
