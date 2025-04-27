# Logical OR vs Nullish Coalescing in Heimdall

This document explains the behavior and usage of logical OR (`||`) vs nullish coalescing (`??`) operators in the Heimdall codebase, particularly when dealing with configuration values.

## Operator Behavior

### Logical OR (`||`)

The logical OR operator (`||`) returns the right-hand side value if the left-hand side is falsy:

```javascript
'' || 'default'       // Returns 'default' (empty string is falsy)
0 || 'default'        // Returns 'default' (0 is falsy)
false || 'default'    // Returns 'default' (false is falsy)
null || 'default'     // Returns 'default' (null is falsy)
undefined || 'default' // Returns 'default' (undefined is falsy)
```

### Nullish Coalescing (`??`)

The nullish coalescing operator (`??`) only returns the right-hand side value if the left-hand side is null or undefined:

```javascript
'' ?? 'default'       // Returns '' (empty string is NOT nullish)
0 ?? 'default'        // Returns 0 (0 is NOT nullish)
false ?? 'default'    // Returns false (false is NOT nullish)
null ?? 'default'     // Returns 'default' (null is nullish)
undefined ?? 'default' // Returns 'default' (undefined is nullish)
```

## ConfigService Behavior

In Heimdall's ConfigService, environment variables that aren't set or are set to empty strings both return `undefined` when retrieved via `configService.get()`. This means:

```javascript
// If MY_ENV_VAR is unset or set to empty string:
configService.get('MY_ENV_VAR') === undefined // true

// Therefore, both these expressions behave the same for unset/empty variables
configService.get('MY_ENV_VAR') || 'default'  // Returns 'default'
configService.get('MY_ENV_VAR') ?? 'default'  // Returns 'default'
```

However, in other contexts where empty strings might be present (like user-provided values), the behavior would be different.

## Why We Use Logical OR

Throughout the codebase, we use the logical OR (`||`) operator for backward compatibility and consistent behavior. This ensures that:

1. Empty strings are treated as "not provided" and trigger default values
2. Legacy code continues to work as expected
3. Behavior is consistent with how the application has historically handled falsy values

For example, in authentication strategies, we use `||` to handle client IDs and secrets:

```javascript
clientID: configService.get('GITHUB_CLIENTID') || 'disabled'
```

This ensures that if the config value is empty, we fall back to 'disabled'.

## Testing for Expected Behavior

We've added tests to verify the behavior of both operators and ensure our code correctly handles empty strings and undefined values:

- `src/config/empty-string-fallbacks.spec.ts` - Tests ConfigService behavior with empty environment variables
- `src/authn/logical-op-behavior.spec.ts` - Verifies different operator behaviors
- `src/authn/auth-strategies.spec.ts` - Tests authentication strategies with empty config values

## Guidelines for Developers

- For configuration values, use the logical OR (`||`) operator to maintain backward compatibility
- Use nullish coalescing (`??`) only for new code where preserving empty strings, zero, or false is specifically needed
- Be aware that empty environment variables become `undefined` in ConfigService
- Add tests when changing operator behavior to ensure expected fallbacks

## Specific Changes in This PR

In PR #6830, we've reverted certain changes where nullish coalescing (`??`) was introduced to replace logical OR (`||`). These changes were made to maintain backward compatibility, specifically in:

1. Authentication strategies (GitHub, GitLab, Google, OIDC, LDAP)
2. Database module's sanitize function
3. ApiKey service

We've kept nullish coalescing in the Okta implementation as it was designed with this behavior in mind from the start.