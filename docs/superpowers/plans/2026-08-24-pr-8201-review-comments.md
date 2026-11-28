# PR #8201 Review Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve only human review comments added August 17–19, 2026 to PR #8201 without merging newer `master` changes.

**Architecture:** Keep SAML authentication on current `feat/saml-auth` head. Centralize runtime/type authentication-strategy data through one JSON definition plus TypeScript/CommonJS adapters, preserve OAuth/Tenable-only Express sessions, surface a configurable `SAML_NAME`, and keep SAML claim extraction flat and scalar. Verify backend behavior with Vitest and login-button/MockSAML behavior with Cypress.

**Tech Stack:** TypeScript 6, NestJS 11, Vue 2/Vuetify, Vitest 4, Cypress, Passport/Node-SAML 5.1, CommonJS workspace runtime.

---

## Scope and review disposition

- Work from commit `390f364a413ff6fb44916e56b057c4b54a363a1a`; do not merge or rebase `master`.
- Address human review comments created August 17–19 only. Ignore older review threads.
- Do not change logger setup, imports, formatting, levels, transports, or messages.
- Do not add Cypress README material; reviewer explicitly requested that in a separate PR.
- Use the SAML logo artwork from `https://worldvectorlogo.com/logo/saml-1` as approved by the user.
- Keep `libs/common/interfaces/index.js` as a CommonJS runtime bridge because built backend code calls `require('@heimdall/common/interfaces')`. Remove duplicated strategy values by loading one JSON definition.
- Treat Node-SAML profile attributes as flat. Require identity claims to be non-empty scalar strings; a name such as `Mary Anne` remains one intact string. Reject multi-valued arrays rather than choosing an arbitrary value.
- Do not add `ConfigService.has()`. For the `.get()` predicate comment, read `SAML_ADDITIONAL_AUTHORIZE_PARAMS` once and test the saved value, preserving existing empty-string behavior.
- Keep Express sessions enabled only for OAuth callbacks or Tenable. SAML uses Node-SAML request-ID caching and does not need Passport/Express sessions in this flow.
- Before final verification, invoke `ponytail:ponytail` against only the review-fix diff after `390f364a413ff6fb44916e56b057c4b54a363a1a`. Do not audit or refactor unrelated PR code, user files, or newer `master` changes.

## Explicit review-comment checklist

1. [Alphabetize SAML strategy placement](https://github.com/mitre/heimdall2/pull/8201#discussion_r3798973135) — Task 5 groups direct strategy providers alphabetically.
2. [Build `AUTH_STRATEGIES` with `Object.values`](https://github.com/mitre/heimdall2/pull/8201#discussion_r3799028723) — Task 1 derives it from the shared strategy map.
3. [Remove redundant runtime strategy definitions](https://github.com/mitre/heimdall2/pull/8201#discussion_r3799060636) — Task 1 makes JSON the single value source and retains `index.js` only as the required CommonJS bridge.
4. [Hard-code the MockSAML origin](https://github.com/mitre/heimdall2/pull/8201#discussion_r3799260637) — Task 4 uses `http://localhost:4000`.
5. [Use a recognizable, sourced SAML logo](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809592325) — Task 5 uses the user-approved Worldvectorlogo artwork and records its source.
6. [Replace hard-coded SAML button text with a configurable name](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809635893) — Task 3 adds `SAML_NAME`/`samlName` through backend, shared contract, store, and UI.
7. [Simplify the combined-auth availability check](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809679896) — Task 5 checks `enabledAuthStrategies.length > 0`.
8. [Fix getter capitalization](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809683966) — Task 5 renames `ldapenabled` to `ldapEnabled`.
9. [Verify both OIDC and SAML login buttons](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809712756) — Task 4 adds verifier methods and calls them from Cypress flows.
10. [Document Cypress/MockSAML setup in a separate PR](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809730835) — explicitly excluded from this change, matching reviewer scope.
11. [Preserve intentional session restrictions](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809765268) — Task 1 restores OAuth/Tenable-only session activation; local, LDAP, and SAML remain excluded.
12. [Define OAuth strategy subset with other strategy data](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809775108) — Task 1 moves `OAUTH_AUTH_STRATEGIES` into shared strategy definitions.
13. [Keep required-claim helper in `saml.strategy.ts`](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809785903) — Task 2 moves it and deletes `resolve_claim.ts`.
14. [Treat SAML profile claims as flat](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809800250) — Task 2 uses direct bracket lookup by exact claim name.
15. [Do not select an arbitrary string from an array](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809810949) — Task 2 accepts one scalar string, rejects arrays, and tests `Mary Anne` intact.
16. [Avoid repeated `.get()` in the JSON-option predicate](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809842699) — Task 2 saves the setting once; no nonexistent `ConfigService.has()` API is added.
17. [Use given-name/family-name attribute terminology](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809860283) — Tasks 2–3 use `SAML_GIVEN_NAME_ATTRIBUTE` and `SAML_FAMILY_NAME_ATTRIBUTE`.

## File map

- `libs/common/interfaces/config/auth-strategy.json`: single runtime source for strategy values and OAuth subset.
- `libs/common/interfaces/config/auth-strategy.interface.ts`: typed adapters derived from JSON.
- `libs/common/interfaces/index.ts`: TypeScript exports.
- `libs/common/interfaces/index.js`: CommonJS runtime exports derived from JSON.
- `apps/backend/src/config/config.service.ts`: enabled strategy discovery, OAuth subset, `SAML_NAME` startup setting.
- `apps/backend/src/config/config.service.spec.ts`: strategy and startup-setting regression tests.
- `apps/backend/src/main.ts`: OAuth/Tenable-only session gate.
- `apps/backend/src/authn/saml.strategy.ts`: flat required-claim helper and reviewed SAML option cleanup.
- `apps/backend/src/authn/saml.strategy.spec.ts`: required-claim tests.
- `apps/backend/src/authn/resolve_claim.ts`: delete after moving helper.
- `libs/common/interfaces/config/startup-settings.interface.ts`: add `samlName` contract.
- `apps/backend/src/config/dto/startup-settings.dto.ts`: serialize `samlName`.
- `apps/frontend/src/store/server.ts`: store `samlName`.
- `apps/frontend/src/components/global/login/LocalLogin.vue`: configurable SAML button label.
- `apps/frontend/src/views/Login.vue`: simplified provider check and capitalization fix.
- `apps/backend/src/authn/authn.module.ts`: strategy ordering.
- `apps/frontend/src/assets/saml.svg`: approved SAML artwork.
- `apps/backend/README.md`: accurate logo source attribution.
- `apps/backend/.env-example`: document required SAML display name and canonical claim-variable names.
- `apps/backend/test/.env-ci`: set test SAML display name.
- `test/support/pages/LoginPage.ts`: fixed MockSAML origin.
- `test/support/verifiers/LoginPageVerifier.ts`: OIDC and SAML button assertions.
- `test/integration/login.cy.ts`: invoke new verifier assertions.

### Task 1: Centralize authentication strategy data and restore session semantics

**Files:**
- Create: `libs/common/interfaces/config/auth-strategy.json`
- Modify: `libs/common/interfaces/config/auth-strategy.interface.ts`
- Modify: `libs/common/interfaces/index.ts`
- Modify: `libs/common/interfaces/index.js`
- Modify: `apps/backend/src/config/config.service.ts`
- Modify: `apps/backend/src/config/config.service.spec.ts`
- Modify: `apps/backend/src/main.ts`

- [ ] **Step 1: Add failing strategy classification test**

Append this block inside the top-level `describe('Config Service', ...)` in `apps/backend/src/config/config.service.spec.ts`:

```ts
  describe('Authentication strategies', () => {
    it('separates OAuth callbacks from LDAP and SAML authentication', () => {
      const configService = new ConfigService();
      configService.set('LOCAL_LOGIN_DISABLED', 'true');
      configService.set('LDAP_ENABLED', 'true');
      configService.set('OIDC_CLIENTID', 'client-id');
      configService.set('SAML_NAME', 'MockSAML');
      configService.set('SAML_ENTRY_POINT', 'http://localhost:4000/api/saml/sso');
      configService.set('SAML_ISSUER', 'heimdall-local');
      configService.set('SAML_IDP_CERT', 'certificate');

      expect(configService.enabledAuthStrategies()).toEqual([
        'ldap',
        'oidc',
        'saml'
      ]);
      expect(configService.enabledOauthStrategies()).toEqual(['oidc']);
    });
  });
```

- [ ] **Step 2: Run test and confirm missing OAuth method**

Run:

```bash
yarn workspace heimdall-server vitest run src/config/config.service.spec.ts
```

Expected: FAIL because `ConfigService.enabledOauthStrategies` does not exist.

- [ ] **Step 3: Create one strategy-data source**

Create `libs/common/interfaces/config/auth-strategy.json`:

```json
{
  "strategies": {
    "GITHUB": "github",
    "GITLAB": "gitlab",
    "GOOGLE": "google",
    "LDAP": "ldap",
    "LOCAL": "local",
    "OIDC": "oidc",
    "OKTA": "okta",
    "SAML": "saml"
  },
  "oauthStrategies": ["github", "gitlab", "google", "oidc", "okta"]
}
```

Replace `libs/common/interfaces/config/auth-strategy.interface.ts` with:

```ts
import authStrategyDefinitions from './auth-strategy.json';

type AuthStrategyKey = keyof typeof authStrategyDefinitions.strategies;

export type AuthStrategy = Lowercase<AuthStrategyKey>;

export const AUTH_STRATEGY = authStrategyDefinitions.strategies as {
  readonly [Key in AuthStrategyKey]: Lowercase<Key>;
};

export const AUTH_STRATEGIES = Object.values(AUTH_STRATEGY) as AuthStrategy[];

export const OAUTH_AUTH_STRATEGIES =
  authStrategyDefinitions.oauthStrategies as AuthStrategy[];

export type ExternalAuthStrategy = Exclude<
  AuthStrategy,
  typeof AUTH_STRATEGY.LOCAL
>;
```

Change the authentication export block in `libs/common/interfaces/index.ts` to:

```ts
export {
  AUTH_STRATEGIES,
  AUTH_STRATEGY,
  OAUTH_AUTH_STRATEGIES
} from './config/auth-strategy.interface';
export type {
  AuthStrategy,
  ExternalAuthStrategy
} from './config/auth-strategy.interface';
```

Replace `libs/common/interfaces/index.js` with this CommonJS adapter:

```js
const authStrategyDefinitions = require('./config/auth-strategy.json');

const AUTH_STRATEGY = authStrategyDefinitions.strategies;
const AUTH_STRATEGIES = Object.values(AUTH_STRATEGY);
const OAUTH_AUTH_STRATEGIES = authStrategyDefinitions.oauthStrategies;

exports.AUTH_STRATEGIES = AUTH_STRATEGIES;
exports.AUTH_STRATEGY = AUTH_STRATEGY;
exports.OAUTH_AUTH_STRATEGIES = OAUTH_AUTH_STRATEGIES;
```

- [ ] **Step 4: Use shared OAuth subset and restore `enabledOauthStrategies()`**

Change imports at top of `apps/backend/src/config/config.service.ts` to:

```ts
import {
  AUTH_STRATEGY,
  OAUTH_AUTH_STRATEGIES
} from '@heimdall/common/interfaces';
import type {AuthStrategy} from '@heimdall/common/interfaces';
import type {SequelizeOptions} from 'sequelize-typescript';
```

Delete module-local `OAUTH_AUTH_STRATEGIES`. Add this method immediately before `enabledAuthStrategies()`:

```ts
  enabledOauthStrategies(): AuthStrategy[] {
    return OAUTH_AUTH_STRATEGIES.filter(authStrategy =>
      this.get(`${authStrategy.toUpperCase()}_CLIENTID`)
    );
  }
```

Inside `enabledAuthStrategies()`, replace the local OAuth filter with:

```ts
    enabledAuthStrategies.push(...this.enabledOauthStrategies());
```

Require the approved display name when enabling SAML:

```ts
    if (
      ['SAML_NAME', 'SAML_ENTRY_POINT', 'SAML_ISSUER', 'SAML_IDP_CERT'].every(
        setting => this.get(setting)
      )
    ) {
      enabledAuthStrategies.push(AUTH_STRATEGY.SAML);
    }
```

- [ ] **Step 5: Restore historical session condition**

In `apps/backend/src/main.ts`, replace the current non-local strategy predicate with:

```ts
  if (
    configService.enabledOauthStrategies().length ||
    configService.getTenableHostUrl().length
  ) {
```

Do not alter logger declarations or messages elsewhere in this file.

- [ ] **Step 6: Run strategy test and runtime export check**

Run:

```bash
yarn workspace heimdall-server vitest run src/config/config.service.spec.ts
node -e "const auth = require('./libs/common/interfaces'); if (auth.AUTH_STRATEGIES.length !== 8 || !auth.OAUTH_AUTH_STRATEGIES.includes('oidc')) process.exit(1)"
```

Expected: Vitest passes; Node exits `0` without output.

- [ ] **Step 7: Commit strategy/session change**

```bash
git add libs/common/interfaces/config/auth-strategy.json libs/common/interfaces/config/auth-strategy.interface.ts libs/common/interfaces/index.ts libs/common/interfaces/index.js apps/backend/src/config/config.service.ts apps/backend/src/config/config.service.spec.ts apps/backend/src/main.ts
git commit -m "fix: centralize auth strategy runtime data"
```

### Task 2: Make SAML claim extraction flat, scalar, and local to strategy

**Files:**
- Create: `apps/backend/src/authn/saml.strategy.spec.ts`
- Modify: `apps/backend/src/authn/saml.strategy.ts`
- Delete: `apps/backend/src/authn/resolve_claim.ts`

- [ ] **Step 1: Add failing flat-claim tests**

Create `apps/backend/src/authn/saml.strategy.spec.ts`:

```ts
import {describe, expect, it} from 'vitest';
import {getRequiredClaim} from './saml.strategy';

describe('getRequiredClaim', () => {
  it('returns a non-empty default claim', () => {
    expect(getRequiredClaim({email: 'saml@example.com'}, 'email')).toBe(
      'saml@example.com'
    );
  });

  it('reads a configured flat URI claim and preserves a multi-word name', () => {
    const givenNameClaim =
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname';

    expect(
      getRequiredClaim(
        {[givenNameClaim]: 'Mary Anne'},
        'firstName',
        givenNameClaim
      )
    ).toBe('Mary Anne');
  });

  it('rejects multi-valued identity claims', () => {
    expect(() =>
      getRequiredClaim({firstName: ['Mary', 'Anne']}, 'firstName')
    ).toThrowError('Missing required claim "firstName".');
  });

  it('rejects empty identity claims', () => {
    expect(() => getRequiredClaim({lastName: ''}, 'lastName')).toThrowError(
      'Missing required claim "lastName".'
    );
  });
});
```

- [ ] **Step 2: Run test and confirm helper is not exported from strategy**

Run:

```bash
yarn workspace heimdall-server vitest run src/authn/saml.strategy.spec.ts
```

Expected: FAIL because `saml.strategy.ts` does not export `getRequiredClaim`.

- [ ] **Step 3: Move and simplify helper**

In `apps/backend/src/authn/saml.strategy.ts`, add `UnauthorizedException` to the existing Nest import:

```ts
import {Injectable, UnauthorizedException} from '@nestjs/common';
```

Delete:

```ts
import { getRequiredClaim } from './resolve_claim';
```

Add this top-level function after imports and before `getSamlScoping()`:

```ts
export function getRequiredClaim(
  claims: Record<string, unknown>,
  defaultClaimName: string,
  configuredClaimName?: string
): string {
  const resolvedClaimName = configuredClaimName || defaultClaimName;
  const claimValue = claims[resolvedClaimName];

  if (typeof claimValue === 'string' && claimValue.length > 0) {
    return claimValue;
  }

  throw new UnauthorizedException(
    `Missing required claim "${resolvedClaimName}".`
  );
}
```

Delete `apps/backend/src/authn/resolve_claim.ts`.

- [ ] **Step 4: Rename reviewed claim settings**

In `SAMLStrategy.validate()`, keep `firstName` and `lastName` as default Node-SAML profile keys, but replace configured environment-variable names:

```ts
      getRequiredClaim(
        profile,
        'firstName',
        this.configService.get('SAML_GIVEN_NAME_ATTRIBUTE')
      ),
      getRequiredClaim(
        profile,
        'lastName',
        this.configService.get('SAML_FAMILY_NAME_ATTRIBUTE')
      ),
```

- [ ] **Step 5: Avoid duplicate config lookup in reviewed predicate**

Before `super({...})` in the SAML strategy constructor, add:

```ts
    const additionalAuthorizeParams = configService.get(
      'SAML_ADDITIONAL_AUTHORIZE_PARAMS'
    );
```

Replace the reviewed option with:

```ts
      additionalAuthorizeParams: additionalAuthorizeParams
        ? JSON.parse(additionalAuthorizeParams)
        : undefined,
```

Do not modify SAML strategy logger code.

- [ ] **Step 6: Run claim tests**

Run:

```bash
yarn workspace heimdall-server vitest run src/authn/saml.strategy.spec.ts
```

Expected: 4 tests pass.

- [ ] **Step 7: Commit claim change**

```bash
git add apps/backend/src/authn/saml.strategy.ts apps/backend/src/authn/saml.strategy.spec.ts apps/backend/src/authn/resolve_claim.ts
git commit -m "fix: validate flat SAML identity claims"
```

### Task 3: Add configurable SAML provider name through startup settings

**Files:**
- Modify: `apps/backend/src/config/config.service.spec.ts`
- Modify: `libs/common/interfaces/config/startup-settings.interface.ts`
- Modify: `apps/backend/src/config/dto/startup-settings.dto.ts`
- Modify: `apps/backend/src/config/config.service.ts`
- Modify: `apps/frontend/src/store/server.ts`
- Modify: `apps/frontend/src/components/global/login/LocalLogin.vue`
- Modify: `apps/backend/.env-example`
- Modify: `apps/backend/test/.env-ci`

- [ ] **Step 1: Add failing startup-setting test**

Add this test inside the `Authentication strategies` block created in Task 1:

```ts
    it('exposes the configured SAML provider name', () => {
      const configService = new ConfigService();
      configService.set('SAML_NAME', 'Agency SSO');

      expect(configService.frontendStartupSettings().samlName).toBe(
        'Agency SSO'
      );
    });
```

- [ ] **Step 2: Run test and confirm missing property**

Run:

```bash
yarn workspace heimdall-server vitest run src/config/config.service.spec.ts
```

Expected: FAIL because `StartupSettingsDto` has no `samlName` property.

- [ ] **Step 3: Add `samlName` to shared and backend startup contracts**

Add this property beside `oidcName` in `IStartupSettings`:

```ts
  readonly samlName: string;
```

Add this property beside `oidcName` in `StartupSettingsDto`:

```ts
  readonly samlName: string;
```

Add this constructor assignment beside `oidcName`:

```ts
    this.samlName = settings.samlName;
```

Add this property to `ConfigService.frontendStartupSettings()` beside `oidcName`:

```ts
      samlName: this.get('SAML_NAME') || '',
```

- [ ] **Step 4: Store and render `samlName` in frontend**

Add this property to `IServerState` in `apps/frontend/src/store/server.ts`:

```ts
  samlName: string;
```

Add this class field beside `oidcName`:

```ts
  samlName = '';
```

Add this startup mutation assignment beside `oidcName`:

```ts
    this.samlName = settings.samlName;
```

In `LocalLogin.vue`, replace the hard-coded SAML label with:

```vue
              <div class="pl-2">Login with {{ samlName }}</div>
```

Add this getter beside `oidcName`:

```ts
  get samlName() {
    return ServerModule.samlName;
  }
```

- [ ] **Step 5: Document and configure SAML settings**

Add this section after custom OIDC settings in `apps/backend/.env-example`:

```dotenv

## Custom SAML Service
SAML_NAME=<What you want your authentication method to be named on the frontend (no default, must be set)>
SAML_ENTRY_POINT=<Your identity provider SSO URL (no default, must be set)>
SAML_ISSUER=<Your Heimdall service-provider entity ID (no default, must be set)>
SAML_IDP_CERT=<Your identity provider signing certificate in PEM format or as a base64 encoded string (no default, must be set)>
SAML_EMAIL_ATTRIBUTE=<Identity provider attribute containing email (default=email)>
SAML_GIVEN_NAME_ATTRIBUTE=<Identity provider attribute containing given name (default=firstName)>
SAML_FAMILY_NAME_ATTRIBUTE=<Identity provider attribute containing family name (default=lastName)>
```

Add this line before `SAML_ENTRY_POINT` in `apps/backend/test/.env-ci`:

```dotenv
SAML_NAME=MockSAML
```

- [ ] **Step 6: Run startup-setting tests**

Run:

```bash
yarn workspace heimdall-server vitest run src/config/config.service.spec.ts
```

Expected: all ConfigService tests pass.

- [ ] **Step 7: Commit provider-name change**

```bash
git add apps/backend/src/config/config.service.spec.ts libs/common/interfaces/config/startup-settings.interface.ts apps/backend/src/config/dto/startup-settings.dto.ts apps/backend/src/config/config.service.ts apps/frontend/src/store/server.ts apps/frontend/src/components/global/login/LocalLogin.vue apps/backend/.env-example apps/backend/test/.env-ci
git commit -m "feat: configure SAML login provider name"
```

### Task 4: Add reviewed login-button verification and fixed MockSAML origin

**Files:**
- Modify: `test/support/pages/LoginPage.ts`
- Modify: `test/support/verifiers/LoginPageVerifier.ts`
- Modify: `test/integration/login.cy.ts`

- [ ] **Step 1: Add verifier methods before wiring tests**

Add these methods to `LoginPageVerifier`:

```ts
  oidcLoginButtonPresent(): void {
    cy.get('#oauth-oidc')
      .should('be.visible')
      .and('contain.text', 'Login with Mock Server');
  }

  samlLoginButtonPresent(): void {
    cy.get('#saml')
      .should('be.visible')
      .and('contain.text', 'Login with MockSAML');
  }
```

- [ ] **Step 2: Invoke button verifiers from integration flows**

At start of OIDC authentication test in `test/integration/login.cy.ts`, add:

```ts
      loginPageVerifier.oidcLoginButtonPresent();
```

At start of SAML authentication test, add:

```ts
      loginPageVerifier.samlLoginButtonPresent();
```

- [ ] **Step 3: Hard-code documented MockSAML origin**

Replace origin initialization in `LoginPage.loginSaml()` with:

```ts
    const origin = 'http://localhost:4000';
```

Leave the existing `cy.origin()` login interaction unchanged.

- [ ] **Step 4: Type-check changes through Cypress build**

Run:

```bash
yarn workspace @heimdall/cypress-tests tsc --noEmit
```

Expected: command exits `0` with no TypeScript errors.

- [ ] **Step 5: Commit verifier change**

```bash
git add test/support/pages/LoginPage.ts test/support/verifiers/LoginPageVerifier.ts test/integration/login.cy.ts
git commit -m "test: verify OIDC and SAML login buttons"
```

### Task 5: Apply reviewed UI ordering, naming, and logo changes

**Files:**
- Modify: `apps/frontend/src/views/Login.vue`
- Modify: `apps/backend/src/authn/authn.module.ts`
- Modify: `apps/frontend/src/assets/saml.svg`
- Modify: `apps/backend/README.md`

- [ ] **Step 1: Simplify login availability and capitalization**

In `apps/frontend/src/views/Login.vue`, replace `anyAuthProvidersAvailable` with:

```ts
  get anyAuthProvidersAvailable() {
    return ServerModule.enabledAuthStrategies.length > 0;
  }
```

Rename the getter and template reference from `ldapenabled` to `ldapEnabled`:

```ts
  get ldapEnabled() {
    return ServerModule.enabledAuthStrategies.includes('ldap');
  }
```

```vue
                <v-tab
                  v-if="ldapEnabled"
```

- [ ] **Step 2: Group strategy providers alphabetically**

In `apps/backend/src/authn/authn.module.ts`, normalize the SAML import:

```ts
import {SAMLStrategy} from './saml.strategy';
```

Keep services separate and order direct strategy class providers alphabetically:

```ts
  providers: [
    AuthnService,
    ApiKeyService,
    APIKeyStrategy,
    GithubStrategy,
    GitlabStrategy,
    GoogleStrategy,
    JwtStrategy,
    LDAPStrategy,
    LocalStrategy,
    SAMLStrategy,
```

Keep existing OIDC and Okta factory provider objects after this direct-strategy block without changing factory behavior.

- [ ] **Step 3: Replace generic certificate icon with approved SAML artwork**

Replace `apps/frontend/src/assets/saml.svg` with the approved logo geometry, removing the source file's invalid negative height while preserving its view box and path:

```svg
<svg viewBox="4.3 26.6 86.6 21.5" xmlns="http://www.w3.org/2000/svg">
  <path d="m70.6 26.7h-3.8l-5.5 16.9-5.3-16.9h-6.4v21.1h3.8v-16.5l5.5 16.5h4.8l5.5-16.6v16.6h3.8v-21.1zm-27.7 21.1h4.6l-9.4-21.1h-4.4l-9 21.1h4.8l2-5.1h9.3zm-9.9-8.9 3.1-8 3.2 8zm-11.5-3.2c-.6-.3-1-.3-1.5-.3h-8.7c-1.1-.1-1.3-.3-1.3-.3s-.8-.4-.7-2.4 2-2.3 2-2.3h12.3v-3.8h-14.8s-4.5 1.8-4.5 6.9c0 4.4 3.1 5.4 3.9 5.6h8.8c2 0 2.1.3 2.1.3s.8.4.7 2.4c0 2-2 2.3-2 2.3h-12.7v3.9h14.8s4.5-1.8 4.5-6.9c.2-3.6-1.7-4.8-2.9-5.4zm61.4 8.6s-2.8 0-2.8-4.2v-13.4h-3.8v13.4s-.8 7.7 6.1 8h8.5v-3.8z" fill="#c32527"/>
</svg>
```

- [ ] **Step 4: Record accurate logo source**

Replace the existing logo sentence in `apps/backend/README.md` with:

```md
Login-provider logos except SAML are sourced from SVG Repo and covered by its Logo License or MIT License: https://www.svgrepo.com/page/licensing/. The SAML logo is sourced from https://worldvectorlogo.com/logo/saml-1.
```

- [ ] **Step 5: Commit reviewed presentation changes**

```bash
git add apps/frontend/src/views/Login.vue apps/backend/src/authn/authn.module.ts apps/frontend/src/assets/saml.svg apps/backend/README.md
git commit -m "fix: address SAML login presentation review"
```

### Task 6: Verify focused behavior, builds, and MockSAML flow

**Files:**
- Verify only; do not modify logger code for lint failures.

- [ ] **Step 1: Run focused backend tests**

```bash
yarn workspace heimdall-server vitest run src/config/config.service.spec.ts src/authn/saml.strategy.spec.ts
```

Expected: both files pass.

- [ ] **Step 2: Run backend and frontend builds**

```bash
yarn backend build
yarn frontend build
```

Expected: both builds exit `0`.

- [ ] **Step 3: Run targeted lint without autofix**

```bash
yarn eslint --max-warnings 0 apps/backend/src/authn/authn.module.ts apps/backend/src/authn/saml.strategy.ts apps/backend/src/authn/saml.strategy.spec.ts apps/backend/src/config/config.service.ts apps/backend/src/config/config.service.spec.ts apps/backend/src/config/dto/startup-settings.dto.ts apps/backend/src/main.ts apps/frontend/src/components/global/login/LocalLogin.vue apps/frontend/src/store/server.ts apps/frontend/src/views/Login.vue libs/common/interfaces/config/auth-strategy.interface.ts libs/common/interfaces/config/startup-settings.interface.ts test/integration/login.cy.ts test/support/pages/LoginPage.ts test/support/verifiers/LoginPageVerifier.ts
```

Expected: command exits `0`. If existing logger code triggers lint, report it separately and do not rewrite logger setup or messages.

- [ ] **Step 4: Run Ponytail only on review-fix changes**

List the scoped files and diff:

```bash
git diff --name-only 390f364a413ff6fb44916e56b057c4b54a363a1a...HEAD -- apps/backend apps/frontend libs/common test
git diff 390f364a413ff6fb44916e56b057c4b54a363a1a...HEAD -- apps/backend apps/frontend libs/common test
```

Invoke `ponytail:ponytail` in full mode using only that diff. Apply only simplifications that preserve the 17 approved review dispositions. Do not inspect or change code outside the listed diff.

- [ ] **Step 5: Run login Cypress spec against approved MockSAML**

With MockSAML available at `http://127.0.0.1:4000/` and Heimdall test services running from `apps/backend/test/.env-ci`, run:

```bash
yarn test:ui --spec test/integration/login.cy.ts
```

Expected: login spec passes, including visible OIDC/SAML buttons and SAML user fields `saml@example.com`, `saml`, `saml`.

- [ ] **Step 6: Review final diff against approved scope**

Run:

```bash
git diff --check
git status --short
git diff HEAD~5 -- apps/backend apps/frontend libs/common test
```

Expected: no whitespace errors; only files listed in this plan plus this plan document are changed. `AGENTS.md` and `CONTEXT.md` remain untouched user-owned untracked files.

- [ ] **Step 7: Record verification-only completion if needed**

Do not create an empty commit. Report commands and results in handoff.
