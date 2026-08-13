---
title: Troubleshooting
description: What Heimdall's common failures actually mean, traced to the code that produces them.
---

# Troubleshooting

Each symptom below is tied to the behavior in the code that causes it, so you
can confirm the diagnosis rather than guess at it.

## Uploads fail on large files

There are **two independent size limits**, and raising one does not raise the
other.

`MAX_FILE_UPLOAD_SIZE` controls the evaluation upload limit in megabytes and
defaults to `50`. Separately, the JSON body parser is capped at a hard-coded
`50mb`.

The consequence: raising `MAX_FILE_UPLOAD_SIZE` above 50 does **not** let you
post a larger JSON body — that request is rejected by the body parser before the
upload limit is ever consulted. Below 50 MB, `MAX_FILE_UPLOAD_SIZE` is the
effective limit and lowering it works as expected.

If a large HDF file fails to upload, check which limit you are hitting: a
rejection from the body parser is a parser-level error, not a Heimdall
validation message.

## Splunk or Tenable connections are blocked in the browser

Symptom: the server is configured correctly, but the browser console shows the
request to your Splunk or Tenable host refused by Content Security Policy.

Heimdall sends a CSP whose `connect-src` allows only `'self'`,
`https://api.github.com`, `https://sts.amazonaws.com`, and — added at startup —
the values of `TENABLE_HOST_URL` and `SPLUNK_HOST_URL`.

The important part is **at startup**. Those hosts enter the policy when the
process boots. Setting or changing either variable without restarting leaves the
old policy in place, and the browser blocks the connection no matter how correct
the server-side configuration is. Restart after changing them.

Empty values are filtered out, so an unset host simply is not in the policy.

## Content is blocked over HTTPS

The policy includes `block-all-mixed-content`. Any resource loaded over plain
HTTP by a page served over HTTPS is blocked by the browser. This usually shows
up behind a reverse proxy that terminates TLS while something upstream still
emits `http://` URLs.

## Heimdall will not load inside an iframe

`frame-ancestors` is `'self'`. Embedding Heimdall in a page on another origin is
refused by the browser. This is deliberate.

## Running over plain HTTP

This works, and is supported. Helmet's default CSP includes
`upgrade-insecure-requests`, which rewrites requests to HTTPS and breaks HTTP
deployments; Heimdall **deliberately removes that directive** for exactly this
reason.

So if a plain-HTTP deployment is redirecting to HTTPS, Heimdall's CSP is not the
cause — look at your reverse proxy or a browser HSTS entry from a previous HTTPS
visit to the same host.

## Database errors at startup

**"NODE_ENV and DATABASE_NAME are undefined."** There is no fallback database
name. When `DATABASE_NAME` is unset the name is derived as
`heimdall-server-${NODE_ENV}`, so if both are unset the application refuses to
start rather than guess. Set `NODE_ENV`.

**Connecting to the wrong database.** Because the name is derived from
`NODE_ENV`, changing `NODE_ENV` silently moves Heimdall to a different database.
Data that has "disappeared" after a configuration change is usually intact in
the database belonging to the previous `NODE_ENV`.

**"SSL Key file does not exist"** (or the `Cert` / `CA` equivalent). The
`DATABASE_SSL_*` variables accept either a path or the certificate material
itself, distinguished by a `-BEGIN` marker. Given a path, the file must exist
at startup or the application will not start. Check the path is readable by the
user the service runs as — under the RPM that is the `heimdall` user, not you.

## Configuration changes have no effect

Two causes, in order of likelihood.

**Something in the environment is overriding the file.** Configuration is read
as `process.env[key] || envConfig[key]`, so a shell export, a systemd
`Environment=` line, or an injected Kubernetes variable beats the file. Editing
the file cannot win.

**The file was never read.** It is loaded on a relative path, so it is resolved
against the process's working directory. Started from elsewhere, no file is
loaded and the application logs `Unable to read configuration file .env!` before
continuing on the environment alone. That log line is the fastest way to confirm
this.

See [Configuration](/getting-started/configuration) for the full precedence
model.

## Requests are rejected as rate-limited

Heimdall applies rate limiting and returns a `Ratelimited` error when a client
exceeds it. Behind a reverse proxy this can appear to affect everyone at once if
the proxy does not pass the real client address — every request then looks like
it comes from one IP. Ensure the proxy forwards the client address.

## Where the logs are

| Install method | Logs |
| --- | --- |
| Local development | the terminal running `yarn start:dev` |
| Docker Compose | `docker compose logs -f server` |
| RPM | `journalctl -u heimdall-server -f` by default; if `LOG_FILE` is set, the launcher redirects output to that path instead |
| Kubernetes | `kubectl logs` against the Heimdall pod |

Under the RPM, `LOG_FILE` changes where output goes — unset means journald. If
it is set, the directory must be writable by the `heimdall` user.

## The docs site is not served by the application

`yarn start:dev` does not start this documentation, and there is no `/docs`
route on a running server. The site is a separate project with its own
`package.json`, outside the application's workspaces. Run it with
`cd docs && yarn dev`. Serving it from the application for offline and airgapped
installs is planned but not yet implemented.

## Node version errors during install or build

This codebase requires **Node 22.18.0 or newer** (`.nvmrc` pins major version
22). Older instructions — including parts of the repository README and the
GitHub wiki — say Node 18, which is out of date and will fail. Run `nvm use` in
the repository root to pick up the pinned version.
