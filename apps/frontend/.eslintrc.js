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
    'no-console': 'off',
    'no-return-await': 'warn',
    'no-throw-literal': 'warn',
    'vue/require-default-prop': 'off',
    'vue/prop-name-casing': 'off',
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
