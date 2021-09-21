import csv2json from 'csv2json';
import {createReadStream, createWriteStream} from 'fs';
import path from 'path';

const files = [
  'aws-config-mapping.csv',
  'cwe-nist-mapping.csv',
  'nessus-plugins-nist-mapping.csv',
  'nikto-nist-mapping.csv',
  'owasp-nist-mapping.csv',
  'scoutsuite-nist-mapping.csv'
];

try {
  const pathToFiles = process.argv[2];
  try {
    const pathToOutput = process.argv[3];
    files.forEach((file) => {
      createReadStream(path.join(pathToFiles, file))
        .pipe(csv2json())
        .pipe(
          createWriteStream(
            path.join(pathToOutput, file.replace('.csv', '.json'))
          )
        );
    });
  } catch {
    console.error(`You must provide the path to an output folder.`);
    process.exit(1);
  }
} catch {
  console.error(
    `You must provide the path to a folder containing ${files.join(', ')}.`
  );
  process.exit(1);
}
