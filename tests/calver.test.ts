import { describe, expect, it } from 'vitest'
import { nextCalVer } from '../src/calver'

describe('nextCalVer', () => {
  it('starts at .0 for a new UTC day when current version is not CalVer', () => {
    const t = Date.UTC(2026, 4, 6, 12, 0, 0)
    expect(nextCalVer(t, '1.0.999')).toBe('2.20260506.0')
  })

  it('increments N on the same UTC day', () => {
    const t = Date.UTC(2026, 4, 6, 18, 0, 0)
    expect(nextCalVer(t, '2.20260506.0')).toBe('2.20260506.1')
    expect(nextCalVer(t, '2.20260506.9')).toBe('2.20260506.10')
  })

  it('resets N when the UTC date rolls', () => {
    const t = Date.UTC(2026, 4, 7, 0, 0, 0)
    expect(nextCalVer(t, '2.20260506.5')).toBe('2.20260507.0')
  })
})
