#!/bin/bash
# Unprivileged wrapper contract: execute a copy with only the fixed CLI path replaced.
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
    result = subprocess.run(['bash', str(wrapper), *args], env=env, input=b'', capture_output=True)
    assert result.returncode == 37, result
    assert json.loads(log.read_text()) == ['setup', *args]
    env['WRAPPER_EXIT'] = '0'
    result = subprocess.run(['bash', str(wrapper)], env=env, input=b'', capture_output=True)
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
