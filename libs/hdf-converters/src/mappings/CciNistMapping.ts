import {XMLParser} from 'fast-xml-parser';
import _ from 'lodash';
import {CCI_List} from '../utils/CCI_List';
import {CCI_TO_NIST} from './CciNistMappingData';
import {CciNistMappingItem} from './CciNistMappingItem';

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
    const alwaysArray = ['cci_item', 'reference'];
    const options = {
      ignoreAttributes: false,
      isArray: (tagName: string) => {
        if (alwaysArray.includes(tagName)) {
          return true;
        } else {
          return false;
        }
      }
    };
    const parser = new XMLParser(options);
    this.data = parser.parse(CCI_List);
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

  private findMatchingCciIdsByNistControl(pattern: string): string[] {
    const matchingIds: string[] = [];

    const {cci_item} = this.data.cci_list.cci_items;

    for (const item of cci_item) {
      for (const reference of item.references.reference) {
        // first try the pattern as is
        const regexPattern = new RegExp(`^${pattern}`);
        if (
          RegExp(regexPattern).exec(reference['@_index']) &&
          item.type === 'technical'
        ) {
          matchingIds.push(item['@_id']);
          break;
        }
        // if there were no matches using the original pattern, try using only 2 letters hyphen followed by one or two numbers
        if (matchingIds.length === 0) {
          const regexEditedPattern = new RegExp(
            `${/\w\w-\d\d?\d?/g.exec(pattern)}`
          );
          if (
            RegExp(regexEditedPattern).exec(reference['@_index']) &&
            item.type === 'technical'
          ) {
            matchingIds.push(item['@_id']);
            break;
          }
        }
      }
    }

    return matchingIds;
  }
}

export class CciNistMapping {
  data: CciNistMappingItem[];

  constructor() {
    this.data = [];

    if (typeof CCI_TO_NIST === 'object') {
      Object.entries(CCI_TO_NIST).forEach((item) => {
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
          if (matches.indexOf(item.nistId) === -1) {
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
