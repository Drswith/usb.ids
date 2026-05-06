import type { VersionInfo } from '../src/types'
import { describe, expect, it } from 'vitest'
import { resolveUpstreamMeta } from '../src/version-manifest'

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
})
