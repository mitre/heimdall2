import concat from 'concat-stream';
import {saveAs} from 'file-saver';
import {ZipFile} from 'yazl';

type File = {
  filename: string;
  data: string;
};
export async function saveSingleOrMultipleFiles(
  files: File[],
  filetype: string
) {
  if (files.length === 1) {
    const blob = new Blob([files[0].data]);
    saveAs(blob, cleanUpFilename(`${files[0]?.filename}`));
  } else {
    const zipfile = new ZipFile();
    files.forEach((file) => {
      const buffer = Buffer.from(file.data);
      zipfile.addBuffer(buffer, file.filename);
    });
    zipfile.outputStream.pipe(
      concat({encoding: 'uint8array'}, (b: Uint8Array) => {
        saveAs(new Blob([b]), `exported_${filetype}s.zip`);
      })
    );
    zipfile.end();
  }
}

export function cleanUpFilename(filename: string): string {
  return filename.replace(/\s+/g, '_');
}

/** Converts a string to an array buffer */
export function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  const view = new Uint8Array(buf); //create uint8array as viewer
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff; //convert to octet
  }
  return buf;
}
