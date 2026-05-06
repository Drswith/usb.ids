#!/usr/bin/env node

/**
 * USB设备数据CLI工具
 * 提供命令行接口来管理USB设备数据
 */

import * as fs from 'node:fs'
import { createServer } from 'node:http'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import sirv from 'sirv'
import { UI_LOCAL_BASE_URL, USB_IDS_JSON_FILE, USB_IDS_SOURCE, USB_IDS_VERSION_JSON_FILE } from './config'
import { fetchUsbIdsData, loadVersionInfo, saveUsbIdsToFile } from './core'
import { shouldUpdate } from './parser'
import { colors, logger } from './utils'

function getCliPackageRoot(): string {
  const cliDir = path.dirname(fileURLToPath(import.meta.url))
  return path.dirname(cliDir)
}

function resolveUiDistDir(): string {
  const cliDir = path.dirname(fileURLToPath(import.meta.url))
  const fromDistSibling = path.join(cliDir, 'ui')
  if (fs.existsSync(fromDistSibling))
    return path.resolve(fromDistSibling)
  const fromRepo = path.join(path.dirname(cliDir), 'dist', 'ui')
  if (fs.existsSync(fromRepo))
    return path.resolve(fromRepo)
  return path.resolve(fromDistSibling)
}

/**
 * 主要的数据更新函数
 */
async function updateUsbIdsData(forceUpdate = false): Promise<void> {
  try {
    const root = process.cwd()
    const fallbackFile = USB_IDS_JSON_FILE
    const jsonFile = path.join(root, USB_IDS_JSON_FILE)
    const versionFile = path.join(root, USB_IDS_VERSION_JSON_FILE)

    logger.start('Starting USB ID\'s data update...')

    // 检查是否需要更新
    const currentVersionInfo = loadVersionInfo(versionFile)
    if (!forceUpdate && !shouldUpdate(currentVersionInfo, forceUpdate)) {
      logger.info('Data is already up to date, no update needed')
      return
    }

    // 获取USB设备数据
    logger.info('Fetching USB ID\'s data...')
    const { data, source, versionInfo } = await fetchUsbIdsData(
      USB_IDS_SOURCE,
      fallbackFile,
      root,
      forceUpdate,
    )

    // 保存JSON格式数据
    logger.info('Saving JSON format data...')
    await saveUsbIdsToFile(data, jsonFile)

    // 输出统计信息
    logger.success(`Data update completed!`)
    logger.info(`Data source: ${source === 'api' ? 'Remote API' : 'Local fallback file'}`)
    logger.info(`Vendor count: ${versionInfo.vendorCount}`)
    logger.info(`Device count: ${versionInfo.deviceCount}`)
    logger.info(`Version: ${versionInfo.version}`)
    logger.info(`Update time: ${versionInfo.fetchTimeFormatted}`)
  }
  catch (error) {
    logger.error(`Update failed: ${(error as Error).message}`)
    process.exit(1)
  }
}

/**
 * 显示当前版本信息
 */
function showVersionInfo(): void {
  try {
    const root = process.cwd()
    const versionFile = path.join(root, USB_IDS_VERSION_JSON_FILE)

    if (!fs.existsSync(versionFile)) {
      logger.warn('Version info file does not exist, please run update command first')
      return
    }

    const versionInfo = loadVersionInfo(versionFile)
    if (!versionInfo) {
      logger.error('Unable to read version information')
      return
    }

    logger.info('Current version information:')
    console.log(`  Version: ${versionInfo.version}`)
    console.log(`  Data source: ${versionInfo.source === 'api' ? 'Remote API' : 'Local fallback file'}`)
    console.log(`  Vendor count: ${versionInfo.vendorCount}`)
    console.log(`  Device count: ${versionInfo.deviceCount}`)
    console.log(`  Update time: ${versionInfo.fetchTimeFormatted}`)
    console.log(`  Content hash: ${versionInfo.contentHash}`)
  }
  catch (error) {
    logger.error(`Failed to get version information: ${(error as Error).message}`)
  }
}

/**
 * 检查是否需要更新
 */
function checkUpdate(): void {
  try {
    const root = process.cwd()
    const versionFile = path.join(root, USB_IDS_VERSION_JSON_FILE)

    const versionInfo = loadVersionInfo(versionFile)
    const needsUpdate = shouldUpdate(versionInfo)

    if (needsUpdate) {
      logger.warn('Data needs to be updated')
      if (versionInfo) {
        const hoursSinceUpdate = (Date.now() - versionInfo.fetchTime) / (1000 * 60 * 60)
        logger.info(`${hoursSinceUpdate.toFixed(1)} hours have passed since last update`)
      }
      else {
        logger.info('Version information not found, recommend performing initial update')
      }
    }
    else {
      logger.success('Data is up to date, no update needed')
      if (versionInfo) {
        logger.info(`Last update time: ${versionInfo.fetchTimeFormatted}`)
      }
    }
  }
  catch (error) {
    logger.error(`Check update failed: ${(error as Error).message}`)
  }
}

/**
 * 启动静态web服务器
 */
async function startWebServer(port = 3000): Promise<void> {
  try {
    const distDir = resolveUiDistDir()
    const pkgRoot = path.resolve(getCliPackageRoot())
    const distDirResolved = path.resolve(distDir)

    if (!fs.existsSync(distDirResolved)) {
      logger.error('dist/ui directory does not exist, please run build command first: pnpm run build:app')
      process.exit(1)
    }

    function isPathInsideDir(file: string, dir: string): boolean {
      const rel = path.relative(dir, file)
      return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
    }

    function logResp(statusCode: number, start: number, success = true): void {
      logger.info(`${colors.yellow}HTTP${colors.reset} ${success ? colors.green : colors.red}Returned ${statusCode} in ${Date.now() - start} ms${colors.reset}`)
    }

    const prod = process.env.NODE_ENV === 'production'
    const serveStatic = sirv(distDirResolved, {
      etag: true,
      single: true,
      dev: !prod,
      maxAge: prod ? 86_400_000 : 0,
      immutable: prod,
    })

    const server = createServer((req, res) => {
      const startTime = Date.now()
      const rawUrl = req.url ?? '/'
      logger.info(`${colors.yellow}HTTP${colors.reset} ${colors.cyan}${req.method} ${rawUrl}${colors.reset}`)

      let urlPath: string
      try {
        urlPath = decodeURIComponent(rawUrl.split('?')[0] || '/')
      }
      catch {
        res.writeHead(400)
        res.end('Bad Request')
        logResp(400, startTime, false)
        return
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405)
        res.end('Method Not Allowed')
        logResp(405, startTime, false)
        return
      }

      if (urlPath === '/' || urlPath === '') {
        res.writeHead(302, { Location: UI_LOCAL_BASE_URL })
        res.end()
        logResp(302, startTime)
        return
      }

      const rel = urlPath === UI_LOCAL_BASE_URL
        ? 'index.html'
        : urlPath.startsWith(UI_LOCAL_BASE_URL)
          ? (urlPath.slice(UI_LOCAL_BASE_URL.length) || 'index.html')
          : urlPath.replace(/^\//, '')

      const base = path.basename(rel.split('?')[0] ?? rel)
      if (base === USB_IDS_JSON_FILE || base === USB_IDS_VERSION_JSON_FILE) {
        const dataPath = path.resolve(pkgRoot, base)
        if (!isPathInsideDir(dataPath, pkgRoot)) {
          res.writeHead(403)
          res.end('Forbidden')
          logResp(403, startTime, false)
          return
        }
        fs.readFile(dataPath, (err, data) => {
          if (err) {
            res.writeHead(404)
            res.end('Not Found')
            logResp(404, startTime, false)
            return
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          if (req.method === 'HEAD') {
            res.end()
          }
          else {
            res.end(data)
          }
          logResp(200, startTime)
        })
        return
      }

      if (!urlPath.startsWith(UI_LOCAL_BASE_URL)) {
        res.writeHead(404)
        res.end('Not Found')
        logResp(404, startTime, false)
        return
      }

      let inner = urlPath.slice(UI_LOCAL_BASE_URL.length)
      if (!inner || inner === '/')
        inner = '/'
      else if (!inner.startsWith('/'))
        inner = `/${inner}`

      const qs = rawUrl.includes('?') ? `?${rawUrl.split('?').slice(1).join('?')}` : ''
      const prevUrl = req.url
      ;(req as { url?: string }).url = `${inner}${qs}`

      serveStatic(req, res, () => {
        ;(req as { url?: string }).url = prevUrl
        res.statusCode = 404
        res.end('Not Found')
        logResp(404, startTime, false)
      })
    })

    server.listen(port, () => {
      logger.success(`usb.ids Web UI ${colors.green}server started!${colors.reset}`)
      logger.info(`Access URL: ${colors.cyan}http://localhost:${port}${UI_LOCAL_BASE_URL}${colors.reset}`)
      logger.info(`Press ${colors.yellow}Control+C${colors.reset} to ${colors.yellow}stop${colors.reset} the server`)
    })

    return new Promise<void>((resolve, reject) => {
      server.on('error', (error) => {
        logger.error(`Server error: ${error.message}`)
        reject(error)
      })
      server.on('close', () => {
        logger.success('Server stopped')
        resolve()
      })
    })
  }
  catch (error) {
    logger.error(`Failed to start web server: ${(error as Error).message}`)
    process.exit(1)
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
USB Device Data Management Tool

Usage:
  usb-ids <command> [options]
  or: node bin/cli.js <command> [options]

Commands:
  update, fetch    Update USB ID's data
  version, info    Show current version information
  check           Check if update is needed
  ui              Start web interface server
  help            Show this help information

Options:
  --force         Force update (ignore time check)
  --port <port>   Specify web server port (default 3000)

Examples:
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
async function runCli(): Promise<void> {
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
          logger.error('Invalid port number, using default port 3000')
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
        logger.error(`Unknown command: ${command}`)
        logger.info('Use --help to see available commands')
        process.exit(1)
      }
      break
  }
}

runCli().catch((error) => {
  logger.error(`CLI execution failed: ${error.message}`)
  process.exit(1)
})
