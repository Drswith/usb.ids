import type { UsbDevice, UsbVendor } from '../src/types'

export interface DeviceResult {
  device: UsbDevice & { devid: string }
  vendor: UsbVendor & { vendor: string }
  matchType: 'vendor' | 'device' | 'both'
}

export interface SearchOptions {
  query: string
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

export function searchUsbData(data: Record<string, UsbVendor>, options: SearchOptions): DeviceResult[] {
  const { query } = options
  const normalizedQuery = normalizeText(query)
  const results: DeviceResult[] = []

  Object.entries(data).forEach(([vendorId, vendor]) => {
    const vendorIdMatch = normalizeText(vendorId).includes(normalizedQuery)
    const vendorNameMatch = normalizeText(vendor.name).includes(normalizedQuery)

    Object.entries(vendor.devices || {}).forEach(([deviceId, device]) => {
      const deviceIdMatch = normalizeText(deviceId).includes(normalizedQuery)
      const deviceNameMatch = normalizeText(device.devname).includes(normalizedQuery)

      let shouldInclude = false
      let matchType: 'vendor' | 'device' | 'both' = 'vendor'

      if (!normalizedQuery) {
        shouldInclude = true
        matchType = 'vendor'
      }
      else {
        if ((vendorIdMatch || vendorNameMatch) && (deviceIdMatch || deviceNameMatch)) {
          matchType = 'both'
          shouldInclude = true
        }
        else if (vendorIdMatch || vendorNameMatch) {
          matchType = 'vendor'
          shouldInclude = true
        }
        else if (deviceIdMatch || deviceNameMatch) {
          matchType = 'device'
          shouldInclude = true
        }
      }

      if (shouldInclude) {
        results.push({
          device: { ...device, devid: deviceId },
          vendor: { ...vendor, vendor: vendorId },
          matchType,
        })
      }
    })
  })

  return results
}
