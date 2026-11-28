#!/usr/bin/env python3
"""Exercise shortcut staging and failure handling without compiling the application."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

RPM = Path(__file__).resolve().parents[1]


class BuildShortcutsTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='heimdall-build-shortcuts-')
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        source = root / 'source'
        self.packaging = source / 'packaging/rpm'
        (self.packaging / 'scripts').mkdir(parents=True)
        shutil.copyfile(str(RPM / 'Makefile'), str(self.packaging / 'Makefile'))
        shutil.copyfile(str(RPM / 'scripts/check-inputs.py'),
                        str(self.packaging / 'scripts/check-inputs.py'))
        (source / 'VERSION').write_text('v2.13.1\n')
        for app in ('backend', 'frontend'):
            path = source / 'apps' / app
            path.mkdir(parents=True)
            (path / 'package.json').write_text('{"version":"2.13.1"}\n')
        self.spec = self.packaging / 'heimdall-server.spec'
        self.spec.write_text('Version: @HEIMDALL_VERSION@\nSummary: updated spec\n')
        self.topdir = root / 'build output'
        (self.topdir / 'SPECS').mkdir(parents=True)
        (self.topdir / 'SPECS/heimdall-server.spec').write_text(
            'Version: 2.13.1\nSummary: stale spec\n')
        self.artifact = self.topdir / 'RPMS/noarch/fixture.rpm'
        self.artifact.parent.mkdir(parents=True)
        self.artifact.write_text('old RPM')
        self.calls = self.topdir / 'calls'
        binaries = root / 'bin'
        binaries.mkdir()
        stub = binaries / 'rpmbuild'
        stub.write_text('''#!/usr/bin/env python3
import json, os
from pathlib import Path
import sys
args = sys.argv[1:]
mode = next(value for value in args if value in ('-bi', '-bb'))
topdir = Path(args[args.index('--define') + 1].split(' ', 1)[1])
spec = Path(args[-1]).read_text()
with (topdir / 'calls').open('a') as output:
    output.write(json.dumps({'mode': mode, 'spec': spec}) + '\\n')
if os.environ.get('FAIL_STAGE') == mode:
    sys.exit(42)
payload = topdir / 'BUILDROOT/fixture/payload'
if mode == '-bi':
    payload.parent.mkdir(parents=True, exist_ok=True)
    payload.write_text('installed payload')
else:
    assert payload.is_file(), 'packaging ran before installation'
    (topdir / 'RPMS/noarch/fixture.rpm').write_text(spec + payload.read_text())
''')
        stub.chmod(0o755)
        self.environment = dict(os.environ, PATH=str(binaries) + os.pathsep + os.environ['PATH'])

    def run_make(self, target, fail_stage=''):
        return subprocess.run(['make', '-C', str(self.packaging), target,
                               'TOPDIR=' + str(self.topdir)],
                              env=dict(self.environment, FAIL_STAGE=fail_stage),
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                              universal_newlines=True)

    def populate_buildroot(self):
        payload = self.topdir / 'BUILDROOT/fixture/payload'
        payload.parent.mkdir(parents=True, exist_ok=True)
        payload.write_text('existing payload')

    def recorded_calls(self):
        return [json.loads(line) for line in self.calls.read_text().splitlines()]

    def test_packaging_failure_is_returned_without_success_output(self):
        self.populate_buildroot()
        result = self.run_make('rpm-package', '-bb')
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertNotIn('RPMs:', result.stdout)
        self.assertEqual(self.artifact.read_text(), 'old RPM')

    def test_failed_installation_stops_before_packaging(self):
        result = self.run_make('rpm-package', '-bi')
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertEqual([call['mode'] for call in self.recorded_calls()], ['-bi'])
        self.assertNotIn('RPMs:', result.stdout)
        self.assertEqual(self.artifact.read_text(), 'old RPM')

    def test_missing_or_empty_buildroot_is_installed_before_packaging(self):
        for empty in (False, True):
            with self.subTest(empty=empty):
                if empty:
                    shutil.rmtree(str(self.topdir / 'BUILDROOT'))
                    (self.topdir / 'BUILDROOT').mkdir()
                    self.calls.unlink()
                    self.artifact.write_text('old RPM')
                result = self.run_make('rpm-package')
                self.assertEqual(result.returncode, 0, result.stdout)
                self.assertEqual([call['mode'] for call in self.recorded_calls()], ['-bi', '-bb'])
                self.assertIn('installed payload', self.artifact.read_text())

    def test_existing_buildroot_goes_straight_to_packaging(self):
        self.populate_buildroot()
        result = self.run_make('rpm-package')
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual([call['mode'] for call in self.recorded_calls()], ['-bb'])
        self.assertIn('existing payload', self.artifact.read_text())

    def test_both_shortcuts_render_spec_edits_and_produce_updated_rpms(self):
        self.populate_buildroot()
        for target in ('rpm-install', 'rpm-package'):
            with self.subTest(target=target):
                self.spec.write_text('Version: @HEIMDALL_VERSION@\nSummary: ' + target + '\n')
                result = self.run_make(target)
                self.assertEqual(result.returncode, 0, result.stdout)
                expected = 'Version: 2.13.1\nSummary: ' + target + '\n'
                self.assertTrue(self.artifact.read_text().startswith(expected), result.stdout)
                self.assertTrue(all(call['spec'] == expected for call in self.recorded_calls()))
                self.calls.unlink()


if __name__ == '__main__':
    unittest.main()
