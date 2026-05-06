import type { UsbDatasetV2, UsbIdsData, VersionInfo } from '../types'
import * as fs from 'node:fs'
import { normalizeVersionInfo } from '../version-manifest'

export async function saveRawUsbIdsFile(
  content: string,
  filePath: string,
): Promise<void> {
  try {
    fs.writeFileSync(filePath, content, 'utf8')
  }
  catch (error) {
    throw new Error(`Failed to save raw usb.ids: ${(error as Error).message}`)
  }
}

export async function saveUsbIdsToFile(
  data: UsbDatasetV2 | UsbIdsData,
  filePath: string,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
  }
  catch (error) {
    throw new Error(`Failed to save usb.ids JSON: ${(error as Error).message}`)
  }
}

export async function saveVersionInfo(
  versionInfo: VersionInfo,
  filePath: string,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(versionInfo, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')
  }
  catch (error) {
    throw new Error(`Failed to save version file: ${(error as Error).message}`)
  }
}

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

export function loadVersionInfo(filePath: string): VersionInfo | null {
  const raw = loadJsonFile<unknown>(filePath)
  return normalizeVersionInfo(raw)
}
