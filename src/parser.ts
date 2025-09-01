import type { UsbIdsData, VersionInfo } from './types'
import * as crypto from 'node:crypto'

/**
 * 数据解析模块
 * 专门负责将原始数据解析为JSON格式
 */

/**
 * 解析usb.ids文件格式并转换为项目所需的JSON格式
 * @param content usb.ids文件的原始内容
 * @returns UsbIdsData 解析后的JSON数据
 */
export function parseUsbIds(content: string): UsbIdsData {
  const lines = content.split('\n')
  const result: UsbIdsData = {}
  let currentVendor: string | null = null

  for (const line of lines) {
    // 跳过注释和空行
    if (line.startsWith('#') || line.trim() === '') {
      continue
    }

    // 供应商行（不以制表符开头）
    if (!line.startsWith('\t')) {
      const match = line.match(/^([0-9a-f]{4})\s(.+)$/i)
      if (match) {
        const [, vendorId, vendorName] = match
        currentVendor = vendorId.toLowerCase()
        result[currentVendor] = {
          vendor: currentVendor,
          name: vendorName.trim(),
          devices: {},
        }
      }
    }
    // 设备行（以一个制表符开头）
    else if (line.startsWith('\t') && !line.startsWith('\t\t') && currentVendor) {
      const match = line.match(/^\t([0-9a-f]{4})\s(.+)$/i)
      if (match) {
        const [, deviceId, deviceName] = match
        const deviceIdLower = deviceId.toLowerCase()
        result[currentVendor].devices[deviceIdLower] = {
          devid: deviceIdLower,
          devname: deviceName.trim(),
        }
      }
    }
    // 跳过子设备行（以两个制表符开头）
  }

  return result
}

/**
 * 生成内容的SHA256哈希值
 * @param content 要计算哈希的内容
 * @returns string SHA256哈希值
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * 格式化时间戳为可读格式
 * @param timestamp 时间戳
 * @returns string 格式化后的时间字符串
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

/**
 * 格式化时间戳为UTC格式
 * @param timestamp 时间戳
 * @returns string UTC格式的时间字符串
 */
export function formatDateTimeUTC(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

/**
 * 创建版本信息
 * @param data 解析后的USB数据
 * @param rawContent 原始内容
 * @param source 数据源
 * @returns VersionInfo 版本信息对象
 */
export function createVersionInfo(
  data: UsbIdsData,
  rawContent: string,
  source: 'api' | 'fallback',
): VersionInfo {
  const fetchTime = Date.now()
  const contentHash = generateContentHash(rawContent)

  // 统计供应商和设备数量
  const vendorCount = Object.keys(data).length
  let deviceCount = 0

  for (const vendor of Object.values(data)) {
    deviceCount += Object.keys(vendor.devices).length
  }

  return {
    fetchTime,
    fetchTimeFormatted: formatDateTime(fetchTime),
    contentHash,
    source,
    vendorCount,
    deviceCount,
    version: `v1.0.${fetchTime}`,
  }
}

/**
 * 判断是否需要更新数据
 * @param versionInfo 当前版本信息
 * @param forceUpdate 是否强制更新
 * @returns boolean 是否需要更新
 */
export function shouldUpdate(
  versionInfo: VersionInfo | null,
  forceUpdate = false,
): boolean {
  if (forceUpdate) {
    return true
  }

  if (!versionInfo) {
    return true
  }

  // 检查是否超过24小时
  const now = Date.now()
  const timeDiff = now - versionInfo.fetchTime
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  return hoursDiff >= 24
}
