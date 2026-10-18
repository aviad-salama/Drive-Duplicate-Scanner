import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  { ignores: ['dist', 'eslint.config.js', 'vite.config.js'] },
  
  ...compat.config({
    extends: [
      'airbnb',
      'airbnb-typescript',
      'airbnb/hooks'
    ],
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      warnOnUnsupportedTypeScriptVersion: false,
    }
  }),

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'react-refresh/only-export-components': 'off',
      
      'curly': ['error', 'all'],
      
      'linebreak-style': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'no-restricted-exports': 'off',
      'no-alert': 'off',
      'react/require-default-props': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
      'max-len': 'off',
      'consistent-return': 'off'
    },
  },
];