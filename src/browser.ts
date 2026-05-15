/**
 * Browser-safe entry: no Node built-ins. Import as `usb.ids/browser` (see package exports).
 */

import type { UsbIdsData } from "./types";
import { ERROR_CODES, UsbApiError } from "./errors";

export { ERROR_CODES, UsbApiError } from "./errors";
export type { DeviceFilter, VendorFilter } from "./pure/query";
export { filterDevices, filterVendors, searchInData } from "./pure/query";
export type { UsbDevice, UsbIdsData, UsbVendor, VersionInfo } from "./types";

export async function loadUsbDataFromUrl(url: string): Promise<UsbIdsData> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new UsbApiError(
      `Failed to fetch USB data: HTTP ${res.status}`,
      ERROR_CODES.NETWORK_ERROR,
    );
  }
  try {
    return (await res.json()) as UsbIdsData;
  } catch (error) {
    const cause = error instanceof Error ? error : undefined;
    throw new UsbApiError(`Invalid JSON from ${url}`, ERROR_CODES.DATA_NOT_FOUND, cause);
  }
}
