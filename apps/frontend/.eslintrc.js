module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'unused-imports'],
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/recommended', '@vue/prettier', '@vue/typescript'],
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-imports-ts': 'error',
    'unused-imports/no-unused-vars-ts': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }
    ],
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'vue/require-default-prop': 'off',
    'vue/prop-name-casing': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always'
        }
      }
    ]
  }
};
