import { describe, expect, it } from 'vitest'
import * as api from '../src/api'
import { mockUsbData } from './setup'

describe('浏览器环境 API 测试', () => {
  describe('异步函数在浏览器环境下的表现', () => {
    it('getVendors应该在浏览器环境下正常工作', async () => {
      const vendors = await api.getVendors()
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0]).toHaveProperty('vendor')
      expect(vendors[0]).toHaveProperty('name')
    })

    it('getVendor应该在浏览器环境下正常工作', async () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const vendor = await api.getVendor(firstVendorId)
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe(firstVendorId)
    })

    it('getDevices应该在浏览器环境下正常工作', async () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const devices = await api.getDevices(firstVendorId)
      expect(devices.length).toBeGreaterThan(0)
      expect(devices[0]).toHaveProperty('devid')
      expect(devices[0]).toHaveProperty('devname')
    })

    it('getDevice应该在浏览器环境下正常工作', async () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
      const device = await api.getDevice(firstVendorId, firstDeviceId)
      expect(device).not.toBeNull()
      expect(device!.devid).toBe(firstDeviceId)
    })

    it('searchDevices应该在浏览器环境下正常工作', async () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const results = await api.searchDevices(firstVendor.name)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].vendor.name).toBe(firstVendor.name)
    })

    it('getUsbData应该在浏览器环境下正常工作', async () => {
      const data = await api.getUsbData()
      expect(Object.keys(data).length).toBeGreaterThan(0)
      const firstVendorId = Object.keys(mockUsbData)[0]
      expect(data[firstVendorId]).toBeDefined()
    })
  })

  describe('纯函数在浏览器环境下的表现', () => {
    it('filterVendors应该在浏览器环境下正常工作', () => {
      const vendors = api.filterVendors(mockUsbData)
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0]).toHaveProperty('vendor')
    })

    it('filterVendors过滤功能应该正常工作', () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const vendors = api.filterVendors(mockUsbData, firstVendorId)
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0].vendor).toBe(firstVendorId)
    })

    it('filterDevices应该在浏览器环境下正常工作', () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const devices = api.filterDevices(firstVendor)
      expect(devices.length).toBeGreaterThan(0)
      expect(devices[0]).toHaveProperty('devid')
    })

    it('searchInData应该在浏览器环境下正常工作', () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const results = api.searchInData(mockUsbData, firstVendor.name)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].vendor.name).toBe(firstVendor.name)
    })
  })

  describe('环境检测', () => {
    it('应该正确检测到浏览器环境', () => {
      // happy-dom 提供的浏览器环境模拟
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
      expect(typeof navigator).toBe('object')
      expect(typeof location).toBe('object')
    })
  })

  describe('错误处理在浏览器环境下的表现', () => {
    it('异步函数在网络错误时应该正确处理', async () => {
      const { vi } = await import('vitest')

      // 清理所有模块缓存
      vi.resetModules()

      // 重新模拟fetchUsbIdsData抛出错误
      vi.doMock('../src/core', () => ({
        fetchUsbIdsData: vi.fn().mockRejectedValue(new Error('网络错误')),
      }))

      // 重新导入模块
      const { getVendors } = await import('../src/api')

      await expect(getVendors()).rejects.toThrow('无法获取USB设备数据')
    })
  })
})
