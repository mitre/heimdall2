module.exports = {
  extends: [
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    es6: true
  },
  rules: {
    'object-curly-spacing': 'warn',
  },
  parserOptions: {
    ecmaVersion: 2017
  }
};
