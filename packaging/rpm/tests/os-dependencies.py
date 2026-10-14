#!/usr/bin/env python3
"""Check the offline bundle's baseline and vendor trust boundaries without DNF."""
import importlib.util
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/bundle-os-dependencies.py'
sys.dont_write_bytecode = True
assert SCRIPT.is_file(), 'Offline OS dependency collector is missing'
spec = importlib.util.spec_from_file_location('os_dependencies', str(SCRIPT))
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class Package:
    def __init__(self, name, version='1', arch='x86_64', repo='baseos'):
        self.name, self.version, self.arch, self.reponame = name, version, arch, repo

    def __str__(self):
        return '{}-{}.{}'.format(self.name, self.version, self.arch)


class OfflineDependencies(unittest.TestCase):
    def setUp(self):
        self.core = Package('systemd')
        self.candidate = Package('heimdall-server', repo='@commandline')
        self.extra = Package('checkpolicy')

    def collect_fixture(self, root, unsigned=None):
        output = root / 'bundle'
        output.mkdir()
        candidate = root / 'candidate.rpm'
        candidate.write_bytes(b'candidate')
        key = root / 'vendor-key'
        key.write_bytes(b'vendor key')
        repositories = {}
        for name in collector.REPOSITORIES:
            repositories[name] = MagicMock(id=name, gpgcheck=True, sslverify=True,
                                           gpgkey=[key.as_uri()])
        base = MagicMock()
        base.__enter__.return_value = base
        base.repos.values.return_value = list(repositories.values())
        base.repos.iter_enabled.return_value = iter(repositories.values())
        base.add_remote_rpms.return_value = [self.candidate]
        transactions = iter([[self.core], [self.core, self.extra, self.candidate]])

        def resolve():
            base.transaction.install_set = next(transactions)

        def download(packages):
            for package in packages:
                path = root / (str(package) + '.rpm')
                path.write_bytes(package.name.encode())
                package.localPkg = lambda path=path: str(path)

        def signature(command, **kwargs):
            text = 'Header V4 RSA/SHA256 Signature, key ID deadbeef: OK\n'
            if unsigned and Path(command[-1]).name.startswith(unsigned + '-'):
                text = 'digests OK\n'
            return subprocess.CompletedProcess(command, 0, stdout=text)

        base.resolve.side_effect = resolve
        base.download_packages.side_effect = download
        with patch.dict(sys.modules, {'dnf': SimpleNamespace(Base=lambda: base)}), \
                patch.object(collector, 'read_os_release',
                             return_value={'ID': 'rocky', 'VERSION_ID': '9.8'}), \
                patch.object(collector.platform, 'machine', return_value='x86_64'), \
                patch.object(collector.subprocess, 'check_output',
                             return_value='heimdall-server\t1.el9\tx86_64'), \
                patch.object(collector.subprocess, 'check_call'), \
                patch.object(collector.subprocess, 'run', side_effect=signature):
            collector.collect(candidate, output)
        return output

    def test_collection_contains_signed_dependencies_and_vendor_keys(self):
        with tempfile.TemporaryDirectory() as temp:
            output = self.collect_fixture(Path(temp))
            self.assertEqual(set(p.name for p in output.iterdir()), set(collector.OUTPUT_NAMES))
            self.assertEqual(sorted(p.name for p in (output / 'OS-RPMS/x86_64').iterdir()),
                             ['checkpolicy-1.x86_64.rpm'])
            self.assertEqual((output / 'OS-RPMS/x86_64/checkpolicy-1.x86_64.rpm').read_bytes(),
                             b'checkpolicy')
            manifest = json.loads((output / 'os-dependencies.json').read_text())
            self.assertEqual(manifest['dependencies'], [{'name': 'checkpolicy',
                'nevra': 'checkpolicy-1.x86_64', 'path': 'OS-RPMS/x86_64/checkpolicy-1.x86_64.rpm',
                'sha256': hashlib.sha256(b'checkpolicy').hexdigest(), 'repository': 'baseos'}])
            self.assertEqual((output / 'OS-GPG-KEYS/vendor-key').read_bytes(), b'vendor key')

    def test_unsigned_packages_cannot_publish_bundle(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaisesRegex(ValueError, 'Vendor signature'):
                self.collect_fixture(root, unsigned='checkpolicy')
            self.assertEqual(list((root / 'bundle').iterdir()), [])

    def test_dependencies_reject_other_repositories_and_architectures(self):
        for repository, arch in [('epel', 'x86_64'), ('baseos', 'i686')]:
            with self.subTest(repository=repository, arch=arch), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.extra.reponame, self.extra.arch = repository, arch
                with self.assertRaisesRegex(ValueError, 'repository or architecture'):
                    self.collect_fixture(root)

    def test_only_additional_packages_are_bundled(self):
        self.assertEqual(collector.dependency_delta(
            [self.core], [self.core, self.candidate, self.extra], self.candidate),
            [self.extra])

    def test_core_update_or_removal_is_rejected(self):
        for combined in ([self.candidate], [Package('systemd', '2'), self.candidate]):
            with self.assertRaisesRegex(ValueError, 'baseline'):
                collector.dependency_delta([self.core], combined, self.candidate)

    def test_multilib_baseline_does_not_hide_package_changes(self):
        second = Package('systemd', arch='i686')
        changed = Package('systemd', '2')
        with self.assertRaisesRegex(ValueError, 'baseline'):
            collector.dependency_delta([self.core, second],
                [changed, second, self.candidate], self.candidate)

    def test_wrong_candidate_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'candidate'):
            collector.dependency_delta([self.core], [self.core, self.extra], self.candidate)

    def test_target_matches_distribution_major_and_architecture(self):
        rocky = {'ID': 'rocky', 'VERSION_ID': '8.10'}
        self.assertEqual(collector.validate_target(rocky, 'x86_64',
            'heimdall-server', '0.4.integration.el8', 'x86_64'), '8')
        cases = [({'ID': 'rhel', 'VERSION_ID': '8.10'}, 'x86_64', '0.4.el8', 'x86_64'),
                 (rocky, 'x86_64', '0.4.el9', 'x86_64'),
                 (rocky, 'x86_64', '0.4.el8', 'aarch64'),
                 (rocky, 'ppc64le', '0.4.el8', 'ppc64le')]
        for os_release, arch, release, rpm_arch in cases:
            with self.assertRaises(ValueError):
                collector.validate_target(os_release, arch, 'heimdall-server', release, rpm_arch)

    def test_unsigned_or_unknown_key_package_is_rejected(self):
        for output, status in [('digests OK\n', 0),
                ('Header V4 RSA/SHA256 Signature, key ID deadbeef: NOKEY\n', 1),
                ('Header V4 RSA/SHA256 Signature, key ID deadbeef: OK\nPayload SHA256 digest: BAD\n', 1)]:
            result = subprocess.CompletedProcess([], status, stdout=output)
            with patch.object(collector.subprocess, 'run', return_value=result):
                with self.assertRaisesRegex(ValueError, 'signature'):
                    collector.verify_signature(Path('/tmp/trust'), Path('/tmp/package.rpm'))

    def test_signature_check_uses_only_isolated_key_database(self):
        result = subprocess.CompletedProcess([], 0,
            stdout='Header V4 RSA/SHA256 Signature, key ID deadbeef: OK\n')
        with patch.object(collector.subprocess, 'run', return_value=result) as run:
            collector.verify_signature(Path('/tmp/trust'), Path('/tmp/package.rpm'))
        self.assertEqual(run.call_args[0][0], ['rpmkeys', '--dbpath', '/tmp/trust',
            '--checksig', '--verbose', '/tmp/package.rpm'])
        self.assertEqual(run.call_args[1]['env']['LC_ALL'], 'C')

    def test_existing_bundle_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in collector.OUTPUT_NAMES:
                path = root / name
                path.write_text('existing contents')
                with self.assertRaisesRegex(ValueError, 'exists'):
                    collector.check_output(root)
                self.assertEqual(path.read_text(), 'existing contents')
                path.unlink()

    def test_repository_trust_checks_cannot_be_disabled(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            key = root / 'vendor-key'
            key.write_text('fixture vendor key')
            for index, settings in enumerate((
                    {'gpgcheck': False}, {'sslverify': False},
                    {'gpgkey': ['https://example.invalid/key']}, {'gpgkey': []})):
                values = {'id': 'baseos', 'gpgcheck': True, 'sslverify': True,
                          'gpgkey': [key.as_uri()]}
                values.update(settings)
                repo = SimpleNamespace(**values)
                with self.assertRaises(ValueError):
                    collector.copy_repository_keys([repo], root / str(index))

    def test_conflicting_vendor_keys_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            keys = []
            for name in ('first', 'second'):
                (root / name).mkdir()
                key = root / name / 'vendor-key'
                key.write_text(name)
                keys.append(key.as_uri())
            repo = SimpleNamespace(id='baseos', gpgcheck=True, sslverify=True, gpgkey=keys)
            with self.assertRaisesRegex(ValueError, 'filenames conflict'):
                collector.copy_repository_keys([repo], root / 'keys')

    def test_os_release_reader_preserves_quoted_values_and_ignores_comments(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'os-release'
            path.write_text('# ignored="unterminated\n\nID=rocky\nVERSION_ID="9.8"\n'
                            'NAME="Rocky Linux"\n')
            self.assertEqual(collector.read_os_release(path),
                {'ID': 'rocky', 'VERSION_ID': '9.8', 'NAME': 'Rocky Linux'})

    def test_host_repository_variables_survive_isolated_installroot(self):
        class Substitutions(dict):
            def update_from_etc(self, installroot, varsdir):
                if installroot == '/' and varsdir == ['/etc/dnf/vars']:
                    self['rltype'] = ''

        class Base:
            def __init__(self):
                self.conf = SimpleNamespace(read=lambda: None,
                    substitutions=Substitutions(), varsdir=['/etc/dnf/vars'])

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read_all_repos(self):
                if 'rltype' not in self.conf.substitutions:
                    raise AssertionError('Rocky mirror URL contains unresolved $rltype')
                raise RuntimeError('Reached repository loading with host variables')

        with tempfile.TemporaryDirectory() as temp, \
                patch.dict(sys.modules, {'dnf': SimpleNamespace(Base=Base)}), \
                patch.object(collector.Path, 'read_text', return_value='ID=rocky\nVERSION_ID=9.8\n'), \
                patch.object(collector.platform, 'machine', return_value='aarch64'), \
                patch.object(collector.subprocess, 'check_output',
                    return_value='heimdall-server\t0.4.el9\taarch64'):
            with self.assertRaisesRegex(RuntimeError, 'with host variables'):
                collector.collect(Path('/tmp/candidate.rpm'), Path(temp))


if __name__ == '__main__':
    unittest.main()
