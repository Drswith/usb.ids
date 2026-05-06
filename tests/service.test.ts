import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USB_IDS_JSON_FILE, USB_IDS_VERSION_JSON_FILE } from '../src/config'
import { downloadFromUrls } from '../src/fetcher'
import { fetchUsbIdsData } from '../src/service/usb-ids-data'
import { MINI_USB_IDS } from './fixtures/mini-usb.ids'

vi.mock('../src/fetcher', () => ({
  downloadFromUrls: vi.fn(),
}))

describe('fetchUsbIdsData', () => {
  let root: string

  beforeEach(() => {
    vi.mocked(downloadFromUrls).mockResolvedValue(MINI_USB_IDS)
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-svc-'))
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'usb.ids', version: '2.20260506.0' }, null, 2),
    )
  })

  afterEach(() => {
    if (root && fs.existsSync(root))
      fs.rmSync(root, { recursive: true, force: true })
  })

  it('downloads, parses v2, writes version file when forced', async () => {
    const r = await fetchUsbIdsData(
      ['https://example.com/usb.ids'],
      USB_IDS_JSON_FILE,
      root,
      true,
    )
    expect(r.source).toBe('api')
    expect(r.versionInfo.version.match(/^2\.\d{8}\.\d+$/)).toBeTruthy()
    expect(r.data).toHaveProperty('schemaVersion', 2)

    const verPath = path.join(root, USB_IDS_VERSION_JSON_FILE)
    expect(fs.existsSync(verPath)).toBe(true)
  })
})
