import JSZip from 'jszip';
import {saveAs} from 'file-saver';

type File = {
  filename: string;
  data: ArrayBuffer | Uint8Array | Blob | string;
};
export async function saveSingleOrMultipleFiles(
  files: File[],
  filetype: string
) {
  if (files.length === 1) {
    const blob = new Blob([files[0].data]);
    saveAs(blob, cleanUpFilename(`${files[0]?.filename}`));
  } else {
    const zip = new JSZip();

    for (const file of files) {
      let binaryData: Uint8Array | ArrayBuffer;

      if (file.data instanceof ArrayBuffer || file.data instanceof Uint8Array) {
        binaryData = file.data;
      } else if (typeof file.data === 'string') {
        binaryData = new TextEncoder().encode(file.data); // Convert string to Uint8Array
      } else if (file.data instanceof Blob) {
        // Convert Blob to ArrayBuffer asynchronously
        binaryData = await file.data.arrayBuffer();
      } else {
        // eslint-disable-next-line no-console
        console.warn(`Unsupported file type for ${file.filename}`);
        continue;
      }

      zip.file(file.filename, binaryData);
    }

    // eslint-disable-next-line prettier/prettier
    const content = await zip.generateAsync({type: 'blob'});
    saveAs(content, `exported_${filetype}s.zip`);
  }
}

export function cleanUpFilename(filename: string): string {
  return filename.replace(/\s+/gv, '_');
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
