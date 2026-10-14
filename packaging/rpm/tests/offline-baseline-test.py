#!/usr/bin/env python3
"""Reject a disconnected test that hides missing dependencies or changes the OS."""
import copy
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True


class OfflineBaselineTests(unittest.TestCase):
    def setUp(self):
        helper = Path(__file__).with_name('offline-baseline.py')
        self.assertTrue(helper.exists(), 'Offline baseline validation is missing')
        spec = importlib.util.spec_from_file_location('offline_baseline', str(helper))
        self.helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.helper)
        self.manifest = {
            'schema': 1,
            'distribution': {'id': 'rocky', 'version_id': '8.10'},
            'architecture': 'x86_64',
            'baseline': [{'name': 'systemd', 'nevra': 'systemd-239-82.el8.x86_64'}],
            'dependencies': [{'name': 'tar', 'nevra': 'tar-2:1.30-13.el8.x86_64'}],
            'candidate': {'name': 'heimdall-server', 'nevra': 'heimdall-server-2.14.0-1.el8.x86_64'},
        }
        self.installed = {'systemd': {'systemd-239-82.el8.x86_64'},
                          'container-tool': {'container-tool-1-1.noarch'}}

    def check(self, installed=None, before=None):
        self.helper.check_inventory(self.manifest, installed or self.installed, before)

    def test_extra_image_packages_are_allowed_but_bundled_dependencies_are_absent(self):
        self.check()
        self.installed['tar'] = {'tar-2:1.30-9.el8.x86_64'}
        with self.assertRaisesRegex(ValueError, 'already installed.*tar'):
            self.check()

    def test_baseline_requires_the_exact_recorded_version(self):
        self.installed['systemd'] = {'systemd-239-81.el8.x86_64'}
        with self.assertRaisesRegex(ValueError, 'baseline.*systemd'):
            self.check()

    def test_inventory_treats_explicit_and_omitted_zero_epoch_as_identical(self):
        expected = {'libldb': {'libldb-4.23.5-12.el9_8.aarch64'},
                    'python3-samba-dc': {'python3-samba-dc-4.23.5-12.el9_8.aarch64'}}
        for epoch in ('', '0:'):
            with self.subTest(epoch=epoch):
                output = ('libldb\tlibldb-{}4.23.5-12.el9_8.aarch64\n'
                          'python3-samba-dc\tpython3-samba-dc-{}4.23.5-12.el9_8.aarch64\n').format(epoch, epoch)
                self.assertEqual(self.helper.inventory(output), expected)

    def test_inventory_preserves_other_package_identity_differences(self):
        for nevra in ('systemd-1:239-82.el8.x86_64',
                      'systemd-240-82.el8.x86_64',
                      'systemd-239-83.el8.x86_64',
                      'systemd-239-82.el8.aarch64'):
            with self.subTest(nevra=nevra):
                installed = self.helper.inventory('systemd\t' + nevra + '\n')
                self.assertEqual(installed, {'systemd': {nevra}})
                with self.assertRaisesRegex(ValueError, 'baseline.*systemd'):
                    self.check(installed)

    def test_a_dependency_supplied_by_the_actual_core_baseline_is_allowed(self):
        self.manifest['baseline'].append({'name': 'policycoreutils-python-utils',
                                         'nevra': 'policycoreutils-python-utils-3-1.noarch'})
        self.installed['policycoreutils-python-utils'] = {'policycoreutils-python-utils-3-1.noarch'}
        self.check()

    def test_successful_install_adds_dependencies_without_changing_existing_packages(self):
        after = copy.deepcopy(self.installed)
        after['tar'] = {'tar-2:1.30-13.el8.x86_64'}
        after['heimdall-server'] = {'heimdall-server-2.14.0-1.el8.x86_64'}
        self.check(after, self.installed)
        after['container-tool'] = {'container-tool-2-1.noarch'}
        with self.assertRaisesRegex(ValueError, 'changed.*container-tool'):
            self.check(after, self.installed)

    def test_missing_dependency_after_install_is_rejected(self):
        after = copy.deepcopy(self.installed)
        after['heimdall-server'] = {'heimdall-server-2.14.0-1.el8.x86_64'}
        with self.assertRaisesRegex(ValueError, 'installed.*tar'):
            self.check(after, self.installed)

    def test_importing_a_signing_key_does_not_count_as_an_os_upgrade(self):
        self.installed['gpg-pubkey'] = {'gpg-pubkey-vendor-1'}
        after = copy.deepcopy(self.installed)
        after['gpg-pubkey'].add('gpg-pubkey-heimdall-1')
        after['tar'] = {'tar-2:1.30-13.el8.x86_64'}
        after['heimdall-server'] = {'heimdall-server-2.14.0-1.el8.x86_64'}
        self.check(after, self.installed)

    def test_wrong_distribution_or_architecture_is_rejected(self):
        for release, arch in [({'ID': 'rhel', 'VERSION_ID': '8.10'}, 'x86_64'),
                              ({'ID': 'rocky', 'VERSION_ID': '8.9'}, 'x86_64'),
                              ({'ID': 'rocky', 'VERSION_ID': '8.10'}, 'aarch64')]:
            with self.subTest(release=release, arch=arch):
                with self.assertRaises(ValueError):
                    self.helper.check_platform(self.manifest, release, arch)

    def test_older_minor_image_can_be_provisioned_to_the_recorded_baseline(self):
        self.helper.check_platform(self.manifest, {'ID': 'rocky', 'VERSION_ID': '8.9'},
                                   'x86_64', exact_version=False)
        with self.assertRaises(ValueError):
            self.helper.check_platform(self.manifest, {'ID': 'rocky', 'VERSION_ID': '9.0'},
                                       'x86_64', exact_version=False)

    def test_snapshot_requires_exactly_the_recorded_core_rpms(self):
        with tempfile.TemporaryDirectory() as temporary:
            snapshot = Path(temporary)
            (snapshot / 'os-dependencies.json').write_text(json.dumps(self.manifest))
            rpms = snapshot / 'RPMS' / 'x86_64'
            rpms.mkdir(parents=True)
            package = rpms / 'systemd.rpm'
            package.touch()
            with mock.patch.object(self.helper.subprocess, 'check_output',
                                   return_value='systemd\tsystemd-0:239-82.el8.x86_64\n'):
                self.assertEqual(self.helper.snapshot_packages(self.manifest, snapshot),
                                 [('systemd', str(package))])
            for output in ('systemd\tsystemd-239-81.el8.x86_64\n',
                           'systemd\tsystemd-239-82.el8.aarch64\n',
                           'tar\ttar-2:1.30-13.el8.x86_64\n'):
                with self.subTest(output=output), mock.patch.object(
                        self.helper.subprocess, 'check_output', return_value=output):
                    with self.assertRaisesRegex(ValueError, 'snapshot.*baseline'):
                        self.helper.snapshot_packages(self.manifest, snapshot)
            package.unlink()
            with self.assertRaisesRegex(ValueError, 'snapshot.*baseline'):
                self.helper.snapshot_packages(self.manifest, snapshot)

    def test_snapshot_rejects_extra_or_duplicate_rpms(self):
        with tempfile.TemporaryDirectory() as temporary:
            snapshot = Path(temporary)
            (snapshot / 'os-dependencies.json').write_text(json.dumps(self.manifest))
            rpms = snapshot / 'RPMS' / 'x86_64'
            rpms.mkdir(parents=True)
            (rpms / 'systemd.rpm').touch()
            (rpms / 'extra.rpm').touch()
            for extra in ('tar\ttar-2:1.30-13.el8.x86_64\n',
                          'systemd\tsystemd-239-82.el8.x86_64\n'):
                with self.subTest(extra=extra), mock.patch.object(
                        self.helper.subprocess, 'check_output',
                        return_value='systemd\tsystemd-239-82.el8.x86_64\n' + extra):
                    with self.assertRaisesRegex(ValueError, 'snapshot.*baseline'):
                        self.helper.snapshot_packages(self.manifest, snapshot)

    def test_snapshot_must_belong_to_the_same_bundle(self):
        with tempfile.TemporaryDirectory() as temporary:
            snapshot = Path(temporary)
            other = copy.deepcopy(self.manifest)
            other['candidate']['nevra'] = 'heimdall-server-2.15.0-1.el8.x86_64'
            (snapshot / 'os-dependencies.json').write_text(json.dumps(other))
            with self.assertRaisesRegex(ValueError, 'snapshot manifest'):
                self.helper.snapshot_packages(self.manifest, snapshot)


if __name__ == '__main__':
    unittest.main()
