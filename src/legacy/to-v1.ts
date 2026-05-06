import type { UsbDatasetV2, UsbIdsData, UsbVendor } from '../types'

export function isDatasetV2(x: unknown): x is UsbDatasetV2 {
  return typeof x === 'object' && x !== null && 'schemaVersion' in x && (x as UsbDatasetV2).schemaVersion === 2
}

/**
 * Flatten schema v2 vendor/device tree to legacy v1 record (drops non-vendor sections).
 */
export function toV1(dataset: UsbDatasetV2): UsbIdsData {
  const result: UsbIdsData = {}
  for (const [vid, v] of Object.entries(dataset.vendors)) {
    const vendor: UsbVendor = {
      vendor: v.vendor,
      name: v.name,
      devices: {},
    }
    for (const [did, d] of Object.entries(v.devices)) {
      vendor.devices[did] = { devid: d.devid, devname: d.devname }
    }
    result[vid] = vendor
  }
  return result
}
