import { data as dataRecord } from './NiktoNistMappingData';

export type INIKJSONID = {
  'NIKTO-ID': number;
  'NIST-ID': string;
  OSVDB: number;
  'PLUGIN-CATEGORY': string;
};
const DEFAULT_NIST_TAG = ['AC-3', 'SA-11', 'RA-5'];
const dataMap = new Map(Object.entries(dataRecord));

export class NiktoNistMapping {
  nistTag(id: string): string[] {
    if (id === '' || id === undefined) {
      return DEFAULT_NIST_TAG;
    }
    const value = dataMap.get(id);
    return value ? [value] : DEFAULT_NIST_TAG;
  }
}
