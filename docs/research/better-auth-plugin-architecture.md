# better-auth Plugin Architecture Reference

Research document for izw.16.11. Informs all downstream plugin work:
LDAP (izw.16.5), password-policy (izw.16.10), API keys (izw.16.6).

Source: better-auth 1.6.13, read from node_modules + Context7 docs.

## BetterAuthPlugin Interface

From `@better-auth/core/src/types/plugin.ts`:

```typescript
type BetterAuthPlugin = {
  id: LiteralString;
  version?: string;
  init?: (ctx: AuthContext) => Awaitable<{
    context?: DeepPartial<Omit<AuthContext, "options">> & Record<string, unknown>;
    options?: Partial<BetterAuthOptions>;
  } | void>;
  endpoints?: { [key: string]: Endpoint };
  middlewares?: { path: string; middleware: Middleware }[];
  onRequest?: (request: Request, ctx: AuthContext) => Promise<{response: Response} | {request: Request} | void>;
  onResponse?: (response: Response, ctx: AuthContext) => Promise<{response: Response} | void>;
  hooks?: {
    before?: { matcher: (ctx: HookEndpointContext) => boolean; handler: AuthMiddleware }[];
    after?: { matcher: (ctx: HookEndpointContext) => boolean; handler: AuthMiddleware }[];
  };
  schema?: BetterAuthPluginDBSchema;
  migrations?: Record<string, Migration>;
  options?: Record<string, any>;
  $Infer?: Record<string, any>;
  $ERROR_CODES?: Record<string, RawError>;
  rateLimit?: { window: number; max: number; pathMatcher: (path: string) => boolean }[];
  adapter?: { [key: string]: (...args: any[]) => Awaitable<any> };
};
```

## Plugin Lifecycle

1. **Registration**: Plugin factory function called with options, returns `BetterAuthPlugin` object.
2. **Schema merge**: `getAuthTables(options)` merges all plugin `schema` fields into
   the core table definitions. This happens BEFORE `init()` runs.
3. **Init**: `runPluginInit` calls each plugin's `init(ctx: AuthContext)` in array order.
   - Return `{ context: {...} }` to extend the auth context (e.g., wrap password hash).
   - Return `{ options: {...} }` to modify auth options (e.g., add databaseHooks).
   - `databaseHooks` returned from init are extracted and collected separately with
     `source: "plugin:${plugin.id}"` attribution, then `internalAdapter` is rebuilt.
   - Return `void` for no modifications.
4. **Endpoint + Hook + Middleware collection**: `getEndpoints()` and `toAuthEndpoints()`
   collect all plugin endpoints, hooks, and middlewares in a single pass. Hooks are
   appended in plugin array order (user hooks first, then plugin hooks).
5. **Runtime**: Router dispatches requests. For each request:
   - `onRequest` runs (all plugins, in array order) — before routing.
   - Route matched, middlewares run, `hooks.before` checked and executed.
   - Endpoint handler runs.
   - `hooks.after` checked and executed.
   - `onResponse` runs (all plugins, in array order) — after response.

Plugin array order in the `plugins: [...]` config determines execution priority
for `onRequest`, `onResponse`, `init`, and hook ordering.

## Endpoint Registration Pattern

Endpoints use `createAuthEndpoint` from `better-auth/api`:

```typescript
import { createAuthEndpoint } from 'better-auth/api';
import * as z from 'zod';

const myEndpoint = createAuthEndpoint(
  '/my-plugin/action',          // path (appended to basePath)
  {
    method: 'POST',
    body: z.object({            // Zod schema for request body
      field: z.string().min(1),
    }),
    requireHeaders: true,       // require auth headers
    use: [sessionMiddleware],   // middleware chain
    metadata: {
      openapi: {                // OpenAPI spec for this endpoint
        operationId: 'myAction',
        summary: 'Do something',
        responses: { 200: { description: 'Success', content: {...} } },
      },
    },
  },
  async (ctx) => {
    // ctx.body — validated request body
    // ctx.context — AuthContext (adapter, internalAdapter, options, etc.)
    // ctx.context.session — current session (if middleware attached)
    return ctx.json({ result: 'ok' });
  },
);
```

Key observations from first-party plugins:
- Body schemas use `z.object()` with `.meta({ description })` for OpenAPI.
- All admin endpoints use `requireHeaders: true` + `use: [adminMiddleware]`.
- Endpoints return via `ctx.json()` — never raw objects.
- The `ctx.context.internalAdapter` provides typed DB operations.
- The `ctx.context.adapter` provides generic model CRUD.

## Hook System (hooks.before / hooks.after)

Hooks intercept requests to specific endpoints:

```typescript
hooks: {
  before: [{
    matcher: (context) => context.path === '/sign-up/email',
    handler: createAuthMiddleware(async (ctx) => {
      // Run BEFORE the endpoint handler
      // Return { context: ctx } to modify context
      // Throw APIError to reject the request
      // Return nothing to pass through
    }),
  }],
  after: [{
    matcher: (context) => context.path === '/list-sessions',
    handler: createAuthMiddleware(async (ctx) => {
      // Run AFTER the endpoint handler
      // ctx.context.returned — the endpoint's return value
      // Return ctx.json(...) to override the response
    }),
  }],
}
```

Matcher receives `HookEndpointContext` with `path`, `context`, `headers`.
Handler uses `createAuthMiddleware` from `better-auth/api` (or `@better-auth/core/api`).

## init() Pattern — Context Extension

The `init()` function is the most powerful plugin capability. It runs once at
startup and can wrap core behavior.

**HIBP plugin (password validation via init)**:
```typescript
init(ctx) {
  const originalHash = ctx.password.hash;
  return {
    context: {
      password: {
        ...ctx.password,
        async hash(password) {
          // Validate password BEFORE hashing
          await checkPasswordCompromise(password);
          return originalHash(password);
        },
      },
    },
  };
},
```

This pattern wraps `ctx.password.hash` — every password hash call goes through
the plugin first. This is the correct pattern for password-policy validation.

**Admin plugin (databaseHooks via init)**:
```typescript
init() {
  return {
    options: {
      databaseHooks: {
        user: {
          create: {
            async before(user) {
              return { data: { role: 'user', ...user } };
            },
          },
        },
        session: {
          create: {
            async before(session, ctx) {
              const user = await ctx.context.internalAdapter.findUserById(session.userId);
              if (user?.banned) throw APIError.from('FORBIDDEN', { ... });
            },
          },
        },
      },
    },
  };
},
```

## Schema Extension Pattern

Plugins extend existing tables or create new ones via `schema`:

```typescript
schema: {
  // Extend existing 'user' table with new columns
  user: {
    fields: {
      role: { type: 'string', required: false, input: false },
      banned: { type: 'boolean', defaultValue: false, required: false, input: false },
    },
  },
  // Create a new table
  apikey: {
    fields: {
      key: { type: 'string', required: true },
      userId: { type: 'string', required: true, references: { model: 'user', field: 'id' } },
      expiresAt: { type: 'date', required: false },
    },
    modelName: 'apikey',  // optional: SQL table name override
  },
}
```

Field types: `string`, `boolean`, `number`, `date`.
Field options: `required`, `defaultValue`, `input` (false = not settable via API),
`unique`, `references` (FK).

Use `mergeSchema(baseSchema, userOverrides)` from `better-auth/db` to allow
users to extend plugin schemas.

## Error Handling Conventions

### Error codes — `defineErrorCodes`

```typescript
import { defineErrorCodes } from '@better-auth/core/utils/error-codes';

const MY_ERROR_CODES = defineErrorCodes({
  PASSWORD_TOO_SHORT: 'Password must be at least N characters',
  MISSING_REQUIRED_CLASS: 'Password must contain uppercase, lowercase, digits, and special characters',
});
```

Export as `$ERROR_CODES` on the plugin object for type inference.

### Throwing errors — `APIError`

```typescript
import { APIError } from 'better-auth/api';

// From HTTP status
throw APIError.fromStatus('UNAUTHORIZED');

// From error code with custom message
throw APIError.from('BAD_REQUEST', {
  message: MY_ERROR_CODES.PASSWORD_TOO_SHORT.message,
  code: MY_ERROR_CODES.PASSWORD_TOO_SHORT.code,
});

// Direct construction
throw new APIError('INTERNAL_SERVER_ERROR', { message: 'Something went wrong' });
```

Patterns from first-party plugins:
- Use `APIError.from(status, errorCode)` for domain errors with specific codes.
- Use `APIError.fromStatus(status)` for generic HTTP errors.
- Re-throw `APIError` instances, wrap non-APIError in classified errors.
- Collapse error codes when distinct codes would enable user enumeration (LDAP pattern).

## Testing Patterns

From reading better-auth's test utilities in `dist/test-utils/`:

1. **Unit tests**: Test plugin factory functions, schema definitions, error codes.
2. **Integration tests**: Use `createAuth({...})` with the plugin, test endpoints via HTTP.
3. **Mock-free**: better-auth tests use real DB adapters (SQLite in-memory for speed).
4. **`getTestInstance`**: better-auth's own test helper creates a full auth instance.

For Heimdall:
- Use `createAuth({envOverrides, connectionConfig})` factory pattern.
- Test plugin config (include/exclude based on env vars) via options inspection.
- Test hooks/init by examining the auth instance's options.
- Test endpoints via real HTTP requests against a running auth instance.
- Test against real infrastructure (e.g., rroemhild/test-openldap for LDAP).

## Audit: Vendored LDAP Plugin vs Best Practices

### Compliant
- Uses `createAuthEndpoint` with Zod body schema and OpenAPI metadata.
- Uses `APIError` with classified error codes from `defineErrorCodes`-style constants.
- Collapses auth failure codes to prevent user enumeration.
- Uses `satisfies LdapPlugin` (which extends `BetterAuthPlugin`) for type checking.
- Body schema uses `.meta({ description })` for OpenAPI.
- Handles all auth result codes exhaustively.
- Proper error classification (BAD_REQUEST vs UNAUTHORIZED).

### Gaps
1. **Error codes not using `defineErrorCodes`**: `error.ts` exports a plain `const`
   object instead of using `defineErrorCodes()` from `@better-auth/core/utils/error-codes`.
   The first-party pattern uses `defineErrorCodes()` which returns `{ code, message }`
   pairs. Our error codes are plain strings. Impact: `$ERROR_CODES` won't have proper
   `RawError` type structure.

2. **Missing `$ERROR_CODES` on plugin object**: The plugin factory returns
   `{ id, endpoints, options }` but does not export `$ERROR_CODES: LDAP_ERROR_CODES`.
   First-party plugins include this for type inference.

3. **Missing `version` field**: First-party plugins include `version: PACKAGE_VERSION`.
   Our plugin omits it. Non-breaking but inconsistent.

4. **Type cast at call site**: `ctx as unknown as LdapEndpointContext` at line 161.
   This is documented and stems from EndpointContext variance. Acceptable but should
   be revisited when better-auth provides a generic context type.

5. **No rate limiting**: First-party auth endpoints include rate limit rules.
   The LDAP sign-in endpoint should have rate limiting to prevent brute force.
   Currently handled by the global auth config rate limit rules, but a plugin-specific
   rule would be defense in depth.

## Implications for Downstream Cards

### izw.16.10 (password-policy plugin)
- Use the HIBP `init()` pattern: wrap `ctx.password.hash` to validate before hashing.
- Use `defineErrorCodes()` for error code definitions.
- Export `$ERROR_CODES` on the plugin object.
- Include `version` field.
- Match paths: `/sign-up/email`, `/change-password`, `/reset-password` (same as HIBP).
- Do NOT use hooks.before — the `init()` password wrapper is the canonical pattern.

### izw.16.5 (LDAP review)
- Fix error codes to use `defineErrorCodes()` format.
- Add `$ERROR_CODES` to plugin return object.
- Add `version` field.
- Consider adding plugin-specific rate limit rule.

### izw.16.6 (API keys)
- This uses the first-party `@better-auth/api-key` package — no custom plugin needed.
- Wire it via `plugins: [apiKey({...})]` in auth config.
- The package handles schema, endpoints, rate limiting internally.
- Our job is configuration only: map existing API key env vars to plugin options.
