#!/usr/bin/env python3
import json
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 4:
    sys.exit('Usage: check-inputs.py REPO TOPDIR MODE')
repo, topdir = (Path(value).resolve() for value in sys.argv[1:3])
topdir_input = Path(sys.argv[2])
mode = sys.argv[3]
if mode not in ('check', 'head', 'release', 'workspace', 'clean'):
    sys.exit('Unknown source mode')
if mode == 'clean':
    protected = (not sys.argv[2] or topdir_input.is_symlink()
                 or topdir == repo or repo in topdir.parents or topdir in repo.parents
                 or topdir == Path.home().resolve())
    if protected:
        sys.exit('Refusing to clean protected RPM topdir')
    if topdir.exists():
        if not topdir.is_dir():
            sys.exit('Refusing to clean RPM topdir that is not a directory')
        allowed = {'BUILD', 'BUILDROOT', 'RPMS', 'SOURCES', 'SPECS', 'SRPMS',
                   'heimdall-cli-src', 'heimdall-cli-build', 'cli-man',
                   'RPM-TEST-GPG-KEY', 'runtime-manifest.json', 'SHA256SUMS'}
        unexpected = sorted(child.name for child in topdir.iterdir()
                             if child.name not in allowed)
        if unexpected:
            sys.exit('Refusing to clean RPM topdir with unexpected entries: '
                     + ', '.join(unexpected))
    sys.exit(0)

version_file = (repo / 'VERSION').read_text().rstrip('\n')
match = re.fullmatch(r'v?(\d[\dA-Za-z._+~^]*)', version_file, re.ASCII)
if not match:
    sys.exit('Invalid VERSION: expected an RPM-safe version with an optional leading v')
version = match.group(1)
spec = (repo / 'packaging/rpm/heimdall-server.spec').read_text()
spec_versions = re.findall(r'^Version:(.*)$', spec, re.MULTILINE)
if [value.lstrip(' \t') for value in spec_versions] != ['@HEIMDALL_VERSION@']:
    sys.exit('RPM spec must contain one Version: @HEIMDALL_VERSION@ template field')
versions = {}
for app in ('backend', 'frontend'):
    versions[app] = json.loads((repo / 'apps' / app / 'package.json').read_text())['version']
if any(value != version for value in versions.values()):
    sys.exit('version mismatch: VERSION={}; {}'.format(version, versions))
if mode != 'check' and (topdir == repo or repo in topdir.parents):
    sys.exit('RPM topdir must be outside the source tree')
if mode in ('head', 'release'):
    def git(*args):
        return subprocess.check_output(
            ['git', '-C', str(repo)] + list(args),
            stderr=subprocess.PIPE, universal_newlines=True).strip()

    paths = ['VERSION', 'package.json', 'yarn.lock', 'lerna.json', 'tsconfig.json',
             'postcss.config.js', 'apps', 'libs', 'test', 'packaging/rpm']
    try:
        if git('status', '--porcelain', '--untracked-files=all', '--', *paths):
            sys.exit('Uncommitted build inputs; use SOURCE_MODE=workspace to build current files')
        if mode == 'release':
            try:
                tagged_commit = git('rev-parse', '--verify', 'refs/tags/v{}^{{commit}}'.format(version))
            except subprocess.CalledProcessError:
                tagged_commit = ''
            if git('rev-parse', 'HEAD') != tagged_commit:
                sys.exit('Release build requires HEAD at the matching version tag')
    except subprocess.CalledProcessError as error:
        sys.exit('Cannot validate committed build inputs: ' + error.stderr.strip())
print(version)
