# ADR-009: The Tenable Proxy Needs Three Independent Controls, Not One

**Status:** Accepted — implemented: guard `86f6.5`, allowlist `86f6.6`, redirects `86f6.12`,
address filter `86f6.13`
**Date:** 2026-08-15
**Author:** Aaron Lippold
**Branch:** `feature/fips-compliant-password-hashing`
**PR charter:** `heimdall2-zv9y`
**Related:** `heimdall2-86f6` (epic), `.5` `.6` `.12` `.13`, and ADR-008 (the audit that found this)

> **Numbering.** ADR-007 is reserved by card `heimdall2-8dy` (API-key credential hashing).

## Evidence standard

Every claim cites a file and line, a git object, or an upstream document **fetched in the session
that wrote this ADR**. Claims about *this branch* are checked against `origin/master`, because the
distinction between "we broke it" and "it shipped broken" changes who needs to act and how quickly.

## Context

### What the endpoint did

`POST /api/tenable/login` accepts `{host_url, accesskey, secretkey}`, fetches
`${host_url}/rest/currentUser`, and returns the upstream response body to the caller. A catch-all
`@All('*splat')` proxies every later request to the same host using session-stored credentials.

That is a server-side request primitive whose destination and whose response are both controlled by
the caller. Three defects made it exploitable:

1. **No authentication.** The controller carried `@Controller('api/tenable')` with no `@UseGuards`,
   and the application registers no global guard.
2. **No destination check.** `host_url` was used exactly as supplied.
3. **Redirects followed.** Both call sites use axios, which follows up to 21 redirects by default.

### These are pre-existing on master, not introduced by this branch

This matters for triage, so it was checked rather than assumed:

```bash
git show origin/master:apps/backend/src/tenable/tenable.controller.ts
# @Controller('api/tenable') — no @UseGuards; no maxRedirects on either call site
```

The file was introduced by `a23b7dbef` "Tenable Interface Refactor (#7032)", which is an ancestor of
`origin/master`. The defects are live in shipped code today. By contrast the two login regressions
that ADR-008 addresses (`3bdd1f146`, `14c13a0e9`) are **not** ancestors of `origin/master` — those
this branch introduced and this branch fixed.

### Why a unit suite never caught it

Every one of these is invisible to a green test run, which is the property that ties this epic
together:

- **Guard wiring.** Specs that mount a controller directly never exercise module composition, so a
  missing guard and a missing `ConfigModule` import both stay green while the running app is wrong.
- **HTTP client behaviour.** Whether redirects are followed is a property of the client at runtime,
  not of any value the code returns.
- **Types.** vitest runs through swc/oxc transpile-only, so a green suite carries no type
  information at all; `nest build` is the type gate.

## Decision

**Three independent controls, each with its own failure mode, its own test seam, and its own card.
None of them is sufficient alone, and the code says so where a reader will meet it.**

### 1. Authentication first — `heimdall2-86f6.5`

A class-level `@UseGuards(JwtAuthGuard)`, not a per-route list. The catch-all route means any future
route on this controller is reachable the moment it is declared, and a per-route list would silently
miss it.

### 2. An allowlist of permitted destinations — `heimdall2-86f6.6`

**Allowlist, not host-pinning.** Ruled by Aaron on 2026-08-15. Pinning every request to
`TENABLE_HOST_URL` would have been simpler and would have removed the hostname field from
`AuthStep.vue`; an allowlist keeps multi-instance deployments working by adding a configuration
line instead of removing a feature.

Sub-decisions, each of which is a place this class of control usually fails:

- **Compare parsed origins, never strings.** OWASP's SSRF Prevention Cheat Sheet (read 2026-08-15):
  "Deny-lists are bypass-prone. Prefer allow-lists", and do not accept complete URLs from the user
  because "URL are difficult to validate and the parser can be abused" — validate components. A
  `startsWith` or `includes` comparison admits `https://tenable.example.com.attacker.test` against
  an allowlist containing `https://tenable.example.com`.
- **WHATWG `URL.origin` is the comparison primitive.** It drops a default port, lowercases the host
  and discards the path, which also settles the normalization question for free: `AuthStep.vue`
  appends `https://` and `:443` client-side, so the server receives either form and both compare
  equal.
- **Only `http:` and `https:` may become allowlist entries**, enforced at config-parse time.
- **An empty allowlist refuses everything.** A deployment with no Tenable host configured has
  nothing legitimate to talk to, so the safe reading is "refuse", never "allow anything".
- **Rejections never echo the requested host.** Reflecting it turns the endpoint into a probe
  oracle. The caller already knows what it sent.

### 3. Do not follow redirects — `heimdall2-86f6.12`

OWASP, same document: "disable the support for the following of the redirection". The allowlist
governs where a request is **sent**; it cannot govern where the **response** sends it next. An
allowlisted host answering `302 Location: http://169.254.169.254/...` walks the server straight past
the check that just approved it.

`maxRedirects: 0` is set at **both** call sites — the login probe in the controller and the proxy's
own `axios.create` instance in the service. They are two independent configurations and fixing one
does not fix the other.

**A refused redirect is classified explicitly.** Per the axios documentation (fetched via Context7,
2026-08-15), `settle()` rejects any response failing `validateStatus`, whose default accepts 2xx
only — so a 302 arrives as an ordinary `AxiosError` carrying the 3xx response, and because the code
assignment is `status >= 400 && status < 500 ? ERR_BAD_REQUEST : ERR_BAD_RESPONSE`, a 3xx is
labelled `ERR_BAD_RESPONSE`. Left unclassified it would reach the controller's default branch, which
reports `status: error.response?.status` — Heimdall would answer the **upstream's** 302 as its own
status code, on behalf of a host it had just refused to follow. It is therefore answered as
`502 UPSTREAM_REDIRECT_REFUSED`, before any other classification.

### 4. Filter the connection's own resolved address — `heimdall2-86f6.13`

OWASP requires that after validating the domain, the application resolve the A/AAAA records and
apply the same checks to the resolved addresses. A name on the allowlist can still resolve into
link-local or private space, and can resolve differently between the check and the request (DNS
rebinding).

**The check runs inside the connection's own DNS lookup, not as a separate resolve-then-request
step.** This is the correction that matters, and it was made after the first version of this ADR
was written. Resolving separately and then handing the NAME to the HTTP client leaves the client to
resolve again when it connects, and the second answer can differ from the validated one — that gap
IS the rebinding window the control exists to close. Node lets a connection supply its own resolver
(`lookup` on `socket.connect`, documented as "Custom lookup function. Default: `dns.lookup()`"), so
validating there makes the address that was checked the same address the socket uses.

This is the established community pattern, taken from `azu/request-filtering-agent`, which
subclasses `http.Agent`, overrides `createConnection`, and injects a filtering `lookup`. Read from
its source on 2026-08-15 rather than recalled. At the network layer the equivalent control is an
egress proxy such as Stripe's `smokescreen`; that is a deployment decision and out of scope here.

**Implemented in-repo rather than by adding the dependency.** `request-filtering-agent` has ~26
stars; adding it as a supply-chain dependency of a MITRE product for a security control is a worse
trade than implementing the same ~60-line pattern on the standard library. Classification uses
`node:net` `BlockList`, which parses addresses and understands CIDR, so no dotted-quad regex or
mask arithmetic appears anywhere — and which maps IPv4-mapped IPv6 (`::ffff:169.254.169.254`) onto
the IPv4 rules, verified by test rather than assumed.

**Both agents are supplied at both call sites**, because axios selects between `httpAgent` and
`httpsAgent` by the target's protocol; supplying one leaves the other scheme unfiltered.

**Default-deny with an explicit operator opt-out.** The earlier framing of this control — "applies
to request-supplied hosts, not to the operator-configured one" — does not survive contact with
control 2: the allowlist has already reduced every permitted host to a configured origin, so
exempting configured origins would exempt everything and the control would do nothing. What an
operator actually needs is the ability to say "my Security Center really is on private space", which
is `TENABLE_ALLOW_PRIVATE_ADDRESSES`, default false. That matches how the community libraries expose
the same choice (`allowPrivateIPAddress`).

**Residual exposure, stated precisely.** There is no second resolution to disagree with the first,
so the classic rebinding window is closed for these agents. A name may still resolve to a permitted
address on one connection and a blocked one on the next — each connection is judged on its own
resolution, which is correct behaviour rather than a gap.

### The rule this ADR exists to state

**No single one of these closes SSRF, and no card that ships one of them may be read as having
closed it.** Every card says so in its own text, and `tenable-host-allowlist.ts` says so in its
module header, where the next person to change the file will meet it.

## Alternatives Considered

### A. Pin every request to `TENABLE_HOST_URL`

Rejected by Aaron, 2026-08-15. Strictly safer and strictly less capable: it removes the hostname
field from `AuthStep.vue` and breaks any deployment talking to more than one Security Center. The
allowlist reaches the same security property while a second instance costs one configuration line.

### B. Deny-list private and link-local ranges

Rejected. OWASP is explicit that deny-lists fail against encoded payloads, nested schemes and
normalization. A regex on `169.254.` looks simpler and is wrong.

### C. Substring / `startsWith` comparison against the configured host

Rejected — it admits the suffix attack described above. Pinned by a test, and by a mutation that
weakens the comparison to `startsWith` and is caught.

### D. One card for all of it

Rejected after the card was written. A single "fix the SSRF" card produced 21 acceptance criteria at
sp:5 whose first failing test went red only because a module did not exist — an import error, not a
demonstration of the vulnerability. Splitting by failure mode is what surfaced the redirect bypass,
which the combined card had not mentioned at all.

### E. A boolean-flagged decision type

The allowlist decision was first modelled as `{allowed: true} | {allowed: false, reason}`. This
repo sets neither `strict` nor `strictNullChecks`, so TypeScript will not narrow that union through
truthiness: `if (!decision.allowed)` compiles under vitest and then fails `nest build`. The working
form, `decision.allowed === false`, then collided with
`unicorn/no-unnecessary-boolean-comparison`. Replaced with a string tag —
`{kind: 'allowed'} | {kind: 'rejected'}` — which narrows correctly regardless of the compiler
setting and is not a comparison against a boolean literal. Both rules satisfied by code, no
`eslint-disable`.

## Consequences

- **Operators with more than one Security Center instance must set
  `TENABLE_ADDITIONAL_HOST_URLS`** (comma- or space-separated). Single-host deployments need no new
  configuration; `TENABLE_HOST_URL` is always permitted.
- **A deployment with no `TENABLE_HOST_URL` cannot use the Tenable integration at all.** This is
  deliberate: refuse over allow. It is also a behaviour change for anyone who was relying on the
  endpoint accepting an arbitrary host.
- **`502 UPSTREAM_REDIRECT_REFUSED` and `502 UPSTREAM_ADDRESS_REFUSED` are new response codes** on
  both Tenable paths, deliberately distinct from each other and from the allowlist's
  `400 HOST_NOT_ALLOWED`, so an operator can tell which control refused.
- **`TENABLE_ALLOW_PRIVATE_ADDRESSES` defaults to false.** A deployment whose Security Center runs
  on private address space must set it to true, and will otherwise see `UPSTREAM_ADDRESS_REFUSED`
  after upgrading. This is the one operator-visible behaviour change in the set.
- **All three controls are now in place.** That is not the same as "SSRF is impossible here" —
  it means the three failure modes this ADR names are each closed by a control with its own tests
  and its own mutation evidence. Any future change to these paths inherits the same obligation.
- Each control is pinned by mutation testing, and each card carries live evidence against a running
  server, because the whole class of defect is one a green unit suite cannot see.
