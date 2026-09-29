#!/usr/bin/env python3
"""Stage pinned runtime archives without extracting or executing their contents."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request

ARCHITECTURES = {'x86_64', 'aarch64'}
ARCHIVES = {'node': 'node-runtime.tar.xz', 'postgresql': 'postgresql-runtime.tar.bz2',
            'caddy': 'caddy-runtime.tar.gz'}


def inventory(lock, arch):
    if arch not in ARCHITECTURES:
        raise ValueError('Unsupported RPM architecture: ' + arch)
    if not isinstance(lock, dict) or type(lock.get('schema')) is not int or lock['schema'] != 1:
        raise ValueError('Runtime lock schema must be 1')
    runtimes = lock.get('runtimes')
    if not isinstance(runtimes, dict) or set(runtimes) != set(ARCHIVES):
        raise ValueError('Runtime lock must contain exactly node, postgresql, and caddy')
    result = {'schema': 1, 'architecture': arch, 'runtimes': {}}
    for name, filename in ARCHIVES.items():
        runtime = runtimes[name]
        if not isinstance(runtime, dict) or not isinstance(runtime.get('version'), str) or not runtime['version'].strip():
            raise ValueError('Missing runtime version for ' + name)
        licenses = runtime.get('license_files')
        if not isinstance(licenses, list) or not licenses or any(
                not isinstance(path, str) or not path or PurePosixPath(path).is_absolute()
                or '..' in PurePosixPath(path).parts or path == '.' for path in licenses):
            raise ValueError('Runtime license_files must contain relative file paths for ' + name)
        archives = runtime.get('archives')
        keys = {'any'} if name == 'postgresql' else ARCHITECTURES
        if not isinstance(archives, dict) or set(archives) != keys:
            raise ValueError('Invalid runtime archive architectures for ' + name)
        for record in archives.values():
            if not isinstance(record, dict) or not isinstance(record.get('url'), str):
                raise ValueError('Missing runtime archive URL for ' + name)
            url = urllib.parse.urlsplit(record['url'])
            if url.scheme != 'https' or not url.hostname or url.username or url.password or url.fragment:
                raise ValueError('Runtime URL must use HTTPS without credentials or fragments for ' + name)
            if not isinstance(record.get('sha256'), str) or not re.fullmatch('[0-9a-f]{64}', record['sha256']):
                raise ValueError('Runtime SHA-256 must be 64 lowercase hexadecimal characters for ' + name)
        selected = archives['any' if name == 'postgresql' else arch]
        result['runtimes'][name] = {
            'version': runtime['version'], 'license_files': licenses,
            'url': selected['url'], 'sha256': selected['sha256'], 'archive': filename,
            'install_prefix': '/usr/libexec/heimdall-server/runtime/' + name}
    return result


def verify(path, expected, name):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    if digest.hexdigest() != expected:
        raise ValueError('SHA-256 mismatch for {}: {}'.format(name, path.name))


def stage(lock_path: Path, arch: str, sources: Path) -> dict:
    manifest = inventory(json.loads(lock_path.read_text()), arch)
    sources.mkdir(parents=True, exist_ok=True)
    manifest_path = sources / 'runtime-manifest.json'
    # A failed rerun must not leave a success marker for stale or corrupt inputs.
    if manifest_path.exists():
        manifest_path.unlink()
    temporary = []
    pending = []
    try:
        # Check every cached input before fetching or publishing anything new.
        for name, record in manifest['runtimes'].items():
            destination = sources / record['archive']
            if destination.exists():
                verify(destination, record['sha256'], name)
        for name, record in manifest['runtimes'].items():
            destination = sources / record['archive']
            if destination.exists():
                continue
            with tempfile.NamedTemporaryFile(dir=str(sources), prefix='.' + destination.name + '.', delete=False) as output:
                path = Path(output.name)
                temporary.append(path)
                with urllib.request.urlopen(record['url'], timeout=120) as response:
                    shutil.copyfileobj(response, output)
            verify(path, record['sha256'], name)
            pending.append((path, destination))
        # No new archive is published until all three inputs have passed verification.
        for path, destination in pending:
            path.replace(destination)
        with tempfile.NamedTemporaryFile(mode='w', dir=str(sources), prefix='.runtime-manifest.', delete=False) as output:
            path = Path(output.name)
            temporary.append(path)
            json.dump(manifest, output, indent=2, sort_keys=True)
            output.write('\n')
        path.replace(manifest_path)
    finally:
        for path in temporary:
            if path.exists():
                path.unlink()
    return manifest


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit('Usage: stage-runtimes.py LOCK ARCH SOURCES')
    try:
        stage(Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]))
    except (OSError, ValueError) as error:
        sys.exit(str(error))
