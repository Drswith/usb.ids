// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/bin/**',
    ],
    rules: {
      'no-console': 'off',
      'node/prefer-global/process': 'warn',
    },
  },
)
