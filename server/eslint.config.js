import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['dist/**', 'generated/**', 'prisma/**', 'eslint.config.js', 'prisma.config.ts'],
  },
  ...compat.config({
    extends: [
      'airbnb-base',
      'airbnb-typescript/base',
    ],
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      warnOnUnsupportedTypeScriptVersion: false,
    },
  }),
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'no-restricted-exports': 'off',
      'max-classes-per-file': 'off',
      'no-promise-executor-return': 'off',
      'curly': ['error', 'all'],
      'linebreak-style': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
      'no-continue': 'off',
      'max-len': 'off',
      'consistent-return': 'off',
      'no-console': 'off',
      'implicit-arrow-linebreak': 'off',
      'function-paren-newline': 'off',
      'operator-linebreak': 'off',
      'object-curly-newline': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
