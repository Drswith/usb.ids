import type { UsbDatasetV2, UsbIdsData, VersionInfo } from '../types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { USB_IDS_FILE, USB_IDS_VERSION_JSON_FILE } from '../config'
import { downloadFromUrls } from '../fetcher'
import { isDatasetV2 } from '../legacy/to-v1'
import { createVersionInfo, generateContentHash, parseUsbIdsFull, shouldUpdate } from '../parser'
import {
  loadVersionInfo,
  saveRawUsbIdsFile,
  saveVersionInfo,
} from '../repository/file-store'

function readPackageVersion(repoRoot: string): string {
  const p = path.join(repoRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8')) as { version: string }
  return pkg.version
}

function readFallbackDataset(fallbackPath: string): { data: UsbDatasetV2 | UsbIdsData, rawText: string } {
  const rawText = fs.readFileSync(fallbackPath, 'utf8')
  const parsed = JSON.parse(rawText) as unknown
  if (isDatasetV2(parsed))
    return { data: parsed, rawText }
  return { data: parsed as UsbIdsData, rawText }
}

/**
 * Fetch or load USB ID data (single orchestration entry for core/CLI/API).
 */
export async function fetchUsbIdsData(
  usbIdsUrls: string[],
  fallbackFile: string,
  root: string,
  forceUpdate = false,
): Promise<{ data: UsbDatasetV2 | UsbIdsData, source: 'api' | 'fallback', versionInfo: VersionInfo }> {
  const versionFilePath = path.resolve(root, USB_IDS_VERSION_JSON_FILE)

  try {
    const existingVersion = loadVersionInfo(versionFilePath)

    if (!shouldUpdate(existingVersion, forceUpdate)) {
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        const { data } = readFallbackDataset(fallbackPath)
        return { data, source: 'fallback', versionInfo: existingVersion! }
      }
    }

    let usbIdsContent: string | null = null

    try {
      usbIdsContent = await downloadFromUrls(usbIdsUrls)
    }
    catch {
      usbIdsContent = null
    }

    let data: UsbDatasetV2 | UsbIdsData
    let source: 'api' | 'fallback'
    let rawContent: string

    if (usbIdsContent) {
      if (existingVersion && !forceUpdate) {
        const newHash = generateContentHash(usbIdsContent)
        if (newHash === existingVersion.contentHash) {
          const fallbackPath = path.resolve(root, fallbackFile)
          if (fs.existsSync(fallbackPath)) {
            const { data } = readFallbackDataset(fallbackPath)
            return { data, source: 'fallback', versionInfo: existingVersion }
          }
        }
      }

      const rawFilePath = path.resolve(root, USB_IDS_FILE)
      await saveRawUsbIdsFile(usbIdsContent, rawFilePath)

      data = parseUsbIdsFull(usbIdsContent)
      source = 'api'
      rawContent = usbIdsContent
    }
    else {
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        const { data: fbData, rawText } = readFallbackDataset(fallbackPath)
        data = fbData
        source = 'fallback'
        rawContent = rawText
      }
      else {
        throw new Error('Unable to fetch USB IDs and no local fallback file exists')
      }
    }

    const versionInfo = createVersionInfo(data, rawContent, source, readPackageVersion(root))
    await saveVersionInfo(versionInfo, versionFilePath)

    return { data, source, versionInfo }
  }
  catch (error) {
    throw new Error(`Failed to fetch USB ID data: ${(error as Error).message}`)
  }
}

export { loadJsonFile, loadVersionInfo } from '../repository/file-store'
export { saveRawUsbIdsFile, saveUsbIdsToFile, saveVersionInfo } from '../repository/file-store'
