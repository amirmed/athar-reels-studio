import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'dist-electron', 'release', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-useless-assignment': 'off',
      'no-misleading-character-class': 'off',
      'no-useless-escape': 'off',
      // Enforce Zustand selector usage: Never allow full store subscription useAppStore() without a selector
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='useAppStore'][arguments.length=0]",
          message:
            '❌ Always pass a selector to useAppStore, e.g. useAppStore((s) => s.myValue) to prevent full component tree re-renders!',
        },
      ],
    },
  }
);
