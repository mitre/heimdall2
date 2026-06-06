// Vendored from mitre/better-auth-ldap (fork of aa900031/better-auth-ldap)
// Source: https://github.com/mitre/better-auth-ldap (feat/main-func branch)
// License: MIT
// When upstream publishes to npm, switch to: yarn add better-auth-ldap
import type { BetterAuthClientPlugin } from 'better-auth/client'
import type { LdapPlugin } from './index'

export interface LdapClientPlugin extends BetterAuthClientPlugin {
	id: 'ldap'
	$InferServerPlugin: LdapPlugin
}

export function ldapClient(): LdapClientPlugin {
	return {
		id: 'ldap',
		$InferServerPlugin: {} as LdapPlugin,
	} satisfies LdapClientPlugin
}
