import aws_s3_baseline from '../assets/samples/aws-s3-baseline.json';
import bad_nginx from '../assets/samples/bad_nginx.json';
import cis_aws_foundations_baseline from '../assets/samples/cis-aws-foundations-baseline.json';
import fortify_h_tools_conv_webgoat from '../assets/samples/fortify_h_tools_conv_webgoat.json';
import good_nginxresults from '../assets/samples/good_nginxresults.json';
import owasp_zap_webgoat from '../assets/samples/owasp_zap_webgoat.json';
import owasp_zap_zero from '../assets/samples/owasp_zap_zero.webappsecurity.json';
import rhel_cve_vulnerability_scan_baseline_with_failures from '../assets/samples/rhel_cve_vulnerability_scan_baseline_with_failures.json';
import rhel7_results from '../assets/samples/rhel7-results.json';
import sonarqube_java_sample from '../assets/samples/sonarqube_java_sample.json';
import ubuntu_1604_baseline_results from '../assets/samples/ubuntu-16.04-baseline-results.json';
import red_hat_bad from '../assets/samples/red_hat_bad.json';
import red_hat_good from '../assets/samples/red_hat_good.json';
import triple_overlay_profile from '../assets/samples/triple_overlay_profile_example.json';
import acme_overlay from '../assets/samples/wrapper-acme-run.json';

export interface Sample {
  name: string;
  sample: any;
}

export const samples: Sample[] = [
  {
    name: 'Sonarqube Java Heimdall_tools Sample',
    sample: sonarqube_java_sample
  },
  {
    name: 'OWASP ZAP Webgoat Heimdall_tools Sample',
    sample: owasp_zap_webgoat
  },
  {
    name: 'OWASP ZAP Zero_WebAppSecurity Heimdall_tools Sample',
    sample: owasp_zap_zero
  },
  {
    name: 'Fortify Heimdall_tools Sample',
    sample: fortify_h_tools_conv_webgoat
  },
  {
    name: 'AWS S3 Permissions Check',
    sample: aws_s3_baseline
  },
  {
    name: 'AWS CIS Foundations Baseline',
    sample: cis_aws_foundations_baseline
  },
  {
    name: 'NGINX Clean Sample',
    sample: good_nginxresults
  },
  {
    name: 'NGINX With Failing Tests',
    sample: bad_nginx
  },
  {
    name: 'Red Hat CVE Vulnerability Scan',
    sample: rhel_cve_vulnerability_scan_baseline_with_failures
  },
  {
    name: 'Red Hat 7 STIG Baseline',
    sample: rhel7_results
  },
  {
    name: 'Ubuntu STIG Baseline',
    sample: ubuntu_1604_baseline_results
  },
  {
    name: 'Red Hat With Failing Tests',
    sample: red_hat_bad
  },
  {
    name: 'Red Hat Clean Sample',
    sample: red_hat_good
  },
  {
    name: 'Triple Overlay Example',
    sample: triple_overlay_profile
  },
  {
    name: 'Acme Overlay Example',
    sample: acme_overlay
  }
];
