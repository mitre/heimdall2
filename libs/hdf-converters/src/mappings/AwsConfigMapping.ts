import * as _ from 'lodash';
import {data as AWSConfigMappingData} from './AwsConfigMappingData';

export type AwsConfigRev = 4 | 5;

// Rev 4 stays the default so existing callers keep the tags they have today.
export const DEFAULT_AWS_CONFIG_REV: AwsConfigRev = 4;

type RevisionMappings = {
  ruleName: Record<string, string[]>;
  sourceIdentifier: Record<string, string[]>;
};

export class AwsConfigMapping {
  readonly rev: AwsConfigRev;

  // Public because callers outside this package read them; the per-revision
  // tables behind them are private.
  awsConfigRuleNameMappings: Record<string, string[]>;
  awsConfigRuleSourceIdentifierMappings: Record<string, string[]>;

  private readonly mappingsByRev: Record<AwsConfigRev, RevisionMappings>;

  constructor(rev: AwsConfigRev = DEFAULT_AWS_CONFIG_REV) {
    this.rev = rev;
    this.mappingsByRev = {
      4: {ruleName: {}, sourceIdentifier: {}},
      5: {ruleName: {}, sourceIdentifier: {}}
    };

    // Keying by revision keeps a rule's two rows from overwriting each other.
    AWSConfigMappingData.forEach((mapping) => {
      const revision = this.mappingsByRev[mapping.Rev as AwsConfigRev];
      if (revision === undefined) {
        return;
      }
      const nistTags = mapping['NIST-ID'].split('|');
      revision.ruleName[mapping.AwsConfigRuleName] = nistTags;
      revision.sourceIdentifier[mapping.AwsConfigRuleSourceIdentifier] =
        nistTags;
    });

    this.awsConfigRuleNameMappings = this.mappingsByRev[rev].ruleName;
    this.awsConfigRuleSourceIdentifierMappings =
      this.mappingsByRev[rev].sourceIdentifier;
  }

  searchNIST(identifiers: string[], rev: AwsConfigRev = this.rev): string[] {
    if (identifiers.length === 0) {
      return [];
    } else {
      const {ruleName, sourceIdentifier} = this.mappingsByRev[rev];
      let matches: string[] = [];
      Object.entries(ruleName).forEach(([awsConfigRuleName, NISTTags]) => {
        identifiers.forEach((identifier) => {
          if (identifier.toLowerCase().includes(awsConfigRuleName)) {
            matches = matches.concat(NISTTags);
          }
        });
      });

      Object.entries(sourceIdentifier).forEach(
        ([awsConfigRuleSourceIdentifier, NISTTags]) => {
          identifiers.forEach((identifier) => {
            if (
              identifier
                .toLowerCase()
                .includes(awsConfigRuleSourceIdentifier.toLowerCase())
            ) {
              matches = matches.concat(NISTTags);
            }
          });
        }
      );
      return _.uniq(matches);
    }
  }
}
