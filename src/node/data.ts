import type { UsbIdsData } from '../types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { USB_IDS_JSON_FILE, USB_IDS_SOURCE } from '../config'
import { fetchUsbIdsData } from '../core'
import { isDatasetV2, toV1 } from '../legacy/to-v1'
import { getPackageRoot } from '../paths'

export function loadUsbDataSync(): UsbIdsData {
  const p = path.join(getPackageRoot(), USB_IDS_JSON_FILE)
  if (!fs.existsSync(p)) {
    throw new Error(
      `Missing ${USB_IDS_JSON_FILE} under package root (${getPackageRoot()}). Run \`usb-ids fetch\` or install a published build that includes data files.`,
    )
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (isDatasetV2(raw))
    return toV1(raw)
  return raw as UsbIdsData
}

export async function loadUsbData(): Promise<UsbIdsData> {
  return loadUsbDataSync()
}

export async function updateUsbData(options: { force?: boolean, root?: string } = {}): Promise<
  Awaited<ReturnType<typeof fetchUsbIdsData>>
> {
  const root = options.root ?? getPackageRoot()
  return fetchUsbIdsData(USB_IDS_SOURCE, USB_IDS_JSON_FILE, root, options.force ?? false)
}
