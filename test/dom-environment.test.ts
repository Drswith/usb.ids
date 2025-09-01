import { beforeEach, describe, expect, it, vi } from 'vitest'

// 模拟DOM环境（不使用jsdom，直接模拟必要的全局对象）
const mockWindow = {
  location: { href: 'http://localhost' },
  navigator: { userAgent: 'test' },
}

const mockDocument = {
  createElement: vi.fn(),
  getElementById: vi.fn(),
}

// 设置全局DOM对象
globalThis.window = mockWindow as any
globalThis.document = mockDocument as any

// 使用Object.defineProperty设置navigator（避免只读属性错误）
Object.defineProperty(globalThis, 'navigator', {
  value: mockWindow.navigator,
  writable: true,
  configurable: true,
})

// 模拟浏览器环境下的fetch
Object.defineProperty(globalThis, 'fetch', {
  value: vi.fn(),
  writable: true,
  configurable: true,
})

describe('dom环境兼容性测试', () => {
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

  describe('异步函数在DOM环境下的表现', () => {
    it('getVendorsAsync应该在DOM环境下正常工作', async () => {
      const vendors = await api.getVendorsAsync()
      expect(vendors).toHaveLength(1)
      expect(vendors[0].vendor).toBe('1234')
      expect(vendors[0].name).toBe('Test Vendor')
    })

    it('getVendorAsync应该在DOM环境下正常工作', async () => {
      const vendor = await api.getVendorAsync('1234')
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe('1234')
      expect(vendor!.name).toBe('Test Vendor')
    })

    it('getDevicesAsync应该在DOM环境下正常工作', async () => {
      const devices = await api.getDevicesAsync('1234')
      expect(devices).toHaveLength(1)
      expect(devices[0].devid).toBe('5678')
      expect(devices[0].devname).toBe('Test Device')
    })

    it('getDeviceAsync应该在DOM环境下正常工作', async () => {
      const device = await api.getDeviceAsync('1234', '5678')
      expect(device).not.toBeNull()
      expect(device!.devid).toBe('5678')
      expect(device!.devname).toBe('Test Device')
    })

    it('searchDevicesAsync应该在DOM环境下正常工作', async () => {
      const results = await api.searchDevicesAsync('Test')
      expect(results).toHaveLength(1)
      expect(results[0].vendor.name).toBe('Test Vendor')
      expect(results[0].device.devname).toBe('Test Device')
    })

    it('getUsbDataAsync应该在DOM环境下正常工作', async () => {
      const data = await api.getUsbDataAsync()
      expect(Object.keys(data)).toHaveLength(1)
      expect(data['1234']).toBeDefined()
      expect(data['1234'].name).toBe('Test Vendor')
    })
  })

  describe('同步函数在DOM环境下的表现', () => {
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

    it('getVendors应该在DOM环境下正常工作', () => {
      const vendors = api.getVendors(undefined, testData)
      expect(vendors).toHaveLength(1)
      expect(vendors[0].vendor).toBe('1234')
    })

    it('getVendor应该在DOM环境下正常工作', () => {
      const vendor = api.getVendor('1234', testData)
      expect(vendor).not.toBeNull()
      expect(vendor!.vendor).toBe('1234')
    })

    it('getDevices应该在DOM环境下正常工作', () => {
      const devices = api.getDevices('1234', undefined, testData)
      expect(devices).toHaveLength(1)
      expect(devices[0].devid).toBe('5678')
    })

    it('getDevice应该在DOM环境下正常工作', () => {
      const device = api.getDevice('1234', '5678', testData)
      expect(device).not.toBeNull()
      expect(device!.devid).toBe('5678')
    })

    it('searchDevices应该在DOM环境下正常工作', () => {
      const results = api.searchDevices('Test', testData)
      expect(results).toHaveLength(1)
      expect(results[0].vendor.name).toBe('Test Vendor')
    })
  })

  describe('环境检测', () => {
    it('应该正确检测到DOM环境', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
      expect(typeof navigator).toBe('object')
    })

    it('应该模拟浏览器环境的全局对象', () => {
      expect(globalThis.window).toBeDefined()
      expect(globalThis.document).toBeDefined()
      expect(globalThis.navigator).toBeDefined()
      expect(globalThis.fetch).toBeDefined()
    })
  })

  describe('错误处理在DOM环境下的表现', () => {
    it('同步函数在没有数据时应该抛出错误', () => {
      expect(() => api.getVendors()).toThrow('没有可用的USB设备数据')
      expect(() => api.searchDevices('test')).toThrow('没有可用的USB设备数据')
    })

    it('异步函数在网络错误时应该正确处理', async () => {
      // 清理所有模块缓存
      vi.resetModules()

      // 重新模拟fetchUsbIdsData抛出错误
      vi.doMock('../src/core', () => ({
        fetchUsbIdsData: vi.fn().mockRejectedValue(new Error('网络错误')),
      }))

      // 重新导入模块
      const { getVendorsAsync } = await import('../src/api')

      await expect(getVendorsAsync()).rejects.toThrow('无法获取USB设备数据')
    })
  })
})
