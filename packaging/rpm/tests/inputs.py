#!/usr/bin/env python3
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest

CHECK = Path(__file__).resolve().parents[1] / 'scripts/check-inputs.py'
RPM = CHECK.parent.parent


class InputsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'source'
        for name in ('apps/backend', 'apps/frontend', 'packaging/rpm'):
            (self.root / name).mkdir(parents=True, exist_ok=True)
        (self.root / 'VERSION').write_text('v2.13.1\n')
        (self.root / 'packaging/rpm/heimdall-server.spec').write_text('Version: 2.13.1\n')
        for app in ('backend', 'frontend'):
            (self.root / 'apps' / app / 'package.json').write_text(
                json.dumps({'version': '2.13.1'}))
        self.topdir = Path(self.tmp.name) / 'output'

    def check(self, mode='check'):
        return subprocess.run(
            [sys.executable, str(CHECK), str(self.root), str(self.topdir), mode],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)

    def test_matching_versions(self):
        result = self.check()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, '2.13.1\n')

    def test_backend_mismatch(self):
        (self.root / 'apps/backend/package.json').write_text('{"version":"2.13.0"}')
        result = self.check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('version mismatch', result.stderr)

    def test_symlinked_in_tree_topdir(self):
        link = Path(self.tmp.name) / 'source-link'
        link.symlink_to(self.root, target_is_directory=True)
        self.topdir = link / 'output'
        result = self.check('workspace')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('outside the source tree', result.stderr)

    def commit_fixture(self):
        def git(*args):
            subprocess.run(['git', '-C', str(self.root)] + list(args), check=True,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        git('init', '-q')
        git('add', '.')
        git('-c', 'user.name=RPM Test', '-c', 'user.email=rpm-test@example.invalid',
            'commit', '-qm', 'fixture')
        return git

    def test_dirty_and_unrelated_inputs(self):
        self.commit_fixture()
        self.assertEqual(self.check('head').returncode, 0)
        (self.root / 'notes.txt').write_text('unrelated')
        self.assertEqual(self.check('head').returncode, 0)
        for path in ('apps/backend/new-file.txt', 'test/package.json', 'yarn.lock'):
            with self.subTest(path=path):
                input_file = self.root / path
                input_file.parent.mkdir(parents=True, exist_ok=True)
                input_file.write_text('build input')
                result = self.check('head')
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Uncommitted build inputs', result.stderr)
                input_file.unlink()

    def test_dirty_tracked_inputs(self):
        git = self.commit_fixture()
        (self.root / 'apps/backend/package.json').write_text(
            '{"version":"2.13.1","modified":true}')
        self.assertNotEqual(self.check('head').returncode, 0)
        git('add', 'apps/backend/package.json')
        self.assertNotEqual(self.check('head').returncode, 0)

    def test_release_requires_matching_head(self):
        git = self.commit_fixture()
        result = self.check('release')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('matching version tag', result.stderr)
        git('tag', 'v2.13.1')
        self.assertEqual(self.check('release').returncode, 0)
        git('-c', 'user.name=RPM Test', '-c', 'user.email=rpm-test@example.invalid',
            'commit', '--allow-empty', '-qm', 'later commit')
        self.assertNotEqual(self.check('release').returncode, 0)

    def test_linked_worktree(self):
        git = self.commit_fixture()
        linked = Path(self.tmp.name) / 'linked'
        git('worktree', 'add', '--detach', str(linked), 'HEAD')
        self.root = linked
        result = self.check('head')
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_workspace_accepts_dirty_inputs_without_git(self):
        (self.root / 'apps/backend/local.txt').write_text('build input')
        result = self.check('workspace')
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_unknown_mode(self):
        result = self.check('typo')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Unknown source mode', result.stderr)

    def prepare_make_fixture(self):
        packaging = self.root / 'packaging/rpm'
        shutil.rmtree(str(packaging))
        shutil.copytree(str(RPM), str(packaging),
                        ignore=shutil.ignore_patterns('rpmbuild', 'dist', 'cli-man', 'tests', 'man'))
        self.make_env = os.environ.copy()
        # OL8 uses GNU tar; select the installed GNU tar on macOS as well.
        gtar = shutil.which('gtar')
        if gtar:
            bin_dir = Path(self.tmp.name) / 'bin'
            bin_dir.mkdir()
            (bin_dir / 'tar').symlink_to(gtar)
            self.make_env['PATH'] = str(bin_dir) + os.pathsep + self.make_env['PATH']

    def make(self, *args):
        return subprocess.run(
            ['make', '-C', str(self.root / 'packaging/rpm'), 'GOARCH=amd64',
             'TOPDIR=' + str(self.topdir)] + list(args),
            env=self.make_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            universal_newlines=True)

    def test_workspace_archive_excludes_local_inputs(self):
        self.prepare_make_fixture()
        excluded = ('.git/config', '.beads/state', '.superpowers/state',
                    'node_modules/dependency', 'apps/backend/node_modules/dependency',
                    'dist/build', 'packaging/rpm/rpmbuild/generated',
                    '.env', 'apps/backend/.env-secret', 'apps/backend/.env.local',
                    'apps/frontend/.env.development.local', 'package.rpm',
                    'certs/corporate-ca.pem', '.cache/item', 'coverage/report')
        for name in excluded:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('private marker')
        (self.root / 'apps/backend/local-source.js').write_text('workspace source')
        self.topdir = Path(self.tmp.name) / 'output with spaces'
        result = self.make('sources', 'SOURCE_MODE=workspace')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        with tarfile.open(str(self.topdir / 'SOURCES/heimdall2-2.13.1.tar.gz')) as archive:
            names = set(archive.getnames())
            prefix = 'heimdall2-2.13.1/'
            self.assertIn(prefix + 'apps/backend/local-source.js', names)
            self.assertIn(prefix + 'VERSION', names)
            for name in excluded:
                self.assertNotIn(prefix + name, names)

    def test_head_archive_uses_committed_snapshot(self):
        self.prepare_make_fixture()
        (self.root / 'committed.txt').write_text('committed source')
        self.commit_fixture()
        (self.root / 'notes.txt').write_text('unrelated untracked note')
        self.topdir = Path(self.tmp.name) / 'output with spaces'
        result = self.make('sources', 'DEV=1')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        with tarfile.open(str(self.topdir / 'SOURCES/heimdall2-2.13.1.tar.gz')) as archive:
            self.assertIn('heimdall2-2.13.1/committed.txt', archive.getnames())
            self.assertNotIn('heimdall2-2.13.1/notes.txt', archive.getnames())

    def test_parallel_stage_rejects_inputs_before_cli_acquisition(self):
        self.prepare_make_fixture()
        self.commit_fixture()
        (self.root / 'test').mkdir()
        (self.root / 'test/package.json').write_text('dirty input')
        result = self.make('-j4', 'stage', 'SOURCE_MODE=head',
                           'HEIMDALL_CLI_REPO=/no-such-local-cli-repo')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Uncommitted build inputs', result.stderr)
        self.assertNotIn('does not exist', result.stderr)
        self.assertFalse(self.topdir.exists())


if __name__ == '__main__':
    unittest.main()
