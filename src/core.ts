import type { UsbIdsData, VersionInfo } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { USB_IDS_FILE, USB_IDS_VERSION_JSON_FILE } from './config'
import { downloadFromUrls } from './fetcher'
import { createVersionInfo, generateContentHash, parseUsbIds, shouldUpdate } from './parser'

/**
 * 保存原始usb.ids文件
 */
export async function saveRawUsbIdsFile(
  content: string,
  filePath: string,
): Promise<void> {
  try {
    fs.writeFileSync(filePath, content, 'utf8')
  }
  catch (error) {
    throw new Error(`保存原始USB设备数据失败: ${(error as Error).message}`)
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
  const versionFilePath = path.resolve(root, USB_IDS_VERSION_JSON_FILE)

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
    try {
      usbIdsContent = await downloadFromUrls(usbIdsUrls)
    }
    catch {
      // 下载失败，将使用fallback文件
      usbIdsContent = null
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
      const rawFilePath = path.resolve(root, USB_IDS_FILE)
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
 * 通用的 JSON 文件读取函数
 * 基于 loadVersionInfo 的模式，但支持泛型
 */
export function loadJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content) as T
  }
  catch {
    return null
  }
}

/**
 * 读取版本信息
 */
export function loadVersionInfo(filePath: string): VersionInfo | null {
  return loadJsonFile<VersionInfo>(filePath)
}
