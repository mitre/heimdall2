import * as _ from 'lodash';
import { data as AWSConfigMappingData } from './AwsConfigMappingData';

export class AwsConfigMapping {
  awsConfigRuleNameMappings: Record<string, string[]> = {};
  awsConfigRuleSourceIdentifierMappings: Record<string, string[]> = {};

  constructor() {
    for (const mapping of AWSConfigMappingData) {
      this.awsConfigRuleNameMappings[mapping.AwsConfigRuleName]
        = mapping['NIST-ID'].split('|');
      this.awsConfigRuleSourceIdentifierMappings[
        mapping.AwsConfigRuleSourceIdentifier
      ] = mapping['NIST-ID'].split('|');
    }
  }

  searchNIST(identifiers: string[]): string[] {
    if (identifiers.length === 0) {
      return [];
    } else {
      let matches: string[] = [];
      for (const [awsConfigRuleName, NISTTags] of Object.entries(this.awsConfigRuleNameMappings)) {
        for (const identifier of identifiers) {
          if (
            identifier.toLowerCase().toLowerCase().includes(awsConfigRuleName)
          ) {
            matches = [...matches, ...NISTTags];
          }
        }
      }

      for (const [awsConfigRuleSourceIdentifier, NISTTags] of Object.entries(this.awsConfigRuleSourceIdentifierMappings)) {
        for (const identifier of identifiers) {
          if (
            identifier
              .toLowerCase()
              .includes(awsConfigRuleSourceIdentifier.toLowerCase())
          ) {
            matches = [...matches, ...NISTTags];
          }
        }
      }

      return _.uniq(matches);
    }
  }
}
