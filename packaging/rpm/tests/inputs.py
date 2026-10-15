#!/usr/bin/env python3
import json
import os
from pathlib import Path
import re
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
        (self.root / 'packaging/rpm/heimdall-server.spec').write_text('Version: @HEIMDALL_VERSION@\n')
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

    def test_rejects_unsafe_version(self):
        for version in ('', 'vv2.14.0', ' v2.14.0', '2.14.0;id', '2.14.0\n3.0.0',
                        '2.14.0-rc1', '\u0662.14.0', '2.\u0661\u0664.0'):
            with self.subTest(version=version):
                (self.root / 'VERSION').write_text(version + '\n')
                result = self.check()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Invalid VERSION', result.stderr)

    def test_rejects_non_template_spec_version(self):
        for value in ('Version: 2.13.1\n', '',
                      'Version: @HEIMDALL_VERSION@ \n',
                      'Version: @HEIMDALL_VERSION@\nVersion: @HEIMDALL_VERSION@\n'):
            with self.subTest(value=value):
                (self.root / 'packaging/rpm/heimdall-server.spec').write_text(value)
                result = self.check()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('spec must contain one Version:', result.stderr)

    def test_spec_version_allows_horizontal_whitespace(self):
        for whitespace in ('', ' ', '\t ', ' ' * 100000):
            with self.subTest(whitespace_length=len(whitespace)):
                (self.root / 'packaging/rpm/heimdall-server.spec').write_text(
                    'Version:' + whitespace + '@HEIMDALL_VERSION@\n')
                result = self.check()
                self.assertEqual(result.returncode, 0, result.stderr)

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

    def test_clean_rejects_protected_paths(self):
        source_link = Path(self.tmp.name) / 'source-link'
        source_link.symlink_to(self.root, target_is_directory=True)
        for target in (self.root, self.root.parent, self.root / 'output',
                       Path.home(), Path('/'), source_link):
            with self.subTest(target=target):
                self.topdir = target
                result = self.check('clean')
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Refusing to clean protected RPM topdir', result.stderr)
        self.assertTrue(self.root.is_dir())

    def test_clean_rejects_empty_topdir(self):
        result = subprocess.run(
            [sys.executable, str(CHECK), str(self.root), '', 'clean'],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Refusing to clean protected RPM topdir', result.stderr)

    def test_make_clean_preserves_source(self):
        self.prepare_make_fixture()
        self.topdir = self.root
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue((self.root / 'VERSION').is_file())

    def test_make_clean_preserves_source_ancestor(self):
        self.prepare_make_fixture()
        self.topdir = self.root.parent
        sentinel = self.topdir / 'unrelated-file'
        sentinel.write_text('preserve me')
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(sentinel.read_text(), 'preserve me')
        self.assertTrue((self.root / 'VERSION').is_file())

    def test_make_clean_preserves_symlink_to_source(self):
        self.prepare_make_fixture()
        self.topdir = Path(self.tmp.name) / 'source-link'
        self.topdir.symlink_to(self.root, target_is_directory=True)
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(self.topdir.is_symlink())
        self.assertTrue((self.root / 'VERSION').is_file())

    def test_make_clean_rejects_unrelated_external_contents(self):
        self.prepare_make_fixture()
        self.topdir.mkdir()
        unrelated = self.topdir / 'unrelated-file'
        unrelated.write_text('preserve me')
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('unrelated-file', result.stderr)
        self.assertEqual(unrelated.read_text(), 'preserve me')

    def test_make_clean_rejects_external_symlink_topdir(self):
        self.prepare_make_fixture()
        target = Path(self.tmp.name) / 'external-output'
        target.mkdir()
        sentinel = target / 'preserve me'
        sentinel.write_text('build output')
        self.topdir = Path(self.tmp.name) / 'output-link'
        self.topdir.symlink_to(target, target_is_directory=True)
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(self.topdir.is_symlink())
        self.assertEqual(sentinel.read_text(), 'build output')

    def test_make_clean_preserves_external_symlink_child_target(self):
        self.prepare_make_fixture()
        self.topdir.mkdir()
        target = Path(self.tmp.name) / 'external-output'
        target.mkdir()
        sentinel = target / 'preserve me'
        sentinel.write_text('build output')
        (self.topdir / 'SOURCES').symlink_to(target, target_is_directory=True)
        result = self.make('clean')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse(self.topdir.exists())
        self.assertEqual(sentinel.read_text(), 'build output')

    def test_make_clean_removes_only_external_output(self):
        self.prepare_make_fixture()
        self.topdir = Path(self.tmp.name) / 'output with spaces'
        (self.topdir / 'SOURCES').mkdir(parents=True)
        (self.topdir / 'SOURCES/artifact').write_text('build output')
        sibling = Path(self.tmp.name) / 'unrelated-file'
        sibling.write_text('preserve me')
        (self.root / 'VERSION').unlink()
        result = self.make('clean')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse(self.topdir.exists())
        self.assertTrue(self.root.is_dir())
        self.assertEqual(sibling.read_text(), 'preserve me')

    def test_default_archive_excludes_local_inputs_without_git(self):
        self.prepare_make_fixture()
        excluded = ('.git/config', '.beads/state', '.superpowers/state',
                    'node_modules/dependency', 'apps/backend/node_modules/dependency',
                    'dist/build', 'packaging/rpm/rpmbuild/generated',
                    '.env', 'apps/backend/.env-secret', 'apps/backend/.env.local',
                    'apps/frontend/.env.development.local', 'package.rpm',
                    '.npmrc', 'apps/backend/.npmrc',
                    '.yarnrc.yml', 'apps/frontend/.yarnrc.yml',
                    'certs/corporate-ca.pem', '.cache/item', 'coverage/report',
                    'data/pgdata/base/private-database')
        for name in excluded:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('private marker')
        (self.root / 'apps/backend/local-source.js').write_text('workspace source')
        nested_data = self.root / 'libs/hdf-converters/data/fixture.json'
        nested_data.parent.mkdir(parents=True)
        nested_data.write_text('application data')
        self.topdir = Path(self.tmp.name) / 'output with spaces'
        result = self.make('sources')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        with tarfile.open(str(self.topdir / 'SOURCES/heimdall2-2.13.1.tar.gz')) as archive:
            names = set(archive.getnames())
            prefix = 'heimdall2-2.13.1/'
            self.assertIn(prefix + 'apps/backend/local-source.js', names)
            self.assertIn(prefix + 'VERSION', names)
            self.assertEqual(archive.extractfile(
                prefix + 'libs/hdf-converters/data/fixture.json').read(), b'application data')
            for name in excluded:
                self.assertNotIn(prefix + name, names)

    def test_default_archive_excludes_symlinked_database_directory(self):
        self.prepare_make_fixture()
        database = Path(self.tmp.name) / 'database'
        database.mkdir()
        (database / 'private-data').write_text('private database')
        (self.root / 'data').symlink_to(database, target_is_directory=True)
        result = self.make('sources')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        with tarfile.open(str(self.topdir / 'SOURCES/heimdall2-2.13.1.tar.gz')) as archive:
            self.assertNotIn('heimdall2-2.13.1/data', archive.getnames())

    def test_default_archive_includes_uncommitted_changes(self):
        self.prepare_make_fixture()
        self.commit_fixture()
        manifest = '{"version":"2.13.1","modified":true}'
        (self.root / 'apps/backend/package.json').write_text(manifest)
        (self.root / 'apps/backend/local-source.js').write_text('local source')
        for args in ((), ('DEV=1',)):
            with self.subTest(args=args):
                result = self.make('sources', *args)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                with tarfile.open(str(self.topdir / 'SOURCES/heimdall2-2.13.1.tar.gz')) as archive:
                    self.assertEqual(archive.extractfile(
                        'heimdall2-2.13.1/apps/backend/package.json').read().decode(), manifest)
                    self.assertEqual(archive.extractfile(
                        'heimdall2-2.13.1/apps/backend/local-source.js').read(), b'local source')

    def test_head_archive_uses_committed_snapshot(self):
        self.prepare_make_fixture()
        (self.root / 'committed.txt').write_text('committed source')
        self.commit_fixture()
        (self.root / 'notes.txt').write_text('unrelated untracked note')
        self.topdir = Path(self.tmp.name) / 'output with spaces'
        result = self.make('sources', 'render-spec', 'SOURCE_MODE=head')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(re.findall(r'^Version:\s+(\S+)',
                                   (self.topdir / 'SPECS/heimdall-server.spec').read_text(),
                                   re.MULTILINE), ['2.13.1'])
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

    def test_staged_version_and_archive_follow_version_file(self):
        self.prepare_make_fixture()
        for value, expected, mode in (('v2.14.0\r', '2.14.0', 'workspace'),
                                      ('3.2.1', '3.2.1', 'head')):
            with self.subTest(version=value):
                (self.root / 'VERSION').write_text(value + '\n')
                for app in ('backend', 'frontend'):
                    (self.root / 'apps' / app / 'package.json').write_text(
                        json.dumps({'version': expected}))
                if mode == 'head':
                    self.commit_fixture()
                # Acquisition/builds have separate fixtures; exercise real staging.
                result = self.make('-o', 'heimdall-cli', '-o', 'man', '-o', 'runtimes',
                                   'stage', 'SOURCE_MODE=' + mode, 'VERSION=9.9.9',
                                   'HEIMDALL_RELEASE=0.7.integration')
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                spec_path = self.topdir / 'SPECS/heimdall-server.spec'
                # The SRPM spec retains its literal version without a checkout.
                (self.root / 'VERSION').unlink()
                spec = spec_path.read_text()
                self.assertEqual(re.findall(r'^Version:\s+(\S+)', spec, re.MULTILINE),
                                 [expected])
                self.assertIn('%global heimdall_release 0.7.integration}', spec)
                archive_path = self.topdir / ('SOURCES/heimdall2-' + expected + '.tar.gz')
                with tarfile.open(str(archive_path)) as archive:
                    archived_version = archive.extractfile(
                        'heimdall2-' + expected + '/VERSION').read().decode()
                    self.assertEqual(archived_version, value + '\n')
                self.assertFalse((self.topdir / 'SOURCES/heimdall2-9.9.9.tar.gz').exists())


if __name__ == '__main__':
    unittest.main()
