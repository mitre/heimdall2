/** @type {import('tailwindcss').Config} */

// Lookup constants
const fs = require('fs');
const path = require('path');
const htmlConverterPath = 'src/converters-from-hdf/html';

// Grabs template and dependencies for HTML export
fs.copyFile(require.resolve('tw-elements/dist/js/tw-elements.umd.min.js'), path.join(htmlConverterPath, 'tw-elements.umd.min.js.txt'), (err) => {
    if (err) {
        throw err;
    }
});

module.exports = {
  content: [
    path.join(htmlConverterPath, 'template.html'),
    './node_modules/tw-elements/dist/js/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('tw-elements/dist/plugin.cjs')]
};
