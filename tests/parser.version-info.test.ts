import type { UsbIdsData } from '../src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVersionInfo } from '../src/parser/version-info'

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

  it('derives CalVer YMD from upstreamVersion (not clock)', () => {
    const info = createVersionInfo(legacy, 'raw-bytes', '2026.03.01', null, '1.0.0')
    expect(info.releaseVersion).toBe('2.20260301.0')
    expect(info.schemaVersion).toBe(2)
    expect(info.upstreamHash).toMatch(/^[a-f0-9]{64}$/)
    expect(info.upstreamVersion).toBe('2026.03.01')
  })

  it('increments N on same upstream YMD', () => {
    const first = createVersionInfo(legacy, 'raw1', '2026.05.06', 'd1', '1.0.0')
    expect(first.releaseVersion).toBe('2.20260506.0')
    const second = createVersionInfo(legacy, 'raw2', '2026.05.06', 'd1', '2.20260506.0')
    expect(second.releaseVersion).toBe('2.20260506.1')
  })

  it('stores upstreamDate', () => {
    const info = createVersionInfo(legacy, 'x', '2026.01.01', 'Monday', '1.0.0')
    expect(info.upstreamDate).toBe('Monday')
  })
})
