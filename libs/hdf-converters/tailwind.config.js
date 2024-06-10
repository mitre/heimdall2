/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './templates/html/template.html',
    './node_modules/tw-elements/dist/js/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('tw-elements/dist/plugin.cjs')]
};
