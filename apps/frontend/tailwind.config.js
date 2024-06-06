/** @type {import('tailwindcss').Config} */

// Lookup constants
const fs = require('fs');

// Grabs template and dependencies for HTML export
const files = {
  [require.resolve(
    '@mitre/hdf-converters/src/converters-from-hdf/html/template.html'
  )]: 'public/static/export/template.html',
  [require.resolve('tw-elements/js/tw-elements.umd.min.js')]:
    'public/static/export/tw-elements.min.js'
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
    './public/static/export/template.html',
    './node_modules/tw-elements/dist/js/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('tw-elements/dist/plugin.cjs')]
};
