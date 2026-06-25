import { XMLParser } from 'fast-xml-parser';
import _ from 'lodash';
import { CCI_List } from '../utils/cci_list';
import { data } from './CciNistMappingData';
import { CciNistMappingItem } from './CciNistMappingItem';

const NIST_FAMILY_NUM_RE = /\w{2}-\d{1,3}/v;

type CciItem = {
  '@_id': string;
  contributor: string;
  definition: string;
  publishdate: string;
  references: { reference: Reference[] };
  status: string;
  type: string;
};

type CciItems = { cci_item: CciItem[] };
type CciList = {
  cci_items: CciItems;
  metadata: Metadata;
};

type CciNistData = {
  '?xml': {
    '@_encoding': string;
    '@_version': string;
  };
  '?xml-stylesheet': {
    '@_href': string;
    '@_type': string;
  };
  cci_list: CciList;
};

type Metadata = {
  publishdate: string;
  version: string;
};

type Reference = {
  '@_creator': string;
  '@_index': string;
  '@_location': string;
  '@_title': string;
  '@_version': string;
};

export class CciNistMapping {
  data: CciNistMappingItem[];

  constructor() {
    this.data = [];

    if (typeof data === 'object') {
      for (const item of Object.entries(data)) {
        this.data.push(new CciNistMappingItem(item[0], item[1]));
      }
    }
  }

  nistFilter(
    identifiers: string[],
    defaultNist: string[],
    shouldCollapse = true,
  ): string[] {
    const DEFAULT_NIST_TAG = defaultNist;
    const matches: string[] = [];
    for (const id of identifiers) {
      const item = this.data.find(element => element.cci === id);
      if (item?.nistId) {
        if (shouldCollapse) {
          if (!matches.includes(item.nistId)) {
            matches.push(item.nistId);
          }
        } else {
          matches.push(item.nistId);
        }
      }
    }
    if (matches.length === 0) {
      return DEFAULT_NIST_TAG;
    }
    return matches;
  }
}

export class CciNistTwoWayMapper {
  data: CciNistData;

  constructor() {
    const alwaysArray = new Set(['cci_item', 'reference']);
    const options = {
      ignoreAttributes: false,
      isArray: (tagName: string) => {
        return alwaysArray.has(tagName) ? true : false;
      },
    };
    const parser = new XMLParser(options);
    this.data = parser.parse(CCI_List);
  }

  private findHighestVersionNistControlByCci(targetId: string): null | string {
    let highestVersionControl: null | string = null;
    let highestVersion = -1;

    const { cci_item } = this.data.cci_list.cci_items;
    const targetItem = cci_item.find(item => item['@_id'] === targetId);

    if (targetItem) {
      for (const reference of targetItem.references.reference) {
        const version = Number(reference['@_version']);
        if (version > highestVersion) {
          highestVersion = version;
          highestVersionControl = reference['@_index'];
        }
      }
    }
    return highestVersionControl;
  }

  private findMatchingCciIdsByNistControl(pattern: string): string[] {
    const matchingIds: string[] = [];

    const { cci_item } = this.data.cci_list.cci_items;

    const regexPattern = new RegExp(`^${pattern}`); // eslint-disable-line security/detect-non-literal-regexp -- pattern is internal NIST control ID
    const editedPattern = NIST_FAMILY_NUM_RE.exec(pattern);
    const regexEditedPattern = editedPattern ? new RegExp(String(editedPattern)) : null; // eslint-disable-line security/detect-non-literal-regexp -- derived from internal NIST pattern
    for (const item of cci_item) {
      if (item.type !== 'technical') {
        continue;
      }
      const isMatch = item.references.reference.some(
        reference =>
          regexPattern.test(reference['@_index'])
          || (matchingIds.length === 0
            && regexEditedPattern?.test(reference['@_index'])),
      );
      if (isMatch) {
        matchingIds.push(item['@_id']);
      }
    }

    return matchingIds;
  }

  cciFilter(identifiers: string[], defaultCci: string[]): string[] {
    const matches: string[] = [];
    for (const id of identifiers) {
      matches.push(...this.findMatchingCciIdsByNistControl(id));
    }
    return matches ?? defaultCci;
  }

  nistFilter(
    identifiers: string[],
    defaultNist: string[],
    shouldCollapse = true,
  ): string[] {
    const DEFAULT_NIST_TAGS = defaultNist;
    let matches: string[] = [];
    for (const id of identifiers) {
      const nistRef = this.findHighestVersionNistControlByCci(id);
      if (nistRef) {
        matches.push(nistRef);
      }
    }
    if (shouldCollapse) {
      matches = _.uniq(matches);
    }
    return matches ?? DEFAULT_NIST_TAGS;
  }
}
