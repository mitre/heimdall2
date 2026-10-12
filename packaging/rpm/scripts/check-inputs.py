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

version_file = (repo / 'VERSION').read_text().rstrip('\n')
match = re.fullmatch(r'v?([0-9][0-9A-Za-z._+~^]*)', version_file)
if not match:
    sys.exit('Invalid VERSION: expected an RPM-safe version with an optional leading v')
version = match.group(1)
spec = (repo / 'packaging/rpm/heimdall-server.spec').read_text()
if re.findall(r'^Version:[ \t]*(.*)$', spec, re.MULTILINE) != ['@HEIMDALL_VERSION@']:
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
