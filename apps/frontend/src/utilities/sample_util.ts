import aws_s3_baseline from '../assets/samples/aws-s3-baseline.json';
import bad_nginx from '../assets/samples/bad_nginx.json';
import cis_aws_foundations_baseline from '../assets/samples/cis-aws-foundations-baseline.json';
import fortify_h_tools_conv_webgoat from '../assets/samples/fortify_h_tools_conv_webgoat.json';
import good_nginxresults from '../assets/samples/good_nginxresults.json';
import owasp_zap_webgoat from '../assets/samples/owasp_zap_webgoat.json';
import owasp_zap_zero from '../assets/samples/owasp_zap_zero.webappsecurity.json';
import red_hat_bad from '../assets/samples/red_hat_bad.json';
import red_hat_good from '../assets/samples/red_hat_good.json';
import rhel7_results from '../assets/samples/rhel7-results.json';
import rhel_cve_vulnerability_scan_baseline_with_failures from '../assets/samples/rhel_cve_vulnerability_scan_baseline_with_failures.json';
import sonarqube_java_sample from '../assets/samples/sonarqube_java_sample.json';
import triple_overlay_profile from '../assets/samples/triple_overlay_profile_example.json';
import ubuntu_1604_baseline_results from '../assets/samples/ubuntu-16.04-baseline-results.json';
import acme_overlay from '../assets/samples/wrapper-acme-run.json';

export interface Sample {
  filename: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export const samples: Sample[] = [
  {
    filename: 'Sonarqube Java Heimdall_tools Sample',
    data: sonarqube_java_sample
  },
  {
    filename: 'OWASP ZAP Webgoat Heimdall_tools Sample',
    data: owasp_zap_webgoat
  },
  {
    filename: 'OWASP ZAP Zero_WebAppSecurity Heimdall_tools Sample',
    data: owasp_zap_zero
  },
  {
    filename: 'Fortify Heimdall_tools Sample',
    data: fortify_h_tools_conv_webgoat
  },
  {
    filename: 'AWS S3 Permissions Check',
    data: aws_s3_baseline
  },
  {
    filename: 'AWS CIS Foundations Baseline',
    data: cis_aws_foundations_baseline
  },
  {
    filename: 'NGINX Clean Sample',
    data: good_nginxresults
  },
  {
    filename: 'NGINX With Failing Tests',
    data: bad_nginx
  },
  {
    filename: 'Red Hat CVE Vulnerability Scan',
    data: rhel_cve_vulnerability_scan_baseline_with_failures
  },
  {
    filename: 'Red Hat 7 STIG Baseline',
    data: rhel7_results
  },
  {
    filename: 'Ubuntu STIG Baseline',
    data: ubuntu_1604_baseline_results
  },
  {
    filename: 'Red Hat With Failing Tests',
    data: red_hat_bad
  },
  {
    filename: 'Red Hat Clean Sample',
    data: red_hat_good
  },
  {
    filename: 'Triple Overlay Example',
    data: triple_overlay_profile
  },
  {
    filename: 'Acme Overlay Example',
    data: acme_overlay
  }
];
