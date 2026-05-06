import type { MockedFunction } from 'vitest'
import type { UsbIdsData, VersionInfo } from '../src/types'
import { vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  const mockUsbData: UsbIdsData = {
    '1d6b': {
      vendor: '1d6b',
      name: 'Linux Foundation',
      devices: {
        '0001': {
          devid: '0001',
          devname: '1.1 root hub',
        },
        '0002': {
          devid: '0002',
          devname: '2.0 root hub',
        },
      },
    },
    '05ac': {
      vendor: '05ac',
      name: 'Apple, Inc.',
      devices: {
        '12a8': {
          devid: '12a8',
          devname: 'iPhone 5/5C/5S/6/SE/7/8/X',
        },
        '1460': {
          devid: '1460',
          devname: 'Bluetooth Host Controller',
        },
      },
    },
    '1234': {
      vendor: '1234',
      name: 'Test Vendor',
      devices: {
        5678: {
          devid: '5678',
          devname: 'Test Device',
        },
      },
    },
  }

  const mockVersionInfo: VersionInfo = {
    fetchTime: Date.now(),
    fetchTimeFormatted: new Date().toISOString(),
    contentHash: 'mock-hash-12345',
    source: 'api' as const,
    vendorCount: 3,
    deviceCount: 5,
    version: '1.0.0-test',
  }

  return { mockUsbData, mockVersionInfo }
})

export const mockUsbData = hoisted.mockUsbData
export const mockVersionInfo = hoisted.mockVersionInfo

vi.mock('../src/node/data', () => ({
  loadUsbData: vi.fn().mockImplementation(async () => hoisted.mockUsbData),
  loadUsbDataSync: vi.fn().mockImplementation(() => hoisted.mockUsbData),
  updateUsbData: vi.fn().mockImplementation(async () => ({
    data: hoisted.mockUsbData,
    source: 'api' as const,
    versionInfo: hoisted.mockVersionInfo,
  })),
}))

/** @deprecated Use node/data mock instead */
export function createMockFetchUsbIdsData(): MockedFunction<
  (usbIdsUrls: string[], fallbackFile: string, root: string, forceUpdate?: boolean) => Promise<{
    data: UsbIdsData
    source: 'api' | 'fallback'
    versionInfo: VersionInfo
  }>
> {
  return vi.fn().mockResolvedValue({
    data: hoisted.mockUsbData,
    source: 'api' as const,
    versionInfo: hoisted.mockVersionInfo,
  })
}
