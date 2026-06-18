import * as _ from 'lodash';

const XCCDF_XMLNS_RE = /xmlns.*http.*\/xccdf/v;
const NETSPARKER_RE = /<netsparker-.*generated.*>/v;
const INVICTI_RE = /<invicti-.*generated.*>/v;

export enum INPUT_TYPES {
  ASFF = 'asff',
  BURP = 'burp',
  CHECKLIST = 'checklist',
  CHECKOV = 'checkov',
  CONVEYOR = 'conveyor',
  CYCLONEDX_SBOM = 'cyclonedx_sbom',
  DB_PROTECT = 'dbProtect',
  DEPENDENCY_TRACK = 'dependencyTrack',
  FORTIFY = 'fortify',
  GOSEC = 'gosec',
  GRYPE = 'grype',
  IONCHANNEL = 'ionchannel',
  JFROG = 'jfrog',
  MSFT_SEC_SCORE = 'msft_secure_score',
  NESSUS = 'nessus',
  NETSPARKER = 'netsparker',
  NEUVECTOR = 'neuvector',
  NIKTO = 'nikto',
  NOT_FOUND = '',
  PRISMA = 'prisma',
  SARIF = 'sarif',
  SCOUTSUITE = 'scoutsuite',
  SNYK = 'snyk',
  TRUFFLEHOG = 'trufflehog',
  TWISTLOCK = 'twistlock',
  VERACODE = 'veracode',
  XCCDF = 'xccdf',
  ZAP = 'zap',
}

// Fields to look for inside of JSON structures to determine type before passing to hdf-converters
const fileTypeFingerprints: Record<INPUT_TYPES, string[]> = {
  [INPUT_TYPES.ASFF]: ['Findings', 'AwsAccountId', 'ProductArn'],
  [INPUT_TYPES.BURP]: [],
  [INPUT_TYPES.CHECKLIST]: [],
  [INPUT_TYPES.CHECKOV]: ['check_type', 'results', 'results.passed_checks',
    'results.failed_checks', 'results.skipped_checks', 'results.parsing_errors',
    'summary', 'url'],
  [INPUT_TYPES.CONVEYOR]: ['api_error_message', 'api_response'],
  [INPUT_TYPES.CYCLONEDX_SBOM]: ['bomFormat', 'metadata', 'specVersion'],
  [INPUT_TYPES.DB_PROTECT]: [],
  [INPUT_TYPES.DEPENDENCY_TRACK]: ['version', 'meta', 'project', 'findings'],
  [INPUT_TYPES.FORTIFY]: ['FVDL', 'FVDL.EngineData.EngineVersion', 'FVDL.UUID'],
  [INPUT_TYPES.GOSEC]: ['Golang errors', 'Issues'],
  [INPUT_TYPES.GRYPE]: [
    'matches.vulnerability',
    'matches.relatedVulnerabilities',
    'matches.matchDetails',
    'matches.artifact',
    'distro',
    'descriptor',
  ],
  [INPUT_TYPES.IONCHANNEL]: [
    'analysis_id',
    'team_id',
    'source',
    'trigger_hash',
  ],
  [INPUT_TYPES.JFROG]: ['total_count', 'data'],
  [INPUT_TYPES.MSFT_SEC_SCORE]: ['secureScore', 'profiles'],
  [INPUT_TYPES.NESSUS]: [],
  [INPUT_TYPES.NETSPARKER]: [],
  [INPUT_TYPES.NEUVECTOR]: [
    'report.base_os',
    'report.cvedb_create_time',
    'report.cvedb_version',
    'report.modules',
    'report.repository',
    'report.signature_data',
    'report.vulnerabilities',
  ],
  [INPUT_TYPES.NIKTO]: ['banner', 'host', 'ip', 'port', 'vulnerabilities'],

  [INPUT_TYPES.NOT_FOUND]: [],
  [INPUT_TYPES.PRISMA]: [],
  [INPUT_TYPES.SARIF]: ['$schema', 'version', 'runs'],
  [INPUT_TYPES.SCOUTSUITE]: [],
  [INPUT_TYPES.SNYK]: [
    'projectName',
    'policy',
    'summary',
    'vulnerabilities',
    'vulnerabilities[0].identifiers',
  ],
  [INPUT_TYPES.TRUFFLEHOG]: [
    'SourceName',
    'DetectorType',
    'DetectorName',
    'DecoderName',
  ],
  [INPUT_TYPES.TWISTLOCK]: [
    'results[0].complianceDistribution',
    'results[0].vulnerabilityDistribution',
    'results[0].collections',
    'results[0].digest',
    'packages',
    'complianceDistribution',
    'vulnerabilityDistribution',
  ],
  [INPUT_TYPES.VERACODE]: [],
  [INPUT_TYPES.XCCDF]: [],
  [INPUT_TYPES.ZAP]: ['@generated', '@version', 'site'],
};

export function fingerprint(guessOptions: {
  data: string;
  filename: string;
}): INPUT_TYPES {
  try {
    const parsed = JSON.parse(guessOptions.data);
    const object = Array.isArray(parsed) ? parsed[0] : parsed;
    // Find the fingerprint with the most matches
    let bestType: INPUT_TYPES = INPUT_TYPES.NOT_FOUND;
    let bestCount = 0;
    for (const [type, keys] of Object.entries(fileTypeFingerprints) as [INPUT_TYPES, string[]][]) {
      const matchCount = keys.filter(value => _.get(object, value)).length;
      if (matchCount > bestCount) {
        bestType = type;
        bestCount = matchCount;
      }
    }
    const result = bestType;
    if (bestCount !== 0) {
      return result;
    }
  } catch {
    const splitLines = guessOptions.data.trim().split('\n');
    // If we don't have valid json, look for known strings inside the file text
    if (guessOptions.filename.toLowerCase().endsWith('.nessus')) {
      return INPUT_TYPES.NESSUS;
    } else if (
      XCCDF_XMLNS_RE.test(guessOptions.data)
      || guessOptions.filename.toLowerCase().includes('xccdf')
    ) {
      return INPUT_TYPES.XCCDF;
    } else if (
      NETSPARKER_RE.test(guessOptions.data)
      || INVICTI_RE.test(guessOptions.data)
    ) {
      return INPUT_TYPES.NETSPARKER;
    } else if (guessOptions.filename.toLowerCase().endsWith('.fvdl')) {
      return INPUT_TYPES.FORTIFY;
    } else if (
      guessOptions.data.includes('"AwsAccountId"')
      && guessOptions.data.includes('"SchemaVersion"')
    ) {
      return INPUT_TYPES.ASFF;
    } else if (guessOptions.data.includes('issues burpVersion')) {
      return INPUT_TYPES.BURP;
    } else if (guessOptions.data.includes('scoutsuite_results')) {
      return INPUT_TYPES.SCOUTSUITE;
    } else if (
      guessOptions.data.includes('Policy')
      && guessOptions.data.includes('Job Name')
      && guessOptions.data.includes('Check ID')
      && guessOptions.data.indexOf('Result Status')
    ) {
      return INPUT_TYPES.DB_PROTECT;
    } else if (
      splitLines[0].includes('Hostname')
      && splitLines[0].includes('Distro')
      && splitLines[0].includes('CVE ID')
      && splitLines[0].includes('Compliance ID')
      && splitLines[0].includes('Type')
      && splitLines[0].includes('Severity')
    ) {
      return INPUT_TYPES.PRISMA;
    } else if (
      splitLines[0].includes('SourceName')
      && splitLines[0].includes('DetectorType')
      && splitLines[0].includes('DetectorName')
      && splitLines[0].includes('DecoderName')
    ) {
      return INPUT_TYPES.TRUFFLEHOG;
    } else if (
      guessOptions.data.includes('veracode')
      && guessOptions.data.includes('detailedreport')
    ) {
      return INPUT_TYPES.VERACODE;
    } else if (
      guessOptions.data.includes('<CHECKLIST>')
      && guessOptions.data.includes('<STIGS>')
      && guessOptions.data.includes('<STIG_INFO>')
    ) {
      return INPUT_TYPES.CHECKLIST;
    }
  }
  return INPUT_TYPES.NOT_FOUND;
}
