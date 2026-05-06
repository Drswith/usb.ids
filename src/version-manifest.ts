import type { VersionInfo } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { legacyReleaseToUpstream } from './manifest-ui'
import { formatDateTime } from './parser/datetime'
import { parseUsbIdsHeader } from './parser/upstream-header'

export { legacyReleaseToUpstream } from './manifest-ui'

type LegacyManifest = Partial<VersionInfo> & {
  version?: string
  contentHash?: string
  fetchTime?: number
  fetchTimeFormatted?: string
}

export function normalizeVersionInfo(raw: unknown): VersionInfo | null {
  if (!raw || typeof raw !== 'object')
    return null
  const r = raw as LegacyManifest

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
      : null
  if (!upstreamHash)
    return null

  let upstreamVersion: string | null = typeof r.upstreamVersion === 'string'
    ? r.upstreamVersion
    : null
  if (!upstreamVersion)
    upstreamVersion = legacyReleaseToUpstream(releaseVersion)
  if (!upstreamVersion)
    return null

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

export function readPackageVersion(repoRoot: string): string {
  const p = path.join(repoRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8')) as { version: string }
  return pkg.version
}

export function readCurrentReleaseVersion(
  repoRoot: string,
  existing: VersionInfo | null,
): string {
  const pkg = readPackageVersion(repoRoot)
  const fromManifest = existing?.releaseVersion ?? (existing as LegacyManifest | null)?.version
  if (fromManifest && /^\d+\.\d{8}\.\d+$/.test(fromManifest))
    return fromManifest
  return pkg
}

export function getUpstreamHashFromManifest(
  v: VersionInfo | null,
): string | undefined {
  if (!v)
    return undefined
  const ex = v as LegacyManifest
  return ex.upstreamHash ?? ex.contentHash
}

/**
 * @param rawContent - Raw `usb.ids` text or JSON fallback bytes as string.
 * @param existing - Previously loaded manifest, if any.
 * @param strictHeader - When true (downloaded raw `usb.ids`), missing `# Version` throws.
 */
export function resolveUpstreamMeta(
  rawContent: string,
  existing: VersionInfo | null,
  strictHeader: boolean,
): { version: string, date: string | null } {
  const header = parseUsbIdsHeader(rawContent)
  if (header.version)
    return { version: header.version, date: header.date }

  const trimmed = rawContent.trimStart()
  const isProbablyJson = trimmed.startsWith('{')

  if (strictHeader && !isProbablyJson) {
    throw new Error('upstream usb.ids missing # Version header')
  }

  const ex = existing
  const fromExisting = ex?.upstreamVersion ?? legacyReleaseToUpstream(ex?.releaseVersion ?? (ex as LegacyManifest | null)?.version ?? '')

  if (fromExisting) {
    return {
      version: fromExisting,
      date: ex?.upstreamDate ?? null,
    }
  }

  throw new Error(
    'Cannot resolve upstream version: JSON or non-usb.ids content requires upstreamVersion in usb.ids.version.json (run fetch with network first)',
  )
}
