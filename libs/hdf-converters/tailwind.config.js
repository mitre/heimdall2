/** @type {import('tailwindcss').Config} */

// Lookup constants
const fs = require('fs');

// Grabs JS for HTML export
const files = {
  [require.resolve('tw-elements/dist/js/tw-elements.umd.min.js')]:
    'src/converters-from-hdf/html/tw-elements.min.js'
};
for (const file in files) {
  fs.copyFile(file, files[file], (err) => {
    if (err) {
      throw err;
    }
  });
}

module.exports = {
  content: [
    './src/converters-from-hdf/html/template.html',
    './node_modules/tw-elements/dist/js/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('tw-elements/dist/plugin.cjs')]
};
