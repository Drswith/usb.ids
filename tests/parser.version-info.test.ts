import type { UsbIdsData } from '../src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVersionInfo, shouldUpdate } from '../src/parser/version-info'

const legacy: UsbIdsData = {
  aaaa: {
    vendor: 'aaaa',
    name: 'V',
    devices: { 1111: { devid: '1111', devname: 'D' } },
  },
}

describe('createVersionInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-05-06T12:00:00.000Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('bumps CalVer from non-CalVer package version', () => {
    const info = createVersionInfo(legacy, 'raw-bytes', 'api', '1.0.0')
    expect(info.version).toBe('2.20260506.0')
    expect(info.schemaVersion).toBeUndefined()
    expect(info.contentHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('increments CalVer on same UTC day', () => {
    const first = createVersionInfo(legacy, 'raw1', 'api', '1.0.0')
    expect(first.version).toBe('2.20260506.0')
    vi.setSystemTime(new Date('2026-05-06T13:00:00.000Z'))
    const second = createVersionInfo(legacy, 'raw2', 'api', '2.20260506.0')
    expect(second.version).toBe('2.20260506.1')
  })
})

describe('shouldUpdate', () => {
  it('returns true when forced', () => {
    expect(
      shouldUpdate(
        {
          fetchTime: Date.now(),
          fetchTimeFormatted: '',
          contentHash: '',
          source: 'api',
          vendorCount: 0,
          deviceCount: 0,
          version: '1',
        },
        true,
      ),
    ).toBe(true)
  })

  it('returns true when no prior version', () => {
    expect(shouldUpdate(null, false)).toBe(true)
  })

  it('returns false within 24h', () => {
    const v = {
      fetchTime: Date.now() - 23 * 60 * 60 * 1000,
    } as any
    expect(shouldUpdate(v, false)).toBe(false)
  })

  it('returns true after 24h', () => {
    const v = {
      fetchTime: Date.now() - 25 * 60 * 60 * 1000,
    } as any
    expect(shouldUpdate(v, false)).toBe(true)
  })
})
