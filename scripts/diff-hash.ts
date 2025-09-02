#!/usr/bin/env tsx

/**
 * USB.IDS数据哈希差异检查脚本
 * 该脚本比较远程数据与本地已处理数据的contentHash来判断是否需要更新
 * 避免了使用npm包作为基准的循环逻辑问题
 * 复用core.ts中的现有函数以保持代码一致性
 */

import type { VersionInfo } from '../src/types'
import * as path from 'node:path'
import { USB_IDS_SOURCE, USB_IDS_VERSION_JSON_FILE } from '../src/config'
import { loadVersionInfo } from '../src/core'
import { downloadFromUrls } from '../src/fetcher'
import { generateContentHash } from '../src/parser'
import { logger } from '../src/utils'

/**
 * 获取本地版本信息
 * 复用core.ts中的loadVersionInfo函数
 */
function getLocalVersionInfo(): VersionInfo | null {
  try {
    const versionFilePath = path.resolve(process.cwd(), USB_IDS_VERSION_JSON_FILE)
    const versionInfo = loadVersionInfo(versionFilePath)

    if (!versionInfo) {
      logger.warn('Local version file does not exist')
      return null
    }

    logger.info(`Local version: ${versionInfo.version}`)
    logger.info(`Local hash: ${versionInfo.contentHash}`)

    return versionInfo
  }
  catch (error) {
    logger.warn(`Error reading local version info: ${(error as Error).message}`)
    return null
  }
}

/**
 * 获取远程数据的contentHash
 * 复用fetcher.ts中的downloadFromUrls和parser.ts中的generateContentHash
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
 * 主函数：比较本地与远程数据的哈希差异
 * 使用函数式编程风格，保持逻辑清晰简洁
 */
async function diffHash(): Promise<void> {
  try {
    logger.start('Comparing local and remote content hashes...')

    // 获取本地版本信息（复用core.ts逻辑）
    const localInfo = getLocalVersionInfo()

    // 获取远程数据hash（复用fetcher和parser逻辑）
    const remoteHash = await getRemoteContentHash()
    if (!remoteHash) {
      logger.info('Failed to get remote hash, forcing update')
      process.exit(1) // 退出码1表示需要更新
    }

    // 如果没有本地版本信息，说明是首次运行，需要更新
    if (!localInfo) {
      logger.info('No local version info found, update needed for initial setup')
      process.exit(1) // 退出码1表示需要更新
    }

    // 比较hash值
    if (remoteHash === localInfo.contentHash) {
      logger.success('No difference found, content hash is the same')
      process.exit(0) // 退出码0表示不需要更新
    }
    else {
      logger.info('Hash difference detected')
      logger.info(`Remote: ${remoteHash}`)
      logger.info(`Local:  ${localInfo.contentHash}`)
      process.exit(1) // 退出码1表示需要更新
    }
  }
  catch (error) {
    logger.error(`Hash comparison failed: ${(error as Error).message}`)
    process.exit(1) // 出错时也强制更新
  }
}

// 当直接运行此脚本时执行检查
if (import.meta.url === `file://${process.argv[1]}`) {
  diffHash()
}

export { diffHash }
