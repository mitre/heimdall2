import {encode} from 'html-entities';
import _ from 'lodash';

function findingId(finding: Record<string, unknown>): string {
  return encode((_.get(finding, 'Id') as string).split('/').slice(-1)[0]);
}

export function getCMSInSpec(): Record<string, (...inputs: any) => any> {
  return {
    findingId
  };
}
