import nistToCciData from './U_CCI_List.cci.json';

export const NIST_TO_CCI: Record<string, string[]> = nistToCciData;

export const HANDCRAFTED_DEFAULT_NIST_TO_CCI = {
  'AC-7': ['CCI-000044'],
  'AU-12': ['CCI-000172'],
  'CM-6': ['CCI-000366'],
  'IA-5': ['CCI-001544', 'CCI-000183', 'CCI-002042'],
  'RA-5': ['CCI-001643'],
  'SA-11': ['CCI-003173'],
  'SI-2': ['CCI-002605'],
  'SI-11': ['CCI-001312']
} as Record<string, string[]>;
