export interface UsbDevice {
  devid: string
  devname: string
}

export interface UsbVendor {
  vendor: string
  name: string
  devices: Record<string, UsbDevice>
}

export type UsbIdsData = Record<string, UsbVendor>

/** 版本信息接口 */
export interface VersionInfo {
  /** 获取时间戳 */
  fetchTime: number
  /** 获取时间的可读格式 */
  fetchTimeFormatted: string
  /** 文件内容的SHA256哈希值 */
  contentHash: string
  /** 数据源 */
  source: 'api' | 'fallback'
  /** 供应商数量 */
  vendorCount: number
  /** 设备数量 */
  deviceCount: number
  /** 版本号（v1.0.时间戳格式） */
  version: string
}
