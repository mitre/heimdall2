# FIPS-Host Spike — ADR-006 §15/§10/§11 Empirical Findings

**Card:** `heimdall2-e25.1` · **Date:** 2026-08-08
**Host:** EC2 `i-00b942baf369dc6be`, RHEL 9.4 (`RHEL-9.4.0_HVM-20260217`), t3.medium
(2 vCPU, burstable), kernel FIPS mode enabled. Provisioned by
`packaging/test-infra/fips-ec2/` (cloud-init `fips-mode-setup --enable` + reboot).
**Container:** `registry.access.redhat.com/ubi9/nodejs-22-minimal:1`
(Node v22.23.1) under rootless podman — the exact image `Dockerfile:1` pins.
**Method:** every claim below is a live observation on this host; raw outputs
inline. Evidence markers follow ADR-006's standard: **[V]** verified by
execution here; **[U]** plausible mechanism, not load-bearing.

Host state, verified before any container work:

```
$ cat /proc/sys/crypto/fips_enabled
1
$ fips-mode-setup --check
FIPS mode is enabled.
$ openssl version
OpenSSL 3.0.7 1 Nov 2022 (Library: OpenSSL 3.0.7 1 Nov 2022)
```

---

## F1 — The provider ACTIVATES in the container with no container-local config. **[V]**

**The epic's STOP-gate question (ADR §15 [U] item 1) resolves YES.**

```
$ podman run --rm ubi9/nodejs-22-minimal:1 node -p 'require("crypto").getFips()'
1
$ podman run --rm ... sh -c 'find / -name fipsmodule.cnf 2>/dev/null'
(nothing)
$ podman run --rm ... sh -c 'ls -la /usr/lib64/ossl-modules/'
-rwxr-xr-x. 1 root root 1338392 Jun  3 15:40 fips.so
-rwxr-xr-x. 1 root root  140352 Jul 15 09:44 legacy.so
(abridged — total/./.. lines elided)
```

`crypto.getFips()` returns `1` inside the container, and **no `fipsmodule.cnf`
exists anywhere in the image**. Activation is pure host inheritance: kernel
`fips_enabled=1` → RHEL's patched OpenSSL reads it at runtime → Node inherits —
across the container boundary, with zero container-side configuration. This is
the §10 model working exactly as documented. The epic's deployment design
stands; no redesign needed.

## F2 — Provider identity and version, as deployed. **[V]**

```
$ podman run --rm ... sh -c 'openssl list -providers'
Providers:
  base     name: OpenSSL Base Provider      version: 3.5.5              status: active
  default  name: OpenSSL Default Provider   version: 3.5.5              status: active
  fips     name: Red Hat Enterprise Linux 9 - OpenSSL FIPS Provider
           version: 3.0.7-cda111b5812c30d4  status: active
```

The running module self-identifies as **`3.0.7-cda111b5812c30d4`** — a Red Hat
maintenance build, exactly as ADR §15 predicted, ≠ certificate #4857's validated
`3.0.7-395c1a240fbfffd8`. This is the observed string for the SSP posture
(cite cert #4857, disclose this build, self-affirm the OE per CMVP MM §7.9).

Note: the **default provider is active alongside fips** — the container's
OpenSSL config does not restrict to fips-only. Approved-algorithm enforcement
on RHEL comes via crypto-policies + the patched OpenSSL, not provider
exclusivity. Consistent with F5 (nothing blocks pure-JS code either).

## F3 — "Separate RPM since 9.2" is REFUTED. **[V]** (positive dating: inference)

Run **on the HOST** (RHEL 9.4). Scope note, reconciling with F1/F2: the
provider actually *loaded* in a container is the **image's own** `fips.so`
(F1's `ls`; F2's version string) — activation comes from the kernel flag, not
from host files crossing the boundary. This query dates when the **el9 package
stream** began shipping `fips.so` as its own RPM — which is precisely what §15
constraint 4 claims; host and UBI image draw from the same el9 stream:

```
$ rpm -qf /usr/lib64/ossl-modules/fips.so
openssl-fips-provider-3.0.7-2.el9.x86_64
$ rpm -q --changelog openssl-fips-provider | tail -2
* Wed Jan 24 2024 Simo Sorce <ssorce@redhat.com> - 3.0.7-1
Initial packaging
```

The FIPS provider **is** a separate RPM (`openssl-fips-provider`) — that half
of ADR §15 [U] item 4 is confirmed **[V]**. The "since 9.2" dating is
**refuted [V]**: a package first packaged 2024-01-24 cannot have shipped in
9.2 (GA May 2023). The positive placement — "9.4" — is an **inference [U]**
from the date falling between 9.3 GA (Nov 2023) and 9.4 GA (Apr 2024); the
load-bearing fact is the refutation plus the separate-RPM confirmation. The
pinning insight is unchanged: the provider version is decoupled from
`openssl-libs`, deliberately frozen at the validated module's base version
while the linking OpenSSL moves (3.5.5 in the container, per F2; 3.0.7 on
this 9.4 host, per the pasted `openssl version`).

## F4 — Performance on target hardware: latency 4× the laptop, throughput = physical cores. **[V]** ⚠️

Measured with the concurrency-ladder harness at
`packaging/test-infra/fips-ec2/spike/bench.js` (v2, part of this card's change
set — every published number re-derivable from it; the first harness ran a
single unlabelled concurrency and its **throughput and fs numbers are
retracted as methodology flaws** — its 40-sample sequential-latency phase was
sound and is retained below). Host topology **[V]**:

```
$ lscpu | grep -E '^CPU\(s\)|Thread|Core|Model name'
CPU(s):                               2
Model name:                           Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz
Thread(s) per core:                   2
Core(s) per socket:                   1
```

A t3.medium's "2 vCPU" is **two HT siblings of ONE physical core**.

Sequential latency, 40 samples (produced by the v1 harness's sequential phase
— methodologically sound and retained; the identical procedure is now
bench.js v2's sequential phase, `BENCH_SEQ_N`, same output format):

```
latency ms — p50: 594.3, p95: 600.7, min: 592.5, max: 600.7
```

Concurrency ladder (v2 harness; per-level sample count is 2×C, so ladder
latency columns characterize queueing shape — the 40-sample run above is the
latency source of record. These ladder runs predate the harness's added
sequential phase: reproduce byte-identical output with `BENCH_SEQ_N=0`):

```
fips=1 node=v22.23.1 iter=600000 nproc=2 threadpool=4 (default)
C   ops  wall_s  ops/sec  op_p50_ms  op_p95_ms  steal%
1   2    1.2     1.68     598        598        0.0
2   4    2.4     1.65     1214       1215       0.0
4   8    4.9     1.64     2425       2440       0.0
8   16   9.7     1.64     4754       4873       0.0
16  32   18.8    1.70     6941       9416       0.0
32  64   38.0    1.68     11743      19013      0.0
fs.readFile ms — baseline p50=0.15 p95=0.29 | under sustained 8-KDF load p50=12145.73 p95=12245.05

```

Second ladder, `UV_THREADPOOL_SIZE=8` (pasted in full):

```
fips=1 node=v22.23.1 iter=600000 nproc=2 threadpool=8
C   ops  wall_s  ops/sec  op_p50_ms  op_p95_ms  steal%
1   2    1.2     1.67     600        600        0.0
2   4    2.4     1.65     1214       1215       0.0
4   8    4.9     1.64     2427       2440       0.0
8   16   10.0    1.60     4948       5066       0.0
16  32   19.4    1.65     9658       9698       0.0
32  64   37.9    1.69     13840      19020      0.0
fs.readFile ms — baseline p50=0.15 p95=0.29 | under sustained 8-KDF load p50=4143.75 p95=4693.13
```

Two-container discriminator **[V]** — two isolated podman containers each
running continuous C=1 for 15 s, simultaneously
(script: `packaging/test-infra/fips-ec2/spike/two-container.sh`, this change set):

```
A ops: 13 in 15.784 s = 0.82 ops/sec
B ops: 13 in 15.746 s = 0.83 ops/sec      (aggregate 1.65 = the same ceiling)
```

- **Single-op cost: 594.3 ms p50 / 600.7 ms p95** (40-sample sequential run,
  pasted above) at 600k — vs 145 ms on the dev laptop (§11's number was real
  but not representative). **p95 exceeded the card's 500 ms STOP threshold** —
  surfaced; decision recorded below.
- **Throughput is pinned at 1.60–1.70 ops/sec at EVERY concurrency (1→32)
  and BOTH threadpool sizes** (the low point, 1.60, is the UV=8 ladder's C=8
  row — pasted above) **while wall time and p95 latency scale ~linearly with
  C** (p95: 598 → 1215 → 2440 → 4873 → 9416 → 19013; p50 tracks more loosely
  at mid-ladder due to completion-order spread) —
  real concurrency, hard ceiling. The two-container test splits the same
  1.65/sec between isolated processes, proving the bound is the **physical
  core**, not a threadpool artifact or a FIPS-provider lock. SMT contributes
  ~nothing to this ALU-bound SHA-512 loop. **Sizing law: KDF throughput ≈
  1.7 ops/sec × physical cores (this CPU generation, 600k iterations) —
  count cores, never vCPUs.**
- **`fs.readFile` starves catastrophically under SUSTAINED KDF load [V]:**
  p50 **12.1 s** at default threadpool, **4.1 s** at UV_THREADPOOL_SIZE=8.
  §11's starvation warning is reinstated *stronger* than its laptop numbers,
  and both mitigations now carry measured justification: the KDF concurrency
  limiter (bounding how many pool slots KDFs may hold) and UV_THREADPOOL_SIZE=8
  (3× less read-wait under saturation).
- **History of this finding:** harness v1 launched 8 one-shot KDFs (a
  transient, not sustained, load) and observed no starvation, which this doc
  briefly attributed to io_uring **[U]**. v2's continuous-refill load shows
  the truth; the io_uring hypothesis is **refuted** — reads demonstrably share
  the threadpool. v1's "throughput" run never recorded its concurrency and is
  superseded by the ladder.
- **Caveats [U — predictions, not measured]:** t3-class burstable credits
  could make sustained production load worse than these short runs; per-op
  latency on other CPU generations will differ. The measured sizing law above
  is the [V] part.

## F5 — bcryptjs executes freely under FIPS: the gate must be OURS. **[V]**

```
fips: 1
bcrypt.hashSync under FIPS: EXECUTED, prefix $2b$12$
bcrypt.compareSync correct pw: true
bcrypt.compareSync wrong pw: false
```

With the host in FIPS mode and the provider active, pure-JS bcrypt hashing and
comparison run to completion, unblocked and undetected. The platform will never
enforce ADR §3's prohibition — the application-level FIPS gate in
`verifyPassword` is the only enforcement point. Confirmed by execution.

## F6 — Node 24 behaves identically. **[V]**

`ubi9/nodejs-24-minimal:1` exists (Node v24.18.0, current LTS; the Dockerfile
pins 22). Activation checks, same host, outputs pasted:

```
$ podman run --rm ubi9/nodejs-24-minimal:1 sh -c 'node -v; node -p "require(\"crypto\").getFips()"'
v24.18.0
1
```

FIPS activation is identical to Node 22 **[V]**. A v1-methodology benchmark
run showed sequential latency consistent with Node 22 — expected, since pbkdf2
executes in OpenSSL's C code — but its output is not published here and **no
performance figure is claimed for Node 24 [U]**; re-derive with the v2 harness
against the nodejs-24 image if it ever becomes load-bearing. A future Node
bump requires no FIPS *activation* rework **[V — scoped to the tested
nodejs-24 image]**.

---

## Decision — iteration count: 600,000 stays (Aaron, 2026-08-08)

Rationale: best-practice default (OWASP's FIPS-context recommendation), and the
target deployment (140 AF PMOs) is Okta/Keycloak-dominant — external-auth users
never touch PBKDF2, so the payers are few and privileged (local break-glass
admins), exactly the accounts to harden hardest. Deployments tune via
`PASSWORD_HASH_ITERATIONS`; parameters live in each hash, so any later change
needs no migration. The real scale bottleneck is the API-key path, addressed
separately (ADR-007 card). Original decision table preserved below for the record.

### The options as presented

The card's STOP threshold (p95 > 500 ms) is exceeded at 600k on 2-vCPU cloud
hardware. Scaling from measured numbers:

| Iterations | p50 est. | Throughput est. (per physical core) | Standing |
|---|---|---|---|
| **600,000** (ADR default) | ~594 ms | ~1.6/sec | OWASP's "600k or more" for FIPS-140 contexts |
| **310,000** | ~307 ms | ~3.1/sec | above OWASP floor, middle path |
| **220,000** (OWASP floor) | ~218 ms | ~4.4/sec | §11's documented fallback |

All three clear the module's own minimum (1,000) by orders of magnitude, and
parameters live in the PHC string, so the choice is **tunable later without
migration** — hashes verify at their recorded iterations regardless (ADR §8's
no-propagation caveat noted). `PASSWORD_HASH_ITERATIONS` also lets individual
deployments tune per hardware. The decision sets the *default* in `e25.6`/§9.

## Verdict for the epic

**Foundation confirmed — proceed.** F1 clears the STOP-gate; F2 gives the SSP
posture string; F5 proves the gate design is necessary. The iteration default
is decided (600k — see Decision above); implementation lands in `e25.6`.
