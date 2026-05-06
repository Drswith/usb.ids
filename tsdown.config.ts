import { defineConfig } from 'tsdown'

export default defineConfig((_) => {
  const share = {
    clean: true,
    target: 'node18',
  }

  return [
    {
      ...share,
      entry: [
        'src/index.ts',
      ],
      format: 'esm',
    },
    {
      ...share,
      clean: false,
      entry: [
        'src/index.ts',
      ],
      dts: false,
      format: 'cjs',
    },
    {
      ...share,
      clean: false,
      platform: 'node',
      entry: ['src/cli.ts'],
      format: 'esm',
      dts: false,
    },
    {
      clean: false,
      entry: ['src/browser.ts'],
      format: 'esm',
      platform: 'neutral',
      target: 'es2022',
      dts: false,
    },
  ]
})
