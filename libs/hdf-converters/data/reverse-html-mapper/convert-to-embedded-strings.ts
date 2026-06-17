import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const cssFile = 'node_modules/@anyblades/pico/css/pico.blades.min.css';
const cssPath = existsSync(cssFile) ? cssFile : `../../${cssFile}`;
const templatesDir = 'data/reverse-html-mapper/templates';

const css = readFileSync(cssPath, 'utf8');
const reportCss = readFileSync('data/reverse-html-mapper/report.css', 'utf8');

const templates: Record<string, string> = {};
const entries = readdirSync(templatesDir, { recursive: true }) as string[];
for (const entry of entries) {
  if (typeof entry === 'string' && entry.endsWith('.liquid')) {
    const key = entry.replace(/\.liquid$/, '');
    templates[key] = readFileSync(join(templatesDir, entry), 'utf8');
  }
}

const out = `/* AUTO-GENERATED.  DO NOT EDIT. */
export const templates: Record<string, string> = ${JSON.stringify(templates, null, 2)};
export const css = ${JSON.stringify(css)} as const;
export const reportCss = ${JSON.stringify(reportCss)} as const;`;

writeFileSync('src/converters-from-hdf/html/embedded-assets.ts', out, 'utf8');

const count = Object.keys(templates).length;
const sizeKB = Math.round(css.length / 1024);
console.log('Successfully generated embedded assets: ' + count + ' templates, ' + sizeKB + 'KB CSS');
