---
title: Installation
description: Index of the supported ways to install Heimdall, with guidance on choosing one.
---

# Installation

Heimdall ships in two shapes, and picking the right one first saves the most
time.

**Heimdall Lite** is the standalone viewer. It is a static single-page
application — it loads HDF results in your browser, stores nothing, and needs no
database and no server. If your goal is to look at scan results, this is the
whole answer.

**Heimdall Server** adds a backend and a PostgreSQL database, which is what
gives you user accounts, saved evaluations, groups, and the API. Choose it when
results need to persist or be shared.

## Heimdall Lite

No installation:

```bash
npx @mitre/heimdall-lite
```

Install it locally if you use it often — subsequent `npx` runs then start much
faster:

```bash
npm install -g @mitre/heimdall-lite
```

Or run it as a container:

```bash
docker run -d -p 8080:80 mitre/heimdall-lite:release-latest
```

It is then at `http://localhost:8080`. Substitute the `latest` tag for
`release-latest` if you want the bleeding-edge build rather than the released
one.

## Heimdall Server

Every method below installs the same application; they differ in how it is
supervised, upgraded and secured. Each has its own page under Deployment.

| Method | Choose it when | Guide |
| --- | --- | --- |
| Docker Compose | You want the fastest supported server install. Brings up the database and a TLS-terminating NGINX alongside Heimdall. | [Deployment](/deployment/) |
| RPM | You are deploying to RHEL or a derivative and want systemd supervision, a system user and standard file locations. | [Deployment](/deployment/) |
| Kubernetes / Helm | You already run Kubernetes and want Heimdall managed the same way as everything else. | [Deployment](/deployment/) |
| From source | You are developing Heimdall, or you need a build no release provides. | [Quick Start](/getting-started/quick-start) |

The Deployment section covers each in full, along with hardening, backup and
upgrade. This page deliberately does not repeat those instructions — one set of
install steps, in one place.

## Before you install

Two things are worth settling before any method:

**Configuration.** All methods read the same environment variables; only the
file holding them changes. Read [Configuration](/getting-started/configuration)
for the model, and the
[Environment Variables reference](/getting-started/environment-variables) for
the variables themselves.

**TLS.** The Docker Compose path generates a self-signed certificate valid for
**seven days** so a fresh install works immediately. That is fine for a trial
and wrong for anything else — replace it with a real certificate before anyone
depends on the instance.
