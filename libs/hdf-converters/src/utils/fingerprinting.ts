import _ from 'lodash';

// Fields to look for inside of JSON structures to determine type before passing to hdf-converters
const fileTypeFingerprints = {
  asff: ['Findings', 'AwsAccountId', 'ProductArn'],
  fortify: ['FVDL', 'FVDL.EngineData.EngineVersion', 'FVDL.UUID'],
  ionchannel: ['analysis_id', 'team_id', 'source', 'trigger_hash'],
  jfrog: ['total_count', 'data'],
  nikto: ['banner', 'host', 'ip', 'port', 'vulnerabilities'],
  sarif: ['$schema', 'version', 'runs'],
  snyk: [
    'projectName',
    'policy',
    'summary',
    'vulnerabilities',
    'vulnerabilities[0].identifiers'
  ],
  twistlock: [
    'results[0].complianceDistribution',
    'results[0].vulnerabilityDistribution',
    'results[0].collections',
    'results[0].digest'
  ],
  zap: ['@generated', '@version', 'site']
};

export function fingerprint(guessOptions: {
  data: string;
  filename: string;
}): string {
  try {
    const parsed = JSON.parse(guessOptions.data);
    const object = Array.isArray(parsed) ? parsed[0] : parsed;
    // Find the fingerprints that have the most matches
    const fingerprinted = Object.entries(fileTypeFingerprints).reduce(
      (a, b) => {
        return a[1].filter((value) => _.get(object, value)).length >
          b[1].filter((value) => _.get(object, value)).length
          ? {...a, count: a[1].filter((value) => _.get(object, value)).length}
          : {
              ...b,
              count: b[1].filter((value) => _.get(object, value)).length
            };
      }
    ) as unknown as string[] & {count: number};
    const result = fingerprinted[0];
    if (fingerprinted.count !== 0) {
      return result;
    }
  } catch {
    const splitLines = guessOptions.data.trim().split('\n');
    // If we don't have valid json, look for known strings inside the file text
    if (guessOptions.filename.toLowerCase().endsWith('.nessus')) {
      return 'nessus';
    } else if (
      guessOptions.data.match(/xmlns.*http.*\/xccdf/) || // Keys matching (hopefully) all xccdf formats
      guessOptions.filename.toLowerCase().indexOf('xccdf') !== -1
    ) {
      return 'xccdf';
    } else if (guessOptions.data.match(/<netsparker-.*generated.*>/)) {
      return 'netsparker';
    } else if (
      guessOptions.data.indexOf('"AwsAccountId"') !== -1 &&
      guessOptions.data.indexOf('"SchemaVersion"') !== -1
    ) {
      return 'asff';
    } else if (guessOptions.data.indexOf('issues burpVersion') !== -1) {
      return 'burp';
    } else if (guessOptions.data.indexOf('scoutsuite_results') !== -1) {
      return 'scoutsuite';
    } else if (
      guessOptions.data.indexOf('Policy') !== -1 &&
      guessOptions.data.indexOf('Job Name') !== -1 &&
      guessOptions.data.indexOf('Check ID') !== -1 &&
      guessOptions.data.indexOf('Result Status')
    ) {
      return 'dbProtect';
    } else if (
      splitLines[0].includes('Hostname') &&
      splitLines[0].includes('Distro') &&
      splitLines[0].includes('CVE ID') &&
      splitLines[0].includes('Compliance ID') &&
      splitLines[0].includes('Type') &&
      splitLines[0].includes('Severity')
    ) {
      return 'prisma';
    } else if (
      guessOptions.data.indexOf('veracode') !== -1 &&
      guessOptions.data.indexOf('detailedreport') !== -1
    ) {
      return 'veracode';
    }
  }
  return '';
}
