/**
 * USB Device Data API Module
 *
 * Data acquisition strategy:
 * 1. Prioritize local USB JSON files
 * 2. If local files don't exist or are expired, fetch data from remote URLs
 * 3. Downloaded data will be cached locally for future use
 * 4. The same strategy applies to both Node.js and browser environments
 *
 * API Design Principles:
 * - Async-first: All data acquisition operations are asynchronous
 * - Pure function tools: Provide pure functions for processing existing data
 * - Environment compatibility: Maintain consistent behavior across all environments
 */

import type { UsbDevice, UsbIdsData, UsbVendor } from './types'
import { USB_IDS_FILE, USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData } from './core'

// ===============================
// Environment Detection and Utility Functions
// ===============================

/**
 * Reliable environment detection
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined'
    && process.versions
    && process.versions.node !== undefined
}

/**
 * Get environment-adapted root directory
 */
function getEnvironmentRoot(): string {
  return isNodeEnvironment() ? process.cwd() : '.'
}

// ===============================
// Error Handling
// ===============================

/**
 * Create standardized API error
 */
function createApiError(message: string, code: string, cause?: Error): Error {
  const error = new Error(message)
  error.name = 'UsbApiError'
  ;(error as any).code = code
  if (cause) {
    ;(error as any).cause = cause
  }
  return error
}

/**
 * Error code constants
 */
export const ERROR_CODES = {
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
} as const

// ===============================
// Filter Type Definitions
// ===============================

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

// ===============================
// Data Acquisition Strategy
// ===============================

/**
 * Get USB device data (unified data acquisition strategy)
 * Prioritize local JSON files, fetch remote data if not available
 */
async function ensureData(forceUpdate = false): Promise<UsbIdsData> {
  try {
    const { data } = await fetchUsbIdsData(
      USB_IDS_SOURCE,
      USB_IDS_FILE, // Original .ids file as fallback (relative to root)
      getEnvironmentRoot(), // Root directory
      forceUpdate, // Whether to force update
    )
    return data
  }
  catch (error) {
    throw createApiError(
      `Failed to fetch USB device data: ${(error as Error).message}`,
      ERROR_CODES.NETWORK_ERROR,
      error as Error,
    )
  }
}

// ===============================
// Pure Function Tools (for processing existing data)
// ===============================

/**
 * Filter vendor data (pure function)
 * @param data USB data
 * @param filter Filter conditions
 */
export function filterVendors(data: UsbIdsData, filter?: VendorFilter): UsbVendor[] {
  const vendors = Object.values(data)

  if (!filter) {
    return vendors
  }

  if (typeof filter === 'string') {
    const searchTerm = filter.toLowerCase()
    return vendors.filter(vendor =>
      vendor.vendor.toLowerCase().includes(searchTerm)
      || vendor.name.toLowerCase().includes(searchTerm),
    )
  }

  if (typeof filter === 'function') {
    return vendors.filter(filter)
  }

  // Object-based filter
  return vendors.filter((vendor) => {
    if (filter.id && !vendor.vendor.toLowerCase().includes(filter.id.toLowerCase())) {
      return false
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
 * Filter device data (pure function)
 * @param vendor Vendor data
 * @param filter Filter conditions
 */
export function filterDevices(vendor: UsbVendor, filter?: DeviceFilter): UsbDevice[] {
  const devices = Object.values(vendor.devices)

  if (!filter) {
    return devices
  }

  if (typeof filter === 'string') {
    const searchTerm = filter.toLowerCase()
    return devices.filter(device =>
      device.devid.toLowerCase().includes(searchTerm)
      || device.devname.toLowerCase().includes(searchTerm),
    )
  }

  if (typeof filter === 'function') {
    return devices.filter(filter)
  }

  // Object-based filter
  return devices.filter((device) => {
    if (filter.id && !device.devid.toLowerCase().includes(filter.id.toLowerCase())) {
      return false
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
 * @param data USB data
 * @param query Search query
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

  // Optimized search algorithm, sorted by relevance
  Object.values(data).forEach((vendor) => {
    const vendorMatch = vendor.name.toLowerCase().includes(searchTerm)
      || vendor.vendor.toLowerCase().includes(searchTerm)

    Object.values(vendor.devices).forEach((device) => {
      const deviceIdMatch = device.devid.toLowerCase().includes(searchTerm)
      const deviceNameMatch = device.devname.toLowerCase().includes(searchTerm)

      if (deviceIdMatch || deviceNameMatch || vendorMatch) {
        // Calculate relevance score (exact matches prioritized)
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

  // Sort by relevance and remove priority property
  return results
    .sort((a, b) => b.priority - a.priority)
    .map(({ vendor, device }) => ({ vendor, device }))
}

// ===============================
// Public API Functions (Async)
// ===============================

/**
 * Get all vendors matching the filter
 * @param filter Filter function or vendor ID
 * @param forceUpdate Whether to force data update
 */
export async function getVendors(
  filter?: VendorFilter,
  forceUpdate = false,
): Promise<UsbVendor[]> {
  const data = await ensureData(forceUpdate)
  return filterVendors(data, filter)
}

/**
 * Get a single vendor matching the filter
 * @param filter Filter function or vendor ID
 * @param forceUpdate Whether to force data update
 */
export async function getVendor(
  filter: VendorFilter,
  forceUpdate = false,
): Promise<UsbVendor | null> {
  const vendors = await getVendors(filter, forceUpdate)
  return vendors.length > 0 ? vendors[0] : null
}

/**
 * Get all devices for a vendor
 * @param vendorId Vendor ID
 * @param filter Optional device filter conditions
 * @param forceUpdate Whether to force data update
 */
export async function getDevices(
  vendorId: string,
  filter?: DeviceFilter,
  forceUpdate = false,
): Promise<UsbDevice[]> {
  const vendor = await getVendor(v => v.vendor === vendorId, forceUpdate)
  if (!vendor) {
    return []
  }
  return filterDevices(vendor, filter)
}

/**
 * Get a single device
 * @param vendorId Vendor ID
 * @param deviceId Device ID
 * @param forceUpdate Whether to force data update
 */
export async function getDevice(
  vendorId: string,
  deviceId: string,
  forceUpdate = false,
): Promise<UsbDevice | null> {
  const vendor = await getVendor(v => v.vendor === vendorId, forceUpdate)
  if (!vendor || !vendor.devices[deviceId]) {
    return null
  }
  return vendor.devices[deviceId]
}

/**
 * Search for devices
 * @param query Search query
 * @param forceUpdate Whether to force data update
 */
export async function searchDevices(
  query: string,
  forceUpdate = false,
): Promise<Array<{ vendor: UsbVendor, device: UsbDevice }>> {
  const data = await ensureData(forceUpdate)
  return searchInData(data, query)
}

/**
 * Get complete USB device data
 * @param forceUpdate Whether to force data update
 */
export async function getUsbData(
  forceUpdate = false,
): Promise<UsbIdsData> {
  return await ensureData(forceUpdate)
}
