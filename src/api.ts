/**
 * Node.js public API: load local data by default; `forceUpdate` runs a network refresh.
 */

import type { DeviceFilter, VendorFilter } from "./pure/query";
import type { UsbDevice, UsbIdsData, UsbVendor } from "./types";
import { ERROR_CODES, UsbApiError } from "./errors";
import { isDatasetV2, toV1 } from "./legacy/to-v1";
import { loadUsbData, updateUsbData } from "./node/data";
import { filterDevices, filterVendors, searchInData } from "./pure/query";

export { ERROR_CODES, UsbApiError } from "./errors";
export { loadUsbData, loadUsbDataSync, updateUsbData } from "./node/data";
export type { DeviceFilter, VendorFilter } from "./pure/query";
export { filterDevices, filterVendors, searchInData } from "./pure/query";

async function ensureFreshData(forceUpdate: boolean): Promise<UsbIdsData> {
  try {
    if (forceUpdate) {
      const { data } = await updateUsbData({ force: true });
      return isDatasetV2(data) ? toV1(data) : (data as UsbIdsData);
    }
    return await loadUsbData();
  } catch (error) {
    const cause = error instanceof Error ? error : undefined;
    throw new UsbApiError(
      `Failed to load USB ID's data: ${cause?.message ?? String(error)}`,
      ERROR_CODES.NETWORK_ERROR,
      cause,
    );
  }
}

export async function getVendors(filter?: VendorFilter, forceUpdate = false): Promise<UsbVendor[]> {
  const data = await ensureFreshData(forceUpdate);
  return filterVendors(data, filter);
}

export async function getVendor(
  filter: VendorFilter,
  forceUpdate = false,
): Promise<UsbVendor | null> {
  const data = await ensureFreshData(forceUpdate);
  if (typeof filter === "string" && /^[0-9a-f]{4}$/i.test(filter)) {
    return data[filter.toLowerCase()] ?? null;
  }
  const vendors = filterVendors(data, filter);
  return vendors[0] ?? null;
}

export async function getDevices(
  vendorId: string,
  filter?: DeviceFilter,
  forceUpdate = false,
): Promise<UsbDevice[]> {
  const data = await ensureFreshData(forceUpdate);
  const vendor = data[vendorId.toLowerCase()];
  if (!vendor) {
    return [];
  }
  return filterDevices(vendor, filter);
}

export async function getDevice(
  vendorId: string,
  deviceId: string,
  forceUpdate = false,
): Promise<UsbDevice | null> {
  const data = await ensureFreshData(forceUpdate);
  return data[vendorId.toLowerCase()]?.devices[deviceId.toLowerCase()] ?? null;
}

export async function searchDevices(
  query: string,
  forceUpdate = false,
): Promise<Array<{ vendor: UsbVendor; device: UsbDevice }>> {
  const data = await ensureFreshData(forceUpdate);
  return searchInData(data, query);
}

export async function getUsbData(forceUpdate = false): Promise<UsbIdsData> {
  return await ensureFreshData(forceUpdate);
}
