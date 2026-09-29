#!/usr/bin/env python3
"""Check runtime selection, validation, and publication without network access."""
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/stage-runtimes.py'
ARCHIVES = {'node': 'node-runtime.tar.xz', 'postgresql': 'postgresql-runtime.tar.bz2',
            'caddy': 'caddy-runtime.tar.gz'}


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
        for name, version in [('node', '22.23.3'), ('postgresql', '18.6'), ('caddy', '2.11.4')]:
            archives = {}
            for arch in (['any'] if name == 'postgresql' else ['x86_64', 'aarch64']):
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

    def test_rejects_corrupt_archive_before_publication(self):
        # Corruption of the last download must not publish earlier downloads either.
        self.payloads['https://example.invalid/caddy-x86_64'] = b'corrupt'
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
                self.assertEqual(set(written['runtimes']), {'node', 'postgresql', 'caddy'})
                self.assertNotIn(str(self.root), json.dumps(written))
                for name, filename in ARCHIVES.items():
                    selected = 'any' if name == 'postgresql' else arch
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
