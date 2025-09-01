import type { UsbDevice, UsbIdsData, UsbVendor, VersionInfo } from '../src/types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 读取真实的测试数据
const projectRoot = path.resolve(__dirname, '..')
const usbDataPath = path.join(projectRoot, 'usb.ids.json')
const versionDataPath = path.join(projectRoot, 'usb.ids.version.json')

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
    api.clearCache()
  })

  describe('sync functions', () => {
    describe('getVendors', () => {
      it('should return all vendors', () => {
        const vendors = api.getVendors(undefined, realUsbData)
        expect(vendors.length).toBeGreaterThan(0)
        expect(vendors[0]).toHaveProperty('vendor')
      })

      it('should filter vendors by string', () => {
        const vendors = api.getVendors('Apple', realUsbData)
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should filter by vendor ID', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const vendors = api.getVendors(firstVendorId, realUsbData)
        expect(vendors).toHaveLength(1)
        expect(vendors[0].vendor).toBe(firstVendorId)
      })

      it('should filter vendors by function', () => {
        const vendors = api.getVendors(
          (vendor: UsbVendor) => vendor.name.toLowerCase().includes('apple'),
          realUsbData,
        )
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should throw error when no cached data', () => {
        expect(() => api.getVendors()).toThrow('没有可用的USB设备数据')
      })
    })

    describe('getVendor', () => {
      it('should return matching vendor', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const vendor = api.getVendor(firstVendorId, realUsbData)
        expect(vendor).not.toBeNull()
        expect(vendor!.vendor).toBe(firstVendorId)
      })

      it('should return null if no match', () => {
        const vendor = api.getVendor('ffffffff', realUsbData)
        expect(vendor).toBeNull()
      })

      it('should filter by function', () => {
        const vendor = api.getVendor(
          (v: UsbVendor) => v.name.toLowerCase().includes('apple'),
          realUsbData,
        )
        if (vendor) {
          expect(vendor.name.toLowerCase()).toContain('apple')
        }
      })
    })

    describe('getDevices', () => {
      it('should return all devices for vendor', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const devices = api.getDevices(firstVendorId, undefined, realUsbData)
        expect(devices.length).toBeGreaterThanOrEqual(0)
        if (devices.length > 0) {
          expect(devices[0]).toHaveProperty('devid')
        }
      })

      it('should filter devices by string', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceName = Object.values(realUsbData[firstVendorId].devices)[0]?.devname
        if (firstDeviceName) {
          const devices = api.getDevices(firstVendorId, firstDeviceName, realUsbData)
          expect(devices).toHaveLength(1)
          expect(devices[0].devname).toBe(firstDeviceName)
        }
      })

      it('should filter devices by function', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const devices = api.getDevices(
            firstVendorId,
            (device: UsbDevice) => device.devid === firstDeviceId,
            realUsbData,
          )
          expect(devices).toHaveLength(1)
          expect(devices[0].devid).toBe(firstDeviceId)
        }
      })

      it('should return empty array for non-existent vendor', () => {
        const devices = api.getDevices('ffffffff', undefined, realUsbData)
        expect(devices).toHaveLength(0)
      })
    })

    describe('getDevice', () => {
      it('should return specified device', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const device = api.getDevice(firstVendorId, firstDeviceId, realUsbData)
          expect(device).not.toBeNull()
          expect(device!.devid).toBe(firstDeviceId)
        }
      })

      it('should return null for non-existent device', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const device = api.getDevice(firstVendorId, 'ffffffff', realUsbData)
        expect(device).toBeNull()
      })

      it('should return null for non-existent vendor', () => {
        const device = api.getDevice('ffffffff', '0001', realUsbData)
        expect(device).toBeNull()
      })
    })

    describe('searchDevices', () => {
      it('should search by device name', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDevice = Object.values(realUsbData[firstVendorId].devices)[0]
        if (firstDevice) {
          const results = api.searchDevices(firstDevice.devname, realUsbData)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devname).toBe(firstDevice.devname)
        }
      })

      it('should search by vendor name', () => {
        const firstVendor = Object.values(realUsbData)[0]
        if (firstVendor) {
          const results = api.searchDevices(firstVendor.name, realUsbData)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].vendor.name).toBe(firstVendor.name)
        }
      })

      it('should search by device ID', () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const results = api.searchDevices(firstDeviceId, realUsbData)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devid).toBe(firstDeviceId)
        }
      })

      it('should return empty array for no matches', () => {
        const results = api.searchDevices('nonexistent', realUsbData)
        expect(results).toHaveLength(0)
      })

      it('should throw error when no cached data', () => {
        expect(() => api.searchDevices('test')).toThrow('没有可用的USB设备数据')
      })
    })
  })

  describe('async functions', () => {
    describe('getVendorsAsync', () => {
      it('should return all vendors', async () => {
        const vendors = await api.getVendorsAsync()
        expect(vendors.length).toBeGreaterThan(0)
        expect(vendors[0]).toHaveProperty('vendor')
      })

      it('should filter vendors by string', async () => {
        const vendors = await api.getVendorsAsync('Apple')
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should support force update', async () => {
        const vendors = await api.getVendorsAsync(undefined, true)
        expect(vendors.length).toBeGreaterThan(0)
      })
    })

    describe('getVendorAsync', () => {
      it('should return matching vendor', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const vendor = await api.getVendorAsync(firstVendorId)
        expect(vendor).not.toBeNull()
        expect(vendor!.vendor).toBe(firstVendorId)
      })

      it('should return null if no match', async () => {
        const vendor = await api.getVendorAsync('ffffffff')
        expect(vendor).toBeNull()
      })
    })

    describe('getDevicesAsync', () => {
      it('should return all devices for vendor', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const devices = await api.getDevicesAsync(firstVendorId)
        expect(devices.length).toBeGreaterThanOrEqual(0)
        if (devices.length > 0) {
          expect(devices[0]).toHaveProperty('devid')
        }
      })

      it('should filter devices by string', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceName = Object.values(realUsbData[firstVendorId].devices)[0]?.devname
        if (firstDeviceName) {
          const devices = await api.getDevicesAsync(firstVendorId, firstDeviceName)
          expect(devices).toHaveLength(1)
          expect(devices[0].devname).toBe(firstDeviceName)
        }
      })
    })

    describe('getDeviceAsync', () => {
      it('should return specified device', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDeviceId = Object.keys(realUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const device = await api.getDeviceAsync(firstVendorId, firstDeviceId)
          expect(device).not.toBeNull()
          expect(device!.devid).toBe(firstDeviceId)
        }
      })

      it('should return null for non-existent device', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const device = await api.getDeviceAsync(firstVendorId, 'ffffffff')
        expect(device).toBeNull()
      })
    })

    describe('searchDevicesAsync', () => {
      it('should search devices by keyword', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDevice = Object.values(realUsbData[firstVendorId].devices)[0]
        if (firstDevice) {
          const results = await api.searchDevicesAsync(firstDevice.devname)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devname).toBe(firstDevice.devname)
        }
      })

      it('should support force update', async () => {
        const firstVendorId = Object.keys(realUsbData)[0]
        const firstDevice = Object.values(realUsbData[firstVendorId].devices)[0]
        if (firstDevice) {
          const results = await api.searchDevicesAsync(firstDevice.devname, true)
          expect(results.length).toBeGreaterThanOrEqual(1)
        }
      })
    })

    describe('getUsbDataAsync', () => {
      it('should return complete USB data', async () => {
        const data = await api.getUsbDataAsync()
        expect(Object.keys(data).length).toBeGreaterThan(0)
        const firstVendorId = Object.keys(data)[0]
        expect(data[firstVendorId]).toBeDefined()
      })

      it('should support force update', async () => {
        const data = await api.getUsbDataAsync(true)
        expect(Object.keys(data).length).toBeGreaterThan(0)
      })
    })
  })

  describe('cache management', () => {
    describe('clearCache', () => {
      it('should clear cache', () => {
        api.clearCache()
        const cacheInfo = api.getCacheInfo()
        expect(cacheInfo.hasCache).toBe(false)
        expect(cacheInfo.cacheAge).toBe(0)
      })
    })

    describe('getCacheInfo', () => {
      it('should return correct cache info', async () => {
        // 首先获取数据以建立缓存
        await api.getUsbDataAsync()

        const cacheInfo = api.getCacheInfo()
        expect(cacheInfo.hasCache).toBe(true)
        expect(cacheInfo.cacheAge).toBeGreaterThanOrEqual(0)
      })

      it('should return correct info when no cache', () => {
        api.clearCache()
        const cacheInfo = api.getCacheInfo()
        expect(cacheInfo.hasCache).toBe(false)
        expect(cacheInfo.cacheAge).toBe(0)
      })
    })
  })
})
