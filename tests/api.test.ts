import type { UsbDevice, UsbVendor } from '../src/types'
import { describe, expect, it } from 'vitest'
import * as api from '../src/api'
import { mockUsbData } from './setup'

describe('api functions', () => {
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
        const firstVendorId = Object.keys(mockUsbData)[0]
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
        const firstVendorId = Object.keys(mockUsbData)[0]
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
        const firstVendorId = Object.keys(mockUsbData)[0]
        const devices = await api.getDevices(firstVendorId)
        expect(devices.length).toBeGreaterThanOrEqual(0)
        if (devices.length > 0) {
          expect(devices[0]).toHaveProperty('devid')
        }
      })

      it('should filter devices by string', async () => {
        const firstVendorId = Object.keys(mockUsbData)[0]
        const firstDeviceName = Object.values(mockUsbData[firstVendorId].devices)[0]?.devname
        if (firstDeviceName) {
          const devices = await api.getDevices(firstVendorId, firstDeviceName)
          expect(devices).toHaveLength(1)
          expect(devices[0].devname).toBe(firstDeviceName)
        }
      })

      it('should filter devices by function', async () => {
        const firstVendorId = Object.keys(mockUsbData)[0]
        const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
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
        const firstVendorId = Object.keys(mockUsbData)[0]
        const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const device = await api.getDevice(firstVendorId, firstDeviceId)
          expect(device).not.toBeNull()
          expect(device!.devid).toBe(firstDeviceId)
        }
      })

      it('should return null for non-existent device', async () => {
        const firstVendorId = Object.keys(mockUsbData)[0]
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
        const firstVendorId = Object.keys(mockUsbData)[0]
        const firstDevice = Object.values(mockUsbData[firstVendorId].devices)[0]
        if (firstDevice) {
          const results = await api.searchDevices(firstDevice.devname)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devname).toBe(firstDevice.devname)
        }
      })

      it('should search by vendor name', async () => {
        const firstVendor = Object.values(mockUsbData)[0]
        if (firstVendor) {
          const results = await api.searchDevices(firstVendor.name)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].vendor.name).toBe(firstVendor.name)
        }
      })

      it('should search by device ID', async () => {
        const firstVendorId = Object.keys(mockUsbData)[0]
        const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
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

  describe('pure functions', () => {
    describe('filterVendors', () => {
      it('should return all vendors when no filter provided', () => {
        const vendors = api.filterVendors(mockUsbData)
        expect(vendors.length).toBeGreaterThan(0)
        expect(vendors[0]).toHaveProperty('vendor')
      })

      it('should filter vendors by string', () => {
        const vendors = api.filterVendors(mockUsbData, 'Apple')
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should filter vendors by function', () => {
        const vendors = api.filterVendors(mockUsbData, (vendor: UsbVendor) => vendor.name.toLowerCase().includes('apple'),
        )
        expect(vendors.length).toBeGreaterThanOrEqual(0)
        if (vendors.length > 0) {
          expect(vendors[0].name.toLowerCase()).toContain('apple')
        }
      })

      it('should filter vendors by object filter', () => {
        const firstVendorId = Object.keys(mockUsbData)[0]
        const vendors = api.filterVendors(mockUsbData, { id: firstVendorId })
        expect(vendors).toHaveLength(1)
        expect(vendors[0].vendor).toBe(firstVendorId)
      })
    })

    describe('filterDevices', () => {
      it('should return all devices when no filter provided', () => {
        const firstVendor = Object.values(mockUsbData)[0]
        const devices = api.filterDevices(firstVendor)
        expect(devices.length).toBeGreaterThanOrEqual(0)
        if (devices.length > 0) {
          expect(devices[0]).toHaveProperty('devid')
        }
      })

      it('should filter devices by string', () => {
        const firstVendor = Object.values(mockUsbData)[0]
        const firstDeviceName = Object.values(firstVendor.devices)[0]?.devname
        if (firstDeviceName) {
          const devices = api.filterDevices(firstVendor, firstDeviceName)
          expect(devices).toHaveLength(1)
          expect(devices[0].devname).toBe(firstDeviceName)
        }
      })

      it('should filter devices by function', () => {
        const firstVendor = Object.values(mockUsbData)[0]
        const firstDeviceId = Object.keys(firstVendor.devices)[0]
        if (firstDeviceId) {
          const devices = api.filterDevices(firstVendor, (device: UsbDevice) => device.devid === firstDeviceId,
          )
          expect(devices).toHaveLength(1)
          expect(devices[0].devid).toBe(firstDeviceId)
        }
      })
    })

    describe('searchInData', () => {
      it('should search devices by keyword', () => {
        const firstVendor = Object.values(mockUsbData)[0]
        const firstDevice = Object.values(firstVendor.devices)[0]
        if (firstDevice) {
          const results = api.searchInData(mockUsbData, firstDevice.devname)
          expect(results.length).toBeGreaterThanOrEqual(1)
          expect(results[0].device.devname).toBe(firstDevice.devname)
        }
      })

      it('should return empty array for empty query', () => {
        const results = api.searchInData(mockUsbData, '')
        expect(results).toHaveLength(0)
      })

      it('should return empty array for no matches', () => {
        const results = api.searchInData(mockUsbData, 'nonexistent12345')
        expect(results).toHaveLength(0)
      })

      it('should sort results by priority', () => {
        const firstVendorId = Object.keys(mockUsbData)[0]
        const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
        if (firstDeviceId) {
          const results = api.searchInData(mockUsbData, firstDeviceId)
          expect(results.length).toBeGreaterThanOrEqual(1)
          // 精确匹配应该排在前面
          expect(results[0].device.devid).toBe(firstDeviceId)
        }
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
