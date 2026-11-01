import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
  {
    ignores: ['.next/', 'src/payload-types.ts', 'src/migrations/', 'node_modules/', 'tests/e2e/', 'src/app/my-route/'],
  },
  {
    // CJS files use CommonJS globals
    files: ['**/*.cjs'],
    languageOptions: { globals: { module: 'writable', require: 'readonly', __dirname: 'readonly' } },
  },
)
