import path from 'node:path'
import { defineConfig } from 'vite'
import usbIdsPlugin from './plugins/plugin-usb-ids'

export default defineConfig({
  plugins: [usbIdsPlugin({
    fallbackFile: path.resolve(__dirname, 'usb.ids.json'),
    skipInDev: true,
  })],
})
