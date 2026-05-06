import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import pkg from './package.json'
import { UI_LOCAL_BASE_URL } from './src/config'

export default defineConfig(({ command }) => {
  const env = loadEnv(command, process.cwd())

  const base = env.VITE_BASE_PATH || UI_LOCAL_BASE_URL
  console.log('vite base ', base)

  const version = pkg.version

  return {
    base,
    define: {
      'import.meta.env.VERSION': JSON.stringify(version),
    },
    build: {
      chunkSizeWarningLimit: 2048,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('legacy/to-v1') || id.includes('legacy\\to-v1'))
              return 'legacy-v1'
            if (id.includes('/src/pure/') || id.includes('\\src\\pure\\'))
              return 'usb-pure'
            return undefined
          },
        },
      },
    },
  }
})
