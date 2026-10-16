# Changelog

All notable changes to heimdall-cli are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Interactive setup prompts for JWT expiration and local certificate lifetime,
  with defaults of one day and seven days respectively.
- Extracted to its own repository from `mitre/saf-packaging`. The `go.mod`
  module path (`github.com/mitre/heimdall-cli`) now matches the repository
  URL, so `go install` and module vendoring work.
- SAF standard project files: `LICENSE.md`, `NOTICE.md`, `CODE_OF_CONDUCT.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`.

### Changed
- Interactive setup displays the external URL default and uses
  `https://localhost` when no address has been configured.
- Contributing and security guidance rewritten for Go; the inherited templates
  described a Ruby on Rails project.

## [0.0.1] - 2026-02-27

### Added
- Initial Go implementation, replacing the previous Python CLI with a single
  static binary and no Python or vendor dependencies.
- Commands: `setup`, `status`, `config` (list/get/set), `backup`, `restore`,
  `reset-password`, `start`, `stop`, `restart`, `logs`, `diag`, `set-port`,
  `add-cert`, `validate`, `fapolicyd` (add/remove).
- Shell completions for bash, zsh, and fish.
- Man pages for every command.
