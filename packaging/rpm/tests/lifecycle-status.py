#!/usr/bin/env python3
"""Keep disconnected DNF failures and lifecycle evidence observable."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

TESTS = Path(__file__).resolve().parent


class LifecycleStatusTests(unittest.TestCase):
    def test_installer_preserves_status_and_disables_repositories(self):
        lifecycle = (TESTS / 'lifecycle.sh').read_text()
        helper = lifecycle[lifecycle.index('install_candidate() {'):lifecycle.index('refuse_upgrade() {')]
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            status_file = root / 'installer-status.log'
            helper = helper.replace('/tmp/rpm-lifecycle-installer-status.log', str(status_file))
            helper = helper.replace('/tmp/rpm-lifecycle-transaction.log', str(root / 'transaction.log'))
            script = root / 'fixture.sh'
            script.write_text('''set -euo pipefail
timeout() { [[ $1 == 300 ]]; shift; "$@"; }
dnf() {
  [[ $1 == "$EXPECTED_ACTION" ]] || return 91
  [[ " $* " == *" --disablerepo=* "* ]] || return 92
  [[ " $* " == *" --setopt=localpkg_gpgcheck=1 "* ]] || return 93
  [[ ${@: -1} == /tmp/candidate.rpm ]] || return 94
  [[ $SCRIPTLET_ERROR == 0 ]] || echo 'Error in POSTIN scriptlet in rpm package heimdall-server'
  return "$INSTALL_FIXTURE_STATUS"
}
''' + helper + '''
for phase in install upgrade recover; do
  EXPECTED_ACTION=install
  [[ $phase != upgrade ]] || EXPECTED_ACTION=upgrade
  for status in 0 1 17; do
    INSTALL_FIXTURE_STATUS=$status
    SCRIPTLET_ERROR=0
    result=0
    install_candidate /tmp/candidate.rpm "$phase" || result=$?
    [[ $result == "$status" ]]
  done
done
INSTALL_FIXTURE_STATUS=0
SCRIPTLET_ERROR=1
EXPECTED_ACTION=install
if install_candidate /tmp/candidate.rpm install; then exit 95; fi
''')
            result = subprocess.run(['bash', str(script)], stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, universal_newlines=True)
            self.assertEqual(result.returncode, 0, result.stdout)
            self.assertEqual(status_file.read_text().splitlines(), [
                'phase={} exit_status={} candidate=/tmp/candidate.rpm'.format(phase, status)
                for phase in ('install', 'upgrade', 'recover') for status in (0, 1, 17)
            ] + ['phase=install exit_status=1 candidate=/tmp/candidate.rpm'])

    def test_driver_retains_status_evidence(self):
        driver = (TESTS / 'run-lifecycle.sh').read_text()
        cleanup = 'cleanup() {' + driver.split('cleanup() {', 1)[1].split('\ntrap cleanup EXIT', 1)[0]
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / 'source.log'
            source.write_text('phase=upgrade exit_status=17 candidate=/tmp/candidate.rpm\n')
            for status in (0, 17):
                with self.subTest(status=status):
                    logdir = root / str(status)
                    logdir.mkdir()
                    script = root / 'cleanup.sh'
                    script.write_text('''set -euo pipefail
container=fixture
docker() {
  case $1 in
    cp) [[ $2 == fixture:/tmp/rpm-lifecycle-installer-status.log ]] || return 1; cp "$STATUS_SOURCE" "$3" ;;
    inspect) printf '[]\\n' ;;
    *) return 0 ;;
  esac
}
''' + cleanup + '\ntrap cleanup EXIT\nexit ' + str(status) + '\n')
                    result = subprocess.run(['bash', str(script)],
                                            env=dict(os.environ, STATUS_SOURCE=str(source), logdir=str(logdir)),
                                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                            universal_newlines=True)
                    self.assertEqual(result.returncode, status, result.stdout)
                    self.assertTrue((logdir / 'installer-status.log').exists(), result.stdout)
                    self.assertEqual((logdir / 'installer-status.log').read_bytes(), source.read_bytes())
                    self.assertEqual((logdir / 'result.txt').read_text(), 'exit_status={}\n'.format(status))


if __name__ == '__main__':
    unittest.main()
