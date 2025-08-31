import type { UsbIdsData, VersionInfo } from './typing'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import process from 'node:process'
import { pluginName } from './plugin'

/**
 * ANSI 颜色代码
 */
const colors = {
  reset: '\x1B[0m',
  cyan: '\x1B[36m',
  green: '\x1B[32m',
  blue: '\x1B[34m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
}

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 手动实现的日志函数
 */
function createLogger(level: 'start' | 'success' | 'info' | 'warn' | 'error') {
  return (message: string, verbose = true): void => {
    if (!verbose)
      return

    const timestamp = formatTimestamp()
    const prefix = `[${pluginName}]`

    switch (level) {
      case 'start':
        console.log(`${colors.cyan}◐${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'success':
        console.log(`${colors.green}✔${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'info':
        console.log(`${colors.blue}ℹ${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'warn':
        console.warn(`${colors.yellow}⚠${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'error':
        console.error(`${colors.red}✖${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
    }
  }
}

export const startWithTime = createLogger('start')
export const successWithTime = createLogger('success')
export const logWithTime = createLogger('info')
export const warnWithTime = createLogger('warn')
export const errorWithTime = createLogger('error')

/**
 * 下载文件
 */
export function downloadFile(url: string, verbose = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    logWithTime(`正在从 ${url} 下载USB设备数据...`, verbose)

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
 * 获取USB设备数据
 */
/**
 * 保存原始USB IDs文件
 */
export async function saveRawUsbIdsFile(
  content: string,
  filePath: string,
  verbose = true,
): Promise<void> {
  try {
    fs.writeFileSync(filePath, content, 'utf8')
    successWithTime(`原始USB IDs文件已保存到 ${filePath}`, verbose)
  }
  catch (error) {
    errorWithTime(`保存原始USB IDs文件失败: ${(error as Error).message}`)
    throw error
  }
}

export async function fetchUsbIdsData(
  usbIdsUrls: string[],
  fallbackFile: string,
  root: string,
  verbose = true,
  forceUpdate = false,
): Promise<{ data: UsbIdsData, source: 'api' | 'fallback', versionInfo: VersionInfo }> {
  const startTime = Date.now()
  const versionFilePath = path.resolve(root, 'usb.ids.version.json')

  try {
    startWithTime('开始获取USB设备数据...', verbose)

    // 检查现有版本信息
    const existingVersion = loadVersionInfo(versionFilePath)
    if (existingVersion && verbose) {
      logWithTime(`当前版本: ${existingVersion.version}, 获取时间: ${existingVersion.fetchTimeFormatted}`, verbose)
    }

    // 检查是否需要更新
    if (!shouldUpdate(existingVersion, forceUpdate)) {
      logWithTime('当前版本仍在有效期内，跳过更新', verbose)
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
        return { data, source: 'fallback', versionInfo: existingVersion! }
      }
    }

    let usbIdsContent: string | null = null
    const downloadStartTime = Date.now()

    // 尝试从多个URL下载
    for (const url of usbIdsUrls) {
      try {
        usbIdsContent = await downloadFile(url, verbose)
        const downloadTime = Date.now() - downloadStartTime
        logWithTime(`成功从 ${url} 下载数据 (耗时: ${downloadTime}ms)`, verbose)
        break
      }
      catch (error) {
        warnWithTime(`从 ${url} 下载失败: ${(error as Error).message}`, verbose)
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
          logWithTime('远程内容未发生变化，使用现有数据', verbose)
          const fallbackPath = path.resolve(root, fallbackFile)
          if (fs.existsSync(fallbackPath)) {
            const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
            return { data, source: 'fallback', versionInfo: existingVersion }
          }
        }
      }

      // 保存原始文件
      const rawFilePath = path.resolve(root, 'usb.ids')
      await saveRawUsbIdsFile(usbIdsContent, rawFilePath, verbose)

      const parseStartTime = Date.now()
      logWithTime('解析USB设备数据...', verbose)
      data = parseUsbIds(usbIdsContent)
      const parseTime = Date.now() - parseStartTime
      logWithTime(`解析完成，共 ${Object.keys(data).length} 个供应商 (耗时: ${parseTime}ms)`, verbose)
      source = 'api'
      rawContent = usbIdsContent
    }
    else {
      warnWithTime('所有公共API都无法访问，使用本地fallback文件', verbose)
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
        logWithTime('使用本地fallback文件', verbose)
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
    await saveVersionInfo(versionInfo, versionFilePath, verbose)

    const totalTime = Date.now() - startTime
    logWithTime(`数据获取完成 (总耗时: ${totalTime}ms)`, verbose)
    logWithTime(`版本: v${versionInfo.version}`, verbose)

    return { data, source, versionInfo }
  }
  catch (error) {
    errorWithTime(`获取USB设备数据失败: ${(error as Error).message}`)
    throw error
  }
}

/**
 * 保存USB设备数据到JSON文件
 */
export async function saveUsbIdsToFile(
  data: UsbIdsData,
  filePath: string,
  verbose = true,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')

    const vendorCount = Object.keys(data).length
    const deviceCount = Object.values(data).reduce((total, vendor) => {
      return total + Object.keys(vendor.devices || {}).length
    }, 0)

    successWithTime(`USB设备数据已保存到 ${filePath}，包含 ${vendorCount} 个供应商，${deviceCount} 个设备`, verbose)
  }
  catch (error) {
    errorWithTime(`保存USB设备数据失败: ${(error as Error).message}`)
    throw error
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
  verbose = true,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(versionInfo, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
    successWithTime(`版本信息已保存到 ${filePath}`, verbose)
  }
  catch (error) {
    errorWithTime(`保存版本信息失败: ${(error as Error).message}`)
    throw error
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
  catch (error) {
    warnWithTime(`读取版本信息失败: ${(error as Error).message}`)
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
