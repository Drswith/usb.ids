import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('浏览器环境 API 测试', () => {
  let api: typeof import('../src/api')

  beforeEach(async () => {
    // 清理模块缓存
    vi.resetModules()

    // 模拟fetchUsbIdsData在DOM环境下的行为
    vi.doMock('../src/core', () => ({
      fetchUsbIdsData: vi.fn().mockResolvedValue({
        data: {
          1234: {
            vendor: '1234',
            name: 'Test Vendor',
            devices: {
              5678: {
                devid: '5678',
                devname: 'Test Device',
              },
            },
          },
        },
        source: 'api' as const,
        versionInfo: {
          fetchTime: new Date().toISOString(),
          contentHash: 'test-hash',
          source: 'https://example.com/usb.ids',
          vendorCount: 1,
          deviceCount: 1,
          version: '1.0.0',
        },
      }),
    }))

    // 动态导入API模块
    api = await import('../src/api')
  })

  describe('异步函数在浏览器环境下的表现', () => {
    it('getVendors应该在浏览器环境下正常工作', async () => {
      const vendors = await api.getVendors()
      expect(vendors).toHaveLength(1)
      expect(vendors[0].vendor).toBe('1234')
      expect(vendors[0].name).toBe('Test Vendor')
    })

    it('getVendor应该在浏览器环境下正常工作', async () => {
      const vendor = await api.getVendor('1234')
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe('1234')
      expect(vendor!.name).toBe('Test Vendor')
    })

    it('getDevices应该在浏览器环境下正常工作', async () => {
      const devices = await api.getDevices('1234')
      expect(devices).toHaveLength(1)
      expect(devices[0].devid).toBe('5678')
      expect(devices[0].devname).toBe('Test Device')
    })

    it('getDevice应该在浏览器环境下正常工作', async () => {
      const device = await api.getDevice('1234', '5678')
      expect(device).not.toBeNull()
      expect(device!.devid).toBe('5678')
      expect(device!.devname).toBe('Test Device')
    })

    it('searchDevices应该在浏览器环境下正常工作', async () => {
      const results = await api.searchDevices('Test')
      expect(results).toHaveLength(1)
      expect(results[0].vendor.name).toBe('Test Vendor')
      expect(results[0].device.devname).toBe('Test Device')
    })

    it('getUsbData应该在浏览器环境下正常工作', async () => {
      const data = await api.getUsbData()
      expect(Object.keys(data)).toHaveLength(1)
      expect(data['1234']).toBeDefined()
      expect(data['1234'].name).toBe('Test Vendor')
    })
  })

  describe('同步函数在浏览器环境下的表现', () => {
    const testData = {
      1234: {
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

    it('getVendorsSync应该在浏览器环境下正常工作', () => {
      const vendors = api.getVendorsSync(undefined, testData)
      expect(vendors).toHaveLength(1)
      expect(vendors[0].vendor).toBe('1234')
    })

    it('getVendorSync应该在浏览器环境下正常工作', () => {
      const vendor = api.getVendorSync('1234', testData)
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe('1234')
    })

    it('getDevicesSync应该在浏览器环境下正常工作', () => {
      const devices = api.getDevicesSync('1234', undefined, testData)
      expect(devices).toHaveLength(1)
      expect(devices[0].devid).toBe('5678')
    })

    it('getDeviceSync应该在浏览器环境下正常工作', () => {
      const device = api.getDeviceSync('1234', '5678', testData)
      expect(device).not.toBeNull()
      expect(device!.devid).toBe('5678')
    })

    it('searchDevicesSync应该在浏览器环境下正常工作', () => {
      const results = api.searchDevicesSync('Test', testData)
      expect(results).toHaveLength(1)
      expect(results[0].vendor.name).toBe('Test Vendor')
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
    it('同步函数在没有数据时应该抛出错误', () => {
      expect(() => api.getVendorsSync()).toThrow('没有可用的USB设备数据')
      expect(() => api.searchDevicesSync('test')).toThrow('没有可用的USB设备数据')
    })

    it('异步函数在网络错误时应该正确处理', async () => {
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
