#!/usr/bin/env python3
"""Exercise the real remote host runner with Docker/sleep stubs, never containers."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

TESTS = Path(__file__).resolve().parent
REPO = TESTS.parents[2]
git_dir = subprocess.check_output(
    ['git', '-C', str(REPO), 'rev-parse', '--absolute-git-dir'],
    universal_newlines=True).strip()

with tempfile.TemporaryDirectory(prefix='heimdall-remote-readiness-') as temp:
    root = Path(temp)
    docker = root / 'docker'
    docker.write_text('#!' + sys.executable + '\n' + '''import json, os, pathlib, sys
args = sys.argv[1:]
root = pathlib.Path(os.environ['FIXTURE_ROOT'])
with (root / 'calls.jsonl').open('a') as log:
    log.write(json.dumps(args) + '\\n')
if args[0] == 'create':
    print('database' if args[-1] == 'postgres:18' else 'app')
elif args[:2] == ['network', 'create']:
    print('network')
elif args[0] == 'exec' and 'pg_isready' in args:
    # The initialization socket responds even though the final TCP server is absent.
    sys.exit(0)
elif args[0] == 'exec' and 'psql' in args:
    count = root / 'attempts'
    attempt = int(count.read_text()) + 1 if count.exists() else 1
    count.write_text(str(attempt))
    scenario = os.environ['READINESS_CASE']
    if scenario == 'delayed' and attempt >= 3:
        print('1')
    elif scenario == 'wrong-result':
        print('0')
    else:
        print('1')  # Output alone cannot make a failed query count as ready.
        print('fixture database still initializing', file=sys.stderr)
        sys.exit(2)
''')
    docker.chmod(0o755)
    sleep = root / 'sleep'
    sleep.write_text('#!/bin/sh\nexit 0\n')
    sleep.chmod(0o755)
    artifact, key = root / 'candidate.rpm', root / 'public.asc'
    artifact.write_text('fixture\n')
    key.write_text('fixture\n')
    env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'],
               RPM_TEST_GPG_KEY=str(key), FIXTURE_ROOT=str(root),
               GIT_DIR=git_dir, GIT_WORK_TREE=str(REPO))
    for scenario in ('delayed', 'query-error', 'wrong-result'):
        for name in ('calls.jsonl', 'attempts'):
            path = root / name
            if path.exists():
                path.unlink()
        result = subprocess.run(
            ['/bin/bash', str(TESTS / 'remote-database.sh'), 'linux/arm64',
             str(artifact), 'external', 'bundled'],
            cwd=str(root), env=dict(env, READINESS_CASE=scenario),
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        calls = [json.loads(line) for line in (root / 'calls.jsonl').read_text().splitlines()]
        queries = [call for call in calls if 'psql' in call]
        topology = [call for call in calls if '/tmp/rpm-tests/topology.sh' in call]
        assert len(queries) == (3 if scenario == 'delayed' else 60), (scenario, result.stdout)
        for query in queries:
            for flag, value in (('-h', '127.0.0.1'), ('-p', '5432'), ('-U', 'postgres'),
                                ('-d', 'heimdall-server-production')):
                assert query[query.index(flag) + 1] == value, query
            assert 'PGPASSWORD=Rpm-External-Fixture-2026' in query, query
            assert 'PGCONNECT_TIMEOUT=2' in query, query
            assert 'ON_ERROR_STOP=1' in query and 'SELECT 1' in query, query
        if scenario == 'delayed':
            assert result.returncode == 0 and len(topology) == 1, result.stdout
            assert calls.index(topology[0]) > calls.index(queries[-1]), calls
        else:
            assert result.returncode != 0 and not topology, result.stdout
            assert 'Timed out waiting for authenticated PostgreSQL TCP readiness' in result.stdout
        assert ['rm', '-fv', 'app'] in calls and ['rm', '-fv', 'database'] in calls
        assert ['network', 'rm', 'network'] in calls

print('Remote database readiness: PASS (delayed TCP, query errors, wrong result, timeout/cleanup)')
