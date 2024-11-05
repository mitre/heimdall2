import {Trie} from '../../data/converters/cciListXml2json';
import nistToCciData from './U_CCI_List.cci.json';

export const NIST_TO_CCI: Trie = nistToCciData;

export const data = {
  'AC-3': ['CCI-000213'],
  'AC-4': ['CCI-001368', 'CCI-001414'],
  'AC-6': ['CCI-000225'],
  'AC-7': ['CCI-000044'],
  'AC-12': ['CCI-002361'],
  'AU-12': ['CCI-000172'],
  'CM-6': ['CCI-000366'],
  'IA-5': ['CCI-001544', 'CCI-000183', 'CCI-002042'],
  'IA-8': ['CCI-000804'],
  'RA-5': ['CCI-001643'],
  'SA-11': ['CCI-003173'],
  'SC-4': ['CCI-001090'],
  'SC-8': ['CCI-002418'],
  'SC-12': ['CCI-002438'],
  'SC-13': ['CCI-002450'],
  'SC-23': ['CCI-001184'],
  'SC-28': ['CCI-001199'],
  'SI-2': ['CCI-002605'],
  'SI-10': ['CCI-001310'],
  'SI-11': ['CCI-001312'],
  'SI-16': ['CCI-002824']
} as Record<string, string[]>;
