import { describe, expect, it } from 'vitest'
import * as api from '../src/api'
import { mockUsbData } from './setup'

describe('browser Environment API Tests', () => {
  describe('async API Functions in Browser Environment', () => {
    it('should get all vendors in browser environment', async () => {
      const vendors = await api.getVendors()
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0]).toHaveProperty('vendor')
      expect(vendors[0]).toHaveProperty('name')
      expect(vendors[0]).toHaveProperty('devices')
    })

    it('should get specific vendor by ID in browser environment', async () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const vendor = await api.getVendor(firstVendorId)
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe(firstVendorId)
      expect(vendor!.name).toBe(mockUsbData[firstVendorId].name)
    })

    it('should get vendor devices in browser environment', async () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const devices = await api.getDevices(firstVendorId)
      expect(devices.length).toBeGreaterThan(0)
      expect(devices[0]).toHaveProperty('devid')
      expect(devices[0]).toHaveProperty('devname')
    })

    it('should get specific device in browser environment', async () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
      const device = await api.getDevice(firstVendorId, firstDeviceId)
      expect(device).not.toBeNull()
      expect(device!.devid).toBe(firstDeviceId)
      expect(device!.devname).toBe(mockUsbData[firstVendorId].devices[firstDeviceId].devname)
    })

    it('should search devices across vendors in browser environment', async () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const results = await api.searchDevices(firstVendor.name)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0]).toHaveProperty('vendor')
      expect(results[0]).toHaveProperty('device')
      expect(results[0].vendor.name).toBe(firstVendor.name)
    })

    it('should get complete USB data in browser environment', async () => {
      const data = await api.getUsbData()
      expect(Object.keys(data).length).toBeGreaterThan(0)
      const firstVendorId = Object.keys(mockUsbData)[0]
      expect(data[firstVendorId]).toBeDefined()
      expect(data[firstVendorId].vendor).toBe(firstVendorId)
    })
  })

  describe('pure Function Tools in Browser Environment', () => {
    it('should filter vendors without conditions', () => {
      const vendors = api.filterVendors(mockUsbData)
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0]).toHaveProperty('vendor')
      expect(vendors[0]).toHaveProperty('name')
      expect(vendors[0]).toHaveProperty('devices')
    })

    it('should filter vendors with string filter', () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const vendors = api.filterVendors(mockUsbData, firstVendorId)
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0].vendor).toBe(firstVendorId)
    })

    it('should filter vendors with object filter', () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const vendors = api.filterVendors(mockUsbData, { id: firstVendorId })
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0].vendor).toBe(firstVendorId)
    })

    it('should filter vendors with function filter', () => {
      const firstVendorName = Object.values(mockUsbData)[0].name
      const vendors = api.filterVendors(mockUsbData, vendor => vendor.name === firstVendorName)
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0].name).toBe(firstVendorName)
    })

    it('should filter devices without conditions', () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const devices = api.filterDevices(firstVendor)
      expect(devices.length).toBeGreaterThan(0)
      expect(devices[0]).toHaveProperty('devid')
      expect(devices[0]).toHaveProperty('devname')
    })

    it('should filter devices with string filter', () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const firstDeviceId = Object.keys(firstVendor.devices)[0]
      const devices = api.filterDevices(firstVendor, firstDeviceId)
      expect(devices.length).toBeGreaterThan(0)
      expect(devices[0].devid).toBe(firstDeviceId)
    })

    it('should search in data and return results', () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const results = api.searchInData(mockUsbData, firstVendor.name)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0]).toHaveProperty('vendor')
      expect(results[0]).toHaveProperty('device')
      expect(results[0].vendor.name).toBe(firstVendor.name)
    })

    it('should return empty array for empty search query', () => {
      const results = api.searchInData(mockUsbData, '')
      expect(results).toEqual([])
    })
  })

  describe('environment Detection', () => {
    it('should correctly detect browser environment', () => {
      // Browser environment simulation provided by happy-dom
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
      expect(typeof navigator).toBe('object')
      expect(typeof location).toBe('object')
    })

    it('should have browser-specific globals available', () => {
      expect(window).toBeDefined()
      expect(document).toBeDefined()
      expect(navigator).toBeDefined()
      expect(location).toBeDefined()
    })
  })

  describe('error Handling in Browser Environment', () => {
    it('should handle network errors correctly for async functions', async () => {
      const { vi } = await import('vitest')

      // Clear all module caches
      vi.resetModules()

      // Mock fetchUsbIdsData to throw an error
      vi.doMock('../src/core', () => ({
        fetchUsbIdsData: vi.fn().mockRejectedValue(new Error('Network error')),
      }))

      // Re-import the module
      const { getVendors } = await import('../src/api')

      await expect(getVendors()).rejects.toThrow('Failed to fetch USB device data')
    })

    it('should handle force update parameter correctly', async () => {
      const vendors = await api.getVendors(undefined, true)
      expect(vendors.length).toBeGreaterThan(0)
    })

    it('should return null for non-existent vendor', async () => {
      const vendor = await api.getVendor('non-existent-id')
      expect(vendor).toBeNull()
    })

    it('should return empty array for non-existent vendor devices', async () => {
      const devices = await api.getDevices('non-existent-id')
      expect(devices).toEqual([])
    })

    it('should return null for non-existent device', async () => {
      const device = await api.getDevice('non-existent-vendor', 'non-existent-device')
      expect(device).toBeNull()
    })
  })
})
