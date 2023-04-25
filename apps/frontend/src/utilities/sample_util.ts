const awsS3BaselinePath = '/static/samples/aws-s3-baseline.json';
const badNginxPath = '/static/samples/bad_nginx.json';
const cisAwsFoundationsBaselinePath =
  '/static/samples/cis-aws-foundations-baseline.json';
const fortifyHToolsConvWebgoatPath =
  '/static/samples/fortify_h_tools_conv_webgoat.json';
const goodNginxResultsPath = '/static/samples/good_nginxresults.json';
const owaspZapWebgoatPath = '/static/samples/owasp_zap_webgoat.json';
const owaspZapZeroPath = '/static/samples/owasp_zap_zero.webappsecurity.json';
const redhatBadPath = '/static/samples/red_hat_bad.json';
const rhel7ResultsPath = '/static/samples/rhel7-results.json';
const rhelCveVulnerabilityScanBaselineWithFailuresPath =
  '/static/samples/rhel_cve_vulnerability_scan_baseline_with_failures.json';
const sonarqubeJavaSamplePath = '/static/samples/sonarqube_java_sample.json';
const threeOverlayProfilePath = '/static/samples/example-3-layer-overlay.json';
const ubuntu1604BaselineResultsPath =
  '/static/samples/ubuntu-16.04-baseline-results.json';
const acmeOverlayPath = '/static/samples/wrapper-acme-run.json';
const cleanRhel8ChecklistPath = '/static/samples/clean_rhel_8_checklist.ckl';
const rhel8ChecklistPath = '/static/samples/rhel_8_checklist.ckl';
const threeStigChecklistPath = '/static/samples/three_stig_checklist.ckl';
const ubuntuProfile = '/static/samples/ubunutu_profile.json';
const veracodeExecJson = '/static/samples/veracode.xml';

import axios from 'axios';

export interface Sample {
  filename: string;
  path: string;
  fingerprint: string;
}

export function fetchSample(sample: Sample): Promise<File> {
  return axios
    .get(sample.path, {responseType: 'blob'})
    .then(({data}) => new File([data], sample.filename));
}

export const samples: Sample[] = [
  {
    filename: 'Sonarqube Java Heimdall_tools Sample',
    path: sonarqubeJavaSamplePath,
    fingerprint: "HDF"
  },
  {
    filename: 'OWASP ZAP Webgoat Heimdall_tools Sample',
    path: owaspZapWebgoatPath,
    fingerprint: "HDF"
  },
  {
    filename: 'OWASP ZAP Zero_WebAppSecurity Heimdall_tools Sample',
    path: owaspZapZeroPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Fortify Heimdall_tools Sample',
    path: fortifyHToolsConvWebgoatPath,
    fingerprint: "HDF"
  },
  {
    filename: 'AWS S3 Permissions Check',
    path: awsS3BaselinePath,
    fingerprint: "HDF"
  },
  {
    filename: 'AWS CIS Foundations Baseline',
    path: cisAwsFoundationsBaselinePath,
    fingerprint: "HDF"
  },
  {
    filename: 'NGINX Clean Sample',
    path: goodNginxResultsPath,
    fingerprint: "HDF"
  },
  {
    filename: 'NGINX With Failing Tests',
    path: badNginxPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Red Hat CVE Vulnerability Scan',
    path: rhelCveVulnerabilityScanBaselineWithFailuresPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Red Hat 7 STIG Baseline',
    path: rhel7ResultsPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Ubuntu STIG Baseline',
    path: ubuntu1604BaselineResultsPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Red Hat With Failing Tests',
    path: redhatBadPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Three Layer RHEL7 Overlay Example',
    path: threeOverlayProfilePath,
    fingerprint: "HDF"
  },
  {
    filename: 'Acme Overlay Example',
    path: acmeOverlayPath,
    fingerprint: "HDF"
  },
  {
    filename: 'Clean RHEL 8 Checklist',
    path: cleanRhel8ChecklistPath,
    fingerprint: "Checklist"
  },
  {
    filename: 'RHEL 8 Checklist',
    path: rhel8ChecklistPath,
    fingerprint: "Checklist"
  },
  {
    filename: 'Three Stig Checklist',
    path: threeStigChecklistPath,
    fingerprint: "Checklist"
  },
  {
    filename: 'Ubunutu Profile',
    path: ubuntuProfile,
    fingerprint: "Profile"
  },
  {
    filename: 'Veracode Exec JSON',
    path: veracodeExecJson,
    fingerprint: "VeraCode"
  }
];
