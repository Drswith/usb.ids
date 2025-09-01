import type { UsbDevice, UsbIdsData, UsbVendor } from './types'
import { USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData } from './core'

// 环境兼容的默认根目录
let DEFAULT_ROOT = '.'

// 异步初始化默认根目录
async function initDefaultRoot(): Promise<void> {
  try {
    // 在Node.js环境中使用process.cwd()
    const process = await import('node:process')
    DEFAULT_ROOT = process.cwd()
  }
  catch {
    // 在浏览器环境中保持默认值
    DEFAULT_ROOT = '.'
  }
}

// 立即执行初始化
initDefaultRoot().catch(() => {
  // 忽略错误，使用默认值
})

// 缓存数据
let cachedData: UsbIdsData | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 获取或刷新USB设备数据
 */
async function ensureData(forceUpdate = false): Promise<UsbIdsData> {
  const now = Date.now()

  if (!forceUpdate && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData
  }

  try {
    const { data } = await fetchUsbIdsData(
      USB_IDS_SOURCE,
      'usb.ids.json',
      DEFAULT_ROOT,
      forceUpdate,
    )

    cachedData = data
    cacheTimestamp = now
    return data
  }
  catch (error) {
    if (cachedData) {
      return cachedData
    }
    throw new Error(`无法获取USB设备数据: ${(error as Error).message}`)
  }
}

/**
 * 获取所有符合条件的供应商（同步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param data 可选的USB数据，如果不提供则使用缓存数据
 */
export function getVendors(
  filter?: string | ((vendor: UsbVendor) => boolean),
  data?: UsbIdsData,
): UsbVendor[] {
  if (!data && !cachedData) {
    throw new Error('没有可用的USB设备数据，请先调用异步函数获取数据')
  }

  const usbData = data || cachedData!
  const vendors = Object.values(usbData)

  if (!filter) {
    return vendors
  }

  if (typeof filter === 'string') {
    // 按供应商ID或名称搜索
    const searchTerm = filter.toLowerCase()
    return vendors.filter(vendor =>
      vendor.vendor.toLowerCase().includes(searchTerm)
      || vendor.name.toLowerCase().includes(searchTerm),
    )
  }

  return vendors.filter(filter)
}

/**
 * 获取符合条件的单个供应商（同步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param data 可选的USB数据，如果不提供则使用缓存数据
 */
export function getVendor(
  filter: string | ((vendor: UsbVendor) => boolean),
  data?: UsbIdsData,
): UsbVendor | null {
  const vendors = getVendors(filter, data)
  return vendors.length > 0 ? vendors[0] : null
}

/**
 * 获取供应商的所有设备（同步版本）
 * @param vendorId 供应商ID
 * @param filter 可选的设备过滤条件
 * @param data 可选的USB数据
 */
export function getDevices(
  vendorId: string,
  filter?: string | ((device: UsbDevice) => boolean),
  data?: UsbIdsData,
): UsbDevice[] {
  const vendor = getVendor(v => v.vendor === vendorId, data)
  if (!vendor) {
    return []
  }

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

  return devices.filter(filter)
}

/**
 * 获取单个设备（同步版本）
 * @param vendorId 供应商ID
 * @param deviceId 设备ID
 * @param data 可选的USB数据
 */
export function getDevice(
  vendorId: string,
  deviceId: string,
  data?: UsbIdsData,
): UsbDevice | null {
  const vendor = getVendor(v => v.vendor === vendorId, data)
  if (!vendor || !vendor.devices[deviceId]) {
    return null
  }

  return vendor.devices[deviceId]
}

/**
 * 搜索设备（同步版本）
 * @param query 搜索关键词
 * @param data 可选的USB数据
 */
export function searchDevices(
  query: string,
  data?: UsbIdsData,
): Array<{ vendor: UsbVendor, device: UsbDevice }> {
  if (!data && !cachedData) {
    throw new Error('没有可用的USB设备数据，请先调用异步函数获取数据')
  }

  const usbData = data || cachedData!
  const results: Array<{ vendor: UsbVendor, device: UsbDevice }> = []
  const searchTerm = query.toLowerCase()

  Object.values(usbData).forEach((vendor) => {
    Object.values(vendor.devices).forEach((device) => {
      if (
        device.devid.toLowerCase().includes(searchTerm)
        || device.devname.toLowerCase().includes(searchTerm)
        || vendor.name.toLowerCase().includes(searchTerm)
      ) {
        results.push({ vendor, device })
      }
    })
  })

  return results
}

// ==================== 异步版本 ====================

/**
 * 获取所有符合条件的供应商（异步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getVendorsAsync(
  filter?: string | ((vendor: UsbVendor) => boolean),
  forceUpdate = false,
): Promise<UsbVendor[]> {
  const data = await ensureData(forceUpdate)
  return getVendors(filter, data)
}

/**
 * 获取符合条件的单个供应商（异步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getVendorAsync(
  filter: string | ((vendor: UsbVendor) => boolean),
  forceUpdate = false,
): Promise<UsbVendor | null> {
  const data = await ensureData(forceUpdate)
  return getVendor(filter, data)
}

/**
 * 获取供应商的所有设备（异步版本）
 * @param vendorId 供应商ID
 * @param filter 可选的设备过滤条件
 * @param forceUpdate 是否强制更新数据
 */
export async function getDevicesAsync(
  vendorId: string,
  filter?: string | ((device: UsbDevice) => boolean),
  forceUpdate = false,
): Promise<UsbDevice[]> {
  const data = await ensureData(forceUpdate)
  return getDevices(vendorId, filter, data)
}

/**
 * 获取单个设备（异步版本）
 * @param vendorId 供应商ID
 * @param deviceId 设备ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getDeviceAsync(
  vendorId: string,
  deviceId: string,
  forceUpdate = false,
): Promise<UsbDevice | null> {
  const data = await ensureData(forceUpdate)
  return getDevice(vendorId, deviceId, data)
}

/**
 * 搜索设备（异步版本）
 * @param query 搜索关键词
 * @param forceUpdate 是否强制更新数据
 */
export async function searchDevicesAsync(
  query: string,
  forceUpdate = false,
): Promise<Array<{ vendor: UsbVendor, device: UsbDevice }>> {
  const data = await ensureData(forceUpdate)
  return searchDevices(query, data)
}

/**
 * 获取原始USB数据（异步版本）
 * @param forceUpdate 是否强制更新数据
 */
export async function getUsbDataAsync(
  forceUpdate = false,
): Promise<UsbIdsData> {
  return await ensureData(forceUpdate)
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  cachedData = null
  cacheTimestamp = 0
}

/**
 * 获取缓存状态
 */
export function getCacheInfo(): { hasCache: boolean, cacheAge: number } {
  return {
    hasCache: cachedData !== null,
    cacheAge: cachedData ? Date.now() - cacheTimestamp : 0,
  }
}
