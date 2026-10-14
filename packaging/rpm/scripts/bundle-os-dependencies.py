#!/usr/bin/env python3
"""Collect vendor-signed OS additions to a Rocky Core baseline for one RPM."""
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlparse

OUTPUT_NAMES = ('OS-RPMS', 'OS-GPG-KEYS', 'os-dependencies.json')
REPOSITORIES = ('baseos', 'appstream')


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def validate_target(distribution, architecture, name, release, rpm_arch):
    major = distribution.get('VERSION_ID', '').split('.')[0]
    if distribution.get('ID') != 'rocky' or major not in ('8', '9', '10'):
        raise ValueError('OS dependency collection requires Rocky Linux 8, 9 or 10; '
                         'RHEL bundles require their own vendor repositories')
    if architecture not in ('x86_64', 'aarch64') or rpm_arch != architecture:
        raise ValueError('Candidate architecture must match the x86_64/aarch64 collector host')
    if name != 'heimdall-server' or not re.search(r'(^|[.])el' + major + r'([._]|$)', release):
        raise ValueError('Candidate must be heimdall-server for the collector host EL major')
    return major


def dependency_delta(baseline, combined, candidate):
    before = {(p.name, p.arch): str(p) for p in baseline}
    after = {(p.name, p.arch): str(p) for p in combined}
    changed = sorted(name + '.' + arch for (name, arch), nevra in before.items()
                     if after.get((name, arch)) != nevra)
    if changed:
        raise ValueError('Adding Heimdall changes or removes baseline packages: ' + ', '.join(changed))
    if after.get((candidate.name, candidate.arch)) != str(candidate):
        raise ValueError('Resolved transaction does not contain the exact candidate')
    return sorted((p for p in combined if (p.name, p.arch) not in before
                   and str(p) != str(candidate)), key=lambda p: (p.name, p.arch))


def check_output(output):
    if not output.is_dir():
        raise ValueError('Output directory must already exist: ' + str(output))
    for name in OUTPUT_NAMES:
        if os.path.lexists(str(output / name)):
            raise ValueError('Bundle output already exists: ' + str(output / name))


def verify_signature(database, package):
    result = subprocess.run(['rpmkeys', '--dbpath', str(database), '--checksig',
                             '--verbose', str(package)],
                            env=dict(os.environ, LC_ALL='C'), stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, universal_newlines=True)
    # RPM accepts unsigned packages with valid digests; require a verified signature too.
    if result.returncode or not re.search(r'Signature[^\n]*: OK\s*$', result.stdout, re.MULTILINE):
        raise ValueError('Vendor signature verification failed for {}:\n{}'.format(package, result.stdout))


def copy_repository_key(key, destination):
    url = urlparse(key)
    if url.scheme != 'file' or url.netloc:
        raise ValueError('Repository signing keys must be local file URLs: ' + key)
    source = Path(unquote(url.path))
    if not source.is_absolute() or not source.is_file():
        raise ValueError('Repository signing key is missing: ' + str(source))
    target = destination / source.name
    if target.exists() and target.read_bytes() != source.read_bytes():
        raise ValueError('Repository signing key filenames conflict: ' + source.name)
    shutil.copyfile(str(source), str(target))


def copy_repository_keys(repositories, destination):
    destination.mkdir()
    for repo in repositories:
        if not repo.gpgcheck or not repo.sslverify:
            raise ValueError('Repository must enable gpgcheck and sslverify: ' + repo.id)
        if not repo.gpgkey:
            raise ValueError('Repository has no vendor signing keys: ' + repo.id)
        for key in repo.gpgkey:
            copy_repository_key(key, destination)


def read_os_release(path):
    distribution = {}
    for line in path.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            name, value = line.split('=', 1)
            distribution[name] = ''.join(shlex.split(value))
    return distribution


def collect(candidate, output):
    # The build Python can lack DNF; import only when collecting, not for host-side tests.
    import dnf

    check_output(output)
    distribution = read_os_release(Path('/etc/os-release'))
    metadata = subprocess.check_output(['rpm', '-qp', '--queryformat',
        '%{NAME}\t%{RELEASE}\t%{ARCH}', str(candidate)], universal_newlines=True).split('\t')
    if len(metadata) != 3:
        raise ValueError('Cannot read candidate RPM identity')
    architecture = platform.machine()
    major = validate_target(distribution, architecture, *metadata)
    with tempfile.TemporaryDirectory(prefix='.os-dependencies-', dir=str(output)) as temporary:
        work = Path(temporary)
        stage = work / 'bundle'
        stage.mkdir()
        with dnf.Base() as base:
            base.conf.read()
            base.conf.substitutions.update_from_etc('/', varsdir=base.conf.varsdir)
            base.conf.installroot = str(work / 'root')
            base.conf.cachedir = str(work / 'cache')
            base.conf.persistdir = str(work / 'persist')
            base.conf.logdir = str(work)
            base.conf.arch = architecture
            base.conf.substitutions['arch'] = architecture
            base.conf.substitutions['basearch'] = architecture
            base.conf.substitutions['releasever'] = major
            base.conf.module_platform_id = 'platform:el' + major
            base.conf.install_weak_deps = False
            base.conf.best = True
            base.read_all_repos()
            for repo in base.repos.values():
                repo.enable() if repo.id in REPOSITORIES else repo.disable()
            repositories = list(base.repos.iter_enabled())
            if {repo.id for repo in repositories} != set(REPOSITORIES):
                raise ValueError('Rocky BaseOS and AppStream repositories are required')
            copy_repository_keys(repositories, stage / 'OS-GPG-KEYS')
            base.fill_sack(load_system_repo=False)
            package, = base.add_remote_rpms([str(candidate)])
            base.read_comps()
            group = base.comps.group_by_pattern('core')
            if group is None:
                raise ValueError('Selected repositories do not define the Core baseline')
            base.group_install(group.id, ['mandatory', 'default'])
            base.resolve()
            baseline = list(base.transaction.install_set)
            base.package_install(package)
            base.resolve()
            dependencies = dependency_delta(baseline, list(base.transaction.install_set), package)
            for dependency in dependencies:
                if dependency.reponame not in REPOSITORIES or dependency.arch not in (architecture, 'noarch'):
                    raise ValueError('Dependency has an unexpected repository or architecture: ' + str(dependency))
            base.download_packages(dependencies)
            trust = work / 'rpmdb'
            trust.mkdir()
            subprocess.check_call(['rpm', '--dbpath', str(trust), '--initdb'])
            keys = sorted((stage / 'OS-GPG-KEYS').iterdir())
            subprocess.check_call(['rpmkeys', '--dbpath', str(trust), '--import'] + [str(key) for key in keys])
            rpm_directory = stage / 'OS-RPMS' / architecture
            rpm_directory.mkdir(parents=True)
            records = []
            for dependency in dependencies:
                source = Path(dependency.localPkg())
                verify_signature(trust, source)
                target = rpm_directory / source.name
                if target.exists():
                    raise ValueError('Dependency RPM filenames conflict: ' + source.name)
                shutil.copyfile(str(source), str(target))
                records.append({'name': dependency.name, 'nevra': str(dependency),
                    'path': str(target.relative_to(stage)), 'sha256': sha256(target),
                    'repository': dependency.reponame})
            manifest = {'schema': 1,
                'distribution': {'id': distribution['ID'], 'version_id': distribution['VERSION_ID']},
                'architecture': architecture, 'baseline_group': 'core',
                'package_types': ['mandatory', 'default'], 'weak_dependencies': False,
                'baseline': [{'name': p.name, 'nevra': str(p)}
                             for p in sorted(baseline, key=lambda p: (p.name, p.arch))],
                'candidate': {'name': package.name, 'nevra': str(package), 'sha256': sha256(candidate)},
                'repositories': sorted(repo.id for repo in repositories),
                'dependencies': records}
            (stage / 'os-dependencies.json').write_text(json.dumps(manifest, indent=2) + '\n')
        check_output(output)
        for name in OUTPUT_NAMES:
            (stage / name).rename(output / name)
    print('Collected {} vendor-signed OS dependency RPMs for Rocky {} {} into {}'.format(
        len(records), distribution['VERSION_ID'], architecture, output))


def main():
    if len(sys.argv) != 3:
        sys.exit('Usage: bundle-os-dependencies.py CANDIDATE_RPM OUTPUT_DIR')
    try:
        collect(Path(sys.argv[1]).resolve(strict=True), Path(sys.argv[2]).resolve(strict=True))
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))


if __name__ == '__main__':
    main()
