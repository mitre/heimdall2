# MSW Mock Server Research — Splunk + SonarQube Tests

**Date:** 2026-06-06
**Card:** yzf.9
**Purpose:** Replace live service dependencies in hdf-converters tests

## Official MSW + Vitest Pattern (from mswjs/examples)

### File structure:
```
mocks/
  handlers.ts   — default request handlers
  node.ts       — setupServer(...handlers) export
vitest.setup.ts — lifecycle hooks (beforeAll/afterEach/afterAll)
vitest.config.ts — setupFiles: ['./vitest.setup.ts'], root: __dirname
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    root: __dirname,            // CRITICAL for path resolution
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

### vitest.setup.ts
```typescript
import { server } from './mocks/node.js'

beforeAll(() => { server.listen() })
afterEach(() => { server.resetHandlers() })
afterAll(() => { server.close() })
```

### mocks/node.ts
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers.js'

export const server = setupServer(...handlers)
```

### mocks/handlers.ts
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://api.example.com/user', () => {
    return HttpResponse.json({ firstName: 'John', lastName: 'Maverick' })
  }),
]
```

### Per-test handler overrides (Slack API example pattern)
```typescript
// From: https://dev.to/seratch/easier-typescript-api-testing-with-vitest-msw-4k3a
import { server } from './mocks/node'

it('handles specific scenario', async () => {
  server.use(
    http.post('https://api.example.com/endpoint', () => {
      return HttpResponse.json({ ok: true })
    }),
  )
  // test code using the override
})

// { once: true } for sequential responses (rate limit then success)
server.use(
  http.post('url', () => HttpResponse.text('error', { status: 429 }), { once: true }),
  http.post('url', () => HttpResponse.json({ ok: true })),
)
```

## What Our Tests Actually Call

### Splunk reverse mapper (1 test)
**Test file:** `test/mappers/reverse/splunk_reverse_mapper.spec.ts`
**What it does:** Loads HDF JSON, calls `new FromHDFToSplunkMapper(data).toSplunk(config, filename)`

**API calls made by toSplunk():**
1. `POST http://127.0.0.1:8089/services/auth/login` → returns `{sessionKey: '...'}`
2. `GET http://127.0.0.1:8089/services/data/indexes` → returns `{entry: [{name: 'main', ...}]}`
3. `POST http://127.0.0.1:8089/services/receivers/simple` (multiple times) → returns `{text: 'Success', code: 0}`

**Auth:** Username/password → session key in Authorization header

### SonarQube forward mapper (3 tests)
**Test file:** `test/mappers/forward/sonarqube_mapper.spec.ts`
**What it does:** Creates `new SonarqubeResults(url, projectKey, token)`, calls `mapper.toHdf()`

**API calls made by toHdf() (in order):**
1. `GET http://127.0.0.1:3001/api/server/version` → returns version string like `'10.8.0'`
2. `GET http://127.0.0.1:3001/api/webservices/list` → returns service catalog with valid statuses
3. `GET http://127.0.0.1:3001/api/issues/search?componentKeys=<project>&...` → returns paginated issues
4. `GET http://127.0.0.1:3001/api/components/tree?component=<project>&...` → returns component tree

**3 test scenarios:**
- Project 'xss' — standard issue search
- Project 'libc_unix' with branch 'release' — adds `&branch=release` param
- Project 'libc_unix' with pullRequest '123' — adds `&pullRequest=123` param

**Expected outputs already exist:**
- `sample_jsons/sonarqube_mapper/sonarqube-hdf.json`
- `sample_jsons/sonarqube_mapper/sonarqube-branch-hdf.json`
- `sample_jsons/sonarqube_mapper/sonarqube-pull-request-hdf.json`

**Challenge:** No sample INPUT fixtures exist. The expected output was generated from a live
SonarQube server. To create proper mock responses, we need to either:
- (a) Reverse-engineer what API responses would produce the expected output
- (b) Capture real API responses from a SonarQube instance
- (c) Run SonarQube in Docker, hit the API, save the responses as fixtures

## OpenAPI Specs Available

- **Tenable:** Official download at https://developer.tenable.com/reference/download-the-specs
- **SonarQube:** Web API at https://next.sonarqube.com/sonarqube/web_api (JSON schema)
- **Splunk:** Community spec at https://gist.github.com/Bre77/35c67a03e62d48fd802d2576920b1089
- **MSW @msw/source:** Can auto-generate handlers from OpenAPI specs

## Decision: How to Get SonarQube Fixtures

**Option A:** Run `docker run sonarqube:lts-community`, seed a project, hit the API, save responses.
Most accurate but heavy setup.

**Option B:** Read the sonarqube-mapper.ts (1400 lines) and reverse-engineer what response
shapes would produce the 3 expected HDF outputs. Tedious but no external dependencies.

**Option C:** Use the existing expected HDF output to understand the data shape, then construct
minimal API responses that contain the same issues/components/rules. The mapper transforms
API responses → HDF, so we need API responses that round-trip through the mapper to match
the expected output.

**Recommendation:** Option C — construct minimal fixtures that produce the expected output.

## SonarQube Fixture Gap Analysis (from first test run)

MSW infrastructure works — no ECONNRESET. But mock responses produce wrong HDF output.

### Issues found (xss test case):

1. **Missing v9 root-level pagination fields**
   - v9 responses include deprecated root-level `p`, `ps`, `total` alongside `paging` object
   - Fix: add `"p": 1, "ps": 100, "total": 1` to the search response root

2. **Code snippet is empty**
   - `/api/sources/raw` mock returns placeholder text, not real source lines
   - Expected output has: `27 })\n28 \n29 self.addEventListener('message', event => {...`
   - Fix: create a source code fixture file for `xss:packages/docs/src/service-worker.js`
   - The mapper fetches lines `startLine-3` to `endLine+3` (6-line window around the issue)

3. **Rule fixture has v10+ fields that v9 doesn't have**
   - `cleanCodeAttribute`, `cleanCodeAttributeCategory`, `impacts`, `securityStandards` are v10+ additions
   - v9 rule response uses `htmlDesc` (not removed), different field set
   - Fix: remove v10+ fields from rule fixture, keep only v9 fields

4. **`rules` array in search response shouldn't be there (or should match)**
   - The search response includes an inline `rules` array — the expected output doesn't expect it in passthrough
   - Fix: check if the mapper strips it or if it should be absent

5. **Passthrough data shape differences**
   - Expected output doesn't have `branchName`, `organization`, `pullRequestID` in passthrough for the basic test
   - These come from the mapper adding them — but the expected file was generated without them
   - Fix: either regenerate expected output or ensure mapper doesn't add undefined fields

### Approach for next session:

1. Get a REAL v9.9.8 response by running SonarQube in Docker:
   `docker run -d --name sonarqube -p 3001:9000 sonarqube:9.9-community`
   Then hit the API and capture actual responses. This is Option A (most accurate).

2. OR manually fix each fixture field to match v9 shapes exactly by reading the
   SonarQube 9.9 API docs: https://next.sonarqube.com/sonarqube/web_api

3. The `libc_unix` fixture needs to be created similarly — same approach as xss
   but for `c:S5847` rule with C language.

### Splunk: DONE
Splunk test passes with MSW mocks. 1/1 green. No more work needed.
The expected output files contain the issues with specific rule keys, severities, and
component paths. Map those backwards to SonarQube API response format using the type
definitions in sonarqube-mapper.ts (Search<T>, Issue_10, Rule_10, etc.).

## Sources

- [MSW official site](https://mswjs.io/)
- [MSW + Vitest official example](https://github.com/mswjs/examples/tree/main/examples/with-vitest)
- [MSW Node.js integration](https://mswjs.io/docs/integrations/node)
- [Vitest mocking requests guide](https://vitest.dev/guide/mocking/requests)
- [TypeScript API testing with Vitest + MSW (Slack example)](https://dev.to/seratch/easier-typescript-api-testing-with-vitest-msw-4k3a)
- [MSW @msw/source — OpenAPI handler generation](https://github.com/mswjs/source)
- [MSW vs Nock comparison 2026](https://www.pkgpulse.com/guides/msw-vs-nock-vs-axios-mock-adapter-api-mocking-2026)
