/**
 * CalVer: 2.YYYYMMDD.N — N increments for multiple releases the same UTC day.
 */
export function nextCalVer(fetchTimeMs: number, currentPackageVersion: string): string {
  const d = new Date(fetchTimeMs)
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  const ymd = `${y}${mo}${da}`

  const cal = /^2\.(\d{8})\.(\d+)$/
  const m = currentPackageVersion.match(cal)
  if (m?.[1] === ymd)
    return `2.${ymd}.${Number(m[2]) + 1}`
  return `2.${ymd}.0`
}
