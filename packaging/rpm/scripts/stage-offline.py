#!/usr/bin/env python3
"""Collect a signed, distribution-specific RPM repository in an empty root."""
import argparse
import configparser
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tempfile


DISTRIBUTIONS = ('rhel', 'rocky', 'almalinux', 'ol')
ARCHITECTURES = ('x86_64', 'aarch64')


def regular_file(path):
    path = Path(path)
    if '..' in path.parts or not re.fullmatch(r'/[^\x00-\x1f\x7f]+', str(path)):
        raise ValueError('Expected an absolute path without traversal or control characters')
    if not path.is_absolute() or path.is_symlink() or not path.is_file():
        raise ValueError('Expected an absolute regular file without a symlink: ' + str(path))
    return path.resolve()


def read_target(path):
    values = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        name, separator, raw = line.partition('=')
        if not separator or not re.fullmatch(r'[A-Z_][A-Z_0-9]*', name) or name in values:
            raise ValueError('Invalid os-release assignment')
        value = shlex.split(raw)
        if len(value) != 1:
            raise ValueError('Invalid os-release value: ' + name)
        values[name] = value[0]
    distribution, version, platform = [values.get(name, '') for name in ('ID', 'VERSION_ID', 'PLATFORM_ID')]
    if distribution not in DISTRIBUTIONS or not re.fullmatch(r'(8|9|10)(?:\.\d+)*', version, re.ASCII):
        raise ValueError('Unsupported distribution or version')
    major = version.split('.')[0]
    if platform != 'platform:el' + major:
        raise ValueError('Conflicting or unsupported platform')
    return {'id': distribution, 'el_major': major, 'version_id': version}


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def run(command):
    # Repository diagnostics may contain authenticated URLs or subscription paths.
    try:
        return subprocess.run([str(value) for value in command], check=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              universal_newlines=True,
                              env=dict(os.environ, LC_ALL='C')).stdout
    except subprocess.CalledProcessError:
        raise ValueError('Command failed: ' + str(command[0])) from None


def verify_signature(path, dbpath):
    path = regular_file(path)
    result = subprocess.run(['rpmkeys', '--dbpath', str(dbpath), '--checksig', '--verbose', str(path)],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            universal_newlines=True, env=dict(os.environ, LC_ALL='C'))
    if result.returncode or not re.search(r'Signature.*: OK', result.stdout):
        raise ValueError('RPM signature verification failed: ' + path.name)


def package_record(path, root):
    path = regular_file(path)
    output = run(['rpm', '-qp', '--qf', '%{NEVRA}\t%{NAME}\t%{ARCH}\t%{VENDOR}\t%{SOURCERPM}', path])
    fields = output.rstrip('\n').split('\t')
    if len(fields) != 5 or any('\n' in field or '\r' in field for field in fields):
        raise ValueError('Invalid RPM metadata: ' + path.name)
    nevra, name, architecture, vendor, source_rpm = fields
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._+:~-]*', nevra) or not name:
        raise ValueError('Invalid RPM NEVRA')
    return {'path': str(path.relative_to(root.resolve())), 'nevra': nevra, 'name': name,
            'architecture': architecture, 'vendor': vendor, 'source_rpm': source_rpm,
            'sha256': digest(path)}


def public_key(source, destination, home):
    home.mkdir(mode=0o700)
    prefix = ['gpg', '--batch', '--homedir', home]
    records = run(prefix + ['--with-colons', '--import-options', 'show-only', '--import', source]).splitlines()
    if any(line.startswith(('sec:', 'ssb:')) for line in records):
        raise ValueError('Private signing keys are not bundle inputs')
    fingerprints = []
    primary = False
    for line in records:
        fields = line.split(':')
        if fields[0] == 'pub':
            primary = True
        elif fields[0] == 'sub':
            primary = False
        elif fields[0] == 'fpr' and primary:
            fingerprints.append(fields[9])
            primary = False
    if len(fingerprints) != 1 or not re.fullmatch(r'[0-9A-F]{40,64}', fingerprints[0]):
        raise ValueError('Each key input must contain one public primary key')
    run(prefix + ['--import', source])
    exported = run(prefix + ['--armor', '--export', fingerprints[0]])
    if not exported.startswith('-----BEGIN PGP PUBLIC KEY BLOCK-----'):
        raise ValueError('Unable to export public key')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(exported)
    return fingerprints[0]


def isolated_directory(path):
    path = Path(path)
    if not path.is_absolute() or path.is_symlink() or not path.is_dir():
        raise ValueError('Expected an absolute isolated directory: ' + str(path))
    for child in path.rglob('*'):
        if child.is_symlink() or not child.is_file():
            raise ValueError('Repository and variable inputs must be regular files')
    return path


def validate_inputs(args):
    args.rpm = regular_file(args.rpm)
    args.runtime_manifest = regular_file(args.runtime_manifest)
    args.heimdall_key = regular_file(args.heimdall_key)
    args.os_key = [regular_file(path) for path in args.os_key]
    if not args.os_key or not args.repo or len(set(args.repo)) != len(args.repo):
        raise ValueError('At least one OS key and unique approved repositories are required')
    if any(not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*', repo) for repo in args.repo):
        raise ValueError('Invalid repository ID')
    args.reposdir = isolated_directory(args.reposdir)
    args.varsdir = isolated_directory(args.varsdir)
    repositories = configparser.ConfigParser(interpolation=None, strict=True)
    try:
        repositories.read([str(path) for path in sorted(args.reposdir.glob('*.repo'))])
    except configparser.Error:
        raise ValueError('Invalid repository configuration') from None
    if any(not repositories.has_section(repo) for repo in args.repo):
        raise ValueError('An approved repository is missing from reposdir')
    output = Path(args.output)
    if not output.is_absolute() or output.exists() or output.is_symlink() or not output.parent.is_dir():
        raise ValueError('Output must be an absent absolute path with an existing parent')
    return output


def release_version(value, major):
    if not re.fullmatch(r'(8|9|10)(?:\.\d+)*', value, re.ASCII) or value.split('.')[0] != major:
        raise ValueError('releasever does not match the target EL major')
    return value


def runtime_inventory(path, architecture):
    runtime_bytes = regular_file(path).read_bytes()
    runtime = json.loads(runtime_bytes.decode('utf-8'))
    if not isinstance(runtime, dict) or runtime.get('architecture') != architecture or runtime.get('schema') != 1:
        raise ValueError('Runtime inventory architecture or schema does not match')
    return runtime_bytes


def candidate_record(path, major, architecture):
    candidate = package_record(path, path.parent)
    if candidate['name'] != 'heimdall-server' or candidate['architecture'] != architecture:
        raise ValueError('Candidate must be a native binary heimdall-server RPM')
    if not re.search(r'\.el' + major + r'(?:[._+]|$)', candidate['nevra']):
        raise ValueError('Candidate RPM does not match the target EL release')
    return candidate


def stage_keys(args, work, staging):
    records = []
    for index, source in enumerate(args.os_key):
        key = staging / 'keys/os/{}.asc'.format(index + 1)
        fingerprint = public_key(source, key, work / ('gpg-os-' + str(index)))
        records.append({'path': str(key.relative_to(staging)), 'fingerprint': fingerprint, 'sha256': digest(key)})
    key = staging / 'keys/heimdall.asc'
    fingerprint = public_key(args.heimdall_key, key, work / 'gpg-heimdall')
    records.append({'path': str(key.relative_to(staging)), 'fingerprint': fingerprint, 'sha256': digest(key)})
    return records


def package_inventory(downloads, candidate, staging, os_db, major, architecture):
    packages = staging / 'repo/Packages'
    inventories = {candidate['nevra']: package_record(packages / (candidate['nevra'] + '.rpm'), staging)}
    for source in sorted(downloads.rglob('*.rpm')):
        record = package_record(source, downloads)
        if record['architecture'] not in (architecture, 'noarch'):
            raise ValueError('Downloaded RPM has an unsupported architecture')
        releases = re.findall(r'\.el(\d+)(?:[._+]|$)', record['nevra'], re.ASCII)
        if any(release != major for release in releases):
            raise ValueError('Downloaded RPM does not match the target EL release')
        previous = inventories.get(record['nevra'])
        if previous:
            if previous['sha256'] != record['sha256']:
                raise ValueError('Duplicate RPM NEVRA has different bytes')
            continue
        destination = packages / (record['nevra'] + '.rpm')
        shutil.copyfile(str(source), str(destination))
        verify_signature(destination, os_db)
        inventories[record['nevra']] = package_record(destination, staging)
    if len(inventories) < 2:
        raise ValueError('No dependency packages were downloaded')
    return sorted(inventories.values(), key=lambda record: record['nevra'])


def repository_inventory(repos, installroot):
    records = []
    for repo in repos:
        metadata = [path for path in (installroot / 'var/cache/dnf').rglob('repomd.xml')
                    if re.fullmatch(re.escape(repo) + r'-[0-9a-f]+', path.parent.parent.name)]
        if len(metadata) != 1:
            raise ValueError('Missing or ambiguous repository metadata: ' + repo)
        records.append({'id': repo, 'repomd_sha256': digest(regular_file(metadata[0]))})
    return sorted(records, key=lambda record: record['id'])


def write_bundle(staging, manifest, runtime_bytes):
    target = manifest['target']
    run(['createrepo_c', staging / 'repo'])
    (staging / 'runtime-manifest.json').write_bytes(runtime_bytes)
    (staging / 'target').write_text('{} {} {}\n'.format(target['id'], target['el_major'], target['architecture']))
    (staging / 'heimdall-nevra').write_text(manifest['heimdall_nevra'] + '\n')
    (staging / 'offline-manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    offline = Path(__file__).resolve().parent.parent / 'offline'
    for name in ('install.sh', 'README.txt'):
        shutil.copyfile(str(offline / name), str(staging / name))
    with (staging / 'SHA256SUMS').open('w') as sums:
        for path in sorted(staging.rglob('*')):
            if path.is_symlink():
                raise ValueError('Bundle must not contain symbolic links')
            if path.is_file() and path.name != 'SHA256SUMS':
                sums.write('{}  {}\n'.format(digest(path), path.relative_to(staging)))


def stage(args):
    if os.geteuid() != 0:
        raise ValueError('Offline collection requires root on the matching producer')
    output = validate_inputs(args)
    target = read_target(Path('/etc/os-release'))
    releasever = release_version(args.releasever, target['el_major'])
    architecture = run(['rpm', '--eval', '%{_arch}']).strip()
    if architecture not in ARCHITECTURES:
        raise ValueError('Unsupported native RPM architecture')
    runtime_bytes = runtime_inventory(args.runtime_manifest, architecture)
    candidate = candidate_record(args.rpm, target['el_major'], architecture)

    with tempfile.TemporaryDirectory(prefix='.offline-', dir=str(output.parent)) as temporary:
        work = Path(temporary)
        staging = work / 'bundle'
        packages = staging / 'repo/Packages'
        packages.mkdir(parents=True)
        os_db, heimdall_db, installroot, downloads = [work / name for name in ('os-db', 'heimdall-db', 'installroot', 'downloads')]
        for path in (os_db, heimdall_db, installroot, downloads):
            path.mkdir()
        key_records = stage_keys(args, work, staging)
        for db in (os_db, heimdall_db):
            run(['rpm', '--dbpath', db, '--initdb'])
        run(['rpm', '--root', installroot, '--initdb'])
        for record in key_records:
            key = staging / record['path']
            db = heimdall_db if record['path'] == 'keys/heimdall.asc' else os_db
            run(['rpm', '--dbpath', db, '--import', key])
            run(['rpm', '--root', installroot, '--import', key])
        copied_candidate = packages / (candidate['nevra'] + '.rpm')
        shutil.copyfile(str(args.rpm), str(copied_candidate))
        verify_signature(copied_candidate, heimdall_db)
        config = work / 'dnf.conf'
        config.write_text('[main]\ngpgcheck=1\nlocalpkg_gpgcheck=1\ninstall_weak_deps=1\nkeepcache=1\nbest=1\nskip_if_unavailable=0\ncachedir=/var/cache/dnf\n')
        command = ['dnf', '-y', '--noplugins', '--config', config,
                   '--installroot', installroot, '--releasever=' + releasever,
                   '--forcearch', architecture, '--setopt=reposdir=' + str(args.reposdir),
                   '--setopt=varsdir=' + str(args.varsdir),
                   '--setopt=module_platform_id=platform:el' + target['el_major'],
                   '--setopt=install_weak_deps=True', '--setopt=localpkg_gpgcheck=True',
                   '--setopt=*.gpgcheck=True', '--setopt=*.gpgkey=',
                   '--setopt=*.skip_if_unavailable=False', '--setopt=sslverify=True',
                   '--setopt=*.sslverify=True', '--disablerepo=*']
        command.extend('--enablerepo=' + repo for repo in args.repo)
        # Keep installed DNF's RPM bindings compatible when application dependencies update RPM.
        command.extend(['install', '--downloadonly', '--downloaddir', downloads, 'dnf', 'rpm', copied_candidate])
        run(command)
        inventory = package_inventory(downloads, candidate, staging, os_db, target['el_major'], architecture)
        manifest = {'schema': 1, 'target': {'id': target['id'], 'el_major': target['el_major'], 'architecture': architecture},
                    'producer_version_id': target['version_id'], 'releasever': releasever,
                    'heimdall_nevra': candidate['nevra'], 'install_weak_deps': True,
                    'repositories': repository_inventory(args.repo, installroot),
                    'keys': sorted(key_records, key=lambda record: record['path']), 'packages': inventory}
        write_bundle(staging, manifest, runtime_bytes)
        if output.exists() or output.is_symlink():
            raise ValueError('Output appeared during collection')
        staging.rename(output)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__, epilog='Verify supplied public-key fingerprints against the distribution and release authorities before collection.')
    for flag in ('rpm', 'runtime-manifest', 'reposdir', 'varsdir', 'heimdall-key', 'output'):
        parser.add_argument('--' + flag, type=Path, required=True)
    parser.add_argument('--repo', action='append', required=True)
    parser.add_argument('--os-key', action='append', type=Path, required=True)
    parser.add_argument('--releasever', required=True)
    args = parser.parse_args()
    try:
        print(stage(args))
    except (ValueError, OSError, configparser.Error) as error:
        parser.exit(1, 'offline collection failed: {}\n'.format(error))


if __name__ == '__main__':
    main()
