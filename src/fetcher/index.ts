/**
 * Remote download using native fetch (Node 18+): retries, timeout, no cache-busting query params.
 */

const DEFAULT_TIMEOUT_MS = 45_000
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 250

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchTextOnce(url: string): Promise<string> {
  const timeoutSignal
    = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
      : undefined

  const res = await fetch(url, {
    ...(timeoutSignal ? { signal: timeoutSignal } : {}),
    headers: {
      'Accept': 'text/plain,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  return await res.text()
}

/**
 * Download a single URL (no cache-busting).
 */
export async function downloadFile(url: string): Promise<string> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fetchTextOnce(url)
    }
    catch (error) {
      lastError = error as Error
      if (attempt < MAX_RETRIES - 1) {
        await sleep(INITIAL_BACKOFF_MS * (2 ** attempt))
      }
    }
  }
  throw lastError || new Error(`Download failed: ${url}`)
}

/**
 * Try each URL in order; per-URL retries with backoff.
 */
export async function downloadFromUrls(urls: string[]): Promise<string> {
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      return await downloadFile(url)
    }
    catch (error) {
      lastError = error as Error
      console.warn(`Failed to download from ${url}:`, error)
    }
  }
  throw lastError || new Error('All download attempts failed')
}
