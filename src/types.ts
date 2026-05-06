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

/** Subsystem / sub-device binding (tab-indented under device in usb.ids) */
export interface UsbSubsystem {
  subvendor: string
  subdevice: string
  name: string
}

export interface UsbDeviceV2 extends UsbDevice {
  subsystems?: UsbSubsystem[]
}

export interface UsbVendorV2 {
  vendor: string
  name: string
  devices: Record<string, UsbDeviceV2>
}

export interface UsbProtocolEntry {
  code: string
  name: string
}

export interface UsbSubclassEntry {
  code: string
  name: string
  protocols: Record<string, UsbProtocolEntry>
}

export interface UsbClassEntry {
  code: string
  name: string
  subclasses: Record<string, UsbSubclassEntry>
}

export interface HidUsagePage {
  pageCode: string
  name: string
  usages: Record<string, string>
}

export interface LanguageEntry {
  name: string
  dialects?: Record<string, string>
}

/** Full parsed database (schema version 2). */
export interface UsbDatasetV2 {
  schemaVersion: 2
  vendors: Record<string, UsbVendorV2>
  classes: Record<string, UsbClassEntry>
  audioTerminals: Record<string, string>
  hidDescriptors: Record<string, string>
  hidItemTypes: Record<string, string>
  biasTypes: Record<string, string>
  phyTypes: Record<string, string>
  hidUsagePages: Record<string, HidUsagePage>
  languages: Record<string, LanguageEntry>
  hidCountryCodes: Record<string, string>
  videoTerminals: Record<string, string>
  hcts: Record<string, string>
}

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
  /** 版本号（时间戳后缀） */
  version: string
  /** 数据 schema（可选，2 表示完整 usb.ids 解析） */
  schemaVersion?: 2
}
