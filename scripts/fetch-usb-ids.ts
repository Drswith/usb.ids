#!/usr/bin/env tsx

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { fetchUsbIdsData, saveUsbIdsToFile } from '../plugins/plugin-usb-ids/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// 默认配置
const DEFAULT_USB_IDS_URLS = [
  'http://www.linux-usb.org/usb.ids',
  'https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids',
]

const FALLBACK_FILE = 'usb.ids.json'

async function main() {
  try {
    console.log('🚀 开始获取最新的USB设备数据...')

    // 检查命令行参数是否包含强制更新标志
    const forceUpdate = process.argv.includes('--force') || process.argv.includes('-f')
    if (forceUpdate) {
      console.log('🔄 强制更新模式已启用')
    }

    const { data, source, versionInfo } = await fetchUsbIdsData(
      DEFAULT_USB_IDS_URLS,
      FALLBACK_FILE,
      projectRoot,
      true,
      forceUpdate,
    )

    const outputPath = path.resolve(projectRoot, FALLBACK_FILE)
    await saveUsbIdsToFile(data, outputPath, true)

    console.log(`✅ USB设备数据获取完成！数据源: ${source === 'api' ? '远程API' : '本地fallback'}`)

    // 输出版本信息
    console.log('📋 版本信息:')
    console.log(`   版本号: ${versionInfo.version}`)
    console.log(`   获取时间: ${versionInfo.fetchTimeFormatted}`)
    console.log(`   内容哈希: ${versionInfo.contentHash.substring(0, 16)}...`)

    // 输出统计信息
    console.log(`📊 数据统计: ${versionInfo.vendorCount} 个供应商，${versionInfo.deviceCount} 个设备`)

    process.exit(0)
  }
  catch (error) {
    console.error('❌ 获取USB设备数据失败:', error)
    process.exit(1)
  }
}

main()
