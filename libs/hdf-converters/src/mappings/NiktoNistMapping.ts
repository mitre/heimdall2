import {data} from './NiktoNistMappingData';

export interface INIKJSONID {
  'NIKTO-ID': number;
  'PLUGIN-CATEGORY': string;
  'NIST-ID': string;
  OSVDB: number;
}
const DEFAULT_NIST_TAG = ['AC-3', 'SA-11', 'RA-5'];

export class NiktoNistMapping {
  nistTag(id: string): string[] {
    if (id === '' || id === undefined) {
      return DEFAULT_NIST_TAG;
    } else {
      if (id in data) {
        return [(data as Record<string, string>)[id]]
      } else {
        return DEFAULT_NIST_TAG;
      }
    }
  }
}
