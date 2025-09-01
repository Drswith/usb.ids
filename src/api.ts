/**
 * USB 设备数据 API 模块
 *
 * 数据获取策略：
 * 1. 优先使用本地 USB JSON 文件
 * 2. 如果本地文件不存在或过期，则从远程 URL 获取数据
 * 3. 获取后的数据会被缓存到本地，供下次使用
 * 4. 无论 Node.js 还是浏览器环境都遵循相同的策略
 *
 * API 设计原则：
 * - 异步优先：所有数据获取操作都是异步的
 * - 纯函数工具：提供纯函数用于处理已有数据
 * - 环境兼容：在所有环境中保持一致的行为
 */

import type { UsbDevice, UsbIdsData, UsbVendor } from './types'
import { USB_IDS_FILE, USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData } from './core'

// ===============================
// 环境检测和工具函数
// ===============================

/**
 * 可靠的环境检测
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined'
    && process.versions
    && process.versions.node !== undefined
}

/**
 * 获取环境适配的根目录
 */
function getEnvironmentRoot(): string {
  return isNodeEnvironment() ? process.cwd() : '.'
}

// ===============================
// 错误处理
// ===============================

/**
 * 创建标准化的 API 错误
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
 * 错误代码常量
 */
export const ERROR_CODES = {
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
} as const

// ===============================
// 过滤器类型定义
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
// 数据获取策略
// ===============================

/**
 * 获取USB设备数据（统一的数据获取策略）
 * 优先使用本地JSON文件，如果不存在则请求远程数据
 */
async function ensureData(forceUpdate = false): Promise<UsbIdsData> {
  try {
    const { data } = await fetchUsbIdsData(
      USB_IDS_SOURCE,
      USB_IDS_FILE, // 原始 .ids 文件作为 fallback（相对于 root）
      getEnvironmentRoot(), // 根目录
      forceUpdate, // 是否强制更新
    )
    return data
  }
  catch (error) {
    throw createApiError(
      `无法获取USB设备数据: ${(error as Error).message}`,
      ERROR_CODES.NETWORK_ERROR,
      error as Error,
    )
  }
}

// ===============================
// 纯函数工具（用于处理已有数据）
// ===============================

/**
 * 过滤供应商数据（纯函数）
 * @param data USB数据
 * @param filter 过滤条件
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

  // 对象形式的过滤器
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
 * 过滤设备数据（纯函数）
 * @param vendor 供应商数据
 * @param filter 过滤条件
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

  // 对象形式的过滤器
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
 * 在数据中搜索设备（纯函数）
 * @param data USB数据
 * @param query 搜索关键词
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

  // 优化的搜索算法，按匹配度排序
  Object.values(data).forEach((vendor) => {
    const vendorMatch = vendor.name.toLowerCase().includes(searchTerm)
      || vendor.vendor.toLowerCase().includes(searchTerm)

    Object.values(vendor.devices).forEach((device) => {
      const deviceIdMatch = device.devid.toLowerCase().includes(searchTerm)
      const deviceNameMatch = device.devname.toLowerCase().includes(searchTerm)

      if (deviceIdMatch || deviceNameMatch || vendorMatch) {
        // 计算匹配度（精确匹配优先）
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

  // 按匹配度排序并移除优先级属性
  return results
    .sort((a, b) => b.priority - a.priority)
    .map(({ vendor, device }) => ({ vendor, device }))
}

// ===============================
// 公开 API 函数（异步）
// ===============================

/**
 * 获取所有符合条件的供应商
 * @param filter 过滤条件函数或供应商ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getVendors(
  filter?: VendorFilter,
  forceUpdate = false,
): Promise<UsbVendor[]> {
  const data = await ensureData(forceUpdate)
  return filterVendors(data, filter)
}

/**
 * 获取符合条件的单个供应商
 * @param filter 过滤条件函数或供应商ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getVendor(
  filter: VendorFilter,
  forceUpdate = false,
): Promise<UsbVendor | null> {
  const vendors = await getVendors(filter, forceUpdate)
  return vendors.length > 0 ? vendors[0] : null
}

/**
 * 获取供应商的所有设备
 * @param vendorId 供应商ID
 * @param filter 可选的设备过滤条件
 * @param forceUpdate 是否强制更新数据
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
 * 获取单个设备
 * @param vendorId 供应商ID
 * @param deviceId 设备ID
 * @param forceUpdate 是否强制更新数据
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
 * 搜索设备
 * @param query 搜索关键词
 * @param forceUpdate 是否强制更新数据
 */
export async function searchDevices(
  query: string,
  forceUpdate = false,
): Promise<Array<{ vendor: UsbVendor, device: UsbDevice }>> {
  const data = await ensureData(forceUpdate)
  return searchInData(data, query)
}

/**
 * 获取完整的USB设备数据
 * @param forceUpdate 是否强制更新数据
 */
export async function getUsbData(
  forceUpdate = false,
): Promise<UsbIdsData> {
  return await ensureData(forceUpdate)
}
