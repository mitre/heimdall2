import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import csv2json from 'csv2json';

const files = [
  'aws-config-mapping.csv',
  'cwe-nist-mapping.csv',
  'nessus-plugins-nist-mapping.csv',
  'nikto-nist-mapping.csv',
  'owasp-nist-mapping.csv',
  'scoutsuite-nist-mapping.csv',
];

const pathToFiles = process.argv[2];

if (!pathToFiles) {
  throw new Error(
    `You must provide the path to a folder containing ${files.join(', ')}.`,
  );
}

const pathToOutput = process.argv[3];

if (!pathToOutput) {
  throw new Error('You must provide the path to an output folder.');
}

for (const file of files) {
  const inputPath = path.join(pathToFiles, file);
  const outputPath = path.join(pathToOutput, file.replace('.csv', '.json'));
  createReadStream(inputPath) // eslint-disable-line security/detect-non-literal-fs-filename -- CLI tool reads user-specified input files
    .pipe(csv2json())
    .pipe(
      createWriteStream(outputPath), // eslint-disable-line security/detect-non-literal-fs-filename -- CLI tool writes user-specified output files
    );
}
