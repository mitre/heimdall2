/**
 * @heimdall/password-hash-vectors
 *
 * The password-hash format contract shared between heimdall2 and heimdall-cli
 * (ADR-006 §14). heimdall2 owns the format; heimdall-cli consumes these
 * vectors and asserts a formatVersion at build time.
 *
 * This card (e25.2) ships the malformed-hash corpus only. The known-good
 * password→hash vectors and the formatVersion stamp arrive in e25.4.
 */
export {
  MALFORMED_CORPUS,
  type MalformedExpected,
  type MalformedVector,
} from './malformed-corpus';
