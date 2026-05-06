import * as crypto from 'node:crypto'

export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}
