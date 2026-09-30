#!/usr/bin/env python3
import json
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 4:
    sys.exit('Usage: check-inputs.py REPO TOPDIR MODE')
repo, topdir = (Path(value).resolve() for value in sys.argv[1:3])
mode = sys.argv[3]
if mode not in ('check', 'head', 'release', 'workspace'):
    sys.exit('Unknown source mode')

version = (repo / 'VERSION').read_text().strip().lstrip('v')
spec = (repo / 'packaging/rpm/heimdall-server.spec').read_text()
match = re.search(r'^Version:\s+(\S+)', spec, re.MULTILINE)
versions = {'RPM': match.group(1) if match else ''}
for app in ('backend', 'frontend'):
    versions[app] = json.loads((repo / 'apps' / app / 'package.json').read_text())['version']
if not version or any(value != version for value in versions.values()):
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
