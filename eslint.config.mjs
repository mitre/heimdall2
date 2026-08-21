import e18e from '@e18e/eslint-plugin';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import json from '@eslint/json';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import cypress from 'eslint-plugin-cypress';
import { importX } from 'eslint-plugin-import-x';
import n from 'eslint-plugin-n';
import perfectionist from 'eslint-plugin-perfectionist';
import promise from 'eslint-plugin-promise';
import regexp from 'eslint-plugin-regexp';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import vue from 'eslint-plugin-vue';
import yml from 'eslint-plugin-yml';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: [
      '**/dist',
      '**/lib',
      '**/node_modules',
      'libs/inspecjs/src/generated_parsers/**',
      'libs/hdf-converters/types/**/*.js',
      'libs/hdf-converters/types/**/*.d.ts',
      'libs/hdf-converters/data/reverse-html-mapper/tw-elements.min.js',
      'libs/hdf-converters/schemas/checklist/**/jsonix-compiler-output/**',
      'libs/hdf-converters/sample_jsons/**/*.js',
      'apps/backend/migrations/**',
      'apps/backend/seeders/**',
      'apps/frontend/src/server.js',
      'test/support/server/**',
      '.vscode/**',
      'postcss.config.js',
    ],
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
      yml.configs.standard.map(cfg => ({ ...cfg, name: 'yml/standard' })),
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
          ],
        },
      },
      sourceType: 'module',
    },
    name: 'js/ts',
    rules: {
      '@stylistic/eol-last': 'error',
      '@stylistic/object-curly-newline': ['error', { multiline: true }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowBoolean: true, allowNullish: true, allowNumber: true }],
      curly: 'error',
      'e18e/prefer-spread-syntax': 'off',
      'import-x/namespace': 'off',
      'import-x/no-named-as-default-member': 'off',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unsupported-features/es-builtins': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      'perfectionist/sort-classes': 'off',
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
      'perfectionist/sort-modules': 'off',
      'prefer-object-has-own': 'error',
      'security/detect-object-injection': 'off',
      'unicorn/filename-case': ['error', { cases: { camelCase: true, kebabCase: true, pascalCase: true, snakeCase: true } }],
      'unicorn/no-null': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-useless-else': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'vitest/expect-expect': 'off',
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: [
            'tsconfig.json',
            'apps/*/tsconfig.json',
            'libs/*/tsconfig.json',
          ],
        }),
      ],
    },
  },
  {
    files: ['apps/frontend/**/*.{ts,vue}'],
    name: 'frontend/resolver',
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: 'apps/frontend/tsconfig.json',
        }),
      ],
    },
  },
  {
    files: ['libs/inspecjs/**/*.ts'],
    name: 'inspecjs/schema-terms',
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
    },
  },
  {
    files: ['libs/password-complexity/**/*.js'],
    name: 'password-complexity/cjs',
    rules: { 'unicorn/prefer-module': 'off' },
  },
  {
    files: ['test/**/*.ts', 'cypress.config.ts'],
    name: 'integration-tests/overrides',
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'n/no-extraneous-import': 'off',
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'unicorn/prefer-dom-node-text-content': 'off',
      'vitest/no-standalone-expect': 'off',
      'vitest/valid-expect': 'off',
    },
  },
  {
    files: ['apps/backend/**/*.ts'],
    name: 'backend/nestjs-conventions',
    rules: {
      '@typescript-eslint/require-await': 'off',
      'n/no-extraneous-import': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/no-non-function-verb-prefix': 'off',
    },
  },
  {
    files: ['tools/**/*.ts'],
    name: 'tools/overrides',
    rules: { 'n/no-extraneous-import': 'off' },
  },
  {
    files: ['**/vitest.config.ts', '**/vitest.config.mts'],
    name: 'vitest-config/peer-deps',
    rules: { 'n/no-extraneous-import': ['error', { allowModules: ['vite'] }] },
  },
  {
    files: ['**/scripts/**/*.{ts,mts}'],
    name: 'scripts/security-overrides',
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
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
    rules: { 'e18e/ban-dependencies': ['error', { allowed: ['axios', 'dotenv', 'eslint-plugin-import', 'jsonwebtoken', 'lodash', 'moment', 'rimraf', 'uuid'] }] },
  },
  // @eslint/markdown v8 crashes with "Custom getLoc() method must be implemented in the subclass"
  // due to incompatibility with @eslint/plugin-kit 0.7.x. Both packages are on latest versions
  // (8.0.2 / 0.7.2) — no fix available upstream. Disabled until the bug is resolved.
  // Track: https://github.com/eslint/markdown/issues
  // {
  //   extends: [
  //     markdown.configs.recommended,
  //     markdownLinks.configs.recommended,
  //     markdownPreferences.configs.standard,
  //   ],
  //   files: ['**/*.md'],
  //   language: 'markdown/gfm',
  //   name: 'markdown',
  //   plugins: { markdown },
  // },
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
