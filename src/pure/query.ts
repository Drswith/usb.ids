import type { UsbDevice, UsbIdsData, UsbVendor } from '../types'

const VENDOR_OR_DEVICE_ID = /^[0-9a-f]{4}$/i

export type VendorFilter =
  | string
  | ((vendor: UsbVendor) => boolean)
  | {
    id?: string
    name?: string
    search?: string
  }

export type DeviceFilter =
  | string
  | ((device: UsbDevice) => boolean)
  | {
    id?: string
    name?: string
    search?: string
  }

/**
 * Filter vendor data (pure function). String filter: exact match for 4-digit hex vendor id; otherwise substring search on id/name.
 */
export function filterVendors(data: UsbIdsData, filter?: VendorFilter): UsbVendor[] {
  const vendors = Object.values(data)

  if (!filter) {
    return vendors
  }

  if (typeof filter === 'string') {
    if (VENDOR_OR_DEVICE_ID.test(filter)) {
      const v = data[filter.toLowerCase()]
      return v ? [v] : []
    }
    const searchTerm = filter.toLowerCase()
    return vendors.filter(vendor =>
      vendor.vendor.toLowerCase().includes(searchTerm)
      || vendor.name.toLowerCase().includes(searchTerm),
    )
  }

  if (typeof filter === 'function') {
    return vendors.filter(filter)
  }

  return vendors.filter((vendor) => {
    if (filter.id) {
      if (VENDOR_OR_DEVICE_ID.test(filter.id)) {
        if (vendor.vendor !== filter.id.toLowerCase())
          return false
      }
      else if (!vendor.vendor.toLowerCase().includes(filter.id.toLowerCase())) {
        return false
      }
    }
    if (filter.name && !vendor.name.toLowerCase().includes(filter.name.toLowerCase())) {
      return false
    }
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      return vendor.vendor.toLowerCase().includes(searchTerm)
        || vendor.name.toLowerCase().includes(searchTerm)
    }
    return true
  })
}

/**
 * Filter device data (pure function). String filter: exact match for 4-digit hex product id; otherwise substring search.
 */
export function filterDevices(vendor: UsbVendor, filter?: DeviceFilter): UsbDevice[] {
  const devices = Object.values(vendor.devices)

  if (!filter) {
    return devices
  }

  if (typeof filter === 'string') {
    if (VENDOR_OR_DEVICE_ID.test(filter)) {
      const id = filter.toLowerCase()
      const d = vendor.devices[id]
      return d ? [d] : []
    }
    const searchTerm = filter.toLowerCase()
    return devices.filter(device =>
      device.devid.toLowerCase().includes(searchTerm)
      || device.devname.toLowerCase().includes(searchTerm),
    )
  }

  if (typeof filter === 'function') {
    return devices.filter(filter)
  }

  return devices.filter((device) => {
    if (filter.id) {
      if (VENDOR_OR_DEVICE_ID.test(filter.id)) {
        if (device.devid !== filter.id.toLowerCase())
          return false
      }
      else if (!device.devid.toLowerCase().includes(filter.id.toLowerCase())) {
        return false
      }
    }
    if (filter.name && !device.devname.toLowerCase().includes(filter.name.toLowerCase())) {
      return false
    }
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      return device.devid.toLowerCase().includes(searchTerm)
        || device.devname.toLowerCase().includes(searchTerm)
    }
    return true
  })
}

/**
 * Search for devices in data (pure function)
 */
export function searchInData(
  data: UsbIdsData,
  query: string,
): Array<{ vendor: UsbVendor, device: UsbDevice }> {
  if (!query.trim()) {
    return []
  }

  const results: Array<{ vendor: UsbVendor, device: UsbDevice, priority: number }> = []
  const searchTerm = query.toLowerCase().trim()

  Object.values(data).forEach((vendor) => {
    const vendorMatch = vendor.name.toLowerCase().includes(searchTerm)
      || vendor.vendor.toLowerCase().includes(searchTerm)

    Object.values(vendor.devices).forEach((device) => {
      const deviceIdMatch = device.devid.toLowerCase().includes(searchTerm)
      const deviceNameMatch = device.devname.toLowerCase().includes(searchTerm)

      if (deviceIdMatch || deviceNameMatch || vendorMatch) {
        let priority = 0
        if (device.devid.toLowerCase() === searchTerm)
          priority += 100
        else if (deviceIdMatch)
          priority += 50
        if (device.devname.toLowerCase().includes(searchTerm))
          priority += 30
        if (vendorMatch)
          priority += 10

        results.push({ vendor, device, priority })
      }
    })
  })

  return results
    .sort((a, b) => b.priority - a.priority)
    .map(({ vendor, device }) => ({ vendor, device }))
}
