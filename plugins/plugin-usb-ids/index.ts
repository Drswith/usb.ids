import type { Plugin } from 'vite'

export interface UsbIdsPluginOptions {
  /** fallback文件路径，默认为 'usb.ids.json' */
  fallbackFile?: string
  /** USB IDs数据源URLs */
  usbIdsUrls?: string[]
  /** 是否在开发模式下跳过下载，默认为 true */
  skipInDev?: boolean
  /** 是否启用详细日志，默认为 true */
  verbose?: boolean
}

// 虚拟模块ID
const VIRTUAL_USB_IDS_ID = 'virtual:usb-ids'
const RESOLVED_USB_IDS_ID = `\0${VIRTUAL_USB_IDS_ID}`

const pluginName = 'vite-plugin-usb-ids'

/**
 * USB设备数据Vite插件 - 虚拟模块版本
 */
function usbIdsPlugin(_options: UsbIdsPluginOptions = {}): Plugin {
  return {
    name: pluginName,
  }
}

export { pluginName, RESOLVED_USB_IDS_ID, usbIdsPlugin, VIRTUAL_USB_IDS_ID }
