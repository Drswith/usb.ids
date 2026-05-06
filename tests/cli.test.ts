import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

describe('cli (tsx)', () => {
  it('prints help', async () => {
    const { stdout } = await execa('pnpm', ['exec', 'tsx', 'src/cli.ts', 'help'], {
      cwd: root,
    })
    expect(stdout).toContain('usb-ids')
    expect(stdout).toContain('fetch')
  })

  it('exits 1 on unknown command', async () => {
    const r = await execa('pnpm', ['exec', 'tsx', 'src/cli.ts', 'not-a-command'], {
      cwd: root,
      reject: false,
    })
    expect(r.exitCode).toBe(1)
    expect(r.stderr + r.stdout).toMatch(/unknown command/i)
  })
})
