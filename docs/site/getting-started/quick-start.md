---
title: Quick Start
description: Run Heimdall locally from source in development mode, with the versions and commands this repository actually uses.
---

# Quick Start

This page gets Heimdall running **locally from source** in development mode —
the mode that rebuilds as you edit. It is the path to use when you are working
on Heimdall itself.

If you only want to *look at* HDF results and have no interest in running a
server, skip all of this:

```bash
npx @mitre/heimdall-lite
```

That runs Heimdall Lite, the standalone viewer — no database, no build, no
clone. For production server installs, see [Installation](/getting-started/installation).

## Prerequisites

| Requirement | Version | Check |
| --- | --- | --- |
| Node.js | **22.18.0 or newer** | `node --version` |
| Yarn | 1.x (Classic) | `yarn --version` |
| PostgreSQL | any currently supported release | `psql --version` |
| Git | any | `git --version` |

::: warning Node 18 is out of date
Older installation notes — including parts of the repository README and the
GitHub wiki — tell you to install Node 18. That is wrong for this codebase.
`package.json` declares `"engines": {"node": ">=22.18.0"}` and `.nvmrc` pins
major version 22. Install on Node 18 and the toolchain will fail.

With `nvm` installed, the repository's own pin does this for you:

```bash
nvm use
```
:::

Yarn Classic is what this repository uses — the lockfile is `yarn.lock` and the
workspaces are Yarn v1 workspaces. Do not substitute npm or pnpm.

## 1. Clone and install

```bash
git clone https://github.com/mitre/heimdall2
cd heimdall2
yarn install
```

`yarn install` bootstraps every workspace — backend, frontend, and the shared
libraries under `libs/`.

## 2. Create the database

Heimdall needs a PostgreSQL database and a role that can create databases. The
role must be able to create them because the backend derives separate database
names per environment.

```bash
# as a superuser, e.g. `sudo -u postgres psql`
CREATE USER heimdall WITH ENCRYPTED PASSWORD 'your-password';
ALTER USER heimdall CREATEDB;
```

You do not create the database itself by hand — the name is derived from
`NODE_ENV`, and the backend creates it on first run. See the note under
[Configuration](/getting-started/configuration#the-database-name-is-derived).

## 3. Configure

Copy the template and edit it:

```bash
cp apps/backend/.env-example apps/backend/.env
```

At minimum set `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET` and
`NODE_ENV=development`. Generate a secret rather than inventing one:

```bash
openssl rand -hex 64
```

Every variable, its default and its effect is documented in the
[Environment Variables reference](/getting-started/environment-variables) —
that page is the single source of truth, and nothing here restates it.

::: tip Leave PORT unset for local development
`PORT` is read by the backend, which already defaults to `3000`. The frontend
dev server owns its own port and proxy settings in
`apps/frontend/.env.development`. Setting `PORT` in the backend's `.env` to
steer the frontend does not work and breaks local development.
:::

## 4. Run

```bash
yarn start:dev
```

This runs every workspace's `start:dev` in parallel with streamed output, so
backend and frontend rebuild on change. Leave it running.

You get **two** servers, not one:

| Server | Port | Use it for |
| --- | --- | --- |
| Frontend dev server | **printed on startup** — see below | **Open this one.** Serves the UI with hot reload and proxies API calls to the backend. |
| Backend API | `3000` unless `PORT` is set | The NestJS API. Hit it directly when working on the API or reading its responses. |

::: warning Do not assume the frontend port
The dev server does not have a fixed port. It tries `8080` and moves up —
`8081`, `8082`, and so on — until it finds a free one, so the number changes
between machines and between runs depending on what else is listening. Read the
URL it prints in the `yarn start:dev` output and use that.

The backend is different: it binds `3000` unless you set `PORT`, so it is
predictable. Opening it in a browser gets you the API, not the interface.
:::

The other root scripts you are likely to want:

| Command | What it does |
| --- | --- |
| `yarn start:dev` | development mode, rebuilds on change — **use this while developing** |
| `yarn build` | production build of every workspace |
| `yarn start:built` | build, then start the server against the built output |
| `yarn start` | start the backend only, without building first |

::: danger Do not use development mode to deploy
Development mode rebuilds on change and makes tradeoffs that are wrong for a
real deployment. To run Heimdall for actual use, follow
[Installation](/getting-started/installation).
:::

## Running this documentation locally

These docs are **not** part of the application and `yarn start:dev` does not
start them. The site is a separate project with its own `package.json` and
lockfile, deliberately outside the Yarn workspaces, so it never enters the app's
dependency graph. There is no `/docs` route on the running server.

To work on the documentation, run it on its own:

```bash
cd docs
yarn install
yarn dev
```

`yarn build` in the same directory produces the static site and fails the build
on dead internal links.

## Next steps

- [Configuration](/getting-started/configuration) — how config is loaded, and which file applies to which install method
- [Environment Variables](/getting-started/environment-variables) — every variable, with defaults verified against the source
- [Troubleshooting](/getting-started/troubleshooting) — what the common failures actually mean
- [Installation](/getting-started/installation) — the supported ways to deploy for real use
