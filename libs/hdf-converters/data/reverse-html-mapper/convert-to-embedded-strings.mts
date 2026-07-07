import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('data/reverse-html-mapper/template.html', 'utf8');
const js = readFileSync('data/reverse-html-mapper/tw-elements.min.js', 'utf8');
const css = readFileSync('data/reverse-html-mapper/style.css', 'utf8');

const out = `/* AUTO-GENERATED.  DO NOT EDIT. */
export const html = ${JSON.stringify(html)} as const;
export const js = ${JSON.stringify(js)} as const;
export const css = ${JSON.stringify(css)} as const;`;

writeFileSync('src/converters-from-hdf/html/embedded-assets.ts', out, 'utf8');

console.log('Successfully generated the embedded assets file');
