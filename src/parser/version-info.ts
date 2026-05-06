import type { UsbDatasetV2, UsbIdsData, VersionInfo } from '../types'
import { nextCalVer } from '../calver'
import { formatDateTime } from './datetime'
import { generateContentHash } from './hash'

function countVendorsAndDevices(data: UsbIdsData | UsbDatasetV2): { vendorCount: number, deviceCount: number } {
  if ('schemaVersion' in data && data.schemaVersion === 2) {
    let deviceCount = 0
    for (const v of Object.values(data.vendors)) {
      deviceCount += Object.keys(v.devices).length
    }
    return { vendorCount: Object.keys(data.vendors).length, deviceCount }
  }
  const legacy = data as UsbIdsData
  let deviceCount = 0
  for (const v of Object.values(legacy)) {
    deviceCount += Object.keys(v.devices).length
  }
  return { vendorCount: Object.keys(legacy).length, deviceCount }
}

export function createVersionInfo(
  data: UsbIdsData | UsbDatasetV2,
  rawContent: string,
  source: 'api' | 'fallback',
  /** Current npm/package.json version for CalVer bump */
  currentPackageVersion: string,
): VersionInfo {
  const fetchTime = Date.now()
  const contentHash = generateContentHash(rawContent)

  const { vendorCount, deviceCount } = countVendorsAndDevices(data)

  return {
    fetchTime,
    fetchTimeFormatted: formatDateTime(fetchTime),
    contentHash,
    source,
    vendorCount,
    deviceCount,
    version: nextCalVer(fetchTime, currentPackageVersion),
    schemaVersion: 'schemaVersion' in data && data.schemaVersion === 2 ? 2 : undefined,
  }
}

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

  const now = Date.now()
  const timeDiff = now - versionInfo.fetchTime
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  return hoursDiff >= 24
}
