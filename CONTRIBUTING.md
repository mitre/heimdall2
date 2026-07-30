# Contributing to Heimdall

Thank you for considering a contribution. Heimdall is used to review security
and compliance results across a lot of very different environments, so
correctness and clear reporting matter more here than speed.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By
participating you agree to uphold it.

## Reporting Bugs

Open a [GitHub issue](https://github.com/mitre/heimdall2/issues) and include:

- **What you expected** and **what happened instead**
- **Steps to reproduce**
- **Which component** — Heimdall Server, Heimdall Lite, `@mitre/hdf-converters`,
  or `inspecjs`
- **Environment details** — OS, Node version, browser, deployment method
  (Docker, RPM, or source)
- **A sample input file** where relevant, with anything sensitive removed

For converter bugs, the input file is usually the single most useful thing you
can attach. Scan output frequently contains hostnames and configuration
detail — sanitize before sharing, or send it privately.

## Reporting Security Issues

**Do not open a public issue.** See [SECURITY.md](SECURITY.md) for the private
reporting process.

## Development Process

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone git@github.com:your-username/heimdall2.git
   cd heimdall2
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream git@github.com:mitre/heimdall2.git
   ```
4. **Create a feature branch**:
   ```bash
   git switch -c feature/your-feature-name
   ```

### Development Setup

Heimdall is a Yarn workspaces monorepo managed with lerna. Node >= 22.18.0 is
required (see `engines`).

1. **Install dependencies** from the repository root:
   ```bash
   yarn install
   ```

2. **Set up the database** (Heimdall Server only — Heimdall Lite needs none):
   ```bash
   cp apps/backend/.env-example apps/backend/.env
   yarn backend sequelize db:create
   yarn backend sequelize db:migrate
   ```

3. **Start in development mode**:
   ```bash
   yarn start:dev
   ```

Workspace commands are proxied from the root — `yarn backend <cmd>`,
`yarn frontend <cmd>`, `yarn hdf-converters <cmd>`, `yarn inspecjs <cmd>`,
`yarn common <cmd>`.

### Repository Layout

| Path | Contents |
|---|---|
| `apps/backend` | NestJS API server, Sequelize models, authentication |
| `apps/frontend` | Vue 2 application — also published as Heimdall Lite |
| `libs/hdf-converters` | Converters between scan formats and OHDF |
| `libs/inspecjs` | OHDF schema definitions and helpers |
| `libs/common` | Types shared between front and back end |
| `libs/password-complexity` | Password rule checks shared by both |
| `packaging/rpm` | RPM spec, systemd unit, SELinux policy |
| `test` | Cypress end-to-end UI tests |

### Making Changes

1. **Follow existing patterns.** Read the surrounding code before introducing a
   new approach — matching what is already there is usually better than
   importing a pattern from elsewhere.

2. **Write tests first.** Every change to behaviour needs a test that fails
   before the change and passes after.
   ```bash
   yarn backend test:ci
   yarn frontend test:ci
   yarn hdf-converters test:ci
   yarn inspecjs test:ci
   ```

3. **Typecheck separately.** The test runners use swc and **do not typecheck**:
   ```bash
   yarn backend build
   ```

4. **Lint.** Use the workspace-scoped scripts:
   ```bash
   yarn backend lint:ci
   yarn frontend lint:ci
   ```
   Do not silence security-plugin findings with disable comments — fix the code.

5. **Update documentation** — the README for user-facing changes, and
   `CHANGELOG` for anything notable.

### Adding a Converter

New format support is the most common contribution. A converter needs:

- The mapper in `libs/hdf-converters/src/`
- A sample input under `libs/hdf-converters/sample_jsons/<name>_mapper/sample_input_report/`
- Expected OHDF output alongside it, committed as a fixture
- A test in `libs/hdf-converters/test/mappers/forward/`

Use **real scan output** as the sample where you can, sanitized of hostnames and
customer detail. Synthetic input is acceptable when a real sample would be
excessive, but it must reflect the format accurately.

### Commit Messages

Use conventional prefixes — `feat:`, `fix:`, `test:`, `docs:`, `chore:`,
`build:`, `refactor:` — with a body explaining *why*, not just what.

```
feat: add support for Foo scanner output

- Maps Foo severity levels onto OHDF impact
- Handles the multi-result form Foo emits for grouped checks
```

### Pull Requests

1. Rebase on the latest `master`
2. Confirm the full suite passes and the build typechecks
3. Describe what changed and how you verified it
4. Link any related issue

Draft PRs are welcome if you would like feedback before the work is finished.

## Style Guidelines

### TypeScript / JavaScript

ESLint and Prettier are authoritative:

```bash
yarn lint       # fix
yarn lint:ci    # check
```

- Prefer explicit types on exported functions
- Avoid `any` — if the type is genuinely unknown, use `unknown` and narrow
- Handle errors explicitly; do not swallow them in a bare `catch`

### Vue

- Follow the Vue 2 style guide and the conventions already in `apps/frontend`
- Keep components focused — extract shared logic rather than duplicating it

## Getting Help

- [GitHub Discussions](https://github.com/mitre/heimdall2/discussions)
- [Wiki](https://github.com/mitre/heimdall2/wiki)
- [GitHub Issues](https://github.com/mitre/heimdall2/issues)

Thank you for contributing to Heimdall.
