import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Firebase may only be imported from src/lib and feature data hooks (see the skeleton handoff).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase/*'],
              message: 'Import Firebase only in src/lib/ or a feature data hook (*.data.ts).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/**', 'src/**/*.data.ts', 'tests/**', 'e2e/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
