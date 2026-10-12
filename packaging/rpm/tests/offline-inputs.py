#!/usr/bin/env python3
"""Offline collector input and publication checks without native RPM tools."""
import argparse
import contextlib
import io
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/stage-offline.py'


class OfflineInputsTest(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('stage_offline', SCRIPT)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.release = self.root / 'os-release'
        self.release.write_text('ID="rhel"\nVERSION_ID="8.6"\nPLATFORM_ID="platform:el8"\n')

    def test_reads_major_without_pinning_minor(self):
        self.assertEqual(self.module.read_target(self.release),
                         {'id': 'rhel', 'el_major': '8', 'version_id': '8.6'})
        for vendor in ('rocky', 'almalinux', 'ol'):
            for major in ('8', '9', '10'):
                self.release.write_text('ID={}\nVERSION_ID={}.1\nPLATFORM_ID=platform:el{}\n'.format(vendor, major, major))
                self.assertEqual(self.module.read_target(self.release)['el_major'], major)

    def test_reads_distribution_os_release_symlink(self):
        link = self.root / 'os-release-link'
        link.symlink_to(self.release)
        self.assertEqual(self.module.read_target(link)['id'], 'rhel')

    def test_rejects_invalid_target_without_executing_shell(self):
        marker = self.root / 'executed'
        for content in ('ID=$(touch {})\nVERSION_ID=8\nPLATFORM_ID=platform:el8\n'.format(marker),
                        'ID=rocky\nVERSION_ID=9.6\nPLATFORM_ID=platform:el8\n',
                        'ID=ubuntu\nVERSION_ID=8\nPLATFORM_ID=platform:el8\n',
                        'ID=rocky\nVERSION_ID=11\nPLATFORM_ID=platform:el11\n',
                        'ID=rocky\nVERSION_ID=8\n',
                        'ID=rocky\nID=rhel\nVERSION_ID=8\nPLATFORM_ID=platform:el8\n',
                        'ID=rocky extra\nVERSION_ID=8\nPLATFORM_ID=platform:el8\n'):
            with self.subTest(content=content):
                self.release.write_text(content)
                with self.assertRaises(ValueError):
                    self.module.read_target(self.release)
                self.assertFalse(marker.exists())

    def inputs(self):
        values = {}
        for name in ('rpm', 'runtime_manifest', 'heimdall_key'):
            path = self.root / name
            path.write_bytes(b'candidate' if name == 'rpm' else b'public key')
            values[name] = path
        values['runtime_manifest'].write_bytes(b'{"schema": 1, "architecture":"x86_64", "runtimes":{}}\n')
        os_key = self.root / 'os-key'
        os_key.write_bytes(b'os public key')
        for name in ('reposdir', 'varsdir'):
            path = self.root / name
            path.mkdir()
            values[name] = path
        (values['reposdir'] / 'baseos.repo').write_text('[baseos]\nbaseurl=https://example.invalid/os\n')
        return argparse.Namespace(output=self.root / 'bundle', os_key=[os_key],
                                  repo=['baseos'], releasever='8', **values)

    def fake_run(self, command, **kwargs):
        command = [str(value) for value in command]
        out = ''
        if command[:3] == ['rpm', '--eval', '%{_arch}']:
            out = 'x86_64\n'
        elif command[:2] == ['rpm', '-qp']:
            filename = Path(command[-1]).name
            if filename.startswith('libicu'):
                out = 'libicu-60.3-2.el8.x86_64\tlibicu\tx86_64\tRed Hat\ticu-60.3-2.el8.src.rpm'
            else:
                out = 'heimdall-server-2.14.0-1.el8.x86_64\theimdall-server\tx86_64\tHeimdall\theimdall-server-2.14.0-1.el8.src.rpm'
        elif command[0] == 'rpmkeys':
            out = 'Header V4 RSA/SHA256 Signature, key ID 1234: OK\n'
        elif command[0] == 'gpg':
            if '--with-colons' in command:
                out = 'pub:-:2048:1:1234:0:0::::::\nfpr:::::::::0123456789ABCDEF0123456789ABCDEF01234567:\n'
            elif '--export' in command:
                out = '-----BEGIN PGP PUBLIC KEY BLOCK-----\nexported\n-----END PGP PUBLIC KEY BLOCK-----\n'
        elif command[0] == 'dnf':
            downloads = Path(command[command.index('--downloaddir') + 1])
            (downloads / 'libicu.rpm').write_bytes(b'vendor package')
            installroot = Path(command[command.index('--installroot') + 1])
            metadata = installroot / 'var/cache/dnf/baseos-abc123/repodata'
            metadata.mkdir(parents=True)
            (metadata / 'repomd.xml').write_bytes(b'repository snapshot')
        elif command[0] == 'createrepo_c':
            metadata = Path(command[-1]) / 'repodata'
            metadata.mkdir()
            (metadata / 'repomd.xml').write_bytes(b'local snapshot')
        return subprocess.CompletedProcess(command, 0, out, '')

    def collect(self, args, run=None):
        with patch.object(self.module.os, 'geteuid', return_value=0), \
                patch.object(self.module, 'read_target', return_value={'id': 'rhel', 'el_major': '8', 'version_id': '8.6'}), \
                patch.object(self.module.subprocess, 'run', side_effect=run or self.fake_run):
            return self.module.stage(args)

    def test_invalid_inputs_fail_before_dnf_and_publication(self):
        for field, kind in [('rpm', 'symlink'), ('runtime_manifest', 'symlink'),
                            ('heimdall_key', 'symlink'), ('rpm', 'directory'),
                            ('reposdir', 'missing'), ('output', 'existing'),
                            ('repo', 'empty'), ('releasever', 'mismatch'),
                            ('runtime_manifest', 'arch')]:
            with self.subTest(field=field, kind=kind), tempfile.TemporaryDirectory() as tmp:
                self.root = Path(tmp)
                args = self.inputs()
                path = getattr(args, field)
                if kind == 'symlink':
                    path.unlink()
                    path.symlink_to(self.root / 'absent')
                elif kind == 'directory':
                    path.unlink()
                    path.mkdir()
                elif kind == 'missing':
                    for child in path.iterdir():
                        child.unlink()
                    path.rmdir()
                elif kind == 'existing':
                    path.mkdir()
                elif kind == 'empty':
                    args.repo = []
                elif kind == 'mismatch':
                    args.releasever = '9'
                elif kind == 'arch':
                    path.write_text('{"architecture":"aarch64"}')
                def run(command, **kwargs):
                    self.assertNotEqual(command[0], 'dnf', 'invalid input reached DNF')
                    return self.fake_run(command, **kwargs)
                with self.assertRaises(ValueError):
                    self.collect(args, run)
                self.assertEqual(args.output.exists(), kind == 'existing')

    def test_signature_requires_signed_header_not_only_digest(self):
        (self.root / 'rpm').write_bytes(b'unsigned')
        for status, output in [(0, 'Header SHA256 digest: OK\nPayload SHA256 digest: OK\n'),
                               (1, 'Header V4 RSA Signature: NOKEY\n')]:
            with self.subTest(output=output):
                with patch.object(self.module.subprocess, 'run', return_value=subprocess.CompletedProcess([], status, output)):
                    with self.assertRaises(ValueError):
                        self.module.verify_signature(self.root / 'rpm', self.root / 'db')

    def test_publishes_inventory_preserving_runtime_bytes(self):
        args = self.inputs()
        original = args.runtime_manifest.read_bytes()
        self.assertEqual(self.collect(args), args.output)
        inventory = json.loads((args.output / 'offline-manifest.json').read_text())
        self.assertEqual(inventory['target'], {'id': 'rhel', 'el_major': '8', 'architecture': 'x86_64'})
        self.assertEqual(inventory['repositories'], [{'id': 'baseos', 'repomd_sha256': hashlib.sha256(b'repository snapshot').hexdigest()}])
        self.assertEqual([pkg['name'] for pkg in inventory['packages']], ['heimdall-server', 'libicu'])
        self.assertEqual((args.output / 'runtime-manifest.json').read_bytes(), original)
        self.assertEqual((args.output / 'target').read_text(), 'rhel 8 x86_64\n')
        self.assertNotIn(str(self.root), json.dumps(inventory))
        self.assertEqual(len(inventory['keys']), 2)
        expected = set(str(path.relative_to(args.output)) for path in args.output.rglob('*') if path.is_file() and path.name != 'SHA256SUMS')
        actual = set()
        for line in (args.output / 'SHA256SUMS').read_text().splitlines():
            digest, name = line.split('  ')
            actual.add(name)
            self.assertEqual(digest, hashlib.sha256((args.output / name).read_bytes()).hexdigest())
        self.assertEqual(actual, expected)

    def test_rejects_candidate_arch_release_source_and_unsigned(self):
        for mutation in ('arch', 'release', 'source', 'unsigned'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmp:
                self.root = Path(tmp)
                args = self.inputs()
                def run(command, **kwargs):
                    self.assertNotEqual(command[0], 'dnf', 'invalid candidate reached DNF')
                    result = self.fake_run(command, **kwargs)
                    if command[:2] == ['rpm', '-qp']:
                        if mutation == 'arch':
                            result.stdout = result.stdout.replace('x86_64', 'aarch64')
                        elif mutation == 'release':
                            result.stdout = result.stdout.replace('.el8', '.el9')
                        elif mutation == 'source':
                            result.stdout = result.stdout.replace('x86_64', 'src')
                    if command[0] == 'rpmkeys' and mutation == 'unsigned':
                        result.stdout = 'Header SHA256 digest: OK\n'
                    return result
                with self.assertRaises(ValueError):
                    self.collect(args, run)
                self.assertFalse(args.output.exists())

    def test_rejects_missing_repository_snapshot_and_private_key(self):
        for mutation in ('metadata', 'private'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmp:
                self.root = Path(tmp)
                args = self.inputs()
                def run(command, **kwargs):
                    result = self.fake_run(command, **kwargs)
                    if command[0] == 'dnf' and mutation == 'metadata':
                        root = Path(command[command.index('--installroot') + 1])
                        for path in root.rglob('repomd.xml'):
                            path.unlink()
                    if command[0] == 'gpg' and '--with-colons' in command and mutation == 'private':
                        result.stdout = result.stdout.replace('pub:', 'sec:')
                    return result
                with self.assertRaises(ValueError):
                    self.collect(args, run)
                self.assertFalse(args.output.exists())

    def test_native_architecture_and_repository_ids_are_validated(self):
        for mutation in ('native', 'repository', 'os-key', 'root'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmp:
                self.root = Path(tmp)
                args = self.inputs()
                if mutation == 'repository':
                    args.repo = ['missing']
                elif mutation == 'os-key':
                    args.os_key[0].unlink()
                    args.os_key[0].symlink_to(self.root / 'absent')
                def run(command, **kwargs):
                    self.assertNotEqual(command[0], 'dnf')
                    result = self.fake_run(command, **kwargs)
                    if command[:3] == ['rpm', '--eval', '%{_arch}'] and mutation == 'native':
                        result.stdout = 'ppc64le\n'
                    return result
                if mutation == 'root':
                    with patch.object(self.module.os, 'geteuid', return_value=1000):
                        with self.assertRaises(ValueError):
                            self.module.stage(args)
                else:
                    with self.assertRaises(ValueError):
                        self.collect(args, run)
                self.assertFalse(args.output.exists())

    def test_downloaded_duplicates_architectures_and_ambiguous_snapshots_fail(self):
        for mutation in ('duplicate', 'architecture', 'release', 'snapshot'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmp:
                self.root = Path(tmp)
                args = self.inputs()
                def run(command, **kwargs):
                    result = self.fake_run(command, **kwargs)
                    if command[0] == 'dnf':
                        if mutation == 'duplicate':
                            downloads = Path(command[command.index('--downloaddir') + 1])
                            (downloads / 'duplicate.rpm').write_bytes(b'changed candidate')
                        elif mutation == 'snapshot':
                            root = Path(command[command.index('--installroot') + 1])
                            metadata = root / 'var/cache/dnf/baseos-def456/repodata'
                            metadata.mkdir(parents=True)
                            (metadata / 'repomd.xml').write_bytes(b'other snapshot')
                    if command[:2] == ['rpm', '-qp'] and Path(command[-1]).name == 'libicu.rpm' and mutation == 'architecture':
                        result.stdout = result.stdout.replace('x86_64', 'i686')
                    if command[:2] == ['rpm', '-qp'] and Path(command[-1]).name == 'libicu.rpm' and mutation == 'release':
                        result.stdout = result.stdout.replace('.el8', '.el9')
                    return result
                with self.assertRaises(ValueError):
                    self.collect(args, run)
                self.assertFalse(args.output.exists())

    def test_repository_parser_errors_do_not_print_credentials(self):
        args = self.inputs()
        (args.reposdir / 'baseos.repo').write_text('baseurl=https://user:secret@example.invalid/private\n')
        argv = [str(SCRIPT)]
        for name in ('rpm', 'runtime_manifest', 'reposdir', 'varsdir', 'heimdall_key', 'output', 'releasever'):
            argv.extend(['--' + name.replace('_', '-'), str(getattr(args, name))])
        argv.extend(['--repo', 'baseos', '--os-key', str(args.os_key[0])])
        error = io.StringIO()
        with patch.object(sys, 'argv', argv), patch.object(self.module.os, 'geteuid', return_value=0), contextlib.redirect_stderr(error):
            with self.assertRaises(SystemExit):
                self.module.main()
        self.assertNotIn('secret', error.getvalue())
        self.assertIn('repository configuration', error.getvalue())
        self.assertFalse(args.output.exists())

    def test_rpm_query_warnings_do_not_pollute_metadata(self):
        rpm = self.root / 'rpm'
        rpm.write_bytes(b'signed candidate')
        executable = self.root / 'bin/rpm'
        executable.parent.mkdir()
        executable.write_text("#!/bin/sh\nprintf 'warning: Header V4 RSA/SHA256 Signature: NOKEY\\n' >&2\nprintf 'heimdall-server-2.14.0-1.el8.x86_64\\theimdall-server\\tx86_64\\tHeimdall\\theimdall-server-2.14.0-1.el8.src.rpm'\n")
        executable.chmod(0o755)
        with patch.dict(os.environ, {'PATH': str(executable.parent)}):
            record = self.module.package_record(rpm, self.root)
        self.assertEqual(record['nevra'], 'heimdall-server-2.14.0-1.el8.x86_64')

    @unittest.skipUnless(hasattr(os, 'geteuid') and os.geteuid() == 0 and Path('/usr/libexec/platform-python').is_file(),
                         'Requires root on native EL8 with platform-python')
    def test_closure_falls_back_to_el8_platform_python(self):
        environment = dict(os.environ, PATH=str(self.root), HEIMDALL_RPM_TEST='1')
        result = subprocess.run(['/bin/bash', str(SCRIPT.parents[1] / 'tests/offline-closure.sh'), str(self.root)],
                                env=environment, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('SHA256SUMS', result.stdout)
        self.assertNotIn('command not found', result.stdout)

    def test_closure_requires_disposable_opt_in(self):
        script = SCRIPT.parents[1] / 'tests/offline-closure.sh'
        environment = dict(os.environ)
        environment.pop('HEIMDALL_RPM_TEST', None)
        result = subprocess.run(['bash', str(script), str(self.root)], env=environment,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('HEIMDALL_RPM_TEST=1', result.stdout)

    def test_failed_solver_leaves_inputs_and_output_untouched(self):
        args = self.inputs()
        original = args.rpm.read_bytes()
        def run(command, **kwargs):
            if command[0] == 'dnf':
                raise subprocess.CalledProcessError(1, command, output='https://user:secret@example.invalid/private')
            return self.fake_run(command, **kwargs)
        with self.assertRaises(Exception) as error:
            self.collect(args, run)
        self.assertNotIn('secret', str(error.exception))
        self.assertFalse(args.output.exists())
        self.assertEqual(args.rpm.read_bytes(), original)
        self.assertEqual(sorted(path.name for path in self.root.iterdir()),
                         ['heimdall_key', 'os-key', 'os-release', 'reposdir', 'rpm', 'runtime_manifest', 'varsdir'])


if __name__ == '__main__':
    unittest.main()
