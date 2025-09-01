import type { UsbIdsData, VersionInfo } from './types'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import process from 'node:process'

/**
 * 下载文件
 */
export function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    client.get(`${url}?_t=${Date.now()}`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        return
      }

      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve(data)
      })
    }).on('error', reject)
  })
}

/**
 * 解析usb.ids文件格式并转换为项目所需的JSON格式
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
          vendor: vendorId.toLowerCase(),
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
        result[currentVendor].devices[deviceId.toLowerCase()] = {
          devid: deviceId.toLowerCase(),
          devname: deviceName.trim(),
        }
      }
    }
  }

  return result
}

/**
 * 保存原始USB IDs文件
 */
export async function saveRawUsbIdsFile(
  content: string,
  filePath: string,
): Promise<void> {
  try {
    fs.writeFileSync(filePath, content, 'utf8')
  }
  catch (error) {
    throw new Error(`保存原始USB IDs文件失败: ${(error as Error).message}`)
  }
}

/**
 * 获取USB设备数据
 */
export async function fetchUsbIdsData(
  usbIdsUrls: string[],
  fallbackFile: string,
  root: string,
  forceUpdate = false,
): Promise<{ data: UsbIdsData, source: 'api' | 'fallback', versionInfo: VersionInfo }> {
  const versionFilePath = path.resolve(root, 'usb.ids.version.json')

  try {
    // 检查现有版本信息
    const existingVersion = loadVersionInfo(versionFilePath)

    // 检查是否需要更新
    if (!shouldUpdate(existingVersion, forceUpdate)) {
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
        return { data, source: 'fallback', versionInfo: existingVersion! }
      }
    }

    let usbIdsContent: string | null = null

    // 尝试从多个URL下载
    for (const url of usbIdsUrls) {
      try {
        usbIdsContent = await downloadFile(url)
        break
      }
      catch {
        // 继续尝试下一个URL
        continue
      }
    }

    let data: UsbIdsData
    let source: 'api' | 'fallback'
    let rawContent: string

    if (usbIdsContent) {
      // 检查内容是否有变化
      if (existingVersion && !forceUpdate) {
        const newHash = generateContentHash(usbIdsContent)
        if (newHash === existingVersion.contentHash) {
          const fallbackPath = path.resolve(root, fallbackFile)
          if (fs.existsSync(fallbackPath)) {
            const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
            return { data, source: 'fallback', versionInfo: existingVersion }
          }
        }
      }

      // 保存原始文件
      const rawFilePath = path.resolve(root, 'usb.ids')
      await saveRawUsbIdsFile(usbIdsContent, rawFilePath)

      data = parseUsbIds(usbIdsContent)
      source = 'api'
      rawContent = usbIdsContent
    }
    else {
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
        source = 'fallback'
        rawContent = JSON.stringify(data)
      }
      else {
        throw new Error('无法获取USB设备数据，本地fallback文件也不存在')
      }
    }

    // 创建版本信息
    const versionInfo = createVersionInfo(data, rawContent, source)

    // 保存版本信息
    await saveVersionInfo(versionInfo, versionFilePath)

    return { data, source, versionInfo }
  }
  catch (error) {
    throw new Error(`获取USB设备数据失败: ${(error as Error).message}`)
  }
}

/**
 * 保存USB设备数据到JSON文件
 */
export async function saveUsbIdsToFile(
  data: UsbIdsData,
  filePath: string,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
  }
  catch (error) {
    throw new Error(`保存USB设备数据失败: ${(error as Error).message}`)
  }
}

/**
 * 生成内容的SHA256哈希值
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * 格式化时间戳为可读格式（UTC时间）
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
}

export function formatDateTimeUTC(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
}

/**
 * 创建版本信息
 */
export function createVersionInfo(
  data: UsbIdsData,
  rawContent: string,
  source: 'api' | 'fallback',
): VersionInfo {
  const now = Date.now()
  const version = `1.0.${now}`

  // 更新package.json的version字段
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      packageJson.version = version
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
    }
  }
  catch (error) {
    console.warn('Failed to update package.json version:', error)
  }

  const vendorCount = Object.keys(data).length
  const deviceCount = Object.values(data).reduce((total, vendor) => {
    return total + Object.keys(vendor.devices || {}).length
  }, 0)

  return {
    fetchTime: now,
    fetchTimeFormatted: formatDateTime(now),
    contentHash: generateContentHash(rawContent),
    source,
    vendorCount,
    deviceCount,
    version,
  }
}

/**
 * 保存版本信息到文件
 */
export async function saveVersionInfo(
  versionInfo: VersionInfo,
  filePath: string,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(versionInfo, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
  }
  catch (error) {
    throw new Error(`保存版本信息失败: ${(error as Error).message}`)
  }
}

/**
 * 读取版本信息
 */
export function loadVersionInfo(filePath: string): VersionInfo | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content) as VersionInfo
  }
  catch {
    return null
  }
}

/**
 * 检查是否需要更新（基于时间和哈希值）
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

  // 检查是否超过24小时（86400000毫秒）
  const now = Date.now()
  const dayInMs = 24 * 60 * 60 * 1000
  return now - versionInfo.fetchTime >= dayInMs
}
