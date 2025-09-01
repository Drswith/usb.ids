import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
    projects: [
      {
        test: {
          include: ['tests/**/*.browser.test.{ts,js}'],
          // 建议内联配置时定义项目名称
          name: 'happy-dom',
          environment: 'happy-dom',
        },
      },
      {
        // 添加 "extends: true" 继承根配置中的选项
        extends: true,
        test: {
          include: ['tests/**/*.test.{ts,js}'],
          exclude: ['tests/**/*.browser.test.{ts,js}'],
          // 名称标签颜色可自定义
          name: { label: 'node', color: 'green' },
          environment: 'node',
        },
      },
    ],
  },
})
