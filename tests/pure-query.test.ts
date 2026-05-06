import type { UsbIdsData } from '../src/types'
import { describe, expect, it } from 'vitest'
import { filterVendors } from '../src/pure/query'

describe('filterVendors', () => {
  it('uses exact match for 4-digit hex vendor id string', () => {
    const data: UsbIdsData = {
      aaa0: {
        vendor: 'aaa0',
        name: 'First',
        devices: {},
      },
      aaa1: {
        vendor: 'aaa1',
        name: 'Second',
        devices: {},
      },
    }
    expect(filterVendors(data, 'aaa0')).toEqual([data.aaa0])
    expect(filterVendors(data, 'aaa1')).toEqual([data.aaa1])
  })
})
