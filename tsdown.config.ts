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
      entry: [
        'src/index.ts',
      ],
      dts: false,
      format: 'cjs',
    },
    // 命令行工具
    {
      ...share,
      platform: 'node',
      entry: ['src/cli.ts'],
      outDir: 'bin',
      format: 'esm',
      dts: false,
    },
  ]
})
