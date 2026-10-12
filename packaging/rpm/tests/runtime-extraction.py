#!/usr/bin/env python3
"""Exercise the spec's runtime archive confinement with stdlib Python >= 3.6."""
import io
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest


SPEC = Path(__file__).resolve().parents[1] / 'heimdall-server.spec'
PROGRAM = SPEC.read_text().split("python3 - <<'PY'\n", 1)[1].split('\nPY\n', 1)[0]


class RuntimeExtractionTest(unittest.TestCase):
    def check_archive(self, kind):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for number in (23, 24, 25):
                with tarfile.open(str(root / str(number)), 'w') as archive:
                    if number != 23:
                        continue
                    member = tarfile.TarInfo('node/bin/node')
                    if kind == 'traversal':
                        member.name = 'node/../../escape'
                    elif kind == 'absolute':
                        member.name = str(root / 'escape')
                    elif kind == 'symlink':
                        member.type = tarfile.SYMTYPE
                        member.linkname = '../../escape'
                    elif kind == 'hardlink':
                        member.type = tarfile.LNKTYPE
                        member.linkname = 'node/../escape'
                    elif kind == 'device':
                        member.type = tarfile.CHRTYPE
                    elif kind == 'relocated_symlink':
                        member.name = 'node/victim'
                    member.size = 2 if member.isfile() else 0
                    archive.addfile(member, io.BytesIO(b'ok') if member.isfile() else None)
                    if kind == 'relocated_symlink':
                        member = tarfile.TarInfo('node/sub/link')
                        member.type = tarfile.SYMTYPE
                        member.linkname = '../victim'
                        archive.addfile(member)
                        member = tarfile.TarInfo('node/relocated')
                        member.type = tarfile.LNKTYPE
                        member.linkname = 'node/sub/link'
                        archive.addfile(member)
            program = PROGRAM
            for number in (23, 24, 25):
                program = program.replace('%{SOURCE' + str(number) + '}',
                                          str(root / str(number)))
            result = subprocess.run([sys.executable, '-c', program], cwd=tmp,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if kind == 'file':
                self.assertEqual(result.returncode, 0, result.stderr.decode())
                self.assertEqual((root / 'runtime-node/bin/node').read_bytes(), b'ok')
            else:
                self.assertNotEqual(result.returncode, 0, 'Unsafe archive accepted: ' + kind)
            self.assertFalse((root / 'escape').exists())

    def test_regular_file(self):
        self.check_archive('file')

    def test_path_traversal(self):
        self.check_archive('traversal')

    def test_absolute_path(self):
        self.check_archive('absolute')

    def test_symlink_escape(self):
        self.check_archive('symlink')

    def test_hardlink_escape(self):
        self.check_archive('hardlink')

    def test_device_member(self):
        self.check_archive('device')

    def test_hardlink_cannot_relocate_symlink(self):
        self.check_archive('relocated_symlink')


if __name__ == '__main__':
    unittest.main(verbosity=2)
