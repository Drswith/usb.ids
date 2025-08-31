import path from 'node:path'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import usbIdsPlugin from './plugins/plugin-usb-ids'

export default defineConfig(({ command }) => {
  const env = loadEnv(command, process.cwd())

  const base = env.VITE_BASE_PATH || '/'
  console.log('vite base ', base)

  return {
    base,
    plugins: [
      usbIdsPlugin({
        fallbackFile: path.resolve(__dirname, 'usb.ids.json'),
        skipInDev: true,
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2048,
    },
  }
})
