#!/usr/bin/env python3
"""Check runtime selection, validation, and publication without network access."""
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import runpy
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

# These checks run before SOURCE_MODE=head rejects dirty packaging inputs.
sys.dont_write_bytecode = True

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/stage-runtimes.py'
ARCHIVES = {'node': 'node-runtime.tar.xz', 'postgresql': 'postgresql-runtime.tar.bz2',
            'caddy': 'caddy-runtime.tar.gz', 'nginx': 'nginx-runtime.tar.gz'}


class RuntimeInputsTest(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('runtime_stage', SCRIPT)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.sources = self.root / 'SOURCES'
        self.lock_path = self.root / 'lock.json'
        self.payloads = {}
        self.lock = {'schema': 1, 'runtimes': {}}
        for name, version in [('node', '22.23.3'), ('postgresql', '18.6'), ('caddy', '2.11.4'), ('nginx', '1.30.6')]:
            archives = {}
            for arch in (['any'] if name in ('postgresql', 'nginx') else ['x86_64', 'aarch64']):
                url = 'https://example.invalid/{}-{}'.format(name, arch)
                payload = '{} {}'.format(name, arch).encode()
                self.payloads[url] = payload
                archives[arch] = {'url': url, 'sha256': hashlib.sha256(payload).hexdigest()}
            self.lock['runtimes'][name] = {
                'version': version, 'license_files': ['COPYRIGHT' if name == 'postgresql' else 'LICENSE'],
                'archives': archives}

    def stage(self, arch='x86_64'):
        self.lock_path.write_text(json.dumps(self.lock))
        return self.module.stage(self.lock_path, arch, self.sources)

    def download(self, url, timeout):
        return io.BytesIO(self.payloads[url])

    def test_cli_uses_bundled_lock_and_current_directory(self):
        scripts = self.root / 'packaging/scripts'
        scripts.mkdir(parents=True)
        script = scripts / SCRIPT.name
        shutil.copyfile(str(SCRIPT), str(script))
        (scripts.parent / 'runtime-lock.json').write_text(json.dumps(self.lock))
        self.sources.mkdir()
        # A lock in the output directory must not override the bundled pin.
        (self.sources / 'runtime-lock.json').write_text('{}')
        previous = Path.cwd()
        try:
            os.chdir(str(self.sources))
            with patch.object(sys, 'argv', [str(script), 'x86_64']), \
                    patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
                runpy.run_path(str(script), run_name='__main__')
        finally:
            os.chdir(str(previous))
        manifest = json.loads((self.sources / 'runtime-manifest.json').read_text())
        self.assertEqual(manifest['architecture'], 'x86_64')
        self.assertEqual((self.sources / 'node-runtime.tar.xz').read_bytes(), b'node x86_64')

    def test_rejects_symlinked_staging_files_without_touching_targets(self):
        for filename in ARCHIVES.values():
            for dangling in (False, True):
                with self.subTest(filename=filename, dangling=dangling):
                    self.sources = self.root / '{}-{}'.format(filename, dangling)
                    self.sources.mkdir()
                    manifest = self.sources / 'runtime-manifest.json'
                    manifest.write_text('stale')
                    target = self.root / 'outside'
                    if not dangling:
                        target.write_bytes(b'preserve me')
                    link = self.sources / filename
                    link.symlink_to(target)
                    try:
                        with patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
                            with self.assertRaisesRegex(ValueError, 'symlink'):
                                self.stage()
                        self.assertTrue(link.is_symlink())
                        self.assertFalse(manifest.exists())
                        if dangling:
                            self.assertFalse(target.exists())
                        else:
                            self.assertEqual(target.read_bytes(), b'preserve me')
                    finally:
                        if link.is_symlink():
                            link.unlink()
                        if target.exists():
                            target.unlink()

    def test_replaces_manifest_symlink_without_touching_target(self):
        for dangling in (False, True):
            with self.subTest(dangling=dangling):
                self.sources = self.root / str(dangling)
                self.sources.mkdir()
                target = self.root / ('outside-' + str(dangling))
                if not dangling:
                    target.write_bytes(b'preserve me')
                manifest = self.sources / 'runtime-manifest.json'
                manifest.symlink_to(target)
                with patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
                    expected = self.stage()
                self.assertFalse(manifest.is_symlink())
                self.assertEqual(json.loads(manifest.read_text()), expected)
                if dangling:
                    self.assertFalse(target.exists())
                else:
                    self.assertEqual(target.read_bytes(), b'preserve me')

    def test_make_stages_in_custom_topdir(self):
        packaging = self.root / 'packaging with spaces'
        scripts = packaging / 'scripts'
        scripts.mkdir(parents=True)
        shutil.copyfile(str(SCRIPT), str(scripts / SCRIPT.name))
        shutil.copyfile(str(SCRIPT.parents[1] / 'Makefile'), str(packaging / 'Makefile'))
        (packaging / 'runtime-lock.json').write_text(json.dumps(self.lock))
        self.sources = self.root / 'build output/SOURCES'
        self.sources.mkdir(parents=True)
        for name, filename in ARCHIVES.items():
            arch = 'any' if name in ('postgresql', 'nginx') else 'x86_64'
            (self.sources / filename).write_bytes(self.payloads['https://example.invalid/{}-{}'.format(name, arch)])
        result = subprocess.run(
            ['make', '-C', str(packaging), '-o', 'check-source', 'runtimes',
             'TOPDIR=../build output', 'RPM_ARCH=x86_64', 'GOARCH=amd64'],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        manifest = json.loads((self.sources / 'runtime-manifest.json').read_text())
        self.assertEqual(manifest['architecture'], 'x86_64')
        self.assertFalse((packaging / 'runtime-manifest.json').exists())

    def test_rejects_corrupt_archive_before_publication(self):
        # Corruption of the last download must not publish earlier downloads either.
        self.payloads['https://example.invalid/nginx-any'] = b'corrupt'
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
            with self.assertRaisesRegex(ValueError, 'SHA-256'):
                self.stage()
        self.assertEqual(list(self.sources.iterdir()), [])

    def test_selects_both_architectures_and_publishes_inventory(self):
        for arch in ('x86_64', 'aarch64'):
            with self.subTest(arch=arch):
                self.sources = self.root / arch
                with patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
                    result = self.stage(arch)
                written = json.loads((self.sources / 'runtime-manifest.json').read_text())
                self.assertEqual(result, written)
                self.assertEqual(written['schema'], 1)
                self.assertEqual(written['architecture'], arch)
                self.assertEqual(set(written['runtimes']), {'node', 'postgresql', 'caddy', 'nginx'})
                self.assertNotIn(str(self.root), json.dumps(written))
                for name, filename in ARCHIVES.items():
                    selected = 'any' if name in ('postgresql', 'nginx') else arch
                    expected = self.lock['runtimes'][name]
                    inventory = written['runtimes'][name]
                    self.assertEqual(inventory, dict(expected['archives'][selected],
                        version=expected['version'], license_files=expected['license_files'],
                        archive=filename, install_prefix='/usr/libexec/heimdall-server/runtime/' + name))
                    self.assertEqual((self.sources / filename).read_bytes(),
                                     '{} {}'.format(name, selected).encode())
                self.assertEqual(set(path.name for path in self.sources.iterdir()),
                                 set(ARCHIVES.values()) | {'runtime-manifest.json'})

    def test_rejects_unsupported_architecture_without_writes(self):
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=AssertionError('network')):
            with self.assertRaisesRegex(ValueError, 'architecture'):
                self.stage('ppc64le')
        self.assertFalse(self.sources.exists())

    def test_cached_archives_are_verified_without_download(self):
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
            expected = self.stage()
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=AssertionError('network')):
            self.assertEqual(self.stage(), expected)

    def test_corrupt_cache_fails_without_replacement_or_stale_manifest(self):
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=self.download):
            self.stage()
        archive = self.sources / 'caddy-runtime.tar.gz'
        archive.write_bytes(b'corrupt cached input')
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=AssertionError('network')):
            with self.assertRaisesRegex(ValueError, 'SHA-256'):
                self.stage()
        self.assertEqual(archive.read_bytes(), b'corrupt cached input')
        self.assertFalse((self.sources / 'runtime-manifest.json').exists())

    def test_failed_download_leaves_no_published_or_temporary_inputs(self):
        def download(url, timeout):
            if 'caddy' in url:
                raise OSError('connection lost')
            return self.download(url, timeout)
        with patch.object(self.module.urllib.request, 'urlopen', side_effect=download):
            with self.assertRaisesRegex(OSError, 'connection lost'):
                self.stage()
        self.assertEqual(list(self.sources.iterdir()), [])

    def test_rejects_invalid_lock_before_download_or_writes(self):
        invalid = []
        for schema in (2, True):
            invalid.append(dict(self.lock, schema=schema))
        for component in ('missing', 'extra'):
            lock = copy.deepcopy(self.lock)
            if component == 'missing':
                del lock['runtimes']['node']
            else:
                lock['runtimes']['extra'] = lock['runtimes']['node']
            invalid.append(lock)
        for field, value in [('version', ''), ('license_files', []),
                             ('license_files', ['../LICENSE']), ('license_files', ['/LICENSE']),
                             ('archives', {'any': self.lock['runtimes']['node']['archives']['x86_64']})]:
            lock = copy.deepcopy(self.lock)
            lock['runtimes']['node'][field] = value
            invalid.append(lock)
        for field, value in [('url', 'http://example.invalid/archive'), ('url', 'https:///archive'),
                             ('url', 'https://user:secret@example.invalid/archive'),
                             ('sha256', 'f' * 63), ('sha256', 'F' * 64), ('sha256', 'x' * 64)]:
            lock = copy.deepcopy(self.lock)
            # Validate unselected input metadata, too.
            lock['runtimes']['caddy']['archives']['aarch64'][field] = value
            invalid.append(lock)
        for lock in invalid:
            with self.subTest(lock=lock):
                self.lock = lock
                with patch.object(self.module.urllib.request, 'urlopen', side_effect=AssertionError('network')):
                    with self.assertRaises(ValueError):
                        self.stage()
                self.assertFalse(self.sources.exists())


if __name__ == '__main__':
    unittest.main()
