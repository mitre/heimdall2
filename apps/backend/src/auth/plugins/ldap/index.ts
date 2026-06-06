// Vendored from mitre/better-auth-ldap (fork of aa900031/better-auth-ldap)
// Source: https://github.com/mitre/better-auth-ldap (feat/main-func branch)
// License: MIT
// When upstream publishes to npm, switch to: yarn add better-auth-ldap
import type { GenericEndpointContext } from '@better-auth/core'
import type { BetterAuthPlugin } from 'better-auth'
import type { AuthenticationOptions } from 'ldap-authentication'
import { Buffer } from 'node:buffer'
import { APIError, createAuthEndpoint } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { handleOAuthUserInfo } from 'better-auth/oauth2'
import {
	AUTH_RESULT_SUCCESS,
	authenticateResult,
} from 'ldap-authentication'
import * as z from 'zod'
import { LDAP_ERROR_CODES } from './error'

export { LDAP_ERROR_CODES } from './error'

type Awaitable<T> = T | Promise<T>

export type LdapEndpointContext = GenericEndpointContext

export interface LdapUserProfile extends Record<string, unknown> {
	dn?: string | undefined
}

export interface LdapUserInfo extends Record<string, unknown> {
	id: string
	email: string
	name: string
	emailVerified?: boolean | undefined
	image?: string | null | undefined
}

export interface LdapUserDnInput {
	providerId: string
	username: string
	ctx: LdapEndpointContext
}

export type LdapAuthenticationConfig = Omit<
	AuthenticationOptions,
	'username' | 'userPassword' | 'userDn'
> & {
	userDn?: string | ((input: LdapUserDnInput) => Awaitable<string>) | undefined
}

export interface LdapMapProfileInput {
	providerId: string
	username: string
	profile: LdapUserProfile
	ctx: LdapEndpointContext
}

interface LdapProviderBaseConfig {
	providerId: string
	disableImplicitSignUp?: boolean | undefined
	disableSignUp?: boolean | undefined
	overrideUserInfo?: boolean | undefined
	mapProfileToUser?:
		| ((input: LdapMapProfileInput) => Awaitable<Partial<LdapUserInfo> | undefined>)
		| undefined
}

export interface LdapProviderConfig extends LdapProviderBaseConfig {
	ldap: LdapAuthenticationConfig
}

export interface LdapOptions {
	config: LdapProviderConfig[]
}

export interface LdapPlugin extends BetterAuthPlugin {
	id: 'ldap'
	version: string
	endpoints: {
		signInWithLdap: ReturnType<typeof signInWithLdap>
	}
	$ERROR_CODES: typeof LDAP_ERROR_CODES
	options: LdapOptions
}

const signInWithLdapBodySchema = z.object({
	providerId: z.string().min(1).meta({
		description: 'The provider ID for the LDAP provider',
	}),
	username: z.string().min(1).meta({
		description: 'The LDAP username to authenticate',
	}),
	password: z.string().min(1).meta({
		description: 'The LDAP password to authenticate',
	}),
	requestSignUp: z.boolean().optional().meta({
		description: 'Explicitly request sign-up when implicit sign-up is disabled',
	}),
})

export function ldap(options: LdapOptions): LdapPlugin {
	return {
		id: 'ldap',
		version: '0.1.0',
		endpoints: {
			signInWithLdap: signInWithLdap(options),
		},
		$ERROR_CODES: LDAP_ERROR_CODES,
		rateLimit: [{
			pathMatcher: (path: string) => path === '/sign-in/ldap',
			max: 5,
			window: 60,
		}],
		options,
	} satisfies LdapPlugin
}

// eslint-disable-next-line ts/explicit-function-return-type
function signInWithLdap(options: LdapOptions) {
	return createAuthEndpoint(
		'/sign-in/ldap',
		{
			method: 'POST',
			body: signInWithLdapBodySchema,
			metadata: {
				allowedMediaTypes: [
					'application/x-www-form-urlencoded',
					'application/json',
				],
				openapi: {
					operationId: 'signInWithLdap',
					description: 'Sign in with LDAP',
					responses: {
						200: {
							description: 'Successfully signed in with LDAP',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											user: { type: 'object' },
										},
										required: ['user'],
									},
								},
							},
						},
					},
				},
			},
		},
		async (ctx) => {
			const providerConfig = options.config.find(
				config => config.providerId === ctx.body.providerId,
			)

			if (!providerConfig) {
				throw APIError.from('BAD_REQUEST', LDAP_ERROR_CODES.PROVIDER_CONFIG_NOT_FOUND)
			}

			// Cast ctx to LdapEndpointContext — the endpoint context is a structural
			// superset but TypeScript can't verify this due to better-auth's
			// EndpointContext<specific> vs GenericEndpointContext<string, any> variance.
			const ldapCtx = ctx as unknown as LdapEndpointContext

			const profile = await authenticateLdapUser(providerConfig, {
				ctx: ldapCtx,
				password: ctx.body.password,
				username: ctx.body.username,
			})

			const userInfo = await mapProfileToUser(providerConfig, {
				ctx: ldapCtx,
				profile,
				providerId: providerConfig.providerId,
				username: ctx.body.username,
			})

			const result = await handleOAuthUserInfo(ctx, {
				userInfo: {
					id: userInfo.id,
					email: userInfo.email,
					name: userInfo.name,
					emailVerified: userInfo.emailVerified ?? false,
					image: userInfo.image ?? undefined,
				},
				account: {
					providerId: providerConfig.providerId,
					accountId: userInfo.id,
				},
				disableSignUp:
					providerConfig.disableSignUp
					|| (providerConfig.disableImplicitSignUp && !ctx.body.requestSignUp),
				overrideUserInfo: providerConfig.overrideUserInfo,
			})

			if (result.error) {
				throw APIError.from('UNAUTHORIZED', LDAP_ERROR_CODES.LINK_ERROR)
			}

			const { session, user } = result.data!
			await setSessionCookie(
				ctx,
				{
					session,
					user,
				},
			)

			return ctx.json({
				user,
			})
		},
	)
}

async function authenticateLdapUser(
	providerConfig: LdapProviderConfig,
	input: {
		ctx: LdapEndpointContext
		password: string
		username: string
	},
): Promise<LdapUserProfile> {
	let authenticationOptions: AuthenticationOptions

	try {
		authenticationOptions = await resolveAuthenticationOptions(providerConfig, input)
	}
	catch (error) {
		throw APIError.from('BAD_REQUEST', LDAP_ERROR_CODES.AUTHENTICATION_FAILED)
	}

	let authenticationResult: Awaited<ReturnType<typeof authenticateResult>>
	try {
		authenticationResult = await authenticateResult(authenticationOptions)
	}
	catch (error) {
		throw APIError.from('UNAUTHORIZED', LDAP_ERROR_CODES.AUTHENTICATION_FAILED)
	}

	if (authenticationResult.code !== AUTH_RESULT_SUCCESS) {
		throw APIError.from('UNAUTHORIZED', getAuthenticationErrorCode(authenticationResult.code))
	}

	if (!isRecord(authenticationResult.user)) {
		throw APIError.from('UNAUTHORIZED', LDAP_ERROR_CODES.USER_INFO_MISSING)
	}

	return authenticationResult.user
}

async function resolveAuthenticationOptions(
	providerConfig: LdapProviderConfig,
	input: {
		ctx: LdapEndpointContext
		password: string
		username: string
	},
): Promise<AuthenticationOptions> {
	const { userDn, ...ldapOptions } = providerConfig.ldap
	const resolvedUserDn = typeof userDn === 'function'
		? await userDn({
				ctx: input.ctx,
				providerId: providerConfig.providerId,
				username: input.username,
			})
		: userDn

	return {
		...ldapOptions,
		...(resolvedUserDn ? { userDn: resolvedUserDn } : {}),
		username: input.username,
		userPassword: input.password,
	}
}

async function mapProfileToUser(
	providerConfig: LdapProviderConfig,
	input: LdapMapProfileInput,
): Promise<LdapUserInfo> {
	const defaultUserInfo = getDefaultUserInfo(input.profile, input.username)
	const mappedUserInfo = await providerConfig.mapProfileToUser?.(input)
	const userInfo = {
		...defaultUserInfo,
		...mappedUserInfo,
	}

	if (!userInfo.id) {
		throw APIError.from('UNAUTHORIZED', LDAP_ERROR_CODES.USER_ID_MISSING)
	}

	if (!userInfo.email) {
		throw APIError.from('UNAUTHORIZED', LDAP_ERROR_CODES.USER_EMAIL_MISSING)
	}

	if (!userInfo.name) {
		throw APIError.from('UNAUTHORIZED', LDAP_ERROR_CODES.USER_NAME_MISSING)
	}

	return {
		...userInfo,
		email: userInfo.email.toLowerCase(),
		emailVerified: userInfo.emailVerified ?? false,
	}
}

function getDefaultUserInfo(profile: LdapUserProfile, username: string): LdapUserInfo {
	const id = getFirstString(profile, [
		'dn',
		'uid',
		'sAMAccountName',
		'userPrincipalName',
		'mail',
	]) ?? username
	const email = getFirstString(profile, [
		'mail',
		'userPrincipalName',
		'email',
	])
	const name = getFirstString(profile, [
		'cn',
		'displayName',
		'name',
		'uid',
		'sAMAccountName',
	]) ?? username
	const image = getFirstString(profile, [
		'jpegPhoto',
		'thumbnailPhoto',
		'jpegPhoto;binary',
		'thumbnailPhoto;binary',
	])

	return {
		id,
		email: email ?? '',
		name,
		emailVerified: false,
		...(image ? { image } : {}),
	}
}

export function getFirstString(profile: LdapUserProfile, fieldNames: string[]): string | undefined {
	for (const fieldName of fieldNames) {
		const value = normalizeString(profile[fieldName])
		if (value) {
			return value
		}
	}
}

export function normalizeString(value: unknown): string | undefined {
	if (typeof value === 'string') {
		return value.trim() || undefined
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			const normalizedItem = normalizeString(item)
			if (normalizedItem) {
				return normalizedItem
			}
		}
	}

	if (value instanceof Uint8Array) {
		return Buffer.from(value).toString('base64')
	}
}

function isRecord(value: unknown): value is LdapUserProfile {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// All auth failure codes collapsed to AUTHENTICATION_FAILED to prevent user enumeration.
// Distinct codes (CREDENTIAL_INVALID, IDENTITY_NOT_FOUND, IDENTITY_AMBIGUOUS) would
// allow an attacker to determine whether a username exists. Rate limiting mitigates
// brute force but collapsing codes is defense in depth for STIG compliance.
function getAuthenticationErrorCode(_code: number): (typeof LDAP_ERROR_CODES)[keyof typeof LDAP_ERROR_CODES] {
	return LDAP_ERROR_CODES.AUTHENTICATION_FAILED
}

