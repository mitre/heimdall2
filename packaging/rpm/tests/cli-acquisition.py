#!/usr/bin/env python3
"""Exercise CLI provenance and fresh man staging with a tiny local Git repository."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

RPM = Path(__file__).resolve().parents[1]


def run(*args, **kwargs):
    result = subprocess.run(list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            universal_newlines=True, **kwargs)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout.strip()


with tempfile.TemporaryDirectory(prefix='heimdall-cli-inputs-') as temp:
    root = Path(temp)
    os.environ.setdefault('GOCACHE', str(root / 'go-cache'))
    host_os, host_arch = run('go', 'env', 'GOHOSTOS', 'GOHOSTARCH').splitlines()
    target_arch = 'arm64' if host_arch == 'amd64' else 'amd64'
    # OL8 uses GNU tar; avoid macOS tar's AppleDouble metadata in this fixture.
    if shutil.which('gtar'):
        (root / 'bin').mkdir()
        (root / 'bin/tar').symlink_to(shutil.which('gtar'))
        os.environ['PATH'] = str(root / 'bin') + os.pathsep + os.environ['PATH']
    source = root / 'source'
    packaging = source / 'packaging/rpm'
    packaging.mkdir(parents=True)
    for name in ('Makefile', 'heimdall-server.spec', 'setup-rpm-build-env.sh'):
        shutil.copy2(str(RPM / name), str(packaging / name))
    (packaging / 'scripts').mkdir()
    shutil.copy2(str(RPM / 'scripts/check-inputs.py'), str(packaging / 'scripts'))
    (source / 'VERSION').write_text('v2.13.1\n')
    for app in ('backend', 'frontend'):
        path = source / 'apps' / app
        path.mkdir(parents=True)
        (path / 'package.json').write_text(json.dumps({'version': '2.13.1'}))

    upstream = root / 'upstream with spaces'
    for name in ('cmd/heimdall-cli', 'cmd/gen-manpages', 'internal/version'):
        (upstream / name).mkdir(parents=True)
    (upstream / 'go.mod').write_text('module github.com/mitre/heimdall-cli\n\ngo 1.20\n')
    (upstream / 'internal/version/version.go').write_text(
        'package version\nvar Version, Commit, Date string\n')
    (upstream / 'cmd/heimdall-cli/main.go').write_text('''package main
import ("fmt"; "github.com/mitre/heimdall-cli/internal/version")
func main() { fmt.Println(version.Version, version.Commit, version.Date) }
''')
    (upstream / 'cmd/gen-manpages/main.go').write_text('''package main
import ("os"; "path/filepath"; "runtime")
func main() {
    for _, name := range []string{"heimdall-cli.1", "heimdall-cli-setup.1"} {
        if err := os.WriteFile(filepath.Join(os.Args[1], name), []byte("fixture manual " + runtime.GOOS + "/" + runtime.GOARCH + "\\n"), 0644); err != nil { panic(err) }
    }
}
''')
    run('git', '-C', str(upstream), 'init', '-q')
    run('git', '-C', str(upstream), 'symbolic-ref', 'HEAD', 'refs/heads/main')
    run('git', '-C', str(upstream), 'add', '.')
    commit_env = dict(os.environ, GIT_AUTHOR_DATE='2026-09-22T12:00:00+00:00',
                      GIT_COMMITTER_DATE='2026-09-22T12:00:00+00:00')
    run('git', '-C', str(upstream), '-c', 'user.name=RPM Test',
        '-c', 'user.email=rpm-test@example.invalid', 'commit', '-qm', 'CLI fixture', env=commit_env)
    pin = run('git', '-C', str(upstream), 'rev-parse', 'HEAD')
    (packaging / 'heimdall-cli.repo').write_text(str(upstream) + '\n')
    ref_file = packaging / 'heimdall-cli.ref'
    topdir = root / 'output'
    cached = topdir / 'heimdall-cli-src'
    topdir.mkdir()
    run('git', 'clone', '-q', str(upstream), str(cached))

    def make(*args, **kwargs):
        return subprocess.run(['make', '-C', str(packaging), 'GOARCH=' + target_arch,
                               'SOURCE_MODE=workspace', 'TOPDIR=' + str(topdir)] + list(args),
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              universal_newlines=True, **kwargs)

    def reject(message, *args, **kwargs):
        result = make('cli-src', *args, **kwargs)
        assert result.returncode != 0, 'accepted ' + message
        assert message in result.stderr, result.stdout + result.stderr

    # A mutable/malformed file pin must fail before touching the cached checkout.
    for bad_pin in ('main', pin[:12], 'g' * 40, '', pin + '\nmain'):
        ref_file.write_text(bad_pin + '\n')
        reject('40 lowercase hex')
    ref_file.write_text(pin + '\n')
    for name, value in (('HEIMDALL_CLI_REF', pin), ('HEIMDALL_CLI_REPO', str(upstream))):
        reject('pin overrides', name + '=' + value)
        reject('pin overrides', env=dict(os.environ, **{name: value}))

    (cached / 'untracked.go').write_text('package main\n')
    reject('Uncommitted CLI inputs')
    (cached / 'untracked.go').unlink()
    tracked = cached / 'go.mod'
    tracked.write_text(tracked.read_text() + '// dirty\n')
    reject('Uncommitted CLI inputs')
    run('git', '-C', str(cached), 'add', 'go.mod')
    reject('Uncommitted CLI inputs')
    run('git', '-C', str(cached), 'restore', '--staged', 'go.mod')
    run('git', '-C', str(cached), 'restore', 'go.mod')
    (cached / '.git/info/exclude').write_text('ignored.go\n')
    (cached / 'ignored.go').write_text('package main\n')
    reject('Uncommitted CLI inputs')
    (cached / 'ignored.go').unlink()
    run('git', '-C', str(cached), 'remote', 'set-url', 'origin', str(root / 'other'))
    reject('CLI repository mismatch')
    assert run('git', '-C', str(cached), 'rev-parse', 'HEAD') == pin
    shutil.rmtree(str(cached))
    topdir = root / 'output with spaces'
    cached = topdir / 'heimdall-cli-src'

    result = make('heimdall-cli', 'man')
    assert result.returncode == 0, result.stdout + result.stderr
    assert run('git', '-C', str(cached), 'rev-parse', 'HEAD') == pin
    assert run('git', '-C', str(cached), 'rev-parse', '--abbrev-ref', 'HEAD') == 'HEAD'
    binary = topdir / 'SOURCES/heimdall-cli'
    metadata = run('go', 'version', '-m', str(binary))
    assert 'GOOS=linux\n' in metadata, metadata
    assert 'GOARCH=' + target_arch + '\n' in metadata, metadata
    assert 'vcs.revision=' + pin in metadata, metadata
    assert 'vcs.modified=false' in metadata, metadata
    manual = topdir / 'cli-man/man1/heimdall-cli.1'
    assert manual.read_text() == 'fixture manual ' + host_os + '/' + host_arch + '\n', manual.read_text()
    binary_bytes = binary.read_bytes()
    # Linker-injected strings end in NUL; VCS build metadata ends in newline.
    assert pin.encode() + b'\x00' in binary_bytes
    assert any(value in binary_bytes for value in (
        b'2026-09-22T12:00:00+00:00\x00', b'2026-09-22T12:00:00Z\x00'))
    result = make('heimdall-cli', 'man', 'TOPDIR=' + os.path.relpath(str(topdir), str(packaging)))
    assert result.returncode == 0, result.stdout + result.stderr
    assert binary.read_bytes() == binary_bytes

    stale = topdir / 'cli-man/man1/removed-command.1'
    stale.write_text('stale manual')
    result = make('man')
    assert result.returncode == 0, result.stdout + result.stderr
    assert not stale.exists()
    with tarfile.open(str(topdir / 'SOURCES/heimdall-cli-man.tar.gz')) as archive:
        assert set(archive.getnames()) == {'man1', 'man1/heimdall-cli.1', 'man1/heimdall-cli-setup.1'}
    run('bash', str(RPM / 'tests/cli-inputs.sh'), str(topdir))

    # A generator failure cannot leave yesterday's successful archive usable.
    (upstream / 'cmd/gen-manpages/main.go').write_text('package main\nimport "os"\nfunc main() { os.Exit(1) }\n')
    run('git', '-C', str(upstream), 'add', '.')
    run('git', '-C', str(upstream), '-c', 'user.name=RPM Test',
        '-c', 'user.email=rpm-test@example.invalid', 'commit', '-qm', 'Broken generator', env=commit_env)
    ref_file.write_text(run('git', '-C', str(upstream), 'rev-parse', 'HEAD') + '\n')
    result = make('man')
    assert result.returncode != 0
    assert not (topdir / 'SOURCES/heimdall-cli-man.tar.gz').exists()
    result = make('clean')
    assert result.returncode == 0, result.stdout + result.stderr
    assert not topdir.exists()
    assert (root / 'output').is_dir(), 'clean removed a sibling of the spaced TOPDIR'

    # Record the wrapper/Make boundary without installing host dependencies.
    (packaging / 'Makefile').write_text('''.PHONY: deps stage rpm
deps:
\t@echo deps >> calls
stage rpm:
\t@printf '%s\\n' "$@" "$(DEV)" "$(TOPDIR)" "$$PATH" >> calls
''')
    wrapper = packaging / 'setup-rpm-build-env.sh'
    calls = packaging / 'calls'
    run('bash', str(wrapper), '--skip-deps', '--dev', '--topdir', 'wrapper output', cwd=str(root))
    rows = calls.read_text().splitlines()
    assert rows[:3] == ['stage', '1', str(root.resolve() / 'wrapper output')], rows
    assert rows[3].startswith('/opt/heimdall-build/go-1.25.8/bin:'), rows
    calls.unlink()
    run('bash', str(wrapper), '--build', env=dict(os.environ, GO_VERSION='1.26.0'))
    rows = calls.read_text().splitlines()
    assert rows[:3] == ['deps', 'rpm', '0'], rows
    assert rows[4].startswith('/opt/heimdall-build/go-1.26.0/bin:'), rows
    calls.unlink()
    for args in (['--version', '2.13.1'], ['--no-gpg-check'], ['--topdir'], ['--topdir', '--build']):
        result = subprocess.run(['bash', str(wrapper)] + args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        assert result.returncode == 64, args
        assert not calls.exists(), args

print('CLI acquisition, immutable provenance, fresh man staging, and wrapper checks passed '
      '(CLI linux/' + target_arch + '; generator ' + host_os + '/' + host_arch + ')')
