import type { VersionInfo } from '../src/types'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  loadJsonFile,
  loadVersionInfo,
  saveUsbIdsToFile,
  saveVersionInfo,
} from '../src/repository/file-store'

describe('repository file-store', () => {
  let dir: string

  afterEach(() => {
    if (dir && fs.existsSync(dir))
      fs.rmSync(dir, { recursive: true, force: true })
  })

  it('saveVersionInfo round-trips', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-repo-'))
    const p = path.join(dir, 'usb.ids.version.json')
    const v: VersionInfo = {
      fetchTime: 1,
      fetchTimeFormatted: 'x',
      contentHash: 'abc',
      source: 'api',
      vendorCount: 1,
      deviceCount: 2,
      version: '2.20260101.0',
    }
    await saveVersionInfo(v, p)
    expect(loadVersionInfo(p)).toEqual(v)
  })

  it('loadJsonFile returns null for missing file', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-repo-'))
    expect(loadJsonFile(path.join(dir, 'nope.json'))).toBeNull()
  })

  it('saveUsbIdsToFile writes JSON', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usb-repo-'))
    const p = path.join(dir, 'out.json')
    const data = { x: { vendor: 'x', name: 'N', devices: {} } }
    await saveUsbIdsToFile(data, p)
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'))
    expect(parsed).toEqual(data)
  })
})
