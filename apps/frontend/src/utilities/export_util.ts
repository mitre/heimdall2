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
    const blob = new Blob([files[0].data], {
      type: 'application/csv'
    });
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
