#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {FromHDFToHTMLMapper, FileExportTypes} from '../index';

const TYPES: Record<string, FileExportTypes> = {
  admin: FileExportTypes.Administrator,
  administrator: FileExportTypes.Administrator,
  manager: FileExportTypes.Manager,
  executive: FileExportTypes.Executive
};

function usage() {
  console.log(`Usage: npx tsx scripts/build-html-report.ts --type <type> --files <file...> [--output <path>]

Options:
  --type      Report type: admin, manager, executive (required)
  --files     One or more HDF JSON file paths (required)
  --output    Output HTML file path (default: report.html)
  --help      Show this help message

Examples:
  npx tsx scripts/build-html-report.ts --type admin --files rhel7.json
  npx tsx scripts/build-html-report.ts --type admin --files rhel7.json sonarqube.json --output multi.html
  npx tsx scripts/build-html-report.ts --type executive --files rhel7.json --output exec-report.html`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    usage();
    process.exit(0);
  }

  const typeIdx = args.indexOf('--type');
  const filesIdx = args.indexOf('--files');
  const outputIdx = args.indexOf('--output');

  if (typeIdx === -1 || filesIdx === -1) {
    console.error('Error: --type and --files are required');
    usage();
    process.exit(1);
  }

  const typeStr = args[typeIdx + 1]?.toLowerCase();
  if (!typeStr || !TYPES[typeStr]) {
    console.error(`Error: invalid type "${typeStr}". Must be: admin, manager, executive`);
    process.exit(1);
  }
  const exportType = TYPES[typeStr];

  const files: string[] = [];
  for (let i = filesIdx + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) break;
    files.push(args[i]);
  }
  if (files.length === 0) {
    console.error('Error: at least one file path required after --files');
    process.exit(1);
  }

  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`Error: file not found: ${f}`);
      process.exit(1);
    }
  }

  const outputPath = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : 'report.html';

  const inputData = files.map((f, i) => ({
    data: fs.readFileSync(f, 'utf-8'),
    fileName: path.basename(f),
    fileID: path.basename(f, path.extname(f)).replace(/[^a-zA-Z0-9-_]/g, '-')
  }));

  console.log(`Generating ${typeStr} report from ${files.length} file(s)...`);
  const mapper = new FromHDFToHTMLMapper(inputData, exportType);
  const html = await mapper.toHTML();

  fs.writeFileSync(outputPath, html);
  console.log(`Report written to ${outputPath} (${(Buffer.byteLength(html) / 1024).toFixed(0)}KB)`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
