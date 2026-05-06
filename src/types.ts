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

/** Published manifest for USB.ID — aligns with `package.json` version (CalVer). */
export interface VersionInfo {
  /** CalVer release, same as npm `version` (`schemaMajor.YYYYMMDD.N`) */
  releaseVersion: string
  /** Upstream `usb.ids` `# Version: YYYY.MM.DD` */
  upstreamVersion: string
  /** Optional raw `# Date: …` line from upstream */
  upstreamDate: string | null
  /** SHA-256 of raw `usb.ids` bytes (or JSON fallback bytes when rebuild manifest from JSON-only) */
  upstreamHash: string
  /** Matches first segment of `releaseVersion` and dataset schema generation */
  schemaVersion: 2
  /** UTC ms when this manifest was written */
  buildTime: number
  /** `buildTime` as formatted UTC string */
  buildTimeFormatted: string
  vendorCount: number
  deviceCount: number
}
