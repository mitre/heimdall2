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
import tarfile
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

    def test_driver_rejects_unsafe_archives_before_target_creation(self):
        driver = self.root / 'runner/packaging/rpm/tests/run-offline.sh'
        driver.parent.mkdir(parents=True)
        driver.write_text((SCRIPT.parents[1] / 'tests/run-offline.sh').read_text())
        tools = self.root / 'tools'
        tools.mkdir()
        marker = self.root / 'docker-called'
        docker = tools / 'docker'
        docker.write_text('#!/bin/sh\ntouch "$DOCKER_MARKER"\nexit 77\n')
        docker.chmod(0o755)
        environment = dict(os.environ, DOCKER_MARKER=str(marker),
                           PATH=str(tools) + os.pathsep + os.environ['PATH'])
        cases = ('checksum', 'sidecar-path', 'traversal', 'other-root',
                 'symlink', 'hardlink', 'fifo', 'duplicate')
        for case in cases:
            with self.subTest(case=case):
                archive = self.root / ('heimdall-offline-' + case + '.tar.gz')
                top = archive.name[:-7]
                with tarfile.open(str(archive), 'w:gz') as output:
                    candidate = tarfile.TarInfo(top + '/repo/Packages/heimdall-server-fixture.rpm')
                    candidate.size = 1
                    output.addfile(candidate, io.BytesIO(b'x'))
                    bad = tarfile.TarInfo(top + '/extra')
                    if case == 'traversal': bad.name = top + '/../escape'
                    if case == 'other-root': bad.name = 'outside/file'
                    if case == 'symlink': bad.type = tarfile.SYMTYPE; bad.linkname = '../outside'
                    if case == 'hardlink': bad.type = tarfile.LNKTYPE; bad.linkname = '../outside'
                    if case == 'fifo': bad.type = tarfile.FIFOTYPE
                    if case == 'duplicate': bad.name = top + '//repo/Packages/heimdall-server-fixture.rpm'
                    output.addfile(bad)
                digest = hashlib.sha256(archive.read_bytes()).hexdigest()
                if case == 'checksum': digest = '0' * 64
                name = archive.name if case != 'sidecar-path' else '../' + archive.name
                Path(str(archive) + '.sha256').write_text(digest + '  ' + name + '\n')
                result = subprocess.run(['bash', str(driver), 'linux/arm64', 'unused-image', str(archive)],
                                        env=environment, stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, universal_newlines=True)
                self.assertNotEqual(result.returncode, 0, result.stdout)
                message = ('Archive checksum mismatch' if case == 'checksum' else
                           'Sidecar must contain' if case == 'sidecar-path' else 'Unsafe or duplicate')
                self.assertIn(message, result.stdout)
                self.assertFalse(marker.exists(), result.stdout)

    @unittest.skipUnless(hasattr(os, 'geteuid') and os.geteuid() == 0 and Path('/usr/libexec/platform-python').is_file(),
                         'Requires native EL8 Bash for lifecycle target helper')
    def test_lifecycle_logs_each_installer_status_and_driver_retains_it(self):
        lifecycle = (SCRIPT.parents[1] / 'tests/lifecycle.sh').read_text()
        helper = lifecycle[lifecycle.index('install_candidate() {'):lifecycle.index('refuse_upgrade() {')]
        status_file = self.root / 'installer-status.log'
        helper = helper.replace('/tmp/rpm-lifecycle-installer-status.log', str(status_file))
        bundle = self.root / 'offline bundle'
        bundle.mkdir()
        (bundle / 'heimdall-nevra').write_text('heimdall-server-fixture\n')
        (bundle / 'install.sh').write_text('exit "$INSTALL_FIXTURE_STATUS"\n')
        shell = self.root / 'hook.sh'
        shell.write_text("""set -euo pipefail
readonly RPM_NEVRA_FORMAT='%{NEVRA}'
timeout() { [[ $1 == 300 ]]; shift; "$@"; }
rpm() { printf '%s' heimdall-server-fixture; }
dnf() { return "$INSTALL_FIXTURE_STATUS"; }
""" + helper + """
for mode in offline legacy; do
  if [[ $mode == offline ]]; then RPM_TEST_OFFLINE_BUNDLE=$FIXTURE_BUNDLE; else unset RPM_TEST_OFFLINE_BUNDLE; fi
  for status in 0 1 17; do
    export INSTALL_FIXTURE_STATUS=$status
    result=0
    install_candidate /tmp/candidate.rpm upgrade || result=$?
    [[ $result == "$status" ]]
  done
done
""")
        subprocess.run(['bash', str(shell)], env=dict(os.environ, FIXTURE_BUNDLE=str(bundle)), check=True)
        lines = status_file.read_text().splitlines()
        self.assertEqual(lines, ['phase=upgrade exit_status={} candidate=/tmp/candidate.rpm'.format(status)
                                 for status in (0, 1, 17, 0, 1, 17)])
        driver = (SCRIPT.parents[1] / 'tests/run-offline.sh').read_text()
        cleanup = 'cleanup() {' + driver.split('cleanup() {', 1)[1].split('\ntrap cleanup EXIT', 1)[0]
        for status in (0, 17):
            with self.subTest(cleanup_status=status):
                logdir = self.root / ('evidence-' + str(status))
                work = self.root / ('work-' + str(status))
                logdir.mkdir()
                work.mkdir()
                script = self.root / 'cleanup.sh'
                script.write_text("""set -euo pipefail
container=fixture
installed_image=''
state_volume=''
config_volume=''
docker() {
  case $1 in
    cp) [[ $2 == fixture:/tmp/rpm-lifecycle-installer-status.log ]] || return 1; cp "$STATUS_SOURCE" "$3" ;;
    inspect) printf '[]\n' ;;
    *) return 0 ;;
  esac
}
""" + cleanup + '\ntrap cleanup EXIT\nexit ' + str(status) + '\n')
                environment = dict(os.environ, STATUS_SOURCE=str(status_file), logdir=str(logdir), work=str(work))
                result = subprocess.run(['bash', str(script)], env=environment, stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, universal_newlines=True)
                self.assertEqual(result.returncode, status, result.stdout)
                self.assertEqual((logdir / 'installer-status.log').read_bytes(), status_file.read_bytes())
                self.assertEqual((logdir / 'result.txt').read_text(), 'exit_status={}\n'.format(status))

    def make_inputs(self):
        packaging = self.root / 'source tree/packaging/rpm'
        scripts = packaging / 'scripts'
        scripts.mkdir(parents=True)
        (packaging / 'Makefile').write_text((SCRIPT.parent.parent / 'Makefile').read_text().replace('\nrpm:', '\nunused-rpm:').replace('\ndeps:', '\nunused-deps:'))
        with (packaging / 'Makefile').open('a') as makefile:
            makefile.write('\nrpm deps sign:\n\t@touch "$(TOPDIR)/unexpected-build"; exit 1\n')
        (scripts / 'stage-offline.py').write_text(
            'import json, pathlib, sys\n'
            'args = sys.argv[1:]\n'
            'pathlib.Path("arguments.json").write_text(json.dumps(args))\n'
            'output = pathlib.Path(args[args.index("--output") + 1])\n'
            'output.mkdir()\n'
            '(output / "target").write_text("rocky 8 x86_64\\n")\n'
            '(output / "heimdall-nevra").write_text("heimdall-server-2.14.0-0.4.integration.el8.x86_64\\n")\n')
        tools = self.root / 'tools'
        tools.mkdir()
        rpm_tool = tools / 'rpm'
        rpm_tool.write_text('#!/bin/sh\n[ "$1" = -qp ] || exit 1\nprintf "2.14.0 0.4.integration.el8\\n"\n')
        rpm_tool.chmod(0o755)
        topdir = self.root / 'output tree'
        inputs = {'TOPDIR': str(topdir), 'OFFLINE_REPOS': 'baseos appstream',
                  'OFFLINE_RELEASEVER': '8'}
        for name in ('OFFLINE_REPOSDIR', 'OFFLINE_VARSDIR', 'OFFLINE_OS_KEY_DIR'):
            path = self.root / (name + ' directory')
            path.mkdir()
            inputs[name] = str(path)
        for name in ('OFFLINE_RPM', 'OFFLINE_HEIMDALL_KEY'):
            path = self.root / (name + ' file')
            path.write_bytes(b'input')
            inputs[name] = str(path)
        for name in ('first key.asc', 'second key.asc'):
            (Path(inputs['OFFLINE_OS_KEY_DIR']) / name).write_bytes(b'public key')
        (topdir / 'SOURCES').mkdir(parents=True)
        (topdir / 'SOURCES/runtime-manifest.json').write_text('{}')
        return packaging, topdir, inputs, dict(os.environ, COPYFILE_DISABLE='1', PATH=str(tools) + os.pathsep + os.environ['PATH'])

    def run_make(self, packaging, inputs, environment):
        return subprocess.run(['make', '-C', str(packaging), 'offline'] +
                              [name + '=' + value for name, value in inputs.items()],
                              env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              universal_newlines=True)

    def test_make_archives_in_custom_topdir_without_rebuilding_or_signing(self):
        packaging, topdir, inputs, environment = self.make_inputs()
        result = self.run_make(packaging, inputs, environment)
        self.assertEqual(result.returncode, 0, result.stderr)
        args = json.loads((packaging / 'arguments.json').read_text())
        output = Path(args[args.index('--output') + 1])
        self.assertEqual(args, ['--rpm', inputs['OFFLINE_RPM'], '--runtime-manifest',
                               str(topdir / 'SOURCES/runtime-manifest.json'),
                               '--reposdir', inputs['OFFLINE_REPOSDIR'], '--varsdir', inputs['OFFLINE_VARSDIR'],
                               '--releasever', '8', '--heimdall-key', inputs['OFFLINE_HEIMDALL_KEY'],
                               '--output', str(output), '--repo', 'baseos', '--repo', 'appstream',
                               '--os-key', str(Path(inputs['OFFLINE_OS_KEY_DIR']) / 'first key.asc'),
                               '--os-key', str(Path(inputs['OFFLINE_OS_KEY_DIR']) / 'second key.asc')])
        self.assertEqual(output.name, 'bundle')
        self.assertEqual(output.parent.parent, topdir / 'OFFLINE')
        basename = 'heimdall-rocky-el8-x86_64-2.14.0-0.4.integration.el8'
        archive = topdir / 'OFFLINE' / (basename + '.tar.gz')
        self.assertTrue(archive.is_file())
        with tarfile.open(str(archive)) as tar:
            self.assertEqual(set(tar.getnames()), {basename, basename + '/target', basename + '/heimdall-nevra'})
        sidecar = archive.with_name(archive.name + '.sha256')
        self.assertEqual(sidecar.read_text(), hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name + '\n')
        self.assertFalse(output.parent.exists())
        self.assertFalse((topdir / 'unexpected-build').exists())
        self.assertIn(str(archive), result.stdout)
        # Reusing the artifact name must preserve both already published files.
        before = archive.read_bytes(), sidecar.read_bytes()
        repeated = self.run_make(packaging, inputs, environment)
        self.assertNotEqual(repeated.returncode, 0)
        self.assertEqual(archive.read_bytes(), before[0])
        self.assertEqual(sidecar.read_bytes(), before[1])

    def test_make_missing_required_input_fails_before_output_creation(self):
        packaging, topdir, inputs, environment = self.make_inputs()
        for name in inputs:
            if name == 'TOPDIR':
                continue
            with self.subTest(variable=name):
                incomplete = dict(inputs, **{name: ''})
                result = self.run_make(packaging, incomplete, environment)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(name, result.stderr)
                self.assertFalse((topdir / 'OFFLINE').exists())
                self.assertFalse((packaging / 'arguments.json').exists())

    def test_make_rejects_topdir_in_source_tree(self):
        packaging, topdir, inputs, environment = self.make_inputs()
        inside = packaging.parents[1] / 'output'
        inputs['TOPDIR'] = str(inside)
        result = self.run_make(packaging, inputs, environment)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('outside the source tree', result.stderr)
        self.assertFalse(inside.exists())

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

    def test_collector_rejects_traversal_and_control_characters_in_inputs(self):
        for field in ('rpm', 'runtime_manifest'):
            for kind in ('traversal', 'newline'):
                with self.subTest(field=field, kind=kind), tempfile.TemporaryDirectory() as tmp:
                    self.root = Path(tmp)
                    args = self.inputs()
                    source = getattr(args, field)
                    if kind == 'traversal':
                        directory = self.root / 'nested'
                        directory.mkdir()
                        unsafe = directory / '..' / source.name
                    else:
                        unsafe = source.with_name(source.name + '\n')
                        source.rename(unsafe)
                    setattr(args, field, unsafe)
                    with self.assertRaises(ValueError):
                        self.collect(args)
                    self.assertFalse(args.output.exists())

    def test_collector_accepts_spaces_and_unicode_in_input_paths(self):
        args = self.inputs()
        for field in ('rpm', 'runtime_manifest'):
            source = getattr(args, field)
            destination = source.with_name(source.name + ' entrée')
            source.rename(destination)
            setattr(args, field, destination)
        self.assertEqual(self.collect(args), args.output)
        self.assertTrue((args.output / 'offline-manifest.json').is_file())

    def test_collector_rejects_invalid_release_versions(self):
        for releasever in ('--setopt=gpgcheck=0', '8\n', '8.١', '9'):
            with self.subTest(releasever=releasever), tempfile.TemporaryDirectory() as tmp:
                self.root = Path(tmp)
                args = self.inputs()
                args.releasever = releasever
                with self.assertRaises(ValueError):
                    self.collect(args)
                self.assertFalse(args.output.exists())

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

    def test_collects_installer_stack_with_candidate_in_empty_root(self):
        args = self.inputs()
        def run(command, **kwargs):
            if command[0] == 'dnf':
                self.assertEqual([str(value) for value in command[-3:-1]], ['dnf', 'rpm'])
                root = Path(command[command.index('--installroot') + 1])
                self.assertEqual(list(root.iterdir()), [])
            return self.fake_run(command, **kwargs)
        self.collect(args, run)

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

    def test_local_repository_arguments_use_escaped_file_uris(self):
        installer = (SCRIPT.parents[1] / 'offline/install.sh').read_text()
        closure = (SCRIPT.parents[1] / 'tests/offline-closure.sh').read_text()
        fragments = {
            'installer': installer[installer.index('cat > "$work/dnf.conf"'):installer.index('\naction=install')]
                         + '\ndnf "${dnf_args[@]}"\n',
            'closure': closure[closure.index('[[ $candidates == 1 ]]'):closure.index('\ninstalled=')],
        }
        for label, fragment in fragments.items():
            for name in ('offline bundle', 'bundle%#?$releasever', 'bundle-é'):
                with self.subTest(script=label, directory=name):
                    bundle = self.root / name
                    bundle.mkdir(exist_ok=True)
                    script = self.root / 'repo-arguments.sh'
                    script.write_text('set -euo pipefail\nexport LC_ALL=C\n'
                                      'candidates=1\nmajor=8\narch=x86_64\nnevra=fixture\n'
                                      'dnf() { for argument; do case $argument in '
                                      '--repofrompath=*) printf "%s\\n" "$argument";; esac; done; }\n'
                                      + fragment)
                    environment = dict(os.environ, bundle=str(bundle), work=str(self.root),
                                       config=str(self.root / 'dnf.conf'), verification_root=str(self.root),
                                       empty_repos=str(self.root), python=sys.executable)
                    result = subprocess.run(['bash', str(script)], env=environment, stdout=subprocess.PIPE,
                                            stderr=subprocess.STDOUT, universal_newlines=True)
                    self.assertEqual(result.returncode, 0, result.stdout)
                    self.assertEqual(result.stdout.strip(), '--repofrompath=heimdall-offline,' +
                                     (bundle / 'repo').as_uri())

    @unittest.skipUnless(hasattr(os, 'geteuid') and os.geteuid() == 0 and Path('/usr/libexec/platform-python').is_file(),
                         'Requires native EL8 Bash and sha256sum')
    def test_installer_dnf_can_open_unicode_repository_paths(self):
        source = (SCRIPT.parents[1] / 'offline/install.sh').read_text()
        calls = [line.strip() for line in source.splitlines() if '--setopt=tsflags=' in line]
        self.assertEqual(len(calls), 2)
        path = self.root / 'bundle-é'
        path.write_text('fixture\n')
        script = self.root / 'dnf-locale.sh'
        script.write_text('set -euo pipefail\nexport LC_ALL=C\n'
                          'dnf_args=(); answer_args=(); action=install; nevra=fixture\n'
                          'dnf() { /usr/libexec/platform-python -c \'import os; '
                          'from urllib.parse import unquote, urlparse; '
                          'print(open(unquote(urlparse(os.environ["FIXTURE_URI"]).path)).read(), end="")\'; }\n'
                          + '\n'.join(calls) + '\n')
        result = subprocess.run(['/bin/bash', str(script)],
                                env=dict(os.environ, FIXTURE_URI=path.as_uri(), work=str(self.root)),
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(result.stdout, 'fixture\nfixture\n')

    @unittest.skipUnless(hasattr(os, 'geteuid') and os.geteuid() == 0 and Path('/usr/libexec/platform-python').is_file(),
                         'Requires native EL8 Bash and sha256sum')
    def test_installer_inventory_on_minimal_path_without_find(self):
        source = (SCRIPT.parents[1] / 'offline/install.sh').read_text()
        inventory = source[:source.index('\nmapfile -t target')]
        key_selection = next(line for line in source.splitlines() if line.startswith('os_keys=('))
        tools = self.root / 'tools'
        tools.mkdir()
        for name in ('dirname', 'sha256sum'):
            (tools / name).symlink_to('/usr/bin/' + name)
        for mutation in ('valid', 'hidden', 'symlink', 'special'):
            with self.subTest(mutation=mutation):
                bundle = self.root / mutation
                bundle.mkdir()
                required = ('target', 'heimdall-nevra', 'offline-manifest.json', 'runtime-manifest.json',
                            'README.txt', 'keys/heimdall.asc', 'keys/os/visible.asc', 'keys/os/.hidden.asc',
                            'repo/repodata/repomd.xml', 'nested/file')
                for name in required:
                    path = bundle / name
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text('fixture\n')
                (bundle / 'install.sh').write_text(inventory + '\n' + key_selection + '\n'
                                                  '[[ ${#os_keys[@]} == 1 && ${os_keys[0]##*/} == visible.asc ]] '
                                                  '|| fail "Hidden key selected"\necho inventory-verified\n')
                entries = [hashlib.sha256(path.read_bytes()).hexdigest() + '  ' + str(path.relative_to(bundle))
                           for path in bundle.rglob('*') if path.is_file()]
                (bundle / 'SHA256SUMS').write_text('\n'.join(entries) + '\n')
                if mutation == 'hidden': (bundle / '.unlisted').write_text('fixture')
                if mutation == 'symlink': (bundle / '.link').symlink_to(bundle / 'nested', target_is_directory=True)
                if mutation == 'special': os.mkfifo(str(bundle / '.fifo'))
                result = subprocess.run(['/bin/bash', str(bundle / 'install.sh')],
                                        env=dict(os.environ, PATH=str(tools)), stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, universal_newlines=True)
                self.assertNotIn('command not found', result.stdout)
                if mutation == 'valid':
                    self.assertEqual(result.returncode, 0, result.stdout)
                    self.assertIn('inventory-verified', result.stdout)
                else:
                    self.assertNotEqual(result.returncode, 0, result.stdout)
                    self.assertIn('Checksum inventory omits bundle files' if mutation == 'hidden' else 'Symlink or special file',
                                  result.stdout)

    def test_failed_solver_leaves_inputs_and_output_untouched(self):
        args = self.inputs()
        original = args.rpm.read_bytes()
        def run(command, **kwargs):
            if command[0] == 'dnf':
                raise subprocess.CalledProcessError(1, command, output='https://user:secret@example.invalid/private')
            return self.fake_run(command, **kwargs)
        with self.assertRaises(ValueError) as error:
            self.collect(args, run)
        self.assertNotIn('secret', str(error.exception))
        self.assertFalse(args.output.exists())
        self.assertEqual(args.rpm.read_bytes(), original)
        self.assertEqual(sorted(path.name for path in self.root.iterdir()),
                         ['heimdall_key', 'os-key', 'os-release', 'reposdir', 'rpm', 'runtime_manifest', 'varsdir'])


if __name__ == '__main__':
    unittest.main()
