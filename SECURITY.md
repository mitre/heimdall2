# Security Policy

## Reporting Security Issues

The MITRE SAF team takes security seriously. If you discover a security
vulnerability in Heimdall, please report it responsibly.

### Contact Information

- **Email**: [saf-security@mitre.org](mailto:saf-security@mitre.org)
- **GitHub**: Use the [Security tab](https://github.com/mitre/heimdall2/security)
  to report vulnerabilities privately

Please do not open a public issue for a security vulnerability.

### What to Include

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Affected component** — Heimdall Server, Heimdall Lite, or one of the
   published libraries (`@mitre/hdf-converters`, `inspecjs`)
5. **Suggested fix** (if you have one)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Varies by severity

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest release | ✅ Yes |
| Older releases | ❌ No — upgrade to the latest release |

Heimdall ships as a Docker image, an RPM, and npm packages. Security fixes are
issued against the latest release of each.

## Security Best Practices

### For Deployers

- **Terminate TLS in front of Heimdall.** The application sets HSTS and CSP
  headers via Helmet, but headers cannot enforce transport. Run it behind a
  TLS reverse proxy; serving it over plain HTTP will also break asset loading.
- **Use enterprise authentication.** Heimdall supports LDAP, OIDC, GitHub,
  GitLab, Google, and Okta. Prefer these over local accounts in production.
- **Protect the environment file.** `DATABASE_PASSWORD`, `JWT_SECRET`, and
  `API_KEY_SECRET` live there. Restrict it to the service account.
- **Set `API_KEY_SECRET` if API keys are enabled.** API key support is
  disabled when it is unset — do not deploy with a placeholder value.
- **Use database TLS.** Configure `DATABASE_SSL` and the associated
  certificate settings for connections that leave the host.
- **Scope evaluation visibility.** Evaluations can be public, group-scoped, or
  private. Review group membership before importing sensitive scan results.

### For Contributors

- **Dependency scanning**: run `yarn audit` before submitting a PR
- **Credential handling**: never log or expose credentials, tokens, or
  evaluation contents
- **Input validation**: validate at the trust boundary — DTO/pipe layer for
  API input, and parameterize every database query
- **No linter suppressions for security rules**: the ESLint security plugin
  findings must be fixed in code, not disabled
- **Test security behaviour**: authorization changes need tests covering the
  denied path, not just the allowed one

## Security Testing

```bash
# Full test suites
yarn backend test:ci
yarn frontend test:ci

# Type checking (the test runners do not typecheck)
yarn backend build

# Lint, including the security ruleset
yarn backend lint:ci
yarn frontend lint:ci

# Vulnerable dependency check
yarn audit
```

Container images are scanned with Syft/Grype in CI (see
`.github/workflows/anchore-syft.yml`).

## Known Security Considerations

### Authentication and Authorization

- Local passwords are stored as salted, iterated hashes — never in plaintext
- Password complexity is enforced at 15 characters with all four character
  classes and no run of four or more from a single class
- Authorization uses CASL ability rules; evaluation and group access is
  checked per request rather than at the route level alone
- The login endpoint is rate limited per IP; there is no per-account lockout

### API Keys

- API keys are JWTs; only a hash of the signature is stored server-side
- **A lost API key cannot be recovered — it must be regenerated**
- API key support is disabled entirely when `API_KEY_SECRET` is unset

### Data Protection

- Evaluation data may contain hostnames, configuration detail, and finding
  evidence from scanned systems — treat the database and its backups as
  sensitive
- Use TLS for all external connections

### Container Security

- Images are based on Red Hat UBI and run as a non-root user
- Keep base images updated and rescan on rebuild
