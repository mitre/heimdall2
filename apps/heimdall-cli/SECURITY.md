---
title: Security Policy
description: Security vulnerability reporting and policies for heimdall-cli
layout: doc
sidebar: true
---

# Security Policy

## Reporting Security Issues

The MITRE SAF team takes security seriously. If you discover a security vulnerability in heimdall-cli, please report it responsibly.

### Contact Information

- **Email**: [saf-security@mitre.org](mailto:saf-security@mitre.org)
- **GitHub**: Use the [Security tab](https://github.com/mitre/heimdall-cli/security) to report vulnerabilities privately

### What to Include

When reporting security issues, please provide:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if you have one)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Varies by severity

## Security Best Practices

### For Users

- **Keep Updated**: Use the latest release of heimdall-cli
- **Restrict Access**: The binary runs privileged operations — limit it to host
  administrators
- **Protect Configuration**: Keep `backend.env` at `0640 root:heimdall` or tighter
- **Rotate After Reset**: Change a generated password after first login, and
  regenerate API keys rather than attempting to recover them

### For Contributors

- **Dependency Scanning**: Run `govulncheck ./...` before submitting PRs
- **Credential Handling**: Never log or expose credentials in code
- **Input Validation**: Parameterize all SQL; never interpolate into queries
- **Test Security**: Include security tests for new features

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | ✅ Yes — pre-1.0, current release only |

## Security Testing

heimdall-cli includes comprehensive security testing:

```bash
# Run full test suite
make test

# Vet
go vet ./...

# Check for vulnerable dependencies
govulncheck ./...
```

## Known Security Considerations

heimdall-cli is a privileged administrative tool. Most of its commands require
root and operate directly on the Heimdall Server installation, its systemd
unit, its configuration, and its database.

### Privilege
- Commands such as `setup`, `reset-password`, `add-cert`, and `fapolicyd`
  require root by design
- The binary is intended for host administrators, not end users
- Never expose it through a web interface or a network service

### Credentials
- Database credentials are read from `backend.env`, which must remain
  `0640 root:heimdall` or tighter
- `reset-password` prints a generated password to the terminal exactly once
  and never persists it
- Passwords are written to the database as a salted, iterated hash — never in
  plaintext, and never logged

### Cryptography
- The password hash format is owned by `mitre/heimdall2` and validated against
  its published test vectors
- On FIPS-mode hosts the hash must be produced by a FIPS 140-3 validated
  module; a mismatch renders the credential unusable by the server

### Data Protection
- `backup` archives contain database contents and configuration — treat
  archives as sensitive and store them accordingly
- Use TLS for all connections to Heimdall Server

### Container Security
- Docker images run as non-root user
- Keep base images updated
- Scan images for vulnerabilities regularly