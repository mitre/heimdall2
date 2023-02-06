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

import axios from 'axios';

export interface Sample {
  filename: string;
  data: Function;
  path: string;
}

function fetch(sample: string) {
  return axios.get(sample).then(({data}) => data);
}

export const samples: Sample[] = [
  {
    filename: 'Sonarqube Java Heimdall_tools Sample',
    data: () => fetch(sonarqubeJavaSamplePath),
    path: sonarqubeJavaSamplePath
  },
  {
    filename: 'OWASP ZAP Webgoat Heimdall_tools Sample',
    data: () => fetch(owaspZapWebgoatPath),
    path: owaspZapWebgoatPath
  },
  {
    filename: 'OWASP ZAP Zero_WebAppSecurity Heimdall_tools Sample',
    data: () => fetch(owaspZapZeroPath),
    path: owaspZapZeroPath
  },
  {
    filename: 'Fortify Heimdall_tools Sample',
    data: () => fetch(fortifyHToolsConvWebgoatPath),
    path: fortifyHToolsConvWebgoatPath
  },
  {
    filename: 'AWS S3 Permissions Check',
    data: () => fetch(awsS3BaselinePath),
    path: awsS3BaselinePath
  },
  {
    filename: 'AWS CIS Foundations Baseline',
    data: () => fetch(cisAwsFoundationsBaselinePath),
    path: cisAwsFoundationsBaselinePath
  },
  {
    filename: 'NGINX Clean Sample',
    data: () => fetch(goodNginxResultsPath),
    path: goodNginxResultsPath
  },
  {
    filename: 'NGINX With Failing Tests',
    data: () => fetch(badNginxPath),
    path: badNginxPath
  },
  {
    filename: 'Red Hat CVE Vulnerability Scan',
    data: () => fetch(rhelCveVulnerabilityScanBaselineWithFailuresPath),
    path: rhelCveVulnerabilityScanBaselineWithFailuresPath
  },
  {
    filename: 'Red Hat 7 STIG Baseline',
    data: () => fetch(rhel7ResultsPath),
    path: rhel7ResultsPath
  },
  {
    filename: 'Ubuntu STIG Baseline',
    data: () => fetch(ubuntu1604BaselineResultsPath),
    path: ubuntu1604BaselineResultsPath
  },
  {
    filename: 'Red Hat With Failing Tests',
    data: () => fetch(redhatBadPath),
    path: redhatBadPath
  },
  {
    filename: 'Three Layer RHEL7 Overlay Example',
    data: () => fetch(threeOverlayProfilePath),
    path: threeOverlayProfilePath
  },
  {
    filename: 'Acme Overlay Example',
    data: () => fetch(acmeOverlayPath),
    path: acmeOverlayPath
  },
  {
    filename: 'Clean RHEL 8 Checklist',
    data: () => fetch(cleanRhel8ChecklistPath),
    path: cleanRhel8ChecklistPath
  },
  {
    filename: 'RHEL 8 Checklist',
    data: () => fetch(rhel8ChecklistPath),
    path: rhel8ChecklistPath
  },
  {
    filename: 'Three Stig Checklist',
    data: () => fetch(threeStigChecklistPath),
    path: threeStigChecklistPath
  }
];
