#!/usr/bin/env node

/**
 * USB设备数据CLI工具
 * 提供命令行接口来管理USB设备数据
 */

import * as fs from 'node:fs'
import { createServer } from 'node:http'
import * as path from 'node:path'
import * as process from 'node:process'
import { UI_LOCAL_BASE_URL, USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData, loadVersionInfo, saveUsbIdsToFile, saveVersionInfo } from './core'
import { shouldUpdate } from './parser'
import { logger } from './utils'

/**
 * 主要的数据更新函数
 */
export async function updateUsbIdsData(forceUpdate = false): Promise<void> {
  try {
    const root = process.cwd()
    const fallbackFile = path.join(root, 'usb.ids')
    const jsonFile = path.join(root, 'usb.ids.json')
    const versionFile = path.join(root, 'usb.ids.version.json')

    logger.start('开始更新USB设备数据...')

    // 检查是否需要更新
    const currentVersionInfo = loadVersionInfo(versionFile)
    if (!forceUpdate && !shouldUpdate(currentVersionInfo, forceUpdate)) {
      logger.info('数据仍然是最新的，无需更新')
      return
    }

    // 获取USB设备数据
    logger.info('正在获取USB设备数据...')
    const { data, source, versionInfo } = await fetchUsbIdsData(
      USB_IDS_SOURCE,
      fallbackFile,
      root,
      forceUpdate,
    )

    // 保存JSON格式数据
    logger.info('正在保存JSON格式数据...')
    await saveUsbIdsToFile(data, jsonFile)

    // 如果是从API获取的数据，保存原始文件
    if (source === 'api') {
      logger.info('正在保存原始usb.ids文件...')
      // 这里需要重新获取原始内容来保存
      // 由于fetchUsbIdsData已经处理了数据获取，我们需要从versionInfo中获取信息
    }

    // 保存版本信息
    logger.info('正在保存版本信息...')
    await saveVersionInfo(versionInfo, versionFile)

    // 输出统计信息
    logger.success(`数据更新完成！`)
    logger.info(`数据源: ${source === 'api' ? '远程API' : '本地fallback文件'}`)
    logger.info(`供应商数量: ${versionInfo.vendorCount}`)
    logger.info(`设备数量: ${versionInfo.deviceCount}`)
    logger.info(`版本: ${versionInfo.version}`)
    logger.info(`更新时间: ${versionInfo.fetchTimeFormatted}`)
  }
  catch (error) {
    logger.error(`更新失败: ${(error as Error).message}`)
    process.exit(1)
  }
}

/**
 * 显示当前版本信息
 */
export function showVersionInfo(): void {
  try {
    const root = process.cwd()
    const versionFile = path.join(root, 'usb.ids.version.json')

    if (!fs.existsSync(versionFile)) {
      logger.warn('版本信息文件不存在，请先运行更新命令')
      return
    }

    const versionInfo = loadVersionInfo(versionFile)
    if (!versionInfo) {
      logger.error('无法读取版本信息')
      return
    }

    logger.info('当前版本信息:')
    console.log(`  版本: ${versionInfo.version}`)
    console.log(`  数据源: ${versionInfo.source === 'api' ? '远程API' : '本地fallback文件'}`)
    console.log(`  供应商数量: ${versionInfo.vendorCount}`)
    console.log(`  设备数量: ${versionInfo.deviceCount}`)
    console.log(`  更新时间: ${versionInfo.fetchTimeFormatted}`)
    console.log(`  内容哈希: ${versionInfo.contentHash}`)
  }
  catch (error) {
    logger.error(`获取版本信息失败: ${(error as Error).message}`)
  }
}

/**
 * 检查是否需要更新
 */
export function checkUpdate(): void {
  try {
    const root = process.cwd()
    const versionFile = path.join(root, 'usb.ids.version.json')

    const versionInfo = loadVersionInfo(versionFile)
    const needsUpdate = shouldUpdate(versionInfo)

    if (needsUpdate) {
      logger.warn('数据需要更新')
      if (versionInfo) {
        const hoursSinceUpdate = (Date.now() - versionInfo.fetchTime) / (1000 * 60 * 60)
        logger.info(`距离上次更新已过去 ${hoursSinceUpdate.toFixed(1)} 小时`)
      }
      else {
        logger.info('未找到版本信息，建议进行首次更新')
      }
    }
    else {
      logger.success('数据是最新的，无需更新')
      if (versionInfo) {
        logger.info(`上次更新时间: ${versionInfo.fetchTimeFormatted}`)
      }
    }
  }
  catch (error) {
    logger.error(`检查更新失败: ${(error as Error).message}`)
  }
}

/**
 * 启动静态web服务器
 */
export async function startWebServer(port = 3000): Promise<void> {
  try {
    const root = process.cwd()
    const distDir = path.join(root, 'dist', 'ui')

    // 检查dist/ui目录是否存在
    if (!fs.existsSync(distDir)) {
      logger.error('dist/ui目录不存在，请先运行构建命令: pnpm run build:app')
      process.exit(1)
    }

    // 创建HTTP服务器
    const server = createServer((req, res) => {
      console.log('req url', req.url)
      // 重定向根路径到UI_LOCAL_BASE_URL
      if (req.url === '/') {
        res.writeHead(302, {
          Location: UI_LOCAL_BASE_URL,
        })
        res.end()
        return
      }

      let filePath = path.join(distDir, req.url === UI_LOCAL_BASE_URL
        ? 'index.html'
        : req.url?.replace(UI_LOCAL_BASE_URL, '') || '')

      console.log('file path', filePath)

      // 安全检查，防止路径遍历攻击
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      // 处理usb.ids.json和usb.ids.version.json
      if (filePath.includes('usb.ids.json') || filePath.includes('usb.ids.version.json')) {
        // usb.ids.json和usb.ids.version.json与在dist同级目录
        filePath = path.join(root, req.url!.replace(UI_LOCAL_BASE_URL, ''))
        console.log('json file path', filePath)
      }

      // 如果文件不存在，返回index.html（用于SPA路由）
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, 'index.html')
      }

      // 读取文件
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404)
          res.end('Not Found')
          return
        }

        // 设置Content-Type
        const ext = path.extname(filePath)
        const contentType = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
        }[ext] || 'text/plain'

        res.writeHead(200, { 'Content-Type': contentType })
        res.end(data)
      })
    })

    // 启动服务器
    server.listen(port, () => {
      logger.success(`usb.ids Web UI服务器已启动！`)
      logger.info(`访问地址: http://localhost:${port}${UI_LOCAL_BASE_URL}`)
      logger.info('按 Control+C 停止服务器')
    })

    // 保持服务器运行，直到手动停止
    return new Promise<void>((resolve, reject) => {
      // 监听服务器错误
      server.on('error', (error) => {
        logger.error(`服务器错误: ${error.message}`)
        reject(error)
      })

      // 服务器关闭时resolve Promise
      server.on('close', () => {
        logger.success('服务器已停止')
        resolve()
      })
    })
  }
  catch (error) {
    logger.error(`启动web服务器失败: ${(error as Error).message}`)
    process.exit(1)
  }
}

/**
 * 显示帮助信息
 */
export function showHelp(): void {
  console.log(`
USB设备数据管理工具

用法:
  usb-ids <command> [options]
  或者: node bin/cli.js <command> [options]

命令:
  update, fetch    更新USB设备数据
  version, info    显示当前版本信息
  check           检查是否需要更新
  ui              启动web界面服务器
  help            显示此帮助信息

选项:
  --force         强制更新（忽略时间检查）
  --port <port>   指定web服务器端口（默认3000）

示例:
  usb-ids update
  usb-ids update --force
  usb-ids version
  usb-ids check
  usb-ids ui
  usb-ids ui --port 8080
`)
}

/**
 * CLI主函数 - 处理命令行参数
 */
export async function runCli(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'update':
    case 'fetch':
      await updateUsbIdsData(args.includes('--force'))
      break

    case 'version':
    case 'info':
      showVersionInfo()
      break

    case 'check':
      checkUpdate()
      break

    case 'ui': {
      // 解析端口参数
      const portIndex = args.indexOf('--port')
      let port = 3000
      if (portIndex !== -1 && args[portIndex + 1]) {
        const parsedPort = Number.parseInt(args[portIndex + 1], 10)
        if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
          port = parsedPort
        }
        else {
          logger.error('无效的端口号，使用默认端口3000')
        }
      }
      await startWebServer(port)
      break
    }

    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break

    default:
      if (!command) {
        // 默认执行更新
        await updateUsbIdsData()
      }
      else {
        logger.error(`未知命令: ${command}`)
        logger.info('使用 --help 查看可用命令')
        process.exit(1)
      }
      break
  }
}

// 当直接运行此文件时执行CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((error) => {
    logger.error(`CLI执行失败: ${error.message}`)
    process.exit(1)
  })
}
