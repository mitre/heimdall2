# CLI and Server Compatibility

CLI and server versions are independent. The initial pair to validate is
CLI `0.9.0` with server `2.14.0` on EL8/9/10 × x86_64/aarch64.

| CLI | Server | Platforms | Validation |
| --- | --- | --- | --- |
| `0.9.0` | `2.14.0` | EL8, EL9, EL10; x86_64, aarch64 | Pending until the RPM matrix passes |

Validation includes RPM builds, installation, and disconnected lifecycle checks
for every platform in the matrix. This pending entry does not claim that the
matrix has passed.

The server RPM builds the CLI from its own source tree. Upgrade an RPM-owned
executable through a rebuilt server RPM; standalone archives do not upgrade it
automatically.
