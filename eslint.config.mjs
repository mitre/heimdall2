/* eslint-disable n/no-extraneous-import */

import e18e from '@e18e/eslint-plugin';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import { importX } from 'eslint-plugin-import-x';
import markdownLinks from 'eslint-plugin-markdown-links';
import markdownPreferences from 'eslint-plugin-markdown-preferences';
import n from 'eslint-plugin-n';
import perfectionist from 'eslint-plugin-perfectionist';
import promise from 'eslint-plugin-promise';
import regexp from 'eslint-plugin-regexp';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import yml from 'eslint-plugin-yml';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import cypress from 'eslint-plugin-cypress';
import vue from 'eslint-plugin-vue';

/* eslint-enable n/no-extraneous-import */

export default defineConfig([
  {
    ignores: ['**/dist', '**/lib', '**/node_modules', 'libs/inspecjs/src/generated_parsers/**'],
    name: 'global ignores',
  },
  {
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      vitest.configs.recommended,
      promise.configs['flat/recommended'],
      { ...regexp.configs.all, name: 'regexp/all' },
      unicorn.configs.recommended,
      n.configs['flat/recommended'],
      {
        ...stylistic.configs.customize({
          braceStyle: '1tbs',
          indent: [2, { SwitchCase: 1 }],
          quoteProps: 'as-needed',
          quotes: 'single',
          semi: true,
        }), name: '@stylistic/customized',
      },
      tseslint.configs.stylisticTypeChecked,
      comments.recommended,
      yml.configs.standard.map((cfg) => ({...cfg, name: 'yml/standard'})),
      security.configs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      { ...perfectionist.configs['recommended-natural'], name: 'perfectionist/recommended-natural' },
      { ...e18e.configs.modernization, name: 'e18e/modernization' },
      { ...e18e.configs.performanceImprovements, name: 'e18e/performanceImprovements' },
      cypress.configs.recommended,
      vue.configs['flat/vue2-recommended'],
    ],
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: { 
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser,
        projectService: { 
          allowDefaultProject: [
            'apps/frontend/vue.config.js',
            'eslint.config.mjs',
            'libs/password-complexity/index.js',
            'vitest.config.ts',
          ]
        }
      },
      sourceType: 'module',
    },
    name: 'js/ts',
    rules: {
      '@stylistic/eol-last': 'error',
      '@stylistic/object-curly-newline': ['error', { multiline: true }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      curly: 'error',
      'n/no-missing-import': ['error', { tryExtensions: ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.cjs', '.json'] }],
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            ['type-builtin', 'value-builtin'],
            ['type-external', 'value-external'],
            ['type-internal', 'value-internal'],
            ['type-parent', 'value-parent'],
            ['type-sibling', 'value-sibling'],
            ['type-index', 'value-index'],
            'ts-equals-import',
            'unknown',
          ],
          newlinesBetween: 0,
          type: 'natural',
          useExperimentalDependencyDetection: true,
        },
      ],
      'prefer-object-has-own': 'error',
      'unicorn/filename-case': ['error', { case: 'snakeCase' }],
      'unicorn/no-null': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    extends: [json.configs.recommended],
    files: ['**/*.json'],
    ignores: ['package-lock.json', 'parse_testbed/**', 'schemas/**'],
    language: 'json/json',
    name: 'json',
    plugins: { json },
  },
  {
    extends: [{ ...e18e.configs.moduleReplacements, name: 'e18e/moduleReplacements' }],
    files: ['**/package.json'],
    language: 'json/json',
    name: 'package.json',
    plugins: { json },
  },
  {
    extends: [
      markdown.configs.recommended,
      markdownLinks.configs.recommended,
      markdownPreferences.configs.standard,
    ],
    files: ['**/*.md'],
    language: 'markdown/gfm',
    name: 'markdown',
    plugins: { markdown },
  },
]);
//     Should we retain this naming convention for any (i.e. common, hdf-converters projects) / all interfaces (soon to be mostly all types)
//     "@typescript-eslint/naming-convention": [
//       "warn",
//       {
//         "selector": "interface",
//         "format": ["PascalCase"],
//         "custom": {
//           "regex": "^I[A-Z]",
//           "match": true
//         }
//       }
//     ],
//
//     --
//
//     backend sequelize migrations probably should be linted before merge but not modified afterwards, not sure how to implement that atm but it seems like between the tsconfig and allowdefaultproject setting they're being ignored for now
