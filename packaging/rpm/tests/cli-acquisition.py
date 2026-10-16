#!/usr/bin/env python3
"""Exercise CLI provenance and fresh man staging with a tiny local Git repository."""
import json
import hashlib
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

    run('git', '-C', str(source), 'init', '-q')
    run('git', '-C', str(source), 'symbolic-ref', 'HEAD', 'refs/heads/main')
    run('git', '-C', str(source), 'add', '.')
    commit_env = dict(os.environ, GIT_AUTHOR_DATE='2026-09-22T12:00:00+00:00',
                      GIT_COMMITTER_DATE='2026-09-22T12:00:00+00:00')
    run('git', '-C', str(source), '-c', 'user.name=RPM Test',
        '-c', 'user.email=rpm-test@example.invalid', 'commit', '-qm', 'Server fixture', env=commit_env)

    upstream = source / 'apps/heimdall-cli'
    for name in ('cmd/heimdall-cli', 'cmd/gen-manpages', 'internal/version'):
        (upstream / name).mkdir(parents=True, exist_ok=True)
    (upstream / 'VERSION').write_text('v0.9.0\n')
    shutil.copy2(str(RPM.parents[1] / 'apps/heimdall-cli/Makefile'), str(upstream / 'Makefile'))
    (upstream / 'go.mod').write_text(
        'module github.com/mitre/heimdall2/apps/heimdall-cli\n\ngo 1.20\n')
    (upstream / 'internal/version/version.go').write_text(
        'package version\nvar Version, Commit, Date string\n')
    (upstream / 'cmd/heimdall-cli/main.go').write_text('''package main
import ("fmt"; "github.com/mitre/heimdall2/apps/heimdall-cli/internal/version")
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
    # Keep a sibling output to verify clean handles a spaced TOPDIR safely.
    (root / 'output').mkdir()
    topdir = root / 'output with spaces'

    def make(*args, **kwargs):
        return subprocess.run(['make', '-C', str(packaging), 'GOARCH=' + target_arch,
                               'TOPDIR=' + str(topdir)] + list(args),
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              universal_newlines=True, **kwargs)

    def reject(message, *args, **kwargs):
        result = make('cli-build-src', *args, **kwargs)
        assert result.returncode != 0, 'accepted ' + message
        assert message in result.stderr, result.stdout + result.stderr

    result = make('heimdall-cli', 'man')
    assert result.returncode == 0, result.stdout + result.stderr
    assert (topdir / 'heimdall-cli-build/go.mod').read_text() == (upstream / 'go.mod').read_text()
    assert not (topdir / 'heimdall-cli-src').exists()
    binary = topdir / 'SOURCES/heimdall-cli'
    archive = topdir / 'SOURCES/heimdall2-2.13.1.tar.gz'
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    assert b'0.9.0\x00' in binary.read_bytes()
    assert ('source.' + digest).encode() + b'\x00' in binary.read_bytes()
    assert b'unknown\x00' in binary.read_bytes()
    with tarfile.open(str(archive)) as packed:
        assert 'heimdall2-2.13.1/apps/heimdall-cli/go.mod' in packed.getnames()
    metadata = run('go', 'version', '-m', str(binary))
    assert 'GOOS=linux\n' in metadata, metadata
    assert 'GOARCH=' + target_arch + '\n' in metadata, metadata
    assert 'vcs.revision=' not in metadata, metadata
    manual = topdir / 'cli-man/man1/heimdall-cli.1'
    assert manual.read_text() == 'fixture manual ' + host_os + '/' + host_arch + '\n', manual.read_text()
    binary_bytes = binary.read_bytes()
    # Reuse Source0: gzip headers can timestamp otherwise identical workspace archives.
    result = make('-o', 'sources', 'heimdall-cli', 'man',
                  'TOPDIR=' + os.path.relpath(str(topdir), str(packaging)))
    assert result.returncode == 0, result.stdout + result.stderr
    assert binary.read_bytes() == binary_bytes

    stale = topdir / 'cli-man/man1/removed-command.1'
    stale.write_text('stale manual')
    result = make('man')
    assert result.returncode == 0, result.stdout + result.stderr
    assert not stale.exists()
    with tarfile.open(str(topdir / 'SOURCES/heimdall-cli-man.tar.gz')) as packed:
        assert set(packed.getnames()) == {'man1', 'man1/heimdall-cli.1', 'man1/heimdall-cli-setup.1'}
    run('bash', str(RPM / 'tests/cli-inputs.sh'), str(topdir))

    # HEAD mode excludes ignored working-tree Go sources.
    run('git', '-C', str(source), 'add', '.')
    run('git', '-C', str(source), '-c', 'user.name=RPM Test',
        '-c', 'user.email=rpm-test@example.invalid', 'commit', '-qm', 'In-tree CLI',
        env=commit_env)
    pin = run('git', '-C', str(source), 'rev-parse', 'HEAD')
    (source / '.git/info/exclude').write_text('apps/heimdall-cli/ignored.go\n')
    (upstream / 'ignored.go').write_text('this must never compile\n')
    result = make('heimdall-cli', 'man', 'SOURCE_MODE=head')
    assert result.returncode == 0, result.stdout + result.stderr
    assert not (topdir / 'heimdall-cli-build/ignored.go').exists()
    assert pin.encode() + b'\x00' in binary.read_bytes()
    assert any(value in binary.read_bytes() for value in (
        b'2026-09-22T12:00:00+00:00\x00', b'2026-09-22T12:00:00Z\x00'))
    (upstream / 'ignored.go').unlink()

    # Untracked input is accepted in workspace mode and rejected in HEAD mode.
    (upstream / 'new.go').write_text('package main\n')
    reject('Uncommitted build inputs', 'SOURCE_MODE=head')
    result = make('cli-build-src', 'SOURCE_MODE=workspace')
    assert result.returncode == 0, result.stdout + result.stderr
    assert (topdir / 'heimdall-cli-build/new.go').exists()
    (upstream / 'new.go').unlink()

    # Server release mode uses the server tag; the CLI has its own version.
    result = make('cli-build-src', 'SOURCE_MODE=release')
    assert result.returncode != 0
    run('git', '-C', str(source), 'tag', 'v2.13.1')
    result = make('heimdall-cli', 'man', 'SOURCE_MODE=release')
    assert result.returncode == 0, result.stdout + result.stderr
    assert b'0.9.0\x00' in binary.read_bytes()

    # A downloaded source archive needs no Git repository.
    shutil.rmtree(str(source / '.git'))
    result = make('heimdall-cli', 'man', 'SOURCE_MODE=workspace')
    assert result.returncode == 0, result.stdout + result.stderr
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    assert ('source.' + digest).encode() + b'\x00' in binary.read_bytes()

    # Failed generators and compiles cannot leave successful artifacts usable.
    generator = upstream / 'cmd/gen-manpages/main.go'
    generator.write_text('package main\nimport "os"\nfunc main() { os.Exit(1) }\n')
    result = make('man', 'SOURCE_MODE=workspace')
    assert result.returncode != 0
    assert not (topdir / 'SOURCES/heimdall-cli-man.tar.gz').exists()
    main = upstream / 'cmd/heimdall-cli/main.go'
    main.write_text('not valid Go source\n')
    result = make('heimdall-cli', 'SOURCE_MODE=workspace')
    assert result.returncode != 0
    assert not (topdir / 'SOURCES/heimdall-cli').exists()
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
