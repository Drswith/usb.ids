import type { VersionInfo } from '../src/types'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getUpstreamHashFromManifest,
  legacyReleaseToUpstream,
  normalizeVersionInfo,
  readCurrentReleaseVersion,
  readPackageVersion,
  resolveUpstreamMeta,
} from '../src/version-manifest'

describe('resolveUpstreamMeta', () => {
  it('uses header when present', () => {
    expect(
      resolveUpstreamMeta('# Version: 2026.01.02\n', null, true),
    ).toEqual({ version: '2026.01.02', date: null })
  })

  it('throws when strict and raw usb.ids has no Version line', () => {
    expect(() =>
      resolveUpstreamMeta('aaaa  Vendor\n', null, true),
    ).toThrow(/missing # Version/)
  })

  it('uses JSON + existing manifest upstreamVersion when not strict', () => {
    const existing: VersionInfo = {
      releaseVersion: '2.20260101.0',
      upstreamVersion: '2026.01.01',
      upstreamDate: null,
      upstreamHash: 'x',
      schemaVersion: 2,
      buildTime: 1,
      buildTimeFormatted: '',
      vendorCount: 0,
      deviceCount: 0,
    }
    expect(resolveUpstreamMeta('{"schemaVersion":2}', existing, false)).toEqual({
      version: '2026.01.01',
      date: null,
    })
  })

  it('throws JSON path without existing upstream', () => {
    expect(() =>
      resolveUpstreamMeta('{}', null, false),
    ).toThrow(/requires upstreamVersion/)
  })

  it('derives upstream from legacy CalVer on existing when JSON', () => {
    const legacyOnly = {
      version: '2.20260301.0',
      contentHash: 'ab',
    } as unknown as VersionInfo
    expect(resolveUpstreamMeta('{}', legacyOnly, false)).toEqual({
      version: '2026.03.01',
      date: null,
    })
  })

  it('derives upstream from legacy v1.0.<ms> on existing when JSON', () => {
    const legacyOnly = {
      version: 'v1.0.1766044470065',
      contentHash: 'ab',
    } as unknown as VersionInfo
    expect(resolveUpstreamMeta('{}', legacyOnly, false)).toEqual({
      version: '2025.12.18',
      date: null,
    })
  })
})

describe('legacyReleaseToUpstream', () => {
  it('returns null for non-CalVer', () => {
    expect(legacyReleaseToUpstream('1.0.0')).toBeNull()
  })

  it('maps YYYYMMDD middle segment to dotted date', () => {
    expect(legacyReleaseToUpstream('2.20260301.4')).toBe('2026.03.01')
  })
})

describe('normalizeVersionInfo', () => {
  it('returns null for non-objects', () => {
    expect(normalizeVersionInfo(null)).toBeNull()
    expect(normalizeVersionInfo(undefined)).toBeNull()
    expect(normalizeVersionInfo('x')).toBeNull()
  })

  it('returns null without release identity', () => {
    expect(normalizeVersionInfo({ contentHash: 'a' })).toBeNull()
  })

  it('returns null without hash fields', () => {
    expect(normalizeVersionInfo({ releaseVersion: '2.20260101.0' })).toBeNull()
  })

  it('accepts legacy version + contentHash and derives upstreamVersion', () => {
    expect(
      normalizeVersionInfo({
        version: '2.20260202.0',
        contentHash: 'dead',
        vendorCount: 2,
        deviceCount: 3,
      }),
    ).toMatchObject({
      releaseVersion: '2.20260202.0',
      upstreamVersion: '2026.02.02',
      upstreamHash: 'dead',
      vendorCount: 2,
      deviceCount: 3,
    })
  })

  it('prefers explicit upstreamVersion and releaseVersion', () => {
    expect(
      normalizeVersionInfo({
        releaseVersion: '2.20260101.1',
        upstreamVersion: '2026.04.04',
        upstreamHash: 'z',
      }),
    ).toMatchObject({
      releaseVersion: '2.20260101.1',
      upstreamVersion: '2026.04.04',
      upstreamHash: 'z',
    })
  })

  it('uses fetchTime and fetchTimeFormatted when build* absent', () => {
    expect(
      normalizeVersionInfo({
        releaseVersion: '2.20260101.0',
        upstreamVersion: '2026.01.01',
        upstreamHash: 'h',
        fetchTime: 42,
        fetchTimeFormatted: 'formatted',
      }),
    ).toMatchObject({
      buildTime: 42,
      buildTimeFormatted: 'formatted',
    })
  })

  it('falls back to Date.now and formatDateTime when timestamps missing', () => {
    vi.useFakeTimers({ now: 99_000 })
    expect(
      normalizeVersionInfo({
        releaseVersion: '2.20260101.0',
        upstreamVersion: '2026.01.01',
        upstreamHash: 'h',
      }),
    ).toMatchObject({
      buildTime: 99_000,
    })
    vi.useRealTimers()
  })

  it('returns null when upstream cannot be derived', () => {
    expect(
      normalizeVersionInfo({
        releaseVersion: 'not-semver',
        upstreamHash: 'x',
      }),
    ).toBeNull()
  })

  it('derives upstream from legacy v1.0.<fetchTimeMs> + contentHash', () => {
    expect(
      normalizeVersionInfo({
        version: 'v1.0.1766044470065',
        contentHash: 'dead',
        fetchTime: 1766044470065,
        vendorCount: 1,
        deviceCount: 2,
      }),
    ).toMatchObject({
      releaseVersion: 'v1.0.1766044470065',
      upstreamVersion: '2025.12.18',
      upstreamHash: 'dead',
    })
  })

  it('sets upstreamDate when present', () => {
    expect(
      normalizeVersionInfo({
        releaseVersion: '2.20260101.0',
        upstreamVersion: '2026.01.01',
        upstreamHash: 'h',
        upstreamDate: 'Monday',
        buildTime: 1,
        buildTimeFormatted: 't',
      }),
    ).toMatchObject({ upstreamDate: 'Monday' })
  })
})

describe('readPackageVersion / readCurrentReleaseVersion', () => {
  let dir: string

  afterEach(() => {
    if (dir && fs.existsSync(dir))
      fs.rmSync(dir, { recursive: true, force: true })
  })

  it('reads package.json version', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-ver-'))
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'x', version: '3.1.0' }),
    )
    expect(readPackageVersion(dir)).toBe('3.1.0')
  })

  it('prefers manifest CalVer over package when valid', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-ver-'))
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ version: '1.0.0' }),
    )
    const existing: VersionInfo = {
      releaseVersion: '2.20260505.0',
      upstreamVersion: '2026.05.05',
      upstreamDate: null,
      upstreamHash: 'x',
      schemaVersion: 2,
      buildTime: 1,
      buildTimeFormatted: '',
      vendorCount: 0,
      deviceCount: 0,
    }
    expect(readCurrentReleaseVersion(dir, existing)).toBe('2.20260505.0')
  })

  it('falls back to package when manifest not CalVer-shaped', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-ver-'))
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ version: '9.9.9' }),
    )
    const existing: VersionInfo = {
      releaseVersion: 'dev',
      upstreamVersion: '2026.01.01',
      upstreamDate: null,
      upstreamHash: 'x',
      schemaVersion: 2,
      buildTime: 1,
      buildTimeFormatted: '',
      vendorCount: 0,
      deviceCount: 0,
    }
    expect(readCurrentReleaseVersion(dir, existing)).toBe('9.9.9')
  })
})

describe('getUpstreamHashFromManifest', () => {
  it('returns undefined for null', () => {
    expect(getUpstreamHashFromManifest(null)).toBeUndefined()
  })

  it('reads upstreamHash or legacy contentHash', () => {
    expect(
      getUpstreamHashFromManifest({
        releaseVersion: '2.1.0',
        upstreamVersion: '2026.01.01',
        upstreamDate: null,
        upstreamHash: 'new',
        schemaVersion: 2,
        buildTime: 1,
        buildTimeFormatted: '',
        vendorCount: 0,
        deviceCount: 0,
      }),
    ).toBe('new')

    expect(
      getUpstreamHashFromManifest({
        releaseVersion: '2.1.0',
        upstreamVersion: '2026.01.01',
        upstreamDate: null,
        upstreamHash: undefined,
        contentHash: 'old',
        schemaVersion: 2,
        buildTime: 1,
        buildTimeFormatted: '',
        vendorCount: 0,
        deviceCount: 0,
      } as unknown as VersionInfo),
    ).toBe('old')
  })
})
