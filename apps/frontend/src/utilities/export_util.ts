import JSZip from 'jszip';
import {saveAs} from 'file-saver';

interface ExportFile {
  filename: string;
  data: ArrayBuffer | Uint8Array | Blob | string;
}
export async function saveSingleOrMultipleFiles(
  files: ExportFile[],
  filetype: string
) {
  if (files.length === 1) {
    const d = files[0].data;
    const part: BlobPart =
      d instanceof Uint8Array
        ? (d.buffer.slice(
            d.byteOffset,
            d.byteOffset + d.byteLength
          ) as ArrayBuffer)
        : (d);
    const blob = new Blob([part]);
    saveAs(blob, cleanUpFilename(files[0]?.filename));
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
         
        console.warn(`Unsupported file type for ${file.filename}`);
        continue;
      }

      zip.file(file.filename, binaryData);
    }

    const content = await zip.generateAsync({type: 'blob'});
    saveAs(content, `exported_${filetype}s.zip`);
  }
}

export function cleanUpFilename(filename: string): string {
  return filename.replaceAll(/\s+/gv, '_');
}

/** Converts a string to an array buffer */
export function s2ab(s: string) {
  // Uint8Array.from maps each char to an octet without an index-write loop.
  // (NOT TextEncoder: that would emit UTF-8, changing bytes above 0x7f.)
  return Uint8Array.from(s, (ch) => ch.charCodeAt(0) & 0xff).buffer;
}
