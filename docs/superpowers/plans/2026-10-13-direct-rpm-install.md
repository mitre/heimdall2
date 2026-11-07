# Direct RPM installation

The user approved a single Heimdall RPM installed with DNF, including on disconnected hosts whose OS prerequisites are already installed. Application runtimes belong inside the RPM. A separate distribution-specific dependency repository and install.sh are no longer part of delivery.

## Constraints

- Preserve signature verification, normal RPM dependency checks, safe upgrade behavior, and SELinux integration.
- Keep Node, PostgreSQL, Caddy, and the CLI private. Include PostgreSQL's ICU libraries privately with their licenses and provenance.
- Keep glibc, OpenSSL, systemd, SELinux utilities, and other declared base OS dependencies as host prerequisites.
- Publish direct RPM artifacts and supporting verification files without introducing a production signing identity or bypassing the existing integration-release guard.
- Build and publish only generic EL packages. Oracle Linux lifecycle jobs consume the EL8 candidate and its existing SRPM rebuild at a lower release; they build no packages and upload only test evidence. The generic upgrade fixture is excluded from publication.
- Select packages by EL major and CPU architecture. Do not enforce a Rocky versus RHEL distribution-name match.
- Preserve unrelated work. Commit and push the completed RPM changes as authorized by the user.

## Tasks

1. Bundle ICU privately in the RPM. Update payload checks to prove the private libraries are present and loaded, their system dependencies remain declared, and RPM metadata does not advertise private libraries as system providers.
2. Restore direct RPM artifacts in CI. Remove dependency-bundle production and wrapper installation paths. Exercise disconnected DNF installation after explicitly provisioning the documented baseline, retaining lifecycle and signature checks.
3. Remove obsolete bundle tooling and update install/build documentation, checksums, and source staging as needed. Retain historical design documents with a superseded note.
4. Run focused unit and shell checks, native Linux packaging checks where local tools permit, and an independent review. Record any untested platforms explicitly.

## Ownership and validation

Runtime changes own the spec and payload test. CI changes own the workflow and lifecycle harness. The coordinator owns the Makefile, documentation, obsolete bundle tooling removal, and integration. This avoids overlapping edits.

Run existing source/runtime input tests, validate workflow YAML and shell syntax, then use disposable native Linux containers for library loading and disconnected DNF checks. A full RHEL/EL version and architecture matrix remains CI validation unless locally executed.

## Verification result

Completed on 2026-10-13. A native Oracle Linux 8/aarch64 candidate (2.14.0-0.6.integration.el8) built successfully and passed payload checks, pinned CLI provenance checks, and binary/source RPM lint with zero errors. Existing upstream lint warnings remain. The signed binary SHA-256 is `920eb53e1ca39376d6a9277958185b309768a010d39d4c39036a052de0778100`.

On a fresh host with the explicit baseline, networking disabled, and DNF repositories disabled, signature-checked installation added only Heimdall plus its public-key record. System ICU remained absent. Bundled setup, migrations, authenticated application readiness, private TLS, saved secrets and CA checks, and restart verification passed. All three ICU libraries loaded privately. A focused native mutation test changed PostgreSQL's RPATH to RUNPATH and correctly detected the indirect library falling back to the system copy.

Source/runtime/archive input checks, source RPM version/release round trips, lifecycle failure propagation, upgrade scriptlet fixtures, host build argument handling, readiness fixtures, CLI acquisition, guards, shell syntax, and workflow YAML checks passed. Independent review found and resolved the missing ICU manifest file-list entry. Full package lint identified the necessary narrow private-ICU ldconfig exceptions.

Evidence and disposable signed validation artifacts are saved locally at `/private/tmp/heimdall-direct-validation/`. The full candidate was built before the final license-header addition of Unicode-DFS-2016 and the final lint-filter/comment/documentation adjustments; its runtime code and shipped license notices match the implementation. The final license header was separately parsed successfully. This is validation evidence, not a production release artifact. Temporary build and service containers were removed.

RHEL 8.6, EL9/EL10, x86_64, the full two-release CI lifecycle matrix, enforcing SELinux/fapolicyd, and a full VM reboot were not validated here. An optional Rocky 10 baseline fetch stalled at repository metadata; it was stopped without changing product behavior. CI now defines the direct-install matrix for the next build. Production signing and repository hosting remain separate release work.
