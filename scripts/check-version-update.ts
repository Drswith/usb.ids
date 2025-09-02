#!/usr/bin/env tsx

/**
 * 版本更新检查脚本
 * 该脚本用于GitHub Actions工作流中，检查远程USB.IDS数据是否需要更新
 * 通过比较远程数据的contentHash与npm包中的contentHash来判断
 */

import { USB_IDS_SOURCE } from '../src/config'
import { downloadFromUrls } from '../src/fetcher'
import { generateContentHash } from '../src/parser'
import { logger } from '../src/utils'

interface NpmVersionInfo {
  contentHash: string
  version: string
  fetchTime: number
}

/**
 * 获取npm包中的版本信息
 */
async function getNpmVersionInfo(): Promise<NpmVersionInfo | null> {
  try {
    // 尝试直接从unpkg CDN获取版本信息文件
    const versionUrl = 'https://unpkg.com/usb.ids@latest/usb.ids.version.json'
    const response = await fetch(versionUrl)

    if (!response.ok) {
      logger.warn(`Failed to fetch version info from unpkg: ${response.status}`)
      return null
    }

    const versionInfo = await response.json() as NpmVersionInfo
    logger.info(`NPM package version: ${versionInfo.version}`)
    return versionInfo
  }
  catch (error) {
    logger.warn(`Error fetching npm version info: ${(error as Error).message}`)
    return null
  }
}

/**
 * 获取远程数据的contentHash
 */
async function getRemoteContentHash(): Promise<string | null> {
  try {
    logger.info('Downloading remote USB.IDS data...')
    const content = await downloadFromUrls(USB_IDS_SOURCE)

    if (!content) {
      logger.warn('Failed to download remote USB.IDS data')
      return null
    }

    const hash = generateContentHash(content)
    logger.info(`Remote content hash: ${hash}`)
    return hash
  }
  catch (error) {
    logger.warn(`Error downloading remote data: ${(error as Error).message}`)
    return null
  }
}

/**
 * 主函数：检查是否需要更新
 */
async function checkVersionUpdate(): Promise<void> {
  try {
    logger.start('Checking if version update is needed...')

    // 获取npm包版本信息
    const npmInfo = await getNpmVersionInfo()
    if (!npmInfo) {
      logger.info('No npm version info available, forcing update')
      process.exit(1) // 退出码1表示需要更新
    }

    logger.info(`NPM package hash: ${npmInfo.contentHash}`)

    // 获取远程数据hash
    const remoteHash = await getRemoteContentHash()
    if (!remoteHash) {
      logger.info('Failed to get remote hash, forcing update')
      process.exit(1) // 退出码1表示需要更新
    }

    // 比较hash值
    if (remoteHash === npmInfo.contentHash) {
      logger.success('No update needed, content hash is the same')
      process.exit(0) // 退出码0表示不需要更新
    }
    else {
      logger.info('Update needed, content hash is different')
      logger.info(`Remote: ${remoteHash}`)
      logger.info(`NPM:    ${npmInfo.contentHash}`)
      process.exit(1) // 退出码1表示需要更新
    }
  }
  catch (error) {
    logger.error(`Version check failed: ${(error as Error).message}`)
    process.exit(1) // 出错时也强制更新
  }
}

// 当直接运行此脚本时执行检查
if (import.meta.url === `file://${process.argv[1]}`) {
  checkVersionUpdate()
}

export { checkVersionUpdate }
