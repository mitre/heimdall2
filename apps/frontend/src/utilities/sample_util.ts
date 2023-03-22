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

function fetch(sample: Sample) {
  return axios
    .get(sample.path, {responseType: 'blob'})
    .then(({data}) => new File([data], sample.filename));
}

export const samples: Sample[] = [
  {
    filename: 'Sonarqube Java Heimdall_tools Sample',
    data: function () {
      return fetch(this);
    },
    path: sonarqubeJavaSamplePath
  },
  {
    filename: 'OWASP ZAP Webgoat Heimdall_tools Sample',
    data: function () {
      return fetch(this);
    },
    path: owaspZapWebgoatPath
  },
  {
    filename: 'OWASP ZAP Zero_WebAppSecurity Heimdall_tools Sample',
    data: function () {
      return fetch(this);
    },
    path: owaspZapZeroPath
  },
  {
    filename: 'Fortify Heimdall_tools Sample',
    data: function () {
      return fetch(this);
    },
    path: fortifyHToolsConvWebgoatPath
  },
  {
    filename: 'AWS S3 Permissions Check',
    data: function () {
      return fetch(this);
    },
    path: awsS3BaselinePath
  },
  {
    filename: 'AWS CIS Foundations Baseline',
    data: function () {
      return fetch(this);
    },
    path: cisAwsFoundationsBaselinePath
  },
  {
    filename: 'NGINX Clean Sample',
    data: function () {
      return fetch(this);
    },
    path: goodNginxResultsPath
  },
  {
    filename: 'NGINX With Failing Tests',
    data: function () {
      return fetch(this);
    },
    path: badNginxPath
  },
  {
    filename: 'Red Hat CVE Vulnerability Scan',
    data: function () {
      return fetch(this);
    },
    path: rhelCveVulnerabilityScanBaselineWithFailuresPath
  },
  {
    filename: 'Red Hat 7 STIG Baseline',
    data: function () {
      return fetch(this);
    },
    path: rhel7ResultsPath
  },
  {
    filename: 'Ubuntu STIG Baseline',
    data: function () {
      return fetch(this);
    },
    path: ubuntu1604BaselineResultsPath
  },
  {
    filename: 'Red Hat With Failing Tests',
    data: function () {
      return fetch(this);
    },
    path: redhatBadPath
  },
  {
    filename: 'Three Layer RHEL7 Overlay Example',
    data: function () {
      return fetch(this);
    },
    path: threeOverlayProfilePath
  },
  {
    filename: 'Acme Overlay Example',
    data: function () {
      return fetch(this);
    },
    path: acmeOverlayPath
  },
  {
    filename: 'Clean RHEL 8 Checklist',
    data: function () {
      return fetch(this);
    },
    path: cleanRhel8ChecklistPath
  },
  {
    filename: 'RHEL 8 Checklist',
    data: function () {
      return fetch(this);
    },
    path: rhel8ChecklistPath
  },
  {
    filename: 'Three Stig Checklist',
    data: function () {
      return fetch(this);
    },
    path: threeStigChecklistPath
  }
];
