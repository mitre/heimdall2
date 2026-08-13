import {data} from './NiktoNistMappingData';

export interface INIKJSONID {
  'NIKTO-ID': number;
  'PLUGIN-CATEGORY': string;
  'NIST-ID': string;
  OSVDB: number;
}
const DEFAULT_NIST_TAG = ['AC-3', 'SA-11', 'RA-5'];

// Map view over the generated table: the id arrives from the scan file, and
// the old `id in data` guard consulted the PROTOTYPE chain — 'constructor'
// passed it, and bracket access then returned a function as the NIST tag.
// Map.get answers undefined for unknown and prototype keys alike.
const NIKTO_NIST_MAPPING = new Map(
  Object.entries(data as Record<string, string>),
);

export class NiktoNistMapping {
  nistTag(id: string): string[] {
    if (id === '' || id === undefined) {
      return DEFAULT_NIST_TAG;
    }
    const tag = NIKTO_NIST_MAPPING.get(id);
    return tag === undefined ? DEFAULT_NIST_TAG : [tag];
  }
}
