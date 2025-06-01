import ZipFile from 'adm-zip';
import {saveAs} from 'file-saver';

type File = {
  filename: string;
  data: string;
};
export async function saveSingleOrMultipleFiles(
  files: File[],
  filetype: string,
  insertBOM: boolean = false
) {
  if (files.length === 1) {
    let blob: Blob;
    // Insert BOM to force UTF-8 encoding
    if (insertBOM) {
      blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), files[0].data]);
    } else {
      blob = new Blob([files[0].data]);
    }
    saveAs(blob, cleanUpFilename(`${files[0]?.filename}`));
  } else {
    const zipfile = new ZipFile();
    files.forEach((file) => {
      let buffer: Buffer;
      // Insert BOM to force UTF-8 encoding
      if (insertBOM) {
        buffer = Buffer.concat([
          Buffer.from(new Uint8Array([0xef, 0xbb, 0xbf])),
          Buffer.from(file.data)
        ]);
      } else {
        buffer = Buffer.from(file.data);
      }
      zipfile.addFile(file.filename, buffer);
    });
    const blob = new Blob([zipfile.toBuffer()]);
    saveAs(blob, `exported_${filetype}s.zip`);
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
