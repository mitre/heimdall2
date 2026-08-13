---
title: Getting Started
description: Installation, configuration and first steps for Heimdall.
---

# Getting Started

Heimdall visualizes and analyzes security results in the Heimdall Data Format
(HDF). Start with whichever of these matches what you are trying to do.

## I just want to look at some results

```bash
npx @mitre/heimdall-lite
```

Heimdall Lite is the standalone viewer — no database, no server, nothing to
install. See [Installation](/getting-started/installation) for other ways to
run it.

## I want to run the server

Heimdall Server adds a backend and a PostgreSQL database, which is what gives
you accounts, saved evaluations, groups and the API.
[Installation](/getting-started/installation) indexes the supported methods —
Docker Compose, RPM, Kubernetes and source — and links to the full guide for
each.

## I want to work on Heimdall itself

[Quick Start](/getting-started/quick-start) gets you running locally from source
in development mode, which rebuilds as you edit.

## In this section

- [Quick Start](/getting-started/quick-start) — run locally from source, with the versions and commands this repository actually uses
- [Installation](/getting-started/installation) — the supported ways to deploy, and how to choose
- [Configuration](/getting-started/configuration) — how configuration is loaded and what takes precedence
- [Environment Variables](/getting-started/environment-variables) — every variable, with defaults verified against the source
- [Troubleshooting](/getting-started/troubleshooting) — what the common failures actually mean
