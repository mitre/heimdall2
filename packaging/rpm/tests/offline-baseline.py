#!/usr/bin/env python3
"""Record the offline fixture before installation; verify it after installation."""
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

INVENTORY = Path('/tmp/rpm-offline-baseline.tsv')


def check_platform(manifest, release, architecture):
    expected = manifest['distribution']
    actual_version = release.get('VERSION_ID', '').split('.')[0]
    expected_version = expected['version_id'].split('.')[0]
    if (release.get('ID'), actual_version, architecture) != (
            expected['id'], expected_version, manifest['architecture']):
        raise ValueError('Fixture distribution/version/architecture does not match the bundle')


def check_inventory(manifest, installed, before=None):
    for package in manifest['baseline']:
        if not installed.get(package['name']):
            raise ValueError('Missing baseline package: ' + package['name'])
    if before is None:
        extras = {package['name'] for package in manifest['dependencies']}
        extras.add(manifest['candidate']['name'])
        present = sorted(extras.intersection(installed))
        if present:
            raise ValueError('Offline dependencies already installed: ' + ', '.join(present))
    else:
        for name, versions in before.items():
            if name == 'gpg-pubkey' and versions <= installed.get(name, set()):
                continue
            if installed.get(name) != versions:
                raise ValueError('Offline install changed an existing package: ' + name)
        for package in manifest['dependencies'] + [manifest['candidate']]:
            if package['nevra'] not in installed.get(package['name'], set()):
                raise ValueError('Expected installed package: ' + package['nevra'])


def inventory(text):
    packages = {}
    for line in text.splitlines():
        name, nevra = line.split('\t')
        # RPM prints an explicit zero epoch that DNF omits from its NEVRA.
        if nevra.startswith(name + '-0:'):
            nevra = name + '-' + nevra[len(name) + 3:]
        packages.setdefault(name, set()).add(nevra)
    return packages


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ('packages', 'dependencies', 'record', 'verify'):
        raise ValueError('Usage: offline-baseline.py packages|dependencies|record|verify MANIFEST')
    if os.environ.get('HEIMDALL_RPM_TEST') != '1' or os.geteuid() != 0:
        raise ValueError('Offline baseline helper is only for disposable root CI fixtures')
    action, path = sys.argv[1:3]
    manifest = json.loads(Path(path).read_text())
    if manifest['schema'] != 1 or not manifest['baseline']:
        raise ValueError('Unsupported or empty offline baseline manifest')
    for package in manifest['baseline'] + manifest['dependencies']:
        if (not re.fullmatch(r'[A-Za-z0-9_+.-]+', package['name']) or
                not package['nevra'].startswith(package['name'] + '-') or
                not re.fullmatch(r'[A-Za-z0-9_+.~:^%-]+', package['nevra'])):
            raise ValueError('Invalid package identity in baseline manifest')
    release = {}
    for line in Path('/etc/os-release').read_text().splitlines():
        key, separator, value = line.partition('=')
        if separator and key in ('ID', 'VERSION_ID'):
            release[key] = shlex.split(value)[0]
    architecture = subprocess.check_output(['rpm', '-E', '%{_arch}'], universal_newlines=True).strip()
    check_platform(manifest, release, architecture)
    if action == 'packages':
        for package in manifest['baseline']:
            print(package['name'])
        return
    if action == 'dependencies':
        for package in manifest['dependencies']:
            print(package['name'])
        return
    output = subprocess.check_output(['rpm', '-qa', '--qf', '%{NAME}\t%{NEVRA}\n'],
                                     universal_newlines=True)
    before = inventory(INVENTORY.read_text()) if action == 'verify' else None
    check_inventory(manifest, inventory(output), before)
    if action == 'record':
        INVENTORY.write_text('\n'.join(sorted(output.splitlines())) + '\n')
    print('Offline baseline {} passed'.format(action))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        sys.exit('Offline baseline error: ' + str(error))
