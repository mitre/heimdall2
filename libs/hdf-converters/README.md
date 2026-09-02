# OHDF Converters

"[OASIS Heimdall Data Format (OHDF)](https://saf.mitre.org/#/normalize)" is our common data exchange format to preserve and transform security data.

OHDF Converters supplies several methods to convert various types of security tool data to and from the OHDF standard. OHDF Converters can be used in a variety of tools, and is currently well integrated with Heimdall itself, and the [SAF CLI](https://github.com/mitre/saf).

## Supported Formats

1.  [**anchore-grype-mapper**] - Anchore Grype container security scanning results file
2.  [**asff-mapper**] - AWS Security Finding Format JSON file, Prowler-derived AWS Security Finding Format results from concatenated JSON blobs, and Trivy-derived AWS Security Finding Format results from concatenated JSON blobs
3.  [**aws-config-mapper**] - AWS Config
4.  [**burpsuite-mapper**] - BurpSuite Pro XML file
5.  [**caat-mapper**] - Compliance Assessment and Audit Tracking (CAAT) file
6.  [**checklist-mapper**] - Checlist Mapper format
7.  [**checkov-mapper**] - Convert checkov json output files
8.  [**conveyor-mapper**] - Conveyor JSON file
9.  [**cyclonedx-sbom-mapper**] - CycloneDX SBOM JSON file
10. [**dbprotect-mapper**] - DBProtect report in "Check Results Details" XML format
11. [**dependency-track-mapper**] - OWASP Dependency-Track Finding Packaging Format (FPF)
12. [**fortify-mapper**] - Fortify results FVDL file
13. [**gosec-mapper**] - gosec results JSON file
14. [**hadolint-mapper**] - Hadolint results JSON file
15. [**ionchannel-mapper**] - SBOM data from Ion Channel
16. [**jfrog-xray-mapper**] - JFrog Xray results JSON file
17. [**msft-secure-mapper**] - Microsoft Secure Score results file
18. [**nessus-mapper**] - Nessus XML results file
19. [**netsparker-mapper**] - Netsparker XML results file
20. [**neuvector-mapper**] - NeuVector JSON results file
21. [**nikto-mapper**] - Nikto results JSON file
22. [**prisma-mapper**] - Prisma Cloud Scan Report CSV file
23. [**sarif-mapper**] - SARIF JSON file
24. [**scoutsuite-mapper**] - ScoutSuite results from a Javascript object
25. [**snyk-mapper**] - Snyk results JSON file
26. [**sonarqube-mapper**] - SonarQube vulnerabilities for the specified project name and optional branch or pull/merge request ID name from an API
27. [**splunk-mapper**] - Splunk instance
28. [**trufflehog-mapper**] - Trufflehog results json file
29. [**twistlock-mapper**] - Twistlock CLI output file
30. [**veracode-mapper**] - Veracode Scan Results XML file
31. [**xccdf-results-mapper**] - SCAP client XCCDF-Results XML report
32. [**zap-mapper**] - OWASP ZAP results JSON
