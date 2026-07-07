# Fixture Regeneration Tool — Implementation Plan

## Problem
Registry entries must be derived from reading actual spec files, not extrapolated.

## Verified Spec Data (read from actual files 2026-06-18)

### Simple pattern — string input, optional withRaw:

**anchore-grype** (sync, withRaw)
- INPUT: sample_jsons/anchore_grype_mapper/sample_input_report/anchore_grype.json
- INPUT: sample_jsons/anchore_grype_mapper/sample_input_report/amazon.json
- INPUT: sample_jsons/anchore_grype_mapper/sample_input_report/tensorflow.json
- OUTPUT: anchore-grype-hdf.json, anchore-grype-withraw.json (×3 inputs = 6 outputs)

**burpsuite** (ASYNC, withRaw)
- INPUT: sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min
- OUTPUT: burpsuite-hdf.json, burpsuite-hdf-withraw.json

**dbprotect** (sync, withRaw)
- INPUT: sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml
- INPUT: sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml
- OUTPUT: dbprotect-check-hdf.json, dbprotect-check-hdf-withraw.json, dbprotect-findings-hdf.json, dbprotect-findings-hdf-withraw.json

**fortify** (ASYNC, withRaw)
- INPUT: sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl
- OUTPUT: fortify-hdf.json, fortify-hdf-withraw.json

**gosec** (sync, withRaw)
- INPUT: sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json
- INPUT: sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_external_suppressed.json
- INPUT: sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_all_suppressed.json
- OUTPUT: grype-gosec-hdf.json, grype-gosec-hdf-withraw.json, go-ethereum-external-unsuppressed-gosec-hdf.json, go-ethereum-external-unsuppressed-gosec-hdf-withraw.json, go-ethereum-all-unsuppressed-gosec-hdf.json, go-ethereum-all-unsuppressed-gosec-hdf-withraw.json

**jfrog-xray** (sync, withRaw)
- INPUT: sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json
- OUTPUT: jfrog-hdf.json, jfrog-hdf-withraw.json

**netsparker** (ASYNC, withRaw)
- INPUT: sample_jsons/netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml
- OUTPUT: netsparker-hdf.json, netsparker-hdf-withraw.json

**neuvector** (sync, withRaw)
- INPUT ×4: neuvector-mitre-{heimdall2,heimdall,vulcan,caldera}.json
- OUTPUT ×8: neuvector-hdf-mitre-{name}.json + neuvector-hdf-withraw-mitre-{name}.json

**nikto** (sync, withRaw) — NOTE: input is zero.webappsecurity.json NOT nikto_sample.json
- INPUT: sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json
- OUTPUT: nikto-hdf.json, nikto-hdf-withraw.json

**sarif** (sync, withRaw) — NOTE: input is sarif_input.sarif NOT sarif_sample.json
- INPUT: sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif
- OUTPUT: sarif-hdf.json, sarif-hdf-withraw.json

**scoutsuite** (sync, withRaw)
- INPUT: sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js
- OUTPUT: scoutsuite-hdf.json, scoutsuite-hdf-withraw.json

**trufflehog** (sync, withRaw for some)
- INPUT ×5: trufflehog.json, trufflehog_docker_example.json, trufflehog_saf_example.json, trufflehog-report-example.json, trufflehog_dup.ndjson
- OUTPUT ×9: various -hdf.json and -hdf-withraw.json (trufflehog_dup has no withraw)

**twistlock** (sync, withRaw + extra single output)
- INPUT: twistlock-twistcli-sample-1.json → twistlock-hdf.json, twistlock-hdf-withraw.json, twistlock-twistcli-sample-1-hdf.json
- INPUT: twistlock-twistcli-coderepo-scan-sample.json → twistlock-coderepo-hdf.json, twistlock-coderepo-hdf-withraw.json

**veracode** (sync, no withRaw)
- INPUT: sample_jsons/veracode_mapper/sample_input_report/veracode.xml
- OUTPUT: veracode-hdf.json

### Complex pattern:

**asff** (sync, NO withRaw, multiple independent inputs)
- 6 inputs → 6 outputs (each input produces one output independently)
- Class: ASFFResults (takes JSON string)

**checkov** (sync, withRaw for some, 4 inputs)
- INPUT: checkov_json.json → checkov_json-hdf.json, checkov_json-withraw-hdf.json
- INPUT: checkov_sample.json → checkov_sample-hdf.json
- INPUT: checkov_synthetic.json → checkov_synthetic-hdf.json
- INPUT: checkov_with_skips.json → checkov_with_skips-hdf.json

**checklist** (sync, withRaw for some, CKL input)
- 6 inputs → 6+ outputs (RHEL8 + with-raw, overrides, three-stig, mac, ip metadata)
- Also intermediate objects (checklist_intermediate_object.json, checklist_jsonix_data.json) — skip these, they're structure tests not HDF output

**conveyor** (sync, JSON.parse input, 1 input → 5 outputs)
- INPUT: sample-results.json (JSON.parse before passing to constructor)
- OUTPUT: conveyor-hdf.json, conveyor-clamav-hdf.json, conveyor-codequality-hdf.json, conveyor-moldy-hdf.json, conveyor-stigma-hdf.json
- SPECIAL: uses profile-name-based filtering — need to read spec to understand constructor

**cyclonedx-sbom** (sync, withRaw, 7 inputs × 2 outputs each = 14)
- Standard pattern, just large

**dependency-track** (sync, JSON.parse input, withRaw for one)
- 5 inputs → 6 outputs (default has withRaw variant, others don't)

**msft-secure-score** (sync, JSON.parse, complex constructor)
- 3 test cases with different input combinations
- Need to read spec closely for constructor patterns

**nessus** (ASYNC, ARRAY output, withRaw)
- 1 input → 3 outputs (array index 0,1,2) + 3 withRaw outputs
- SPECIAL: toHdf() returns ExecJSON.Execution[] not single Execution

**prisma** (sync, CSV input, DYNAMIC output filenames)
- INPUT: prismacloud_sample.csv
- OUTPUT: filenames derived from data at runtime — CANNOT pre-register output paths
- SPECIAL: needs custom handling or skip from registry

**snyk** (sync, NO withRaw, 2 inputs)
- INPUT: nodejs-goof-local.json → nodejs-goof-local-hdf.json
- INPUT: nodejs-goof-remote.json → nodejs-goof-remote-hdf.json

**xccdf** (ASYNC, withRaw for some, 5 inputs)
- 5 inputs → 9 outputs (some have withRaw, some don't)

**zap** (ASYNC, withRaw, 2 inputs)
- 2 inputs → 4 outputs

### External service (skip unless service available):
- **sonarqube** — needs mock server on port 3001
- **splunk-reverse** — needs Splunk on port 8089

### Special cases requiring custom handling:
- **prisma** — dynamic output filenames from CSV data, can't pre-register
- **conveyor** — 1 input → 5 profiles, need to understand filtering
- **msft-secure-score** — multi-file input combinations
- **ionchannel** — NO spec file found in forward mapper tests (uses API?)

## Total fixture count
~115 output fixture files across 25 registerable mappers (excluding prisma dynamic + sonarqube/splunk external + ionchannel missing)

## Implementation order
1. Rewrite registry with verified paths
2. Add file-existence test
3. Test --dry-run --all → zero ENOENT
4. Test --mapper=anchore-grype → regenerates correctly
5. Lint to zero
6. Add package.json script
7. Commit
