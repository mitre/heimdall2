# In-tree Heimdall CLI and independent releases

Date: 2026-10-16
Status: Proposed design accompanying the requested implementation plan; implementation has not started.

## Outcome and decisions

Maintain the complete Heimdall administration CLI in `apps/heimdall-cli`. Build the server RPM's bundled CLI from the same Heimdall source snapshot as the server. Give the CLI its own version, CI checks, and release stream.

The user explicitly selected **independent CLI versions and releases**. The root `VERSION` remains the server version. Introduce `apps/heimdall-cli/VERSION`, initially `v0.9.0`, and CLI tags `apps/heimdall-cli/vX.Y.Z`. The initial version follows the imported `0.9.0-dev` baseline; the external repository had no tags or releases when inspected.

One implementation plan covers this change because source ownership, packaging, and release isolation share the same module and version contract. Each task yields a separately testable result.

## Current evidence

- Working branch inspected: `feat/rpm-packaging`, HEAD `2c32374c1dadc5612ae3097c9d45317e745944a0`.
- External source: `https://github.com/seanlongcc/heimdall-cli.git` at `ea29e299ca0206519dd324c9543c74cba80c1963`.
- The current RPM applies `packaging/rpm/heimdall-cli-nginx.patch`, SHA-256 `29993da844f52c65fb7334a3bf7b1d4a3408efbc156ffba461f43c25fdc968f1`. Its changes cover setup, firewall, backup/restore, password handling, Nginx, and regression tests.
- The effective source has 92 files, including 79 Go files and 47 Go test files. A clean export of the pin accepts the RPM patch.
- The untracked root `heimdall-cli-setup-prompts.patch` is already present in the pinned commit, byte for byte. Preserve the file and do not apply it again.
- The CLI uses Go `1.25.8`. Existing RPM CI uses the same version and covers EL8, EL9, and EL10 on x86_64 and aarch64.
- The RPM workflow uses `HEIMDALL_RELEASE: 0.4.integration` and disposable signing keys. Its release job intentionally refuses integration artifacts.
- Existing npm, Docker, GitHub Pages, and RPM workflows react to every published GitHub release. Release Drafter currently does not distinguish release streams.

## Architecture

Import ordinary tracked files, retaining the CLI's directory structure and license. Rename its module to `github.com/mitre/heimdall2/apps/heimdall-cli` and update internal imports and linker symbols. Keep dependency versions unchanged. A single nested module needs neither a root `go.work` nor a Yarn package wrapper.

The alternative of a Git submodule still requires the external repository. A subtree with ongoing synchronization adds a maintenance mechanism the ownership change does not require. A one-time source import, with provenance recorded in `UPSTREAM.md` and history preserved by Git, fits the request.

Use the imported CLI Makefile for binary builds. Its own `VERSION` is authoritative; the server RPM no longer overwrites the CLI version with the server version. Direct developer builds identify themselves as development builds. Release and RPM callers provide provenance explicitly.

RPM `cli-build-src` extracts the CLI directory from the existing Source0 archive. Both binary and manual generation consume that extraction. This preserves `SOURCE_MODE=workspace`, `head`, and `release`, including source downloads without Git metadata. Committed builds cannot accidentally compile ignored working-tree Go files.

Keep Source15 as the static CLI binary, Source22 as its generated manuals, and `/usr/bin/heimdall-cli` as the installed executable. Installation continues to require no Go compiler or network access after OS prerequisites are installed. Building Go dependencies can still require network access.

## Global constraints

- Import commit `ea29e299ca0206519dd324c9543c74cba80c1963` plus the tracked RPM patch; preserve all patched behavior and tests.
- Module path: `github.com/mitre/heimdall2/apps/heimdall-cli`.
- CLI version file: `apps/heimdall-cli/VERSION`; initial value: `v0.9.0`.
- CLI release tags: `apps/heimdall-cli/vX.Y.Z`; server release tags retain `vX.Y.Z`.
- Go toolchain: `1.25.8` with `GOTOOLCHAIN=local`; dependency upgrades are separate unless a demonstrated blocking vulnerability requires a reviewed fix.
- Supported release targets: `linux/amd64` and `linux/arm64`; distributable binaries use `CGO_ENABLED=0`.
- Preserve the existing EL8/EL9/EL10 × x86_64/aarch64 RPM build, installation, and disconnected lifecycle checks.
- Preserve the existing integration-RPM publication rejection and temporary-signing restrictions.
- Preserve unrelated local changes, including the untracked root setup-prompts patch.
- CI pull requests use read-only permissions and no publishing credentials.
- Every CLI release validates its exact tag, CLI version, commit, binary metadata, archive contents, and checksums before upload.
- CLI releases must not trigger server publishers, alter the server release draft, or replace the server's latest-release designation.
- Release automation creates a populated draft; a maintainer publishes it after review. Manual workflow runs produce artifacts without creating or changing releases.

## CI and release behavior

Add an always-running CLI workflow on pull requests and pushes to `master`. Avoid path filters on its required checks. Run formatting, `go vet`, unit tests with race detection and coverage, functional tests, and `govulncheck`. Native Linux runners cover both architectures. Keep expensive privileged integration coverage in the existing RPM pipeline. Upload coverage as a CI artifact without introducing an external coverage account or a speculative minimum percentage.

The release workflow responds to CLI tag pushes and supports a manual artifact-only run. Tag runs check out and test the exact tag and verify the CLI version independently of root `VERSION`. Manual runs accept a commit, branch, or tag without requiring a release tag; they never publish. Both build on native architectures and package the executable, license, README, compatibility statement, and generated manuals. Archive names are `heimdall-cli_0.9.0_linux_amd64.tar.gz` and `heimdall-cli_0.9.0_linux_arm64.tar.gz`, accompanied on the release by `heimdall-cli_0.9.0_SHA256SUMS`. Write permissions and attestation permissions belong only to the publication job.

The release workflow uses ordinary Make, tar, SHA-256, GitHub CLI, and GitHub artifact attestations. Retire the imported GoReleaser configuration and its snapshot/release targets rather than retaining two packaging authorities. Its nFPM package would conflict with the server RPM's ownership of `/usr/bin/heimdall-cli`. No separate CLI RPM is introduced.

Add release-event guards to `push-to-npm.yml`, `release-server-to-docker.yml`, `release-lite-to-docker.yml`, `gh-pages.yml`, and `build-rpm.yml`. Keep manual server workflow dispatch behavior. Set `tag-prefix: "v"` in `.github/release-drafter.yml`, and create CLI releases with `--latest=false`. Preserve existing release drafts and published assets on reruns; verify an existing draft before replacing its assets, and refuse to modify an already published release.

The release tag prefix matches Go's nested-module convention. Prebuilt binaries are the supported distribution method in this plan; a separate `go install` support promise and future major-version module migrations are outside its scope.

## Provenance and compatibility

`UPSTREAM.md` records the external commit, downstream patch digest, one-time import, license, and already-incorporated prompt patch. External URLs remain as historical attribution only. No build downloads CLI source or applies a downstream patch after migration.

For `head` and server `release` builds, stamp the full Heimdall commit and commit date. For `workspace` builds, including no-Git source archives, stamp `source.<SHA-256 of Source0>` and `unknown` for the date. This identifies the actual input archive without misrepresenting it as an unmodified commit. Disable automatic Go VCS stamping when building the extracted module.

`COMPAT.md` initially records CLI `0.9.0` with the server `2.14.0` source and the existing RPM platform matrix as the pair requiring validation. Independent releases do not imply arbitrary cross-version compatibility. Future CLI releases update this table based on tested pairs. Document that the RPM manages its bundled executable and that standalone archives do not automatically replace that file.

## Acceptance

1. A checkout contains the complete CLI and its patched regression tests.
2. Normal CLI and RPM builds do not fetch an external CLI repository.
3. Native CI tests, vulnerability checking, cross-architecture artifact checks, and the existing RPM matrix pass.
4. Source0, bundled binary, and generated manuals correspond to the same input snapshot.
5. CLI `--version` reports the independent CLI version and truthful build provenance.
6. A CLI tag produces two verified archives, checksums, attestations, and a draft CLI release.
7. A manual release workflow run builds and validates artifacts but cannot publish.
8. Publishing a CLI draft cannot run server publishing jobs or affect the server draft/latest designation.
9. Documentation explains local development, both version streams, release steps, compatibility, and import provenance.

## Reference mapping

The reference was inspected at [mitre/hdf-libs commit 84371a77aa7ed12a313705c545b2ae908b731343](https://github.com/mitre/hdf-libs/commit/84371a77aa7ed12a313705c545b2ae908b731343).

| Reference | Adopted here |
| --- | --- |
| [ci.yml](https://github.com/mitre/hdf-libs/blob/84371a77aa7ed12a313705c545b2ae908b731343/.github/workflows/ci.yml) | Stable checks without path filters, race tests, cancellation of superseded CI, pinned tools. |
| [release.yml](https://github.com/mitre/hdf-libs/blob/84371a77aa7ed12a313705c545b2ae908b731343/.github/workflows/release.yml) | Exact release validation, clean builds, separate publication privileges, checksums, attestations. |
| [GoReleaser configuration](https://github.com/mitre/hdf-libs/blob/84371a77aa7ed12a313705c545b2ae908b731343/hdf-cli/.goreleaser.yml) | Static binary archives; use the existing Makefile here instead of its larger packaging setup. |

The HDF multi-module/npm/schema workflows, five-platform binaries, external scanning services, SBOM/signature stack, and GoReleaser Pro functionality are not prerequisites for this migration. [GoReleaser's monorepo feature](https://goreleaser.com/customization/monorepo/) requires Pro.

Relevant primary documentation: [Go nested-module tags](https://go.dev/ref/mod#vcs-version), [Release Drafter prefix filtering](https://github.com/release-drafter/release-drafter/blob/v6/lib/releases.js), and [GitHub CLI release creation](https://cli.github.com/manual/gh_release_create).
