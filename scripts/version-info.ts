#!/usr/bin/env tsx

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { loadVersionInfo, shouldUpdate } from '../plugins/plugin-usb-ids/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

async function main() {
  try {
    const versionFilePath = path.resolve(projectRoot, 'usb.ids.version.json')
    const versionInfo = loadVersionInfo(versionFilePath)

    if (!versionInfo) {
      console.log('❌ 未找到版本信息文件')
      console.log('💡 请先运行 npm run fetch-usb-ids 获取数据')
      process.exit(1)
    }

    console.log('📋 USB.IDS 版本信息')
    console.log('='.repeat(50))
    console.log(`版本号: v${versionInfo.version}`)
    console.log(`获取时间: ${versionInfo.fetchTimeFormatted}`)
    console.log(`数据源: ${versionInfo.source === 'api' ? '远程API' : '本地fallback'}`)
    console.log(`供应商数量: ${versionInfo.vendorCount}`)
    console.log(`设备数量: ${versionInfo.deviceCount}`)
    console.log(`内容哈希: ${versionInfo.contentHash}`)

    const needsUpdate = shouldUpdate(versionInfo)
    const status = needsUpdate ? '🔄 需要更新' : '✅ 最新版本'
    console.log(`状态: ${status}`)

    if (needsUpdate) {
      console.log('')
      console.log('💡 运行以下命令更新数据:')
      console.log('   npm run fetch-usb-ids')
      console.log('   或强制更新: npm run fetch-usb-ids -- --force')
    }

    process.exit(0)
  }
  catch (error) {
    console.error('❌ 查看版本信息失败:', error)
    process.exit(1)
  }
}

main()
