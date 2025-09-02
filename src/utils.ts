/**
 * ANSI 颜色代码
 */
export const colors = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  cyan: '\x1B[36m',
  green: '\x1B[32m',
  blue: '\x1B[34m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
}

/**
 * 格式化时间戳（使用UTC时间）
 */
export function formatTimestamp(): string {
  const now = new Date()
  const hours = now.getUTCHours().toString().padStart(2, '0')
  const minutes = now.getUTCMinutes().toString().padStart(2, '0')
  const seconds = now.getUTCSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 手动实现的日志函数
 */
function createLogger(level: 'start' | 'success' | 'info' | 'warn' | 'error') {
  return (message: string, verbose = true): void => {
    if (!verbose)
      return

    const timestamp = formatTimestamp()
    const prefix = `[usb.ids]`

    switch (level) {
      case 'start':
        console.log(`${colors.cyan}◐${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'success':
        console.log(`${colors.green}✔${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'info':
        console.log(`${colors.blue}ℹ${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'warn':
        console.log(`${colors.yellow}⚠${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'error':
        console.log(`${colors.red}✖${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
    }
  }
}

export const logger = {
  start: createLogger('start'),
  success: createLogger('success'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
}
