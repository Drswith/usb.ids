import * as path from 'node:path'
import { describe, expect, it } from 'vitest'

/** Mirrors CLI path containment check for static JSON. */
function isPathInsideDir(file: string, dir: string): boolean {
  const rel = path.relative(dir, file)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

describe('static file path containment', () => {
  const pkgRoot = path.resolve('/app/package-root')

  it('allows files under package root', () => {
    const f = path.join(pkgRoot, 'usb.ids.json')
    expect(isPathInsideDir(f, pkgRoot)).toBe(true)
  })

  it('rejects traversal outside package root', () => {
    const f = path.resolve(pkgRoot, '..', 'etc', 'passwd')
    expect(isPathInsideDir(f, pkgRoot)).toBe(false)
  })

  it('rejects absolute paths outside dir', () => {
    expect(isPathInsideDir('/etc/passwd', pkgRoot)).toBe(false)
  })
})
