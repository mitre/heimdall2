import * as _ from 'lodash';

export enum INPUT_TYPES {
  ASFF = 'asff',
  BURP = 'burp',
  CHECKLIST = 'checklist',
  CONVEYOR = 'conveyor',
  DEPENDENCY_TRACK = 'dependencyTrack',
  FORTIFY = 'fortify',
  GOSEC = 'gosec',
  GRYPE = 'grype',
  IONCHANNEL = 'ionchannel',
  JFROG = 'jfrog',
  MSFT_SEC_SCORE = 'msft_secure_score',
  NIKTO = 'nikto',
  SARIF = 'sarif',
  CYCLONEDX_SBOM = 'cyclonedx_sbom',
  SNYK = 'snyk',
  TRUFFLEHOG = 'trufflehog',
  TWISTLOCK = 'twistlock',
  ZAP = 'zap',
  NESSUS = 'nessus',
  NEUVECTOR = 'neuvector',
  XCCDF = 'xccdf',
  NETSPARKER = 'netsparker',
  SCOUTSUITE = 'scoutsuite',
  DB_PROTECT = 'dbProtect',
  PRISMA = 'prisma',
  VERACODE = 'veracode',
  NOT_FOUND = ''
}

// Fields to look for inside of JSON structures to determine type before passing to hdf-converters
const fileTypeFingerprints: Record<INPUT_TYPES, string[]> = {
  [INPUT_TYPES.ASFF]: ['Findings', 'AwsAccountId', 'ProductArn'],
  [INPUT_TYPES.CONVEYOR]: ['api_error_message', 'api_response'],
  [INPUT_TYPES.CYCLONEDX_SBOM]: ['bomFormat', 'metadata', 'specVersion'],
  [INPUT_TYPES.DEPENDENCY_TRACK]: ['version', 'meta', 'project', 'findings'],
  [INPUT_TYPES.FORTIFY]: ['FVDL', 'FVDL.EngineData.EngineVersion', 'FVDL.UUID'],
  [INPUT_TYPES.GOSEC]: ['Golang errors', 'Issues'],
  [INPUT_TYPES.GRYPE]: [
    'matches.vulnerability',
    'matches.relatedVulnerabilities',
    'matches.matchDetails',
    'matches.artifact',
    'distro',
    'descriptor'
  ],
  [INPUT_TYPES.IONCHANNEL]: [
    'analysis_id',
    'team_id',
    'source',
    'trigger_hash'
  ],
  [INPUT_TYPES.JFROG]: ['total_count', 'data'],
  [INPUT_TYPES.MSFT_SEC_SCORE]: ['secureScore', 'profiles'],
  [INPUT_TYPES.NEUVECTOR]: [
    'report.base_os',
    'report.cvedb_create_time',
    'report.cvedb_version',
    'report.modules',
    'report.repository',
    'report.signature_data',
    'report.vulnerabilities'
  ],
  [INPUT_TYPES.NIKTO]: ['banner', 'host', 'ip', 'port', 'vulnerabilities'],
  [INPUT_TYPES.SARIF]: ['$schema', 'version', 'runs'],
  [INPUT_TYPES.SNYK]: [
    'projectName',
    'policy',
    'summary',
    'vulnerabilities',
    'vulnerabilities[0].identifiers'
  ],
  [INPUT_TYPES.TRUFFLEHOG]: [
    'SourceName',
    'DetectorType',
    'DetectorName',
    'DecoderName'
  ],
  [INPUT_TYPES.TWISTLOCK]: [
    'results[0].complianceDistribution',
    'results[0].vulnerabilityDistribution',
    'results[0].collections',
    'results[0].digest',
    'packages',
    'complianceDistribution',
    'vulnerabilityDistribution'
  ],
  [INPUT_TYPES.ZAP]: ['@generated', '@version', 'site'],

  [INPUT_TYPES.BURP]: [],
  [INPUT_TYPES.CHECKLIST]: [],
  [INPUT_TYPES.DB_PROTECT]: [],
  [INPUT_TYPES.NESSUS]: [],
  [INPUT_TYPES.NETSPARKER]: [],
  [INPUT_TYPES.PRISMA]: [],
  [INPUT_TYPES.SCOUTSUITE]: [],
  [INPUT_TYPES.VERACODE]: [],
  [INPUT_TYPES.XCCDF]: [],
  [INPUT_TYPES.NOT_FOUND]: []
};

export function fingerprint(guessOptions: {
  data: string;
  filename: string;
}): INPUT_TYPES {
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
    ) as unknown as INPUT_TYPES[] & {count: number};
    const result = fingerprinted[0];
    if (fingerprinted.count !== 0) {
      return result;
    }
  } catch {
    const splitLines = guessOptions.data.trim().split('\n');
    // If we don't have valid json, look for known strings inside the file text
    if (guessOptions.filename.toLowerCase().endsWith('.nessus')) {
      return INPUT_TYPES.NESSUS;
    } else if (
      guessOptions.data.match(/xmlns.*http.*\/xccdf/) || // Keys matching (hopefully) all xccdf formats
      guessOptions.filename.toLowerCase().indexOf('xccdf') !== -1
    ) {
      return INPUT_TYPES.XCCDF;
    } else if (
      guessOptions.data.match(/<netsparker-.*generated.*>/) ||
      guessOptions.data.match(/<invicti-.*generated.*>/)
    ) {
      return INPUT_TYPES.NETSPARKER;
    } else if (guessOptions.filename.toLowerCase().endsWith('.fvdl')) {
      return INPUT_TYPES.FORTIFY;
    } else if (
      guessOptions.data.indexOf('"AwsAccountId"') !== -1 &&
      guessOptions.data.indexOf('"SchemaVersion"') !== -1
    ) {
      return INPUT_TYPES.ASFF;
    } else if (guessOptions.data.indexOf('issues burpVersion') !== -1) {
      return INPUT_TYPES.BURP;
    } else if (guessOptions.data.indexOf('scoutsuite_results') !== -1) {
      return INPUT_TYPES.SCOUTSUITE;
    } else if (
      guessOptions.data.indexOf('Policy') !== -1 &&
      guessOptions.data.indexOf('Job Name') !== -1 &&
      guessOptions.data.indexOf('Check ID') !== -1 &&
      guessOptions.data.indexOf('Result Status')
    ) {
      return INPUT_TYPES.DB_PROTECT;
    } else if (
      splitLines[0].includes('Hostname') &&
      splitLines[0].includes('Distro') &&
      splitLines[0].includes('CVE ID') &&
      splitLines[0].includes('Compliance ID') &&
      splitLines[0].includes('Type') &&
      splitLines[0].includes('Severity')
    ) {
      return INPUT_TYPES.PRISMA;
    } else if (
      splitLines[0].includes('SourceName') &&
      splitLines[0].includes('DetectorType') &&
      splitLines[0].includes('DetectorName') &&
      splitLines[0].includes('DecoderName')
    ) {
      return INPUT_TYPES.TRUFFLEHOG;
    } else if (
      guessOptions.data.indexOf('veracode') !== -1 &&
      guessOptions.data.indexOf('detailedreport') !== -1
    ) {
      return INPUT_TYPES.VERACODE;
    } else if (
      guessOptions.data.indexOf('<CHECKLIST>') !== -1 &&
      guessOptions.data.indexOf('<STIGS>') !== -1 &&
      guessOptions.data.indexOf('<STIG_INFO>') !== -1
    ) {
      return INPUT_TYPES.CHECKLIST;
    }
  }
  return INPUT_TYPES.NOT_FOUND;
}
