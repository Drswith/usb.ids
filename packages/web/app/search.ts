import type { UsbDevice, UsbVendor } from "@usb-ids/sdk/browser";
import { searchInData } from "@usb-ids/sdk/browser";

export interface DeviceResult {
  device: UsbDevice & { devid: string };
  vendor: UsbVendor & { vendor: string };
  matchType: "vendor" | "device" | "both";
}

export interface SearchOptions {
  query: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

export function searchUsbData(
  data: Record<string, UsbVendor>,
  options: SearchOptions,
): DeviceResult[] {
  const { query } = options;
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return Object.entries(data).flatMap(([vendorId, vendor]) =>
      Object.entries(vendor.devices || {}).map(([deviceId, device]) => ({
        device: { ...device, devid: deviceId },
        vendor: { ...vendor, vendor: vendorId },
        matchType: "vendor" as const,
      })),
    );
  }

  return searchInData(data, normalizedQuery).map(({ vendor, device }) => {
    const vendorIdMatch = normalizeText(vendor.vendor).includes(normalizedQuery);
    const vendorNameMatch = normalizeText(vendor.name).includes(normalizedQuery);
    const deviceIdMatch = normalizeText(device.devid).includes(normalizedQuery);
    const deviceNameMatch = normalizeText(device.devname).includes(normalizedQuery);

    let matchType: "vendor" | "device" | "both" = "device";
    if ((vendorIdMatch || vendorNameMatch) && (deviceIdMatch || deviceNameMatch)) {
      matchType = "both";
    } else if (vendorIdMatch || vendorNameMatch) {
      matchType = "vendor";
    }

    return { device, vendor, matchType };
  });
}
