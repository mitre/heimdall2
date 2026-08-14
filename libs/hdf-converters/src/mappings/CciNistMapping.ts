import {XMLParser} from 'fast-xml-parser';
import _ from 'lodash';
import {CCI_List} from '../utils/cci-list';
import {data} from './CciNistMappingData';
import {CciNistMappingItem} from './CciNistMappingItem';

// two letters, hyphen, then one to three digits — the control-family prefix
// of a NIST control identifier
const CONTROL_FAMILY_PREFIX = /\w\w-\d\d?\d?/;

type Reference = {
  '@_creator': string;
  '@_title': string;
  '@_version': string;
  '@_location': string;
  '@_index': string;
};

type CciItem = {
  status: string;
  publishdate: string;
  contributor: string;
  definition: string;
  type: string;
  references: {
    reference: Reference[];
  };
  '@_id': string;
};
type CciItems = {
  cci_item: CciItem[];
};

type Metadata = {
  version: string;
  publishdate: string;
};

type CciList = {
  metadata: Metadata;
  cci_items: CciItems;
};

type CciNistData = {
  '?xml': {
    '@_version': string;
    '@_encoding': string;
  };
  '?xml-stylesheet': {
    '@_type': string;
    '@_href': string;
  };
  cci_list: CciList;
};

export class CciNistTwoWayMapper {
  data: CciNistData;

  constructor() {
    const alwaysArray = new Set(['cci_item', 'reference']);
    const options = {
      ignoreAttributes: false,
      isArray: (tagName: string) => {
        if (alwaysArray.has(tagName)) {
          return true;
        } else {
          return false;
        }
      }
    };
    const parser = new XMLParser(options);
    this.data = parser.parse(CCI_List);
  }

  private findHighestVersionNistControlByCci(targetId: string): string | null {
    let highestVersionControl: string | null = null;
    let highestVersion = -1;

    const {cci_item} = this.data.cci_list.cci_items;
    const targetItem = cci_item.find((item) => item['@_id'] === targetId);

    if (targetItem) {
      for (const reference of targetItem.references.reference) {
        const version = parseFloat(reference['@_version']);
        if (version > highestVersion) {
          highestVersion = version;
          highestVersionControl = reference['@_index'];
        }
      }
    }
    return highestVersionControl;
  }

  // Whether any of the item's references match: first the pattern as is (a
  // literal prefix match on the index), then — only while nothing has
  // matched anywhere yet — its two-letters-hyphen-digits control-family
  // prefix.
  private itemReferencesMatch(
    item: CciNistData['cci_list']['cci_items']['cci_item'][number],
    pattern: string,
    allowPrefixFallback: boolean
  ): boolean {
    for (const reference of item.references.reference) {
      if (
        reference['@_index'].startsWith(pattern) &&
        item.type === 'technical'
      ) {
        return true;
      }
      if (allowPrefixFallback) {
        const editedPattern = CONTROL_FAMILY_PREFIX.exec(pattern)?.[0];
        if (
          editedPattern !== undefined &&
          reference['@_index'].startsWith(editedPattern) &&
          item.type === 'technical'
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private findMatchingCciIdsByNistControl(pattern: string): string[] {
    const matchingIds: string[] = [];

    const {cci_item} = this.data.cci_list.cci_items;

    for (const item of cci_item) {
      if (this.itemReferencesMatch(item, pattern, matchingIds.length === 0)) {
        matchingIds.push(item['@_id']);
      }
    }

    return matchingIds;
  }

  nistFilter(
    identifiers: string[],
    defaultNist: string[],
    collapse = true
  ): string[] {
    const DEFAULT_NIST_TAGS = defaultNist;
    let matches: string[] = [];
    for (const id of identifiers) {
      const nistRef = this.findHighestVersionNistControlByCci(id);
      if (nistRef) {
        matches.push(nistRef);
      }
    }
    if (collapse) {
      matches = _.uniq(matches);
    }
    return matches ?? DEFAULT_NIST_TAGS;
  }

  cciFilter(identifiers: string[], defaultCci: string[]): string[] {
    const matches: string[] = [];
    for (const id of identifiers) {
      matches.push(...this.findMatchingCciIdsByNistControl(id));
    }
    return matches ?? defaultCci;
  }
}

export class CciNistMapping {
  data: CciNistMappingItem[];

  constructor() {
    this.data = [];

    if (typeof data === 'object') {
      Object.entries(data).forEach((item) => {
        this.data.push(new CciNistMappingItem(item[0], item[1]));
      });
    }
  }

  nistFilter(
    identifiers: string[],
    defaultNist: string[],
    collapse = true
  ): string[] {
    const DEFAULT_NIST_TAG = defaultNist;
    const matches: string[] = [];
    identifiers.forEach((id) => {
      const item = this.data.find((element) => element.cci === id);
      if (item && item.nistId) {
        if (collapse) {
          if (!matches.includes(item.nistId)) {
            matches.push(item.nistId);
          }
        } else {
          matches.push(item.nistId);
        }
      }
    });
    if (matches.length === 0) {
      return DEFAULT_NIST_TAG;
    }
    return matches;
  }
}
