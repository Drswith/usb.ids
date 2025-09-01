/**
 * USB 设备数据 API 模块
 *
 * 数据获取策略：
 * 1. 优先使用本地 USB JSON 文件
 * 2. 如果本地文件不存在或过期，则从远程 URL 获取数据
 * 3. 获取后的数据会被缓存到本地，供下次使用
 * 4. 无论 Node.js 还是浏览器环境都遵循相同的策略
 */

import type { UsbDevice, UsbIdsData, UsbVendor } from './types'
import * as path from 'node:path'
import { USB_IDS_FILE, USB_IDS_JSON_FILE, USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData, loadJsonFile } from './core'

// 环境兼容的默认根目录
// 在 Node.js 环境中使用当前工作目录，在浏览器环境中使用相对路径
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

/**
 * 同步读取本地USB数据文件
 * 直接复用 core.ts 中的 loadJsonFile 通用函数
 * 仅在Node.js环境中有效，浏览器环境会抛出错误
 */
function loadLocalDataSync(): UsbIdsData {
  const jsonFilePath = path.resolve(DEFAULT_ROOT, USB_IDS_JSON_FILE)

  try {
    // 直接复用 core.ts 中的 loadJsonFile 函数
    const data = loadJsonFile<UsbIdsData>(jsonFilePath)

    if (!data) {
      throw new Error('本地USB数据文件不存在或无效，请先运行 usb-ids fetch 获取数据')
    }

    return data
  }
  catch (error) {
    // 增强错误处理：区分浏览器环境和其他错误
    if (error instanceof Error && error.message.includes('require is not defined')) {
      throw new Error('浏览器环境不支持同步读取文件，请使用异步函数或传入数据参数')
    }
    // 对于文件不存在错误，直接重新抛出
    if (error instanceof Error && error.message.includes('本地USB数据文件不存在')) {
      throw error
    }
    // 其他错误（如 JSON 解析失败）
    throw new Error(`无法读取本地USB数据: ${(error as Error).message}`)
  }
}

/**
 * 获取或加载USB数据（同步版本的数据获取策略）
 */
function ensureDataSync(data?: UsbIdsData): UsbIdsData {
  if (data) {
    return data
  }

  // 如果没有提供数据，尝试同步读取本地文件
  return loadLocalDataSync()
}

/**
 * 获取USB设备数据（统一的数据获取策略）
 * 优先使用本地JSON文件，如果不存在则请求远程数据
 */
async function ensureData(forceUpdate = false): Promise<UsbIdsData> {
  try {
    // 参考 cli.ts 中的正确用法：
    // 1. fetchUsbIdsData 的第二个参数是原始 .ids 文件的 fallback 路径
    // 2. JSON 数据需要通过 saveUsbIdsToFile 单独保存
    // 3. 在 API 中，我们只需要使用 fetchUsbIdsData 返回的 data
    const { data } = await fetchUsbIdsData(
      USB_IDS_SOURCE,
      USB_IDS_FILE, // 原始 .ids 文件作为 fallback（相对于 root）
      DEFAULT_ROOT, // 根目录
      forceUpdate, // 是否强制更新
    )
    return data
  }
  catch (error) {
    throw new Error(`无法获取USB设备数据: ${(error as Error).message}`)
  }
}

/**
 * 获取所有符合条件的供应商（异步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getVendors(
  filter?: string | ((vendor: UsbVendor) => boolean),
  forceUpdate = false,
): Promise<UsbVendor[]> {
  const data = await ensureData(forceUpdate)
  return getVendorsSync(filter, data)
}

/**
 * 获取所有符合条件的供应商（同步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param data 可选的USB数据，如果不提供则自动读取本地数据
 */
export function getVendorsSync(
  filter?: string | ((vendor: UsbVendor) => boolean),
  data?: UsbIdsData,
): UsbVendor[] {
  const usbData = ensureDataSync(data)
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
 * 获取符合条件的单个供应商（异步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getVendor(
  filter: string | ((vendor: UsbVendor) => boolean),
  forceUpdate = false,
): Promise<UsbVendor | null> {
  const data = await ensureData(forceUpdate)
  return getVendorSync(filter, data)
}

/**
 * 获取符合条件的单个供应商（同步版本）
 * @param filter 过滤条件函数或供应商ID
 * @param data 可选的USB数据，如果不提供则自动读取本地数据
 */
export function getVendorSync(
  filter: string | ((vendor: UsbVendor) => boolean),
  data?: UsbIdsData,
): UsbVendor | null {
  const vendors = getVendorsSync(filter, data)
  return vendors.length > 0 ? vendors[0] : null
}

/**
 * 获取供应商的所有设备（异步版本）
 * @param vendorId 供应商ID
 * @param filter 可选的设备过滤条件
 * @param forceUpdate 是否强制更新数据
 */
export async function getDevices(
  vendorId: string,
  filter?: string | ((device: UsbDevice) => boolean),
  forceUpdate = false,
): Promise<UsbDevice[]> {
  const data = await ensureData(forceUpdate)
  return getDevicesSync(vendorId, filter, data)
}

/**
 * 获取供应商的所有设备（同步版本）
 * @param vendorId 供应商ID
 * @param filter 可选的设备过滤条件
 * @param data 可选的USB数据，如果不提供则自动读取本地数据
 */
export function getDevicesSync(
  vendorId: string,
  filter?: string | ((device: UsbDevice) => boolean),
  data?: UsbIdsData,
): UsbDevice[] {
  const vendor = getVendorSync(v => v.vendor === vendorId, data)
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
 * 获取单个设备（异步版本）
 * @param vendorId 供应商ID
 * @param deviceId 设备ID
 * @param forceUpdate 是否强制更新数据
 */
export async function getDevice(
  vendorId: string,
  deviceId: string,
  forceUpdate = false,
): Promise<UsbDevice | null> {
  const data = await ensureData(forceUpdate)
  return getDeviceSync(vendorId, deviceId, data)
}

/**
 * 获取单个设备（同步版本）
 * @param vendorId 供应商ID
 * @param deviceId 设备ID
 * @param data 可选的USB数据，如果不提供则自动读取本地数据
 */
export function getDeviceSync(
  vendorId: string,
  deviceId: string,
  data?: UsbIdsData,
): UsbDevice | null {
  const vendor = getVendorSync(v => v.vendor === vendorId, data)
  if (!vendor || !vendor.devices[deviceId]) {
    return null
  }

  return vendor.devices[deviceId]
}

/**
 * 搜索设备（异步版本）
 * @param query 搜索关键词
 * @param forceUpdate 是否强制更新数据
 */
export async function searchDevices(
  query: string,
  forceUpdate = false,
): Promise<Array<{ vendor: UsbVendor, device: UsbDevice }>> {
  const data = await ensureData(forceUpdate)
  return searchDevicesSync(query, data)
}

/**
 * 搜索设备（同步版本）
 * @param query 搜索关键词
 * @param data 可选的USB数据，如果不提供则自动读取本地数据
 */
export function searchDevicesSync(
  query: string,
  data?: UsbIdsData,
): Array<{ vendor: UsbVendor, device: UsbDevice }> {
  const usbData = ensureDataSync(data)
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

/**
 * 获取完整的USB设备数据（异步版本）
 * @param forceUpdate 是否强制更新数据
 */
export async function getUsbData(
  forceUpdate = false,
): Promise<UsbIdsData> {
  return await ensureData(forceUpdate)
}

/**
 * 获取完整的USB设备数据（同步版本）
 * @param data 可选的USB数据，如果不提供则自动读取本地数据
 */
export function getUsbDataSync(
  data?: UsbIdsData,
): UsbIdsData {
  return ensureDataSync(data)
}
