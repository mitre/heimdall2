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
8.  [**clamav_mapper**] - clamscan/clamdscan console or log text
9.  [**conveyor-mapper**] - Conveyor JSON file
10. [**cyclonedx-sbom-mapper**] - CycloneDX SBOM JSON file
11. [**dbprotect-mapper**] - DBProtect report in "Check Results Details" XML format
12. [**dependency-track-mapper**] - OWASP Dependency-Track Finding Packaging Format (FPF)
13. [**fortify-mapper**] - Fortify results FVDL file
14. [**gosec-mapper**] - gosec results JSON file
15. [**hadolint-mapper**] - Hadolint results JSON file
16. [**ionchannel-mapper**] - SBOM data from Ion Channel
17. [**jfrog-xray-mapper**] - JFrog Xray results JSON file
18. [**msft-secure-mapper**] - Microsoft Secure Score results file
19. [**nessus-mapper**] - Nessus XML results file
20. [**netsparker-mapper**] - Netsparker XML results file
21. [**neuvector-mapper**] - NeuVector JSON results file
22. [**nikto-mapper**] - Nikto results JSON file
23. [**prisma-mapper**] - Prisma Cloud Scan Report CSV file
24. [**sarif-mapper**] - SARIF JSON file
25. [**scoutsuite-mapper**] - ScoutSuite results from a Javascript object
26. [**snyk-mapper**] - Snyk results JSON file
27. [**sonarqube-mapper**] - SonarQube vulnerabilities for the specified project name and optional branch or pull/merge request ID name from an API
28. [**splunk-mapper**] - Splunk instance
29. [**trufflehog-mapper**] - Trufflehog results json file
30. [**twistlock-mapper**] - Twistlock CLI output file
31. [**veracode-mapper**] - Veracode Scan Results XML file
32. [**xccdf-results-mapper**] - SCAP client XCCDF-Results XML report
33. [**zap-mapper**] - OWASP ZAP results JSON
