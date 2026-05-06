import type { VersionInfo } from './types'
import { formatDateTime } from './parser/datetime'

interface LegacyFields {
  releaseVersion?: string
  version?: string
  upstreamVersion?: string
  upstreamHash?: string
  contentHash?: string
  upstreamDate?: string | null
  buildTime?: number
  buildTimeFormatted?: string
  fetchTime?: number
  fetchTimeFormatted?: string
  vendorCount?: number
  deviceCount?: number
}

/** Convert CalVer `schema.YYYYMMDD.N` (optional `v` prefix) to upstream `YYYY.MM.DD`. */
export function legacyReleaseToUpstream(calVer: string): string | null {
  const trimmed = calVer.replace(/^v/i, '')
  const m = trimmed.match(/^\d+\.(\d{8})\.\d+$/)
  if (!m)
    return null
  const ymd = m[1]
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`
}

/**
 * Lenient manifest parse for browser UI: accepts legacy `version` / `fetchTime` / `contentHash`
 * and never returns null solely because upstream cannot be derived from CalVer.
 */
export function normalizeVersionInfoForUi(raw: unknown): VersionInfo | null {
  if (!raw || typeof raw !== 'object')
    return null
  const r = raw as LegacyFields

  const releaseVersion = typeof r.releaseVersion === 'string'
    ? r.releaseVersion
    : typeof r.version === 'string'
      ? r.version
      : null
  if (!releaseVersion)
    return null

  const upstreamHash = typeof r.upstreamHash === 'string'
    ? r.upstreamHash
    : typeof r.contentHash === 'string'
      ? r.contentHash
      : 'unknown'

  let upstreamVersion = typeof r.upstreamVersion === 'string' ? r.upstreamVersion : ''
  if (!upstreamVersion) {
    const fromCal = legacyReleaseToUpstream(releaseVersion)
    upstreamVersion = fromCal ?? ''
  }

  const buildTime = typeof r.buildTime === 'number'
    ? r.buildTime
    : typeof r.fetchTime === 'number'
      ? r.fetchTime
      : Date.now()

  const buildTimeFormatted = typeof r.buildTimeFormatted === 'string'
    ? r.buildTimeFormatted
    : typeof r.fetchTimeFormatted === 'string'
      ? r.fetchTimeFormatted
      : formatDateTime(buildTime)

  return {
    releaseVersion,
    upstreamVersion,
    upstreamDate: typeof r.upstreamDate === 'string' ? r.upstreamDate : null,
    upstreamHash,
    schemaVersion: 2,
    buildTime,
    buildTimeFormatted,
    vendorCount: Number(r.vendorCount ?? 0),
    deviceCount: Number(r.deviceCount ?? 0),
  }
}
