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

const SCHEMA_MAJOR = 2

export function createVersionInfo(
  data: UsbIdsData | UsbDatasetV2,
  rawContent: string,
  upstreamVersion: string,
  upstreamDate: string | null,
  currentReleaseVersion: string,
): VersionInfo {
  const buildTime = Date.now()
  const upstreamHash = generateContentHash(rawContent)

  const { vendorCount, deviceCount } = countVendorsAndDevices(data)

  return {
    releaseVersion: nextCalVer({
      upstreamVersion,
      currentReleaseVersion,
      schemaMajor: SCHEMA_MAJOR,
    }),
    upstreamVersion,
    upstreamDate,
    upstreamHash,
    schemaVersion: 2,
    buildTime,
    buildTimeFormatted: formatDateTime(buildTime),
    vendorCount,
    deviceCount,
  }
}
