import type { UsbIdsData } from '../types'
import { toV1 } from '../legacy/to-v1'
import { parseUsbIdsFull } from './full-usb-ids'

/**
 * Legacy v1-compatible parse (vendors + devices only), derived from full parse.
 */
export function parseUsbIds(content: string): UsbIdsData {
  return toV1(parseUsbIdsFull(content))
}
