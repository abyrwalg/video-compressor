import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  // Global ignores
  { ignores: ['node_modules', 'dist', 'build', 'coverage', 'src-tauri'] },

  // Base JS + Prettier integration
  js.configs.recommended,
  prettierRecommended,

  // App-wide defaults (JS + JSX in browser)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      import: importPlugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: { extensions: ['.js', '.jsx'] },
        typescript: {
          project: ['./jsconfig.json'],
        },
      },
    },
    rules: {
      // ---- General quality (adapted from your backend)
      eqeqeq: 'error',
      curly: 'error',
      'no-var': 'error',
      'default-case': 'error',
      'prefer-const': 'warn',
      'no-use-before-define': ['error', { functions: false }],
      'no-redeclare': 'error',
      'no-shadow': 'warn',
      'no-return-await': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: { object: true, array: false },
          AssignmentExpression: { object: true, array: false },
        },
        { enforceForRenamedProperties: false },
      ],
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^(React|_)' },
      ],
      'react/jsx-uses-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ---- Imports (same spirit as backend)
      // keep safety checks
      'import/first': 'error',
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',

      // turn off old sorter
      'import/order': 'off',
      'import/newline-after-import': 'off',

      // your exact groups and blank lines
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1) React then Tauri (React must be first)
            ['^react$'],
            ['^tauri($|/)'],

            // 2) Other externals
            ['^@?\\w'],

            // 3) components (adapt to your aliases/paths)
            [
              '^components(/|$)',
              '^@/components(/|$)',
              '^src/components(/|$)',
              '^(?:\\.{1,2}/)+components(/|$)',
            ],

            // 4) Everything else: internal absolute -> parent/sibling -> side-effects
            ['^(@|src)(/|$)'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^\\u0000'],
          ],
        },
      ],

      // ---- React / Hooks / a11y
      'react/react-in-jsx-scope': 'warn',
      'react/jsx-uses-react': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      'react/self-closing-comp': 'warn',
      'react/jsx-no-target-blank': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
    },
  },

  // Tests
  {
    files: ['**/*.{test,spec}.js', '**/__tests__/**/*.js'],
    languageOptions: { globals: { ...globals.jest } },
    rules: { 'no-console': 'off' },
  },

  {
    files: ['*.config.{js,cjs}', 'scripts/**/*.{js,cjs}'],
    languageOptions: { sourceType: 'script' },
  },

  {
    files: ['vite.config.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
];
