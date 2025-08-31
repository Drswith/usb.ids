#!/usr/bin/env tsx

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { fetchUsbIdsData, loadVersionInfo } from '../plugins/plugin-usb-ids/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const DEFAULT_USB_IDS_URLS = [
  'http://www.linux-usb.org/usb.ids',
  'https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids',
]

const FALLBACK_FILE = 'usb.ids.json'

async function main() {
  try {
    console.log('🔍 检查 USB.IDS 数据更新...')

    const versionFilePath = path.resolve(projectRoot, 'usb.ids.version.json')

    // 获取当前版本信息
    const currentVersion = loadVersionInfo(versionFilePath)
    let currentHash = ''

    if (currentVersion) {
      currentHash = currentVersion.contentHash
      console.log(`📋 当前版本: v${currentVersion.version}`)
      console.log(`🔗 当前哈希: ${currentHash.substring(0, 16)}...`)
    }
    else {
      console.log('📋 未找到现有版本信息')
    }

    // 强制获取最新数据
    console.log('\n🌐 获取最新 USB.IDS 数据...')
    const { data, source: _source, versionInfo } = await fetchUsbIdsData(
      DEFAULT_USB_IDS_URLS,
      FALLBACK_FILE,
      projectRoot,
      false, // 不显示详细日志
      true, // 强制更新
    )

    const newHash = versionInfo.contentHash
    console.log(`📋 最新版本: v${versionInfo.version}`)
    console.log(`🔗 最新哈希: ${newHash.substring(0, 16)}...`)

    // 比较哈希值
    const needsUpdate = !currentVersion || currentHash !== newHash

    console.log('\n📊 检查结果:')
    if (needsUpdate) {
      console.log('✅ 检测到数据更新')
      console.log(`📈 供应商数量: ${versionInfo.vendorCount}`)
      console.log(`📈 设备数量: ${versionInfo.deviceCount}`)
      console.log(`📅 获取时间: ${versionInfo.fetchTimeFormatted}`)

      if (currentVersion) {
        console.log('\n🔄 变更详情:')
        console.log(`   旧哈希: ${currentHash.substring(0, 16)}...`)
        console.log(`   新哈希: ${newHash.substring(0, 16)}...`)
      }

      // 保存更新后的数据
      const outputPath = path.resolve(projectRoot, FALLBACK_FILE)
      const { saveUsbIdsToFile } = await import('../plugins/plugin-usb-ids/utils')
      await saveUsbIdsToFile(data, outputPath, false)

      console.log('\n💾 已保存最新数据')
      process.exit(0) // 需要更新
    }
    else {
      console.log('ℹ️ 数据无变化，无需更新')
      process.exit(1) // 无需更新
    }
  }
  catch (error) {
    console.error('❌ 检查更新失败:', error)
    process.exit(2) // 错误
  }
}

main()
