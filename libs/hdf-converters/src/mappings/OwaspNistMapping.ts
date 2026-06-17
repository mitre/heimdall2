import * as _ from 'lodash';
import { data } from './OwaspNistMappingData';
import { OwaspNistMappingItem } from './OwaspNistMappingItem';

export type IOWASPJSONID = {
  'NIST-ID': string;
  'NIST Name': string;
  'OWASP-ID': string;
  'OWASP Name': string;
  Rev: number;
};

export class OwaspNistMapping {
  data: OwaspNistMappingItem[];

  constructor() {
    this.data = data.map(
      (line: IOWASPJSONID) => new OwaspNistMappingItem(line),
    );
  }

  nistFilterNoDefault(identifiers: string | string[]): string[] {
    let ids: string[] = [];
    ids = Array.isArray(identifiers) ? identifiers : [identifiers];

    return _.uniq(
      _.compact(
        ids.map(id => this.data.find(element => element.id === id)?.nistId),
      ),
    );
  }
}
