# Contributing to heimdall-cli

First off, thank you for considering contributing to heimdall-cli! It's people like you that make heimdall-cli such a great tool for the security community.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md):

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and why it's a problem
- **Explain which behavior you expected** instead
- **Include screenshots and logs** if possible
- **Include your environment details** (OS and version, architecture, output of
  `heimdall-cli version`, Heimdall Server version, and whether the host is in
  FIPS mode)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Provide specific examples** to demonstrate the enhancement
- **Describe the current behavior** and how your suggestion improves it
- **List any alternatives** you've considered

### Security Vulnerabilities

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them to our security team at **saf-security@mitre.org**. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

## Development Process

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone git@github.com:your-username/heimdall-cli.git
   cd heimdall-cli
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream git@github.com:mitre/heimdall-cli.git
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Setup

heimdall-cli is a single static Go binary with no runtime dependencies.

1. **Install Go** (see `go.mod` for the required version).

2. **Build**:
   ```bash
   make build
   ```

3. **Run the test suite**:
   ```bash
   make test
   ```

4. **Regenerate man pages and shell completions** (both are gitignored and
   built from source):
   ```bash
   make man
   make completions
   ```

### Making Changes

1. **Follow the coding standards**:
   - Format with `gofmt` — CI rejects unformatted code
   - Pass `go vet ./...` and the project linter
   - Write clear, self-documenting code
   - Add comments for exported identifiers and non-obvious logic

2. **Write tests**:
   - Every command has a `_test.go` alongside it — keep it that way
   - Ensure all tests pass: `make test`
   - Maintain or improve code coverage

3. **Keep the password-hash contract in sync**:
   - `reset-password` writes credentials that Heimdall Server must accept.
   - The hash format is owned by `mitre/heimdall2` and published as versioned
     test vectors. Any change to hashing MUST be validated against them.
   - A `formatVersion` mismatch is a build failure, not a warning.

4. **Update documentation**:
   - Update README.md if needed
   - Update the relevant `man/` source for new or changed commands
   - Add inline documentation for exported functions
   - Update CHANGELOG.md

4. **Commit your changes**:
   ```bash
   git add <specific-files>
   git commit -m "feat: add amazing feature

   - Detailed description of what changed
   - Why this change was needed
   - Any breaking changes or migrations required"
   ```

   Follow conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Test additions or corrections
   - `chore:` Maintenance tasks

### Submitting Changes

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**:
   - Go to your fork on GitHub
   - Click "New pull request"
   - Select your feature branch
   - Fill in the PR template with:
     - Description of changes
     - Related issue numbers
     - Testing performed
     - Screenshots (if UI changes)

3. **PR Review Process**:
   - A maintainer will review your PR
   - Address any requested changes
   - Once approved, a maintainer will merge your PR

## Testing Guidelines

### Running Tests

```bash
# Run all tests
rake spec:parallel

# Run specific test file
rake spec:parallel spec/models/user_spec.rb

# Run tests with coverage
COVERAGE=true rake spec:parallel
```

### Writing Tests

- Write tests first (TDD) when possible
- Test both happy path and edge cases
- Keep tests focused and isolated
- Use factories instead of fixtures
- Mock external services
- Ensure tests are deterministic

## Style Guidelines

### Go Style

Standard Go conventions apply — `gofmt` is authoritative, not advisory:

```bash
# Format (CI rejects unformatted code)
gofmt -l -w .

# Vet
go vet ./...

# Lint
make lint
```

Key conventions:
- Tabs for indentation (gofmt default) — do not fight the formatter
- Exported identifiers carry doc comments beginning with the identifier name
- Errors are wrapped with context (`fmt.Errorf("...: %w", err)`), never swallowed
- Prefer small interfaces at the consumer, as in `PasswordHasher`
- Table-driven tests where the cases are homogeneous

## Database Changes

heimdall-cli does not own the Heimdall Server schema — `mitre/heimdall2` does.
Commands that touch the database (`reset-password`, `backup`, `restore`,
`setup`) execute against a schema owned upstream.

Therefore:

1. **Never add a migration here.** Schema changes belong in `mitre/heimdall2`.
2. **Write parameterized SQL.** Use `psql` variable binding (`:'name'`), never
   string interpolation.
3. **Write only the columns you mean to write.** `reset-password` sets
   `encryptedPassword`, `passwordChangedAt`, and `forcePasswordChange` because
   the password genuinely changed — a rehash would not touch the latter two.
4. **Test against a real Postgres.** See the integration tests in
   `internal/cmd`.

## Documentation

- **Code Comments**: Add comments for complex logic
- **Doc Comments**: Standard Go form on every exported identifier
- **Man Pages**: Regenerate with `make man` when commands or flags change
- **User Documentation**: Update the README for user-facing changes

## Release Process

Maintainers handle releases, but you can help by:

1. Keeping CHANGELOG.md updated
2. Following semantic versioning in PRs
3. Highlighting breaking changes
4. Testing release candidates

## Questions?

Feel free to:
- Open a [GitHub Discussion](https://github.com/mitre/heimdall-cli/discussions)
- Email us at saf@mitre.org
- Check our [Wiki](https://github.com/mitre/heimdall-cli/wiki)

## Recognition

Contributors are recognized in:
- GitHub's contributor graph
- Release notes
- Our annual contributor report

Thank you for contributing to heimdall-cli and helping make security automation better for everyone!

---

<p align="center">
  Part of the <a href="https://saf.mitre.org/">MITRE Security Automation Framework</a>
</p>