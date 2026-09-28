#!/usr/bin/env python3
"""Check host Docker build arguments, including macOS Bash 3.2 without a CA."""
import os
from pathlib import Path
import subprocess
import tempfile

TESTS = Path(__file__).resolve().parent
REPO = TESTS.parents[2]
GIT_DIR = subprocess.check_output(['git', '-C', str(REPO), 'rev-parse', '--absolute-git-dir'],
                                  universal_newlines=True).strip()

with tempfile.TemporaryDirectory(prefix='heimdall-host-build-') as temp:
    root = Path(temp)
    docker = root / 'docker'
    docker.write_text('''#!/bin/sh
case "$1" in
  info) exit 0 ;;
  build) printf '%s\\0' "$@" > "$DOCKER_ARGS"; exit 73 ;;
  *) exit 99 ;;
esac
''')
    docker.chmod(0o755)
    artifact = root / 'test.rpm'
    key = root / 'public-key.asc'
    ca = root / 'corporate CA.crt'
    for path in (artifact, key, ca):
        path.write_text('fixture\n')
    env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'],
               RPM_TEST_GPG_KEY=str(key), DOCKER_ARGS=str(root / 'args'),
               GIT_DIR=GIT_DIR, GIT_WORK_TREE=str(REPO))
    failures = []
    for script in ('run-lifecycle.sh', 'sign-rpms.sh'):
        inputs = [artifact, artifact] if script == 'run-lifecycle.sh' else [key, artifact]
        for platform in ('linux/arm64', 'linux/amd64'):
            for use_ca in (False, True):
                env.pop('RPM_TEST_CA', None)
                if use_ca:
                    env['RPM_TEST_CA'] = str(ca)
                args_file = root / 'args'
                if args_file.exists():
                    args_file.unlink()
                result = subprocess.run(
                    ['/bin/bash', str(TESTS / script), platform] + list(map(str, inputs)),
                    cwd=str(root), env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    universal_newlines=True)
                case = '{} {} CA={}'.format(script, platform, use_ca)
                if result.returncode != 73:
                    failures.append('{}: exit {}\n{}'.format(case, result.returncode, result.stdout))
                    continue
                args = args_file.read_bytes().decode().split('\0')[:-1]
                assert args[0] == 'build' and '' not in args, (case, args)
                assert args.count('--platform') == 1, (case, args)
                assert args[args.index('--platform') + 1] == platform, (case, args)
                assert args.count('--secret') == int(use_ca), (case, args)
                if use_ca:
                    assert args[args.index('--secret') + 1] == 'id=corp_ca,src=' + str(ca), (case, args)
    assert not failures, '\n'.join(failures)

print('RPM host build arguments: PASS (both platforms, with and without a CA)')
