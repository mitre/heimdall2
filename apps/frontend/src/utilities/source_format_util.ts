const FORMAT_LABELS = new Map<string, string>([
  ['asff', 'AWS Security Finding'],
  ['burp', 'Burp Suite'],
  ['checklist', 'DISA Checklist'],
  ['checkov', 'Checkov'],
  ['conveyor', 'Conveyor'],
  ['cyclonedx_sbom', 'CycloneDX SBOM'],
  ['dbProtect', 'DB Protect'],
  ['dependencyTrack', 'Dependency-Track'],
  ['fortify', 'Fortify'],
  ['gosec', 'GoSec'],
  ['grype', 'Anchore Grype'],
  ['hdf-converted', 'HDF (Converted)'],
  ['inspec-json', 'InSpec JSON'],
  ['inspec-profile', 'InSpec Profile'],
  ['ionchannel', 'Ion Channel'],
  ['jfrog', 'JFrog Xray'],
  ['msft_secure_score', 'Microsoft Secure Score'],
  ['nessus', 'Nessus'],
  ['netsparker', 'Netsparker'],
  ['neuvector', 'NeuVector'],
  ['nikto', 'Nikto'],
  ['prisma', 'Prisma Cloud'],
  ['sarif', 'SARIF'],
  ['scoutsuite', 'ScoutSuite'],
  ['snyk', 'Snyk'],
  ['sonarqube', 'SonarQube'],
  ['trufflehog', 'TruffleHog'],
  ['twistlock', 'Twistlock'],
  ['veracode', 'Veracode'],
  ['xccdf', 'XCCDF Results'],
  ['zap', 'OWASP ZAP'],
]);

const INSPEC_FORMATS = new Set(['inspec-json', 'inspec-profile']);
const STIG_FORMATS = new Set(['checklist', 'xccdf']);
const CODE_FORMATS = new Set([
  'checkov',
  'fortify',
  'gosec',
  'grype',
  'prisma',
  'sarif',
  'snyk',
  'trufflehog',
  'veracode',
]);

export function getSourceFormatColor(
  sourceFormat: string | undefined,
): string {
  if (!sourceFormat) {
    return 'formatUnknown';
  }
  if (INSPEC_FORMATS.has(sourceFormat)) {
    return 'formatInspec';
  }
  if (STIG_FORMATS.has(sourceFormat)) {
    return 'formatStig';
  }
  if (CODE_FORMATS.has(sourceFormat)) {
    return 'formatCode';
  }
  return 'formatUnknown';
}

export function getSourceFormatLabel(sourceFormat: string | undefined): string {
  if (!sourceFormat) {
    return '';
  }
  return FORMAT_LABELS.get(sourceFormat) ?? sourceFormat;
}
