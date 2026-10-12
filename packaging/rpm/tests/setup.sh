#!/bin/bash
# Unprivileged wrapper contracts: execute copies with fixed executable/config paths replaced.
set -euo pipefail
python3 - "$(cd "$(dirname "$0")/.." && pwd)/heimdall-setup.sh" <<'PY'
import json
import os
from pathlib import Path
import pty
import subprocess
import sys
import tempfile

with tempfile.TemporaryDirectory(prefix='heimdall-wrapper-') as directory:
    directory = Path(directory)
    log = directory / 'argv.json'
    cli = directory / 'heimdall-cli'
    cli.write_text('#!' + sys.executable + '\nimport json,os,sys\n'
                   'open(os.environ["WRAPPER_ARGV"],"w").write(json.dumps(sys.argv[1:]))\n'
                   'sys.exit(int(os.environ.get("WRAPPER_EXIT", "0")))\n')
    cli.chmod(0o755)
    wrapper = directory / 'setup.sh'
    source = Path(sys.argv[1]).read_text()
    assert '/usr/bin/heimdall-cli' in source, 'setup must delegate to the packaged CLI'
    wrapper.write_text(source.replace('/usr/bin/heimdall-cli', str(cli)))
    env = dict(os.environ, WRAPPER_ARGV=str(log), WRAPPER_EXIT='37')
    args = ['--non-interactive', '--db-password', 'spaces $dollar ; literal', '--skip-db']
    result = subprocess.run(['bash', str(wrapper), *args], env=env, input=b'',
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert result.returncode == 37, result
    assert json.loads(log.read_text()) == ['setup', *args]
    env['WRAPPER_EXIT'] = '0'
    result = subprocess.run(['bash', str(wrapper)], env=env, input=b'',
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert result.returncode == 0
    assert json.loads(log.read_text()) == ['setup']
    master, slave = pty.openpty()
    try:
        result = subprocess.run(['bash', str(wrapper)], env=env, stdin=slave, stdout=slave, stderr=slave)
        assert result.returncode == 0
        assert json.loads(log.read_text()) == ['setup', '--interactive']
        result = subprocess.run(['bash', str(wrapper), '--dry-run'], env=env, stdin=slave, stdout=slave, stderr=slave)
        assert result.returncode == 0
        assert json.loads(log.read_text()) == ['setup', '--dry-run']
    finally:
        os.close(master)
        os.close(slave)
print('setup wrapper: arguments, exit status and TTY defaults passed')
PY
python3 - "$(cd "$(dirname "$0")/.." && pwd)/heimdall-db-setup.sh" <<'PY'
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

with tempfile.TemporaryDirectory(prefix='heimdall-db-wrapper-') as directory:
    root = Path(directory)
    app = root / 'apps/backend'
    (app / 'node_modules/.bin').mkdir(parents=True)
    (app / 'dist/db').mkdir(parents=True)
    (app / 'dist/db/database.js').write_text('fixture\n')
    sequelize = app / 'node_modules/.bin/sequelize'
    sequelize.touch()
    sequelize.chmod(0o755)
    node = root / 'node'
    node.write_text('#!' + sys.executable + '\n' + '''import json, os, sys
command = sys.argv[2]
with open(os.environ['WRAPPER_ARGV'], 'a') as log:
    log.write(json.dumps(command) + '\\n')
scenario = os.environ['DB_CASE']
if command == 'db:create' and os.environ.get('HEIMDALL_DATABASE_MODE') == 'external':
    print('ERROR: permission denied to create database', file=sys.stderr)
    sys.exit(1)
if command == 'db:create' and scenario == 'already-exists':
    print('Database already exists', file=sys.stderr)
    sys.exit(1)
if (command, scenario) in [('db:create', 'create-error'), ('db:migrate', 'migrate-error'),
                          ('db:migrate', 'missing-db'), ('db:migrate', 'bad-credentials'),
                          ('db:seed:all', 'seed-error')]:
    print('ERROR: ' + scenario, file=sys.stderr)
    sys.exit(23)
''')
    node.chmod(0o755)
    config, log, wrapper = root / 'backend.env', root / 'argv.jsonl', root / 'db-setup.sh'
    source = Path(sys.argv[1]).read_text()
    source = source.replace('/usr/share/heimdall-server', str(root))
    source = source.replace('/etc/heimdall-server/backend.env', str(config))
    source = source.replace('/usr/libexec/heimdall-server/runtime/node/bin/node', str(node))
    wrapper.write_text(source)
    def check(mode, scenario, expected, code=0, args=()):
        # Saved mode must override a conflicting inherited selection.
        config.write_text('HEIMDALL_DATABASE_MODE=' + mode + '\n' if mode else '')
        log.write_text('')
        env = dict(os.environ, WRAPPER_ARGV=str(log), DB_CASE=scenario)
        env.pop('HEIMDALL_DATABASE_MODE', None)
        if mode:
            env['HEIMDALL_DATABASE_MODE'] = 'bundled' if mode == 'external' else 'external'
        result = subprocess.run(['bash', str(wrapper), *args], env=env,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        calls = [json.loads(line) for line in log.read_text().splitlines()]
        assert result.returncode == code and calls == expected, (mode, scenario, calls, result.stdout)
    migrate_seed = ['db:migrate', 'db:seed:all']
    check('external', 'success', migrate_seed)
    check('external', 'success', ['db:migrate'], args=('--skip-seed',))
    for scenario in ('missing-db', 'bad-credentials', 'migrate-error'):
        check('external', scenario, ['db:migrate'], code=23)
    check('external', 'seed-error', migrate_seed, code=23)
    for mode in ('bundled', ''):
        check(mode, 'success', ['db:create', *migrate_seed])
        check(mode, 'already-exists', ['db:create', *migrate_seed])
        check(mode, 'create-error', ['db:create'], code=1)
print('database wrapper: external ownership, saved mode, failures and legacy creation passed')
PY
