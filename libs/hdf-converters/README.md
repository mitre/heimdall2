# HDF Converters

"[Heimdall Data Format (HDF)](https://saf.mitre.org/#/normalize)" is our common data exchange format to preserve and transform security data.

HDF Converters supplies several methods to convert various types of security tool data to and from this HDF standard. HDF Converters can be used in a variety of tools, and is currently well integrated with Heimdall itself, and the [SAF CLI](https://github.com/mitre/saf).

## Supported Formats
1.  [**asff-mapper**] - AWS Security Finding Format JSON file, Prowler-derived AWS Security Finding Format results from concatenated JSON blobs, and Trivy-derived AWS Security Finding Format results from concatenated JSON blobs
2.  [**aws-config-mapper**] - AWS Config
3.  [**burpsuite-mapper**] - BurpSuite Pro XML file
4.  [**checklist-mapper**] - Checlist Mapper format
5.  [**conveyor-mapper**] - Conveyor JSON file
6.  [**dbprotect-mapper**] - DBProtect report in "Check Results Details" XML format
7.  [**fortify-mapper**] - Fortify results FVDL file
8.  [**ionchannel-mapper**] - SBOM data from Ion Channel
9.  [**jfrog-xray-mapper**] - JFrog Xray results JSON file
10. [**nessus-mapper**] - Nessus XML results file
11. [**netsparker-mapper**] - Netsparker XML results file
12. [**nikto-mapper**] - Nikto results JSON file
13. [**prisma-mapper**] - Prisma Cloud Scan Report CSV file
14. [**sarif-mapper**] - SARIF JSON file
15. [**scoutsuite-mapper**] - ScoutSuite results from a Javascript object
16. [**snyk-mapper**] - Snyk results JSON file
17. [**sonarqube-mapper**] - SonarQube vulnerabilities for the specified project name and optional branch or pull/merge request ID name from an API
18. [**splunk-mapper**] - Splunk instance
19. [**twistlock-mapper**] - Twistlock CLI output file
20. [**veracode-mapper**] - Veracode Scan Results XML file
21. [**xccdf-results-mapper**] - SCAP client XCCDF-Results XML report
22. [**zap-mapper**] - OWASP ZAP results JSON

### NOTICE

© 2022 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.

### NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.

### NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
