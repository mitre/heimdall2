// Vendored from mitre/better-auth-ldap (fork of aa900031/better-auth-ldap)
// Source: https://github.com/mitre/better-auth-ldap (feat/main-func branch)
// License: MIT
// When upstream publishes to npm, switch to: yarn add better-auth-ldap
import {defineErrorCodes} from '@better-auth/core/utils/error-codes';

export const LDAP_ERROR_CODES = defineErrorCodes({
	PROVIDER_CONFIG_NOT_FOUND: 'LDAP provider configuration not found',
	AUTHENTICATION_FAILED: 'LDAP authentication failed',
	CREDENTIAL_INVALID: 'Invalid LDAP credentials',
	IDENTITY_NOT_FOUND: 'LDAP user not found',
	IDENTITY_AMBIGUOUS: 'Multiple LDAP users matched',
	USER_INFO_MISSING: 'LDAP user info is missing',
	USER_EMAIL_MISSING: 'LDAP user email is missing',
	USER_ID_MISSING: 'LDAP user id is missing',
	USER_NAME_MISSING: 'LDAP user name is missing',
	LINK_ERROR: 'Failed to link LDAP account',
});
