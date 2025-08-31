/// <reference types="vite/client" />

// 声明虚拟模块
declare module 'virtual:usb-ids' {
  import type { UsbIdsData } from '../plugins/plugin-usb-ids/typing'

  const usbIdsData: UsbIdsData
  export default usbIdsData
}
