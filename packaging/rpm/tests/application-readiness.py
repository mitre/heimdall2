#!/usr/bin/env python3
"""Probe fixtures must reject HTTP success without usable application/database state."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

TESTS = Path(__file__).resolve().parent
assert (TESTS / 'application-ready.sh').exists(), 'Shared application readiness probe is missing'
with tempfile.TemporaryDirectory(prefix='heimdall-application-ready-') as temp:
    root = Path(temp)
    (root / 'node/bin').mkdir(parents=True)
    (root / 'node/bin/node').symlink_to(shutil.which('node'))
    (root / 'postgresql/bin').mkdir(parents=True)
    (root / 'migrations').mkdir()
    (root / 'migrations/fixture.js').touch()
    (root / 'backend.env').write_text('DATABASE_HOST=db\nDATABASE_PORT=55432\n'
        'DATABASE_USERNAME=heimdall\nDATABASE_PASSWORD=fixture\nDATABASE_NAME=heimdall\n'
        'EXTERNAL_URL=https://heimdall.example.test\n')
    stub = '#!' + sys.executable + '\n' + '''import json, os, pathlib, sys
args = sys.argv[1:]
case = os.environ['PROBE_CASE']
if pathlib.Path(sys.argv[0]).name == 'psql':
    assert os.environ['PGPASSWORD'] == 'fixture'
    assert 'ON_ERROR_STOP=1' in args
    if case == 'database-error' or (case == 'migration-query-error' and 'COUNT(*)' in args[-1]):
        print('1')
        sys.exit(2)
    print('0' if case == 'missing-migration' else '1')
    sys.exit(0)
assert '--cacert' in args and 'fixture-ca' in args
assert '--resolve' in args and 'heimdall.example.test:443:127.0.0.1' in args
url = next(arg for arg in args if arg.startswith('https://'))
if url.endswith('/server'):
    value = {'localLoginEnabled': True, 'externalUrl': 'https://heimdall.example.test'}
    if case == 'wrong-settings':
        value['localLoginEnabled'] = False
elif url.endswith('/authn/login'):
    assert json.loads(args[args.index('--data') + 1])['password'] == 'Rpm-Smoke-Only-2026!'
    value = {'userID': '1', 'accessToken': 'fixture-token'}
    if case == 'missing-token':
        del value['accessToken']
elif url.endswith('/users/1'):
    assert 'Authorization: Bearer fixture-token' in args
    counter = pathlib.Path(os.environ['PROBE_ATTEMPTS'])
    attempt = int(counter.read_text()) + 1
    counter.write_text(str(attempt))
    if case == 'invalid-session' or (case == 'delayed-session' and attempt < 3):
        print('401')
        sys.exit(22)
    if case == 'forbidden-user':
        print('403')
        sys.exit(22)
    value = {'id': '1', 'email': 'rpm-test@example.invalid', 'role': 'admin'}
    if case == 'wrong-user':
        value['id'] = '2'
else:
    raise AssertionError(url)
pathlib.Path(args[args.index('-o') + 1]).write_text(
    '<html>not ready</html>' if case == 'html-fallback' else json.dumps(value))
if '--write-out' in args:
    print('200')
'''
    for command in (root / 'curl', root / 'postgresql/bin/psql'):
        command.write_text(stub)
        command.chmod(0o755)
    (root / 'sleep').write_text('#!/bin/sh\nexit 0\n')
    (root / 'sleep').chmod(0o755)
    source = (TESTS / 'application-ready.sh').read_text()
    source = source.replace('/usr/libexec/heimdall-server/runtime', str(root))
    source = source.replace('/etc/heimdall-server/backend.env', str(root / 'backend.env'))
    source = source.replace('/usr/share/heimdall-server/apps/backend/migrations', str(root / 'migrations'))
    probe = root / 'application-ready.sh'
    probe.write_text(source)
    for case in ('ready', 'html-fallback', 'wrong-settings', 'database-error', 'migration-query-error',
                 'missing-migration', 'missing-token', 'delayed-session', 'invalid-session',
                 'forbidden-user', 'wrong-user'):
        attempts = root / 'attempts'
        attempts.write_text('0')
        result = subprocess.run(['bash', str(probe), 'https://heimdall.example.test',
            '--cacert', 'fixture-ca', '--resolve', 'heimdall.example.test:443:127.0.0.1'],
            env=dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'],
                     PROBE_CASE=case, PROBE_ATTEMPTS=str(attempts)),
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        assert (result.returncode == 0) == (case in ('ready', 'delayed-session')), (case, result.stdout)
        expected_attempts = {'ready': 1, 'delayed-session': 3, 'invalid-session': 10,
                             'forbidden-user': 1, 'wrong-user': 1}.get(case, 0)
        assert int(attempts.read_text()) == expected_attempts, (case, result.stdout)

print('Application readiness: PASS (JSON, database, migrations, login, bounded session retries)')
