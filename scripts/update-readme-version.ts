#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { USB_IDS_VERSION_JSON_FILE } from '../src/config.js'
import { loadVersionInfo } from '../src/core.js'
import { logger } from '../src/utils.js'

// ES module 中获取当前文件路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 更新 README.md 中的版本信息
 * 从 usb.ids.version.json 读取版本信息并更新到 README.md 的指定位置
 */
function updateReadmeVersion(): void {
  try {
    const root = process.cwd()

    // 使用 src 中的函数读取版本信息
    const versionFilePath = path.join(root, USB_IDS_VERSION_JSON_FILE)
    const versionData = loadVersionInfo(versionFilePath)

    if (!versionData) {
      logger.error(`Failed to load version info from ${USB_IDS_VERSION_JSON_FILE}`)
      logger.error('Please ensure the file exists and is valid JSON')
      process.exit(1)
    }

    const version = versionData.version.replace(/^v/, '') // 移除 v 前缀
    const updateTime = versionData.fetchTimeFormatted

    logger.info(`Updating README.md with version: ${version}`)
    logger.info(`Update time: ${updateTime}`)

    // 读取 README.md 文件
    const readmePath = path.join(root, 'README.md')
    if (!fs.existsSync(readmePath)) {
      logger.error('README.md not found')
      process.exit(1)
    }

    const readmeContent = fs.readFileSync(readmePath, 'utf8')

    // 查找版本占位符
    const startMarker = '<!-- START VERSION PLACEHOLDER -->'
    const endMarker = '<!-- END VERSION PLACEHOLDER -->'

    const startIndex = readmeContent.indexOf(startMarker)
    const endIndex = readmeContent.indexOf(endMarker)

    if (startIndex === -1 || endIndex === -1) {
      logger.error('Version placeholders not found in README.md')
      logger.error('Please ensure the README.md contains:')
      logger.error('<!-- START VERSION PLACEHOLDER -->')
      logger.error('<!-- END VERSION PLACEHOLDER -->')
      process.exit(1)
    }

    // 构建新的版本信息块
    const newVersionBlock = `

> **📦 Latest Release**  
>  
> **Version:** \`${version}\`  
> **Updated:** \`${updateTime}\`  
> **Status:** ✅ Auto-updated daily

`

    // 替换版本信息
    const beforeMarker = readmeContent.substring(0, startIndex + startMarker.length)
    const afterMarker = readmeContent.substring(endIndex)
    const newReadmeContent = beforeMarker + newVersionBlock + afterMarker

    // 写入更新后的内容
    fs.writeFileSync(readmePath, newReadmeContent, 'utf8')

    logger.success('README.md version info updated successfully')
    logger.info(`Version: ${version}`)
    logger.info(`Updated: ${updateTime}`)
    logger.info(`Vendor count: ${versionData.vendorCount}`)
    logger.info(`Device count: ${versionData.deviceCount}`)
  }
  catch (error) {
    logger.error(`Failed to update README.md: ${(error as Error).message}`)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  updateReadmeVersion()
}

export { updateReadmeVersion }
