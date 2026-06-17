import { saveAs } from 'file-saver';
import JSZip from 'jszip';

type ExportFile = {
  data: ArrayBuffer | Blob | string | Uint8Array;
  filename: string;
};
export function cleanUpFilename(
  filename: string,
  targetExtension?: string,
): string {
  let cleaned = filename.replaceAll(/[\s:]+/gv, '_');

  if (targetExtension) {
    const extPattern = new RegExp(
      `${targetExtension.replace('.', String.raw`\.`)}$`,
      'i',
    );
    cleaned = cleaned.replace(extPattern, '');
    cleaned = cleaned + targetExtension;
  }

  return cleaned;
}

/** Converts a string to an array buffer */
export function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length); // convert s to arrayBuffer
  const view = new Uint8Array(buf); // create uint8array as viewer
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF; // convert to octet
  }
  return buf;
}

export async function saveSingleOrMultipleFiles(
  files: ExportFile[],
  filetype: string,
) {
  if (files.length === 1) {
    const d = files[0].data;
    const part: BlobPart
      = d instanceof Uint8Array
        ? (d.buffer.slice(
          d.byteOffset,
          d.byteOffset + d.byteLength,
        ) as ArrayBuffer)
        : (d);
    const blob = new Blob([part]);
    saveAs(blob, cleanUpFilename(`${files[0]?.filename}`));
  } else {
    const zip = new JSZip();

    for (const file of files) {
      let binaryData: ArrayBuffer | Uint8Array;

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

    // eslint-disable-next-line prettier/prettier
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `exported_${filetype}s.zip`);
  }
}
