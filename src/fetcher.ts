import * as http from 'node:http'
import * as https from 'node:https'

/**
 * 远程数据获取模块
 * 专门负责从远程URL下载数据
 */

/**
 * 下载文件
 * @param url 要下载的URL
 * @returns Promise<string> 下载的文件内容
 */
export function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    client.get(`${url}?_t=${Date.now()}`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        return
      }

      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve(data)
      })
    }).on('error', reject)
  })
}

/**
 * 从多个URL尝试下载数据
 * @param urls URL列表
 * @returns Promise<string> 成功下载的内容
 */
export async function downloadFromUrls(urls: string[]): Promise<string> {
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const content = await downloadFile(url)
      return content
    }
    catch (error) {
      lastError = error as Error
      console.warn(`Failed to download from ${url}:`, error)
    }
  }

  throw lastError || new Error('All download attempts failed')
}
