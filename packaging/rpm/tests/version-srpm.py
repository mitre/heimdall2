#!/usr/bin/env python3
"""Verify version/release persistence in a source RPM without building the app."""
import json
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile

RPM = Path(__file__).resolve().parents[1]


def run(*args):
    result = subprocess.run(list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            universal_newlines=True)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout.strip()


with tempfile.TemporaryDirectory(prefix='heimdall-version-srpm-') as temp:
    root = Path(temp)
    for version in ('2.14.0', '3.2.1'):
        source, staged = root / 'source', root / 'staged'
        packaging = source / 'packaging/rpm'
        shutil.copytree(str(RPM), str(packaging))
        (source / 'VERSION').write_text('v' + version + '\n')
        for app in ('backend', 'frontend'):
            app_dir = source / 'apps' / app
            app_dir.mkdir(parents=True)
            (app_dir / 'package.json').write_text(json.dumps({'version': version}))
        # Network/toolchain acquisition has its own tests; stage the real spec/sources.
        run('make', '-C', str(packaging), '-o', 'heimdall-cli', '-o', 'man', '-o', 'runtimes',
            'stage', 'TOPDIR=' + str(staged), 'HEIMDALL_RELEASE=0.7.integration')
        spec = staged / 'SPECS/heimdall-server.spec'
        for value in re.findall(r'^Source\d+:\s+(\S+)', spec.read_text(), re.MULTILINE):
            name = value.replace('%{version}', version).rsplit('/', 1)[-1]
            path = staged / 'SOURCES' / name
            if not path.exists():
                # Source RPM assembly stores these bytes; it does not unpack/build them.
                path.write_bytes(b'fixture for independently tested build input\n')
        run('rpmbuild', '-bs', '--nodeps', '--define', '_topdir ' + str(staged),
            '--define', 'dist .el8', str(spec))
        srpms = list((staged / 'SRPMS').glob('*.src.rpm'))
        assert len(srpms) == 1, srpms
        srpm = root / (version + '.src.rpm')
        shutil.copy2(str(srpms[0]), str(srpm))
        shutil.rmtree(str(source))
        shutil.rmtree(str(staged))

        expected = version + ' 0.7.integration.el8'
        assert run('rpm', '-qp', '--qf', '%{VERSION} %{RELEASE}', str(srpm)) == expected
        rebuilt = root / ('rebuild-' + version)
        run('rpm', '-i', '--define', '_topdir ' + str(rebuilt), str(srpm))
        rebuilt_spec = rebuilt / 'SPECS/heimdall-server.spec'
        assert run('rpmspec', '-q', '--srpm', '--qf', '%{VERSION} %{RELEASE}',
                   '--define', 'dist .el8', str(rebuilt_spec)) == expected
        archive = rebuilt / ('SOURCES/heimdall2-' + version + '.tar.gz')
        with tarfile.open(str(archive)) as contents:
            assert contents.extractfile('heimdall2-' + version + '/VERSION').read() == (
                'v' + version + '\n').encode()
        run('rpmbuild', '-bs', '--nodeps', '--define', '_topdir ' + str(rebuilt),
            '--define', 'dist .el8', str(rebuilt_spec))
        print('Self-contained SRPM version/release: ' + expected)
