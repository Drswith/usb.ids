import { describe, expect, it } from 'vitest'
import { isDatasetV2, toV1 } from '../src/legacy/to-v1'
import { parseUsbIdsFull } from '../src/parser/full-usb-ids'
import { MINI_USB_IDS } from './fixtures/mini-usb.ids'

describe('legacy toV1', () => {
  it('detects v2 and flattens vendors only', () => {
    const v2 = parseUsbIdsFull(MINI_USB_IDS)
    expect(isDatasetV2(v2)).toBe(true)
    const v1 = toV1(v2)
    expect(v1.aaaa?.name).toBe('Fixture Vendor')
    expect(v1.aaaa?.devices['1111']?.devname).toBe('Fixture Device')
    expect(isDatasetV2(v1)).toBe(false)
  })

  it('isDatasetV2 false for legacy record', () => {
    expect(isDatasetV2({ aaaa: { vendor: 'aaaa', name: 'x', devices: {} } })).toBe(false)
  })
})
