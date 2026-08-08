/**
 * The password-hash format version — a single integer stamp that both
 * heimdall2 and heimdall-cli assert equality against at build time (ADR-006
 * §14). A mismatch is a build failure, which is what prevents heimdall-cli from
 * shipping a break-glass tool that writes a hash format the FIPS-gated server
 * refuses.
 *
 * BUMP THIS whenever ANY of the following changes:
 *   - the PHC grammar (§2: `$pbkdf2-<alg>$i=<n>$<b64-salt>$<b64-key>`)
 *   - the algorithm allowlist (§6: sha256 | sha384 | sha512)
 *   - the parameter bounds (iteration floor/ceiling, salt/key widths)
 *
 * It is a plain stamp, not a semantic version — §14 specifies equality, not a
 * negotiation protocol. Starts at 1.
 */
export const FORMAT_VERSION = 1;
