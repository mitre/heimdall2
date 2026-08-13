---
title: Configuration
description: How Heimdall loads configuration, which file applies to which install method, and what takes precedence.
---

# Configuration

Every Heimdall install is configured the same way — environment variables. What
changes between install methods is only the file those variables live in.

This page covers the *model*: where configuration comes from and what wins. For
the variables themselves — names, defaults, effects — see the
[Environment Variables reference](/getting-started/environment-variables). That
page is the single source of truth and nothing here repeats it.

## Where the variables live

| Install method | File |
| --- | --- |
| Local development | `apps/backend/.env` (start from `apps/backend/.env-example`) |
| Docker Compose | `.env` beside `docker-compose.yml`, or the `environment:` block |
| RPM | `/etc/heimdall-server/backend.env` |
| Kubernetes | your chart's values, projected into the container environment |

The variable names are identical across all four. A variable that works in
development works in production under the same name.

## What takes precedence

Two rules decide which value wins, and both surprise people.

**The process environment beats the file.** Configuration is read as
`process.env[key] || envConfig[key]`. A variable exported in your shell, set in
a systemd unit, or injected by Kubernetes overrides the same key in the `.env`
file. It is not the other way around — editing the file will not fix a value
that is also set in the environment.

**The file is read relative to the working directory.** It is loaded with a
relative path, so it is found relative to *where the process was started*, not
where the application is installed. Start the server from a different directory
and no file is loaded at all: the application logs
`Unable to read configuration file .env!` and continues on the process
environment alone. If configuration appears to be ignored entirely, check the
working directory before you check the file.

A third, smaller rule: **an empty value is not a default.** Most variables are
read with `||`, so an empty string behaves like unset and the default applies. A
few validate instead and refuse to start; those are called out individually in
the reference.

## The database name is derived

There is no default database name. When `DATABASE_NAME` is unset, the name is
derived from `NODE_ENV`:

```
heimdall-server-${NODE_ENV}
```

So `NODE_ENV=development` uses `heimdall-server-development`, and changing
`NODE_ENV` silently points Heimdall at a different database. This is why the
database role needs `CREATEDB`.

If **both** `DATABASE_NAME` and `NODE_ENV` are unset, the application throws at
startup rather than guessing.

`DATABASE_URL` is an alternative to the individual settings — when set, it is
parsed into the username, password, host, name and port components at startup.

## Secrets

`JWT_SECRET` signs session tokens. When it is unset, a fresh random value is
generated at every start, which invalidates all sessions on every restart —
fine locally, wrong anywhere real. Generate one:

```bash
openssl rand -hex 64
```

`API_KEY_SECRET` works the same way and controls a feature: API keys are
disabled entirely when it is unset.

```bash
openssl rand -hex 33
```

::: warning Rotating a secret logs everyone out
Changing `JWT_SECRET` invalidates every existing session. Changing
`API_KEY_SECRET` invalidates every issued API key. Both are sometimes what you
want — neither should be a surprise.
:::

## Changing configuration

Configuration is read at startup, so a change takes effect on restart:

| Method | Apply a change |
| --- | --- |
| Local development | restart `yarn start:dev` |
| Docker Compose | `docker compose up -d` (recreates the container) |
| RPM | `sudo systemctl restart heimdall-server` |
| Kubernetes | roll the deployment |

## Next steps

- [Environment Variables](/getting-started/environment-variables) — every variable, with defaults verified against the source
- [Troubleshooting](/getting-started/troubleshooting) — when configuration is right but something still fails
