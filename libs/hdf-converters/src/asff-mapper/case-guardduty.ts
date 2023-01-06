import {encode} from 'html-entities';
import _ from 'lodash';

function findingId(finding: Record<string, unknown>): string {
  return encode(
    (_.get(finding, 'GeneratorId') as string).concat(
      ' ',
      (_.get(finding, 'Id') as string).split('/').slice(-1)[0]
    )
  );
}

export function getGuardDuty(): Record<string, (...inputs: any) => any> {
  return {
    findingId
  };
}
