# RPM Branch Integration Design

## Decision and scope

Start an isolated integration branch from
`origin/feature/fips-compliant-password-hashing`, then port selected RPM fixes
from `feat/rpm-build`. Preserve the target branch's explicit administration
workflow: install the package, then run `heimdall-cli setup`.

This is the proposed first milestone requested on September 22, 2026. It
implements the branch-combination recommendation already discussed with the
user. It does not authorize switching the current checkout or deploying a
candidate while writing the plan.

The first milestone integrates packaging against the target branch's existing
application. Reconciliation with the newer 2.14.0 application is a separate
milestone. This preserves a small, testable integration boundary. A successful
2.13.1 candidate is not permission to downgrade an installed 2.14.0 system.

## Verified starting points

| Input | Exact commit | Relevant facts |
|---|---|---|
| Target base | `6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72` | RPM and VERSION 2.13.1; backend manifest 2.13.0; richer packaging imported from saf-packaging |
| RPM donor | `e5ded4aa67d95745a4da7c64b55e13e480e412d1` | Application/RPM 2.14.0; OL8 Docker build, staging/configuration/database/payload/lifecycle tests |
| CLI default branch | `c7da1593c4ffa81d4457fa0757418842ae50bac0` | Separate repository; native configuration/setup implementation; missing cmd/gen-manpages; go.mod requires Go 1.25.8 |

The local `feat/rpm-build` checkout has been fast-forwarded to the donor commit.
The two complete branch tips have 38 simulated merge conflicts, including all
ten shared RPM files. Do not merge their complete histories as the first step.

Local configuration probes confirmed that the target's shell configurator drops
additional login/OIDC assignments, while the donor preserves them. Inspection
of the CLI shows another fixed-key configuration rewrite. The target's database
helper expects backend `.bin/tsx`; that executable is not a declared backend
production dependency. Its latest recorded RPM workflow failed before install
tests: EL8 lacked the CLI man-page generator and EL9 encountered a
`curl-minimal`/`curl` package conflict.

The donor's successful OL8 lifecycle runs are historical evidence, not acceptance
of this combined candidate. Repeat acceptance against the new package.

## Global constraints

- Preserve the target branch's application and FIPS behavior; do not redesign, remove, or port cryptographic code in this milestone.
- Do not change logger setup, logger imports, logger formatters, log levels, transports, or existing log messages.
- Preserve the current checkout, existing local documents, and both source branches; implementation uses isolated worktrees.
- Keep `dnf install` noninteractive and free of database/configuration bootstrap; run setup explicitly through `heimdall-cli setup`.
- Keep PostgreSQL optional for remote deployments; use PGDG PostgreSQL 18 for the required local OL8 acceptance fixture.
- Require Node.js engine `>=22.18.0`, build with Node 22 and Yarn Classic `1.22.22`, and retain frozen dependency installation.
- Align VERSION, the RPM spec, and backend/frontend application versions at `2.13.1` for this milestone; retain existing library dependency versions and the lockfile unless a demonstrated integration failure requires a narrow correction.
- Mark candidate RPM releases `0.1.integration` and `0.2.integration`; do not publish these as stable releases or install them over 2.14.0.
- Pin the CLI to the exact tested commit, build with Go `1.25.8` or a deliberately pinned newer compatible toolchain, and never use mutable `main` for an accepted candidate.
- Keep TLS certificate verification and RPM signature verification enabled; corporate CA inputs remain outside the package payload.
- Preserve additional environment settings and existing credentials across configuration reruns and package upgrades.
- Require actual OL8 systemd/PostgreSQL/application lifecycle acceptance on `aarch64` and `x86_64`; do not infer native hardware, EL9, or enforcing-SELinux certification from those container runs.

## Requirements and acceptance

R1. The target branch supplies the application, CLI-first install model, optional
database dependencies, TLS integration, SELinux policy, sysconfig, and existing
host integration. Do not replace its RPM directory or spec wholesale with the
donor's smaller scaffold.

R2. A clean Git build uses one committed source snapshot for application,
packaging, metadata, and CLI pin. Release staging requires HEAD to equal the
selected release tag. Dirty relevant inputs fail before staging. A Docker
workspace build may include edits, through an explicitly filtered source context.

R3. Backend/frontend/spec/VERSION agree. Node's actual engine requirement is
expressed in the RPM. Binary payload checks cover compiled backend/database
configuration, frontend assets, workspace links, CLI, and man pages. An SRPM
rebuild must not depend on man pages left in the original builder's BUILD tree.

R4. Both the shell configurator and the CLI preserve extra settings and existing
secrets. The CLI must preserve comments/unmodified assignment text when writing
existing files, correctly round-trip the supported single-line quoted values,
and return an error on unreadable configuration rather than overwrite it.
Empty interactive password input retains an existing password.

R5. Database setup runs the packaged Sequelize CLI with `/usr/bin/node` and
compiled database configuration. Creation, migrations, seeds, reruns, and
`--skip-seed` work without tsx. Both setup entry points require working systemd
for service operations, restart an existing service after configuration changes,
and propagate restart failure. Configuration-only mode remains usable without
service changes. CLI topology selection uses the resolved database host.

R6. The CLI repository supplies the missing man-page generator and the runtime
configuration fixes. The RPM records one tested CLI commit; its source package
contains generated man pages as a declared Source. The legacy build helper
delegates to the Makefile so it cannot look for a nonexistent sibling CLI tree.

R7. Fresh package installation on a clean OL8 host succeeds without running
setup. Explicit setup yields live `/`, `/server`, `/health`, `/health/ready`, and
a successful local login. Rerun, candidate release upgrade, reboot, and removal
preserve configuration, credentials, and a database sentinel. Migrations are
explicit during upgrade; acceptance disables automatic restart until they finish.

R8. Verify the target-specific features through the packaged CLI: an external
PostgreSQL fixture does not bootstrap a local server; a private-hostname Caddy
fixture serves HTTPS with its CA explicitly trusted; backup and restore recover
a disposable database fixture. These checks do not alter application logging.

R9. Keep the existing EL8/EL9 architecture build matrix, repair its known build
prerequisites, add application/dependency trigger paths, and make the new OL8
lifecycle acceptance a required dependency before any existing release publishing
job. Do not trigger publication during implementation.

## Deliberate adaptations

| Donor work | Integration treatment |
|---|---|
| `776ee245c`, `8967c0965` metadata/staging | Port checks into the target Makefile staging path; retain target version 2.13.1 |
| `63988a884` OL8 build | Adapt Docker targets to build the larger target payload and pinned CLI |
| `51ffe3826` Node migration launcher | Apply the small launcher change, retaining target comments and behavior |
| `1f2a42f23` config/setup | Port preservation/restart checks into both setup paths; keep target `%post` model |
| `2e8ab409f`, `e5ded4aa6` tests/docs | Adapt tests to explicit CLI setup and parameterized version/releases; create new evidence |

Do not port the donor's hard PostgreSQL-18 package requirement or automatic
`%post` bootstrap. Keep PG18 as an acceptance fixture, not a package restriction.
Do not copy the donor's 2.14.0 metadata onto older application sources.

## Delivery order and boundaries

1. Complete the independently testable CLI prerequisite plan.
2. Integrate RPM staging, runtime fixes, builds, and lifecycle tests in Heimdall.
3. Review candidate evidence and retain the original branches.
4. Plan upstream 2.14.0 reconciliation and historical database migration testing
   before replacing any existing 2.14.0 deployment.

The implementation plans are
`docs/superpowers/plans/2026-09-22-heimdall-cli-rpm-prerequisites.md` and
`docs/superpowers/plans/2026-09-22-rpm-branch-integration.md`.

## Sources

- [Target RPM sources](https://github.com/mitre/heimdall2/tree/6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72/packaging/rpm)
- [Donor RPM sources and recorded acceptance](https://github.com/mitre/heimdall2/tree/e5ded4aa67d95745a4da7c64b55e13e480e412d1/packaging/rpm)
- [CLI setup](https://github.com/mitre/heimdall-cli/blob/c7da1593c4ffa81d4457fa0757418842ae50bac0/internal/cmd/setup.go)
- [CLI environment handling](https://github.com/mitre/heimdall-cli/blob/c7da1593c4ffa81d4457fa0757418842ae50bac0/internal/cmd/env.go)
- [Latest recorded target RPM run](https://github.com/mitre/heimdall2/actions/runs/31267346150)
