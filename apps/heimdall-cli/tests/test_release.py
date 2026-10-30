import pathlib
import shutil
import subprocess
import tempfile
import unittest

CHECK = pathlib.Path(__file__).resolve().parents[1] / "scripts/check-release.py"

class ReleaseTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.cli = self.root / "apps/heimdall-cli"
        (self.cli / "scripts").mkdir(parents=True)
        shutil.copy2(CHECK, self.cli / "scripts/check-release.py")
        (self.cli / "VERSION").write_text("v0.9.0\n")
        (self.root / "VERSION").write_text("v2.14.0\n")
        self.git("init", "-q")
        self.git("add", ".")
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "commit", "-qm", "fixture")
        self.git("tag", "apps/heimdall-cli/v0.9.0")

    def git(self, *args):
        return subprocess.check_output(
            ["git", "-C", str(self.root), *args], text=True).strip()

    def check(self, tag):
        return subprocess.run(
            ["python3", str(self.cli / "scripts/check-release.py"), tag],
            capture_output=True, text=True)

    def test_independent_version(self):
        result = self.check("apps/heimdall-cli/v0.9.0")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "0.9.0\n")

    def test_rejects_server_or_mismatched_tags(self):
        for tag in ("v2.14.0", "apps/heimdall-cli/v0.9.1",
                    "apps/heimdall-cli/v00.9.0", "main"):
            self.assertNotEqual(self.check(tag).returncode, 0, tag)

    def test_rejects_wrong_commit(self):
        (self.root / "another").write_text("new commit")
        self.git("add", ".")
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "commit", "-qm", "after tag")
        self.assertNotEqual(self.check("apps/heimdall-cli/v0.9.0").returncode, 0)

    def test_rejects_dirty_cli(self):
        (self.cli / "untracked.go").write_text("package main\n")
        self.assertNotEqual(self.check("apps/heimdall-cli/v0.9.0").returncode, 0)

    def test_rejects_invalid_version_file(self):
        (self.cli / "VERSION").write_text("v0.9.0\nv0.9.1\n")
        self.assertNotEqual(self.check("apps/heimdall-cli/v0.9.0").returncode, 0)

class MakeVersionTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.cli = pathlib.Path(self.tmp.name)
        shutil.copy2(CHECK.parents[1] / "Makefile", self.cli / "Makefile")

    def test_requires_complete_canonical_version(self):
        for content, valid in ((b"v0.9.0\n", True),
                               (b"v0.9.0\n ", False),
                               (b"v0.9.0\njunk", False),
                               (b"v0.9.0", False),
                               (b"v0.9.0\n\n", False),
                               (b"v00.9.0\n", False),
                               (b"", False)):
            with self.subTest(content=content):
                (self.cli / "VERSION").write_bytes(content)
                result = subprocess.run(
                    ["make", "-C", str(self.cli), "check-version"],
                    capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, valid, result.stderr)

if __name__ == "__main__":
    unittest.main()
