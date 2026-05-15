/* eslint-disable regexp/no-super-linear-backtracking -- small fixed-width header lines from trusted usb.ids */
/**
 * Parse the comment header of upstream `usb.ids` (linux-usb.org format).
 * Only scans the first ~50 lines.
 */
export interface UsbIdsHeader {
  /** e.g. "2026.05.06" from `# Version: YYYY.MM.DD` */
  version: string | null;
  /** Raw text after `# Date:` if present */
  date: string | null;
}

const VERSION_RE = /^\s*#\s*version\s*:\s*(\d{4})\.(\d{2})\.(\d{2})\s*$/i;
const DATE_RE = /^\s*#\s*date\s*:\s*(.+)\s*$/i;

export function parseUsbIdsHeader(content: string): UsbIdsHeader {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n", 51);

  let version: string | null = null;
  let date: string | null = null;

  for (const rawLine of lines.slice(0, 50)) {
    const line = rawLine.trimEnd();

    const mVer = line.match(VERSION_RE);
    if (mVer) {
      version = `${mVer[1]}.${mVer[2]}.${mVer[3]}`;
      continue;
    }

    const mDate = line.match(DATE_RE);
    if (mDate) date = mDate[1].trim();
  }

  return { version, date };
}
