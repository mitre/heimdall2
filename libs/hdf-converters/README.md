# HDF Converters

"[Heimdall Data Format (HDF)](https://saf.mitre.org/#/normalize)" is our common data exchange format to preserve and transform security data.

HDF Converters supplies several methods to convert various types of security tool data to and from this HDF standard. HDF Converters can be used in a variety of tools, and is currently well integrated with Heimdall itself, and the [SAF CLI](https://github.com/mitre/saf).

## Supported Formats
1.  [**asff-mapper**] - AWS Security Finding Format JSON file, Prowler-derived AWS Security Finding Format results from concatenated JSON blobs, and Trivy-derived AWS Security Finding Format results from concatenated JSON blobs
2.  [**aws-config-mapper**] - AWS Config
3.  [**burpsuite-mapper**] - BurpSuite Pro XML file
4.  [**checklist-mapper**] - Checlist Mapper format
5.  [**dbprotect-mapper**] - DBProtect report in "Check Results Details" XML format
6.  [**fortify-mapper**] - Fortify results FVDL file
7.  [**ionchannel-mapper**] - SBOM data from Ion Channel
8.  [**jfrog-xray-mapper**] - JFrog Xray results JSON file
9.  [**nessus-mapper**] - Nessus XML results file
10. [**netsparker-mapper**] - Netsparker XML results file
11. [**nikto-mapper**] - Nikto results JSON file
12. [**prisma-mapper**] - Prisma Cloud Scan Report CSV file
13. [**sarif-mapper**] - SARIF JSON file
14. [**scoutsuite-mapper**] - ScoutSuite results from a Javascript object
15. [**snyk-mapper**] - Snyk results JSON file
16. [**sonarqube-mapper**] - SonarQube vulnerabilities for the specified project name and optional branch or pull/merge request ID name from an API
17. [**splunk-mapper**] - Splunk instance
18. [**twistlock-mapper**] - Twistlock CLI output file
19. [**veracode-mapper**] - Veracode Scan Results XML file
20. [**xccdf-results-mapper**] - SCAP client XCCDF-Results XML report
21. [**zap-mapper**] - OWASP ZAP results JSON

### NOTICE

© 2022 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.

### NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.

### NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
