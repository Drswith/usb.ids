import { describe, expect, it } from 'vitest'
import { ERROR_CODES, UsbApiError } from '../src/errors'

describe('usbApiError', () => {
  it('extends Error and carries code', () => {
    const inner = new Error('net')
    const e = new UsbApiError('x', ERROR_CODES.NETWORK_ERROR, inner)
    expect(e).toBeInstanceOf(Error)
    expect(e).toBeInstanceOf(UsbApiError)
    expect(e.code).toBe(ERROR_CODES.NETWORK_ERROR)
    expect(e.cause).toBe(inner)
  })
})
