module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'sonarjs'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:sonarjs/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ["warn", { "argsIgnorePattern": "^_" }],
    'object-curly-spacing': 'warn',
    'no-return-await': 'warn',
    'no-throw-literal': 'warn'
  },
  overrides: [
    {
      // Enable specific rules for test files only
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'sonarjs/no-identical-functions': 'off',
        'sonarjs/cognitive-complexity': 'off'
      }
    },
    {
      // Disable duplicate string rule for test constants
      files: ['test/**/*.ts', 'test/**/*.constant.ts'],
      rules: {
        'sonarjs/no-duplicate-string': 'off'
      }
    },
    {
      // Special rules for main.ts and filters
      files: ['src/main.ts', 'src/filters/authentication-exception.filter.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'sonarjs/cognitive-complexity': 'off',
        'sonarjs/no-duplicate-string': 'off'
      }
    },
    {
      // Allow higher cognitive complexity for complex service methods
      files: [
        'src/authn/authn.service.ts', 
        'src/evaluations/evaluations.controller.ts'
      ],
      rules: {
        'sonarjs/cognitive-complexity': ['error', 20]
      }
    }
  ],
};
