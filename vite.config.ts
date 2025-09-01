import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import pkg from './package.json'

export default defineConfig(({ command }) => {
  const env = loadEnv(command, process.cwd())

  const base = env.VITE_BASE_PATH || '/'
  console.log('vite base ', base)

  const version = pkg.version

  return {
    base,
    define: {
      'import.meta.env.VERSION': JSON.stringify(version),
    },
    build: {
      chunkSizeWarningLimit: 2048,
    },
  }
})
