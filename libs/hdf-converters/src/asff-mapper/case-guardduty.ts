import {encode} from 'html-entities';
import _ from 'lodash';

function findingId(finding: Record<string, unknown>): string {
  return encode(
    (_.get(finding, 'GeneratorId') as string).concat(
      ' ',
      _.get(finding, 'Title') as string
    )
  );
}
//ghost
export function getGuardDuty(): Record<string, (...inputs: any) => any> {
  return {
    findingId
  };
}
