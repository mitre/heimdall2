import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import {AwsConfigMappingItem} from './AwsConfigMappingItem';

export class AwsConfigMapping {
  data: AwsConfigMappingItem[];

  constructor(csvDataPath: string) {
    this.data = [];
    const contents = parse(fs.readFileSync(csvDataPath, {encoding: 'utf-8'}), {
      skip_empty_lines: true
    });
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
        this.data.push(new AwsConfigMappingItem(line));
      });
    }
  }
  nistFilter(identifiers: string[]) {
    if (identifiers.length === 0) {
      return null;
    } else {
      let matches = new Array<string>();
      identifiers.forEach((sourceIdentifier) => {
        const item = this.data.find(
          (element) => element.configRuleSourceIdentifier === sourceIdentifier
        );
        if (
          item !== null &&
          item !== undefined &&
          item.nistId !== '' &&
          matches.indexOf(item.nistId) === -1
        ) {
          matches = matches.concat(item.nistId.split('|'));
        }
      });
      if (matches.length === 0) {
        return null;
      }
      return matches;
    }
  }
}
