# `REGISTRATION_DISABLED` enum upgrade — v2.13.2

Heimdall v2.13.2 is the first release that treats `REGISTRATION_DISABLED` as a scoped, fail-fast enum. Review this note before upgrading every Heimdall Server deployment, including deployments that use LDAP.

## Supported values

`REGISTRATION_DISABLED` is case-insensitive and supports these values:

| Value | Local registration | SSO/LDAP auto-account creation |
|---|---|---|
| unset or `false` | Allowed | Allowed |
| `true` | Disabled | Disabled |
| `local` | Disabled | Allowed |
| `sso` | Allowed | Disabled |

“SSO” covers every external-authentication provider, including GitHub, GitLab, Google, Okta, custom OIDC, and LDAP. Existing users can still sign in for every value when their external email matches a local Heimdall account.

## Check before upgrading

Two operator cohorts require action:

1. Deployments with `REGISTRATION_DISABLED=true` that rely on SSO or LDAP just-in-time (JIT) account creation. In v2.13.2, a first-time external user is rejected with `account_not_provisioned` because `true` now disables both account-creation paths. To preserve the earlier behavior—local registration disabled and external JIT enabled—change the value to `local`, following the rolling-upgrade ordering below.
2. Deployments with a value other than unset, `false`, `true`, `local`, or `sso`. Earlier versions treated values such as `1`, `yes`, `disabled`, and misspellings as permissive. v2.13.2 refuses to start and reports `Invalid REGISTRATION_DISABLED value` with the valid values. Replace an invalid value before upgrading.

If the variable is represented by YAML or a chart, model it as a string rather than a boolean and quote it, for example:

```yaml
REGISTRATION_DISABLED: 'local'
```

## Rolling upgrades and rollback

Pre-v2.13.2 backends read `local` and `sso` as values other than `true`, which silently allows both local registration and external JIT creation. For a rolling upgrade:

1. Keep the existing value while any backend instance is older than v2.13.2.
2. Upgrade every backend instance to v2.13.2 or later.
3. Only after all instances are upgraded, set `REGISTRATION_DISABLED=local` or `REGISTRATION_DISABLED=sso` and restart the backends.

During a `true` migration, newly upgraded instances reject JIT creation while older instances retain the historical behavior. Plan the rollout so first-time external users do not depend on mixed-version routing.

Before rolling back any backend below v2.13.2, set `REGISTRATION_DISABLED=true` and restart all current instances. Then roll back the application. This ordering avoids older backends interpreting `local` or `sso` as fully permissive. After the rollback is complete, reassess the setting against the older release’s boolean behavior.

## Pre-provisioned account safety

When `true` or `sso` requires an external user to be pre-provisioned, Heimdall matches the external identity to a local account by email. Follow all of these requirements:

- Store every pre-provisioned Heimdall email in lowercase and make it exactly match the email returned by the identity provider. Heimdall normalizes external emails to lowercase before matching.
- For LDAP, Heimdall uses the first value of a multi-valued attribute named by `LDAP_MAILFIELD`. Put the provisioned email first.
- Require an administrator-controlled, verified email attribute at the identity provider. GitHub and Google check provider verification; custom OIDC checks `email_verified` by default; GitLab and Okta do not perform an email-verification check; LDAP trusts the configured mail attribute.
- Do not set `OIDC_USES_VERIFIED_EMAIL=false` for pre-provisioned access. It permits an unverified OIDC email claim to bind to an existing Heimdall account, which can enable account takeover.

`REGISTRATION_DISABLED=sso` blocks silent external JIT creation but leaves local self-registration open. Because local registration does not verify email ownership, use `true` when administrators—not users—must control account creation.

Disabling creation does not disable or remove existing accounts. Administrators must separately review and delete unwanted accounts, accounting for the evaluations and other data those users own.
