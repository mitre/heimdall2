import { data } from './NiktoNistMappingData';

export type INIKJSONID = {
  'NIKTO-ID': number;
  'NIST-ID': string;
  OSVDB: number;
  'PLUGIN-CATEGORY': string;
};
const DEFAULT_NIST_TAG = ['AC-3', 'SA-11', 'RA-5'];

export class NiktoNistMapping {
  nistTag(id: string): string[] {
    if (id === '' || id === undefined) {
      return DEFAULT_NIST_TAG;
    }
    return id in data ? [(data as Record<string, string>)[id]] : DEFAULT_NIST_TAG;
  }
}
