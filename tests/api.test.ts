import type { UsbDevice, UsbIdsData, UsbVendor, VersionInfo } from '../src/types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { USB_IDS_JSON_FILE, USB_IDS_VERSION_JSON_FILE } from '../src/config'

// 读取真实的测试数据
const projectRoot = path.resolve(__dirname, '..')
const usbDataPath = path.join(projectRoot, USB_IDS_JSON_FILE)
const versionDataPath = path.join(projectRoot, USB_IDS_VERSION_JSON_FILE)

const realUsbData: UsbIdsData = JSON.parse(fs.readFileSync(usbDataPath, 'utf8'))
const realVersionInfo: VersionInfo = JSON.parse(fs.readFileSync(versionDataPath, 'utf8'))

// Mock fetchUsbIdsData to return real data
vi.mock('../src/core', () => ({
  fetchUsbIdsData: vi.fn().mockResolvedValue({
    data: realUsbData,
    source: 'api' as const,
    versionInfo: realVersionInfo,
  }),
}))

describe('api functions', () => {
  let api: typeof import('../src/api')

  beforeEach(async () => {
    // 动态导入API模块
    api = await import('../src/api')
  })

  describe('async functions', () => {
    describe('getVendors', () => {
      it('should return all vendors', async () => {
        const vendors = await api.getVendors()
        expect(vendors.length).toBeGreaterThan(0)
        expect(vendors[0]).toHaveProperty('vendor')
      })

      it('should filter vendors by string', async () => {
        const vendors = await api.getVendors('Apple')
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should filter by vendor ID', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const vendors = await api.getVendors(firstVendorId)
        expect(vendors).toHaveLength(1)
        expect(vendors[0].vendor).toBe(firstVendorId)
      })

      it('should filter vendors by function', async () => {
        const vendors = await api.getVendors(
          (vendor: UsbVendor) => vendor.name.toLowerCase().includes('apple'),
        )
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should support force update', async () => {
        const vendors = await api.getVendors(undefined, true)
        expect(vendors.length).toBeGreaterThan(0)
      })
    })

    describe('getVendor', () => {
      it('should return matching vendor', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const vendor = await api.getVendor(firstVendorId)
        expect(vendor).not.toBeNull()
        expect(vendor!.vendor).toBe(firstVendorId)
      })

      it('should return null if no match', async () => {
        const vendor = await api.getVendor('ffffffff')
        expect(vendor).toBeNull()
      })

      it('should filter by function', async () => {
        const vendor = await api.getVendor(
          (v: UsbVendor) => v.name.toLowerCase().includes('apple'),
        )
        if (vendor) {
          expect(vendor.name.toLowerCase()).toContain('apple')
        }
      })
    })

    describe('getDevices', () => {
      it('should return all devices for vendor', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const devices = await api.getDevices(firstVendorId)
        expect(devices.length).toBeGreaterThanOrEqual(0)
        if (devices.length > 0) {
          expect(devices[0]).toHaveProperty('devid')
        }
      })

      it('should filter devices by string', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceName = Object.values(realUsbData[firstVendorId].devices)[0]?.devname
        if (firstDeviceName) {
          const devices = await api.getDevices(firstVendorId, firstDeviceName)
          expect(devices).toHaveLength(1)
          expect(devices[0].devname).toBe(firstDeviceName)
        }
      })

      it('should filter devices by function', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const devices = await api.getDevices(
            firstVendorId,
            (device: UsbDevice) => device.devid === firstDeviceId,
          )
          expect(devices).toHaveLength(1)
          expect(devices[0].devid).toBe(firstDeviceId)
        }
      })

      it('should return empty array for non-existent vendor', async () => {
        const devices = await api.getDevices('ffffffff')
        expect(devices).toHaveLength(0)
      })
    })

    describe('getDevice', () => {
      it('should return specified device', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const device = await api.getDevice(firstVendorId, firstDeviceId)
          expect(device).not.toBeNull()
          expect(device!.devid).toBe(firstDeviceId)
        }
      })

      it('should return null for non-existent device', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const device = await api.getDevice(firstVendorId, 'ffffffff')
        expect(device).toBeNull()
      })

      it('should return null for non-existent vendor', async () => {
        const device = await api.getDevice('ffffffff', '0001')
        expect(device).toBeNull()
      })
    })

    describe('searchDevices', () => {
      it('should search by device name', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDevice = Object.values(realUsbData[firstVendorId].devices)[0]
        if (firstDevice) {
          const results = await api.searchDevices(firstDevice.devname)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devname).toBe(firstDevice.devname)
        }
      })

      it('should search by vendor name', async () => {
        const firstVendor = Object.values(realUsbData)[0]
        if (firstVendor) {
          const results = await api.searchDevices(firstVendor.name)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].vendor.name).toBe(firstVendor.name)
        }
      })

      it('should search by device ID', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const results = await api.searchDevices(firstDeviceId)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devid).toBe(firstDeviceId)
        }
      })

      it('should return empty array for no matches', async () => {
        const results = await api.searchDevices('nonexistent')
        expect(results).toHaveLength(0)
      })

      it('should support force update', async () => {
        const results = await api.searchDevices('nonexistent12345', true)
        expect(results).toHaveLength(0)
      })
    })
  })

  describe('sync functions', () => {
    describe('getVendorsSync', () => {
      it('should return all vendors', () => {
        const vendors = api.getVendorsSync(undefined, realUsbData)
        expect(vendors.length).toBeGreaterThan(0)
        expect(vendors[0]).toHaveProperty('vendor')
      })

      it('should filter vendors by string', () => {
        const vendors = api.getVendorsSync('Apple', realUsbData)
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should throw error when no cached data', () => {
        expect(() => api.getVendorsSync()).toThrow('没有可用的USB设备数据')
      })
    })

    describe('getVendorSync', () => {
      it('should return matching vendor', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const vendor = api.getVendorSync(firstVendorId, realUsbData)
        expect(vendor).not.toBeNull()
        expect(vendor!.vendor).toBe(firstVendorId)
      })

      it('should return null if no match', () => {
        const vendor = api.getVendorSync('ffffffff', realUsbData)
        expect(vendor).toBeNull()
      })
    })

    describe('getDevicesSync', () => {
      it('should return all devices for vendor', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const devices = api.getDevicesSync(firstVendorId, undefined, realUsbData)
        expect(devices.length).toBeGreaterThanOrEqual(0)
        if (devices.length > 0) {
          expect(devices[0]).toHaveProperty('devid')
        }
      })

      it('should filter devices by string', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceName = Object.values(realUsbData[firstVendorId].devices)[0]?.devname
        if (firstDeviceName) {
          const devices = api.getDevicesSync(firstVendorId, firstDeviceName, realUsbData)
          expect(devices).toHaveLength(1)
          expect(devices[0].devname).toBe(firstDeviceName)
        }
      })
    })

    describe('getDeviceSync', () => {
      it('should return specified device', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const device = api.getDeviceSync(firstVendorId, firstDeviceId, realUsbData)
          expect(device).not.toBeNull()
          expect(device!.devid).toBe(firstDeviceId)
        }
      })

      it('should return null for non-existent device', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const device = api.getDeviceSync(firstVendorId, 'ffffffff', realUsbData)
        expect(device).toBeNull()
      })
    })

    describe('searchDevicesSync', () => {
      it('should search devices by keyword', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDevice = Object.values(realUsbData[firstVendorId].devices)[0]
        if (firstDevice) {
          const results = api.searchDevicesSync(firstDevice.devname, realUsbData)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devname).toBe(firstDevice.devname)
        }
      })

      it('should throw error when no cached data', () => {
        expect(() => api.searchDevicesSync('test')).toThrow('没有可用的USB设备数据')
      })
    })

    describe('getUsbData', () => {
      it('should return complete USB data', async () => {
        const data = await api.getUsbData()
        expect(Object.keys(data).length).toBeGreaterThan(0)
        const firstVendorId = Object.keys(data)[0]
        expect(data[firstVendorId]).toBeDefined()
      })

      it('should support force update', async () => {
        const data = await api.getUsbData(true)
        expect(Object.keys(data).length).toBeGreaterThan(0)
      })
    })
  })
})
