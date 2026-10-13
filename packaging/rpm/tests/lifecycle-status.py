#!/usr/bin/env python3
"""Keep disconnected DNF failures and lifecycle evidence observable."""
import os
from pathlib import Path
import subprocess
import tempfile
import textwrap
import unittest

TESTS = Path(__file__).resolve().parent


class LifecycleStatusTests(unittest.TestCase):
    def test_local_upgrade_fixture_preserves_keys_and_builder_failures(self):
        workflow = (TESTS.parents[2] / '.github/workflows/build-rpm.yml').read_text()
        marker = '      - name: Build the upgrade fixture locally\n'
        self.assertTrue(marker in workflow, 'Upgrade fixtures must be built in the test job')
        step = workflow.split(marker, 1)[1].split('\n      - ', 1)[0]
        program = textwrap.dedent(step.split('        run: |\n', 1)[1])
        for arch, platform in [('aarch64', 'linux/arm64'), ('x86_64', 'linux/amd64')]:
            for status in (0, 17):
                with self.subTest(arch=arch, status=status), tempfile.TemporaryDirectory() as temp:
                    root = Path(temp)
                    current = root / 'artifacts/current'
                    (current / 'SRPMS').mkdir(parents=True)
                    (current / 'SRPMS/candidate.src.rpm').write_text('source RPM')
                    (current / 'RPM-TEST-GPG-KEY').write_text('current key\n')
                    script = root / 'fixture.sh'
                    script.write_text('''set -euo pipefail
docker() {
  case $1 in
    build) return 0 ;;
    create) printf 'fixture-builder\\n' ;;
    start) return 0 ;;
    inspect) printf '%s\\n' "$BUILDER_STATUS" ;;
    cp)
      case $2 in
        artifacts/current/SRPMS/candidate.src.rpm) [[ $3 == fixture-builder:/tmp/candidate.src.rpm ]] ;;
        fixture-builder:/tmp/upgrade-fixture/RPMS)
          mkdir -p "$3/$FIXTURE_ARCH"
          printf 'previous RPM\\n' > "$3/$FIXTURE_ARCH/previous.rpm" ;;
        fixture-builder:/tmp/upgrade-fixture/RPM-TEST-GPG-KEY)
          printf 'fixture key\\n' > "$3" ;;
        *) return 92 ;;
      esac ;;
    rm) printf 'cleaned\\n' > cleanup.log ;;
    *) return 93 ;;
  esac
}
''' + program.replace('${{ matrix.platform }}', platform))
                    result = subprocess.run(['bash', str(script)], cwd=temp,
                                            env=dict(os.environ, BUILDER_STATUS=str(status),
                                                     FIXTURE_ARCH=arch, UPGRADE_FIXTURE_RELEASE='0.3.integration'),
                                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                            universal_newlines=True)
                    self.assertEqual(result.returncode, status, result.stdout)
                    self.assertEqual((root / 'cleanup.log').read_text(), 'cleaned\n')
                    self.assertEqual((current / 'RPM-TEST-GPG-KEY').read_text(), 'current key\n')
                    combined = root / 'artifacts/RPM-TEST-GPG-KEY'
                    if status == 0:
                        self.assertEqual(combined.read_text(), 'current key\nfixture key\n')
                        self.assertEqual((root / 'artifacts/previous/RPMS' / arch / 'previous.rpm').read_text(),
                                         'previous RPM\n')
                    else:
                        self.assertFalse(combined.exists())
                        self.assertFalse((root / 'artifacts/previous').exists())

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
