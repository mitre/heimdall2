# CLI and Server Compatibility

CLI and server versions are independent. The initial pair to validate is
CLI `0.9.0` with server `2.14.0` on EL8/9/10 × x86_64/aarch64.

| CLI | Server | Platforms | Validation |
| --- | --- | --- | --- |
| `0.9.0` | `2.14.0` | EL8, EL9, EL10; x86_64, aarch64 | Pending until the RPM matrix passes |

Validation includes RPM builds, installation, and disconnected lifecycle checks
for every platform in the matrix. This pending entry does not claim that the
matrix has passed. Before recording a tested pair, retain successful hosted
results for source extraction, installed CLI version/provenance, manpages,
SRPM rebuild, and disconnected lifecycle checks on all six combinations.
Local CLI archive smoke tests do not establish this compatibility.

Each server RPM builds the CLI source and version from its own source commit.
CLI and server releases can advance independently. Upgrade an RPM-owned
executable through a rebuilt server RPM; standalone archives do not upgrade it
automatically.

Follow the [release runbook](./CONTRIBUTING.md#release-process) for manual
artifact inspection and first-release attestation/draft acceptance.
