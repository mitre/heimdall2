import {data} from './OwaspNistMappingData';
import * as _ from 'lodash';
import {OwaspNistMappingItem} from './OwaspNistMappingItem';

export interface IOWASPJSONID {
  'OWASP-ID': string;
  'OWASP Name': string;
  'NIST-ID': string;
  Rev: number;
  'NIST Name': string;
}

export class OwaspNistMapping {
  data: OwaspNistMappingItem[];

  constructor() {
    this.data = data.map(
      (line: IOWASPJSONID) => new OwaspNistMappingItem(line)
    );
  }

  nistFilterNoDefault(identifiers: string | string[]): string[] {
    const ids: string[] = Array.isArray(identifiers)
      ? identifiers
      : [identifiers];

    return _.uniq(
      _.compact(
        ids.map((id) => this.data.find((element) => element.id === id)?.nistId)
      )
    );
  }
}
