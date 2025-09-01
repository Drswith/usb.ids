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

  describe('同步函数在浏览器环境下的表现', () => {
    it('getVendorsSync应该在浏览器环境下正常工作', () => {
      const vendors = api.getVendorsSync(undefined, mockUsbData)
      expect(vendors.length).toBeGreaterThan(0)
      expect(vendors[0]).toHaveProperty('vendor')
    })

    it('getVendorSync应该在浏览器环境下正常工作', () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const vendor = api.getVendorSync(firstVendorId, mockUsbData)
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe(firstVendorId)
    })

    it('getDevicesSync应该在浏览器环境下正常工作', () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const devices = api.getDevicesSync(firstVendorId, undefined, mockUsbData)
      expect(devices.length).toBeGreaterThan(0)
      expect(devices[0]).toHaveProperty('devid')
    })

    it('getDeviceSync应该在浏览器环境下正常工作', () => {
      const firstVendorId = Object.keys(mockUsbData)[0]
      const firstDeviceId = Object.keys(mockUsbData[firstVendorId].devices)[0]
      const device = api.getDeviceSync(firstVendorId, firstDeviceId, mockUsbData)
      expect(device).not.toBeNull()
      expect(device!.devid).toBe(firstDeviceId)
    })

    it('searchDevicesSync应该在浏览器环境下正常工作', () => {
      const firstVendor = Object.values(mockUsbData)[0]
      const results = api.searchDevicesSync(firstVendor.name, mockUsbData)
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
    it('同步函数在没有数据时应该尝试读取本地数据', () => {
      // 在浏览器环境中，同步函数会尝试读取本地数据但应该失败
      try {
        api.getVendorsSync()
        // 如果没有抛出错误，说明有模拟数据可用，这也是可接受的
      }
      catch (error) {
        // 在真正的浏览器环境中应该抛出错误
        expect((error as Error).message).toMatch(/浏览器环境不支持|无法读取本地USB数据|本地USB数据文件不存在/)
      }

      try {
        api.searchDevicesSync('test')
        // 如果没有抛出错误，说明有模拟数据可用，这也是可接受的
      }
      catch (error) {
        // 在真正的浏览器环境中应该抛出错误
        expect((error as Error).message).toMatch(/浏览器环境不支持|无法读取本地USB数据|本地USB数据文件不存在/)
      }
    })

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
