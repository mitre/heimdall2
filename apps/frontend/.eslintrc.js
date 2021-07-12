module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/recommended', '@vue/prettier', '@vue/typescript'],
  rules: {
    'no-console': 'warn',
    'no-return-await': 'warn',
    'no-throw-literal': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'vue/require-default-prop': 'off',
    'vue/prop-name-casing': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    'object-curly-spacing': 'warn',
    'lines-between-class-members': [
      'warn',
      'always',
      {exceptAfterSingleLine: true}
    ],
    'padding-line-between-statements': [
      'warn',
      {blankLine: 'always', prev: 'function', next: '*'},
      {blankLine: 'always', prev: 'import', next: ['class', 'function']}
    ],
    'vue/html-self-closing': [
      'warn',
      {
        html: {
          void: 'always'
        }
      }
    ]
  }
};
