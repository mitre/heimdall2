#!/usr/bin/env python3
"""Run RPM upgrade shell against disposable paths and service/backup boundaries."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

RPM = Path(__file__).resolve().parents[1]
SPEC = (RPM / 'heimdall-server.spec').read_text()
UNITS = ['heimdall-server.service', 'heimdall-caddy.service', 'heimdall-postgresql.service']


def scriptlet(name, root):
    text = re.split(r'\n%(?:pre|post|preun|postun|files)\n',
                    SPEC.split('\n%' + name + '\n', 1)[1], maxsplit=1)[0]
    for macro, value in {'name': 'heimdall-server', '_sysconfdir': '/etc',
                         '_datadir': '/usr/share', '_bindir': '/usr/bin',
                         '_libexecdir': '/usr/libexec', '_tmpfilesdir': '/usr/lib/tmpfiles.d',
                         '_unitdir': '/usr/lib/systemd/system'}.items():
        text = text.replace('%{' + macro + '}', value)
    text = text.replace('%%', '%')
    for prefix in ('/etc/', '/var/lib/', '/usr/share/', '/usr/sbin/'):
        text = text.replace(prefix, str(root) + prefix)
    return text


with tempfile.TemporaryDirectory(prefix='heimdall-upgrade-') as temp:
    root = Path(temp)
    bin_dir = root / 'bin'
    bin_dir.mkdir()
    stub = bin_dir / 'boundary'
    stub.write_text('#!' + sys.executable + '\n' + '''import json, os, pathlib, sys
name, args = pathlib.Path(sys.argv[0]).name, sys.argv[1:]
root = pathlib.Path(os.environ['FIXTURE_ROOT'])
if name == 'getent':
    sys.exit(0)
if name == 'stat' and args[0] == '-c':
    st = pathlib.Path(args[-1]).stat()
    real = os.environ.get('REAL_METADATA') == '1'
    print(args[1].replace('%u', str(st.st_uid) if real else '0')
          .replace('%g', str(st.st_gid) if real else '0')
          .replace('%a', oct(st.st_mode & 0o7777)[2:]).replace('%h', str(st.st_nlink)))
    sys.exit(0)
with (root / 'calls').open('a') as out:
    out.write(json.dumps([name] + args) + '\\n')
if name in ('chown', 'chmod'):
    if os.environ.get('FAIL_METADATA') == name and pathlib.Path(args[-1]).name.startswith('.selinux-ports.'):
        sys.exit(1)
    if name == 'chmod':
        os.chmod(args[-1], int(args[0], 8))
    elif os.environ.get('REAL_METADATA') == '1':
        os.chown(args[-1], 0, 0)
    sys.exit(0)
if name == 'systemctl':
    if args[0] == 'is-active':
        queries = [json.loads(line) for line in (root / 'calls').read_text().splitlines()]
        count = sum(c[:2] == ['systemctl', 'is-active'] and c[-1] == args[-1] for c in queries)
        if args[-1] == os.environ.get('FAIL_QUERY') and count >= int(os.environ.get('FAIL_QUERY_AFTER', '1')):
            if '--quiet' not in args:
                print(os.environ.get('QUERY_OUTPUT', ''))
            sys.exit(int(os.environ.get('QUERY_STATUS', '1')))
        active = args[-1] in os.environ['ACTIVE_UNITS'].split()
        if '--quiet' not in args:
            print('active' if active else 'inactive')
        sys.exit(0 if active else 3)
    if args[0] == 'stop':
        if os.environ.get('EXPECT_PENDING', '1') == '1' and not (root / 'etc/heimdall-server/upgrade-pending').is_file():
            sys.exit(8)
        sys.exit(1 if args[-1] == os.environ.get('FAIL_STOP') else 0)
elif name == 'heimdall-cli' and args[0] == 'backup':
    sys.exit(int(os.environ.get('FAIL_BACKUP', '0')))
elif name == 'semanage':
    if '-l' in args:
        print(os.environ.get('PORT_MAPPINGS', ''))
    elif '-d' in args:
        sys.exit(1 if args[-1] == os.environ.get('FAIL_PORT_DELETE') else 0)
    elif '-a' in args:
        sys.exit(1 if args[-1] == os.environ.get('FAIL_PORT_ADD') else 0)
''')
    stub.chmod(0o755)
    for name in ('getent', 'groupadd', 'useradd', 'systemctl', 'heimdall-cli', 'chown', 'chmod',
                 'stat', 'semanage', 'semodule', 'systemd-tmpfiles', 'restorecon'):
        (bin_dir / name).symlink_to(stub.name)
    sbin = root / 'usr/sbin'
    sbin.mkdir(parents=True)
    for name in ('selinuxenabled', 'load_policy'):
        (sbin / name).symlink_to(stub)
    config_dir = root / 'etc/heimdall-server'
    config_dir.mkdir(parents=True)
    (config_dir / 'backend.env').write_text('DATABASE_HOST=localhost\nDATABASE_PASSWORD=fixture\n')
    sysconfig = root / 'etc/sysconfig/heimdall-server'
    sysconfig.parent.mkdir()
    pg_root = root / 'var/lib/heimdall-postgresql'
    cluster = pg_root / '18/data'
    cluster.mkdir(parents=True)
    version = cluster / 'PG_VERSION'
    version.write_text('18\n')
    marker = config_dir / 'upgrade-pending'
    env = dict(os.environ, PATH=str(bin_dir) + os.pathsep + os.environ['PATH'],
               FIXTURE_ROOT=str(root), ACTIVE_UNITS=' '.join(UNITS))
    # A noexec temporary filesystem makes PATH lookup silently skip our stubs.
    # Refuse before running any scriptlet instead of reaching host commands.
    subprocess.run([str(bin_dir / 'getent')], env=env, check=True)

    def run(name='pre', count='2', **settings):
        (root / 'calls').write_text('')
        result = subprocess.run(['/bin/sh', '-c', scriptlet(name, root), 'scriptlet', count],
                                env=dict(env, **settings), stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, universal_newlines=True)
        calls = [json.loads(line) for line in (root / 'calls').read_text().splitlines()]
        return result, calls

    def mutating(calls):
        return [c for c in calls if c[0] == 'heimdall-cli' or c[:2] == ['systemctl', 'stop']]

    sysconfig.write_text('SKIP_PREUPGRADE_BACKUP=false\n')
    result, calls = run(FAIL_BACKUP='1')
    assert result.returncode != 0 and not marker.exists(), ('failed backup accepted', result.stdout)
    assert not any(c[:2] == ['systemctl', 'stop'] for c in calls), calls
    for status, output in (('1', ''), ('127', ''), ('3', 'unexpected'),
                           ('4', 'garbage'), ('0', 'inactive'), ('3', 'active')):
        result, calls = run(FAIL_QUERY=UNITS[0], QUERY_STATUS=status, QUERY_OUTPUT=output)
        assert result.returncode != 0 and not marker.exists() and not mutating(calls), (
            'query failure accepted', status, output, result.stdout, calls)
    sysconfig.write_text('RESTART_ON_UPGRADE=true\n')
    result, calls = run(FAIL_BACKUP='1')
    assert result.returncode != 0 and not marker.exists(), ('legacy setting bypassed backup', result.stdout)

    # An override must not bypass cluster compatibility or path safety.
    sysconfig.write_text('SKIP_PREUPGRADE_BACKUP=true\n')
    version.write_text('17\n')
    result, calls = run()
    assert result.returncode != 0 and not mutating(calls), ('wrong major accepted', result.stdout, calls)
    version.write_text('18\n')
    for path in (pg_root, cluster.parent, cluster):
        saved = root / 'saved-state'
        path.rename(saved)
        path.symlink_to(saved, target_is_directory=True)
        result, calls = run()
        assert result.returncode != 0 and not mutating(calls), ('symlink directory accepted', path, result.stdout)
        path.unlink()
        saved.rename(path)
    marker.symlink_to(version)
    result, calls = run()
    assert result.returncode != 0 and not mutating(calls), ('symlink marker accepted', result.stdout)
    marker.unlink()
    extra = pg_root / '17/data'
    extra.mkdir(parents=True)
    (extra / 'PG_VERSION').write_text('18\n')
    result, calls = run()
    assert result.returncode != 0 and not mutating(calls), ('ambiguous cluster accepted', result.stdout)
    (extra / 'PG_VERSION').unlink()
    extra.rmdir()
    extra.parent.rmdir()
    version.unlink()
    outside = root / 'outside-version'
    outside.write_text('18\n')
    version.symlink_to(outside)
    result, calls = run()
    assert result.returncode != 0 and not mutating(calls), ('symlink accepted', result.stdout)
    version.unlink()
    version.write_text('18\n')
    (cluster / 'postgresql.conf').write_text('fixture')
    version.unlink()
    result, calls = run()
    assert result.returncode != 0 and not mutating(calls), ('unmarked data accepted', result.stdout)
    version.write_text('18\n')

    for value in ('TRUE', '1', '"true"', 'true; touch ' + str(root / 'injected'),
                  'true\nSKIP_PREUPGRADE_BACKUP=false'):
        sysconfig.write_text('SKIP_PREUPGRADE_BACKUP=' + value + '\n')
        result, calls = run(FAIL_BACKUP='1')
        assert result.returncode != 0 and not mutating(calls), ('invalid boolean accepted', value, result.stdout)
        assert not (root / 'injected').exists()

    # Unrelated sysconfig content must never be evaluated as shell.
    sysconfig.write_text('SKIP_PREUPGRADE_BACKUP=false\nUNRELATED=$(touch ' + str(root / 'injected') + ')\n')
    result, calls = run()
    assert result.returncode == 0 and marker.is_file(), (result.stdout, calls)
    assert not (root / 'injected').exists()
    operations = mutating(calls)
    assert operations[0][:2] == ['heimdall-cli', 'backup'], operations
    assert operations[1:] == [['systemctl', 'stop', unit] for unit in UNITS], operations
    assert marker.stat().st_mode & 0o777 == 0o600
    assert ['chown', 'root:root', str(marker)] in calls, calls
    marker.unlink()
    result, calls = run(FAIL_QUERY=UNITS[0], FAIL_QUERY_AFTER='2')
    assert result.returncode != 0 and marker.exists(), ('late query failure accepted', result.stdout)
    assert not any(c[:2] == ['systemctl', 'stop'] for c in calls), calls
    marker.unlink()

    sysconfig.write_text('SKIP_PREUPGRADE_BACKUP=true\n')
    result, calls = run(FAIL_BACKUP='1')
    assert result.returncode == 0 and marker.exists(), (result.stdout, calls)
    marker.unlink()
    result, calls = run(FAIL_STOP='heimdall-caddy.service')
    assert result.returncode != 0 and marker.exists(), (result.stdout, calls)
    assert ['systemctl', 'stop', UNITS[2]] not in calls, calls
    marker.unlink()

    result, calls = run(ACTIVE_UNITS='')
    assert result.returncode == 0 and marker.exists() and not mutating(calls), (result.stdout, calls)
    marker.unlink()
    result, calls = run(FAIL_QUERY=UNITS[1], QUERY_STATUS='4', QUERY_OUTPUT='unknown')
    assert result.returncode == 0 and marker.exists(), ('old private unit rejected', result.stdout)
    assert ['systemctl', 'stop', UNITS[1]] not in calls, calls
    marker.unlink()
    result, calls = run(count='1')
    assert result.returncode == 0 and not marker.exists() and not mutating(calls), (result.stdout, calls)

    result, calls = run(name='postun', count='1')
    assert result.returncode == 0, result.stdout
    assert not any(c[0] == 'systemctl' and c[1] in ('restart', 'try-restart', 'start') for c in calls), calls

    # A previous package may still request restart. The new launcher must refuse
    # before reading configuration or executing Node while migrations are pending.
    marker.write_text('')
    launcher = (RPM / 'heimdall-server.sh').read_text().replace('/etc/', str(root) + '/etc/')
    (config_dir / 'backend.env').write_text('touch ' + str(root / 'injected') + '\n')
    result = subprocess.run(['/bin/bash', '-c', launcher], env=env, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, universal_newlines=True)
    assert result.returncode != 0 and 'setup --non-interactive' in result.stdout, result.stdout
    assert not (root / 'injected').exists(), 'launcher sourced config before checking upgrade marker'

    ledger = config_dir / 'selinux-ports'
    ledger.write_text('heimdall_server_port_t tcp 3000\npostgresql_port_t tcp 55432\n'
                      'http_port_t tcp 8443\nhttp_port_t tcp 8444\n'
                      'ssh_port_t tcp 22\nhttp_port_t tcp 80;touch\n')
    ledger.chmod(0o600)
    result, calls = run(name='postun', count='0', FAIL_PORT_DELETE='55432', PORT_MAPPINGS='''
heimdall_server_port_t tcp 3000, 4000
postgresql_port_t tcp 55432
http_port_t tcp 80, 443, 8440-8450
ssh_port_t tcp 22, 8443
''')
    assert result.returncode == 0, result.stdout
    deleted = [c for c in calls if c[:3] == ['semanage', 'port', '-d']]
    assert deleted == [['semanage', 'port', '-d', '-p', 'tcp', '3000'],
                       ['semanage', 'port', '-d', '-p', 'tcp', '55432']], deleted
    assert ledger.read_text() == 'postgresql_port_t tcp 55432\n', ledger.read_text()

    # Native root fixtures exercise actual setgid inheritance and chown metadata.
    # Unprivileged hosts still exercise both metadata-error retention branches.
    if os.geteuid() == 0:
        before = config_dir.stat()
        os.chown(config_dir, 0, 1234)
        config_dir.chmod(0o2751)
        assert config_dir.stat().st_gid == 1234 and config_dir.stat().st_mode & 0o7777 == 0o2751
        result, calls = run(name='postun', count='0', REAL_METADATA='1',
                            FAIL_PORT_DELETE='55432', PORT_MAPPINGS='postgresql_port_t tcp 55432\n')
        assert result.returncode == 0, result.stdout
        st = ledger.stat()
        assert (st.st_uid, st.st_gid, st.st_mode & 0o7777) == (0, 0, 0o600), (
            'replacement ledger inherited group', st.st_uid, st.st_gid, oct(st.st_mode & 0o7777))
        os.chown(config_dir, before.st_uid, before.st_gid)
        config_dir.chmod(before.st_mode & 0o7777)
        print('Replacement ledger real metadata: PASS (setgid parent 0:1234:2751 -> ledger 0:0:600)')
    else:
        print('Replacement ledger real setgid metadata: SKIP (requires root; run native OL8 fixture)')

    for failure in ('chown', 'chmod'):
        original = 'heimdall_server_port_t tcp 3000\npostgresql_port_t tcp 55432\n'
        ledger.write_text(original)
        before = ledger.stat()
        result, calls = run(name='postun', count='0', FAIL_METADATA=failure,
                            FAIL_PORT_DELETE='55432', PORT_MAPPINGS='heimdall_server_port_t tcp 3000\npostgresql_port_t tcp 55432\n')
        assert result.returncode != 0, ('metadata failure accepted', failure, result.stdout)
        st = ledger.stat()
        assert ledger.read_text() == original and (st.st_ino, st.st_uid, st.st_gid, st.st_mode) == (
            before.st_ino, before.st_uid, before.st_gid, before.st_mode), (failure, ledger.read_text())
        assert not list(config_dir.glob('.selinux-ports.*')), failure

    # Existing compatible labels are never claimed; conflicts are never stolen.
    ledger.unlink()
    result, calls = run(name='post', count='1', FAIL_PORT_ADD='3000',
                        PORT_MAPPINGS='ntop_port_t tcp 3000\npostgresql_port_t tcp 5432\n')
    assert result.returncode == 0, result.stdout
    assert ledger.read_text() == 'postgresql_port_t tcp 55432\n', ledger.read_text()
    assert 'conflict' in result.stdout and not any('-m' in c for c in calls), (result.stdout, calls)
    assert not any(c[0] == 'systemctl' and c[1] in ('start', 'enable', 'restart', 'try-restart') for c in calls), calls
    ledger.unlink()
    result, calls = run(name='post', count='2',
                        PORT_MAPPINGS='heimdall_server_port_t tcp 3000\npostgresql_port_t tcp 55432\n')
    assert result.returncode == 0 and ledger.read_text() == '', (result.stdout, calls)
    assert not any(c[:3] == ['semanage', 'port', '-a'] for c in calls), calls
    ledger.unlink()
    ledger.symlink_to(outside)
    result, calls = run(name='post', count='2')
    assert result.returncode == 0 and outside.read_text() == '18\n', result.stdout
    assert not any(c[:3] == ['semanage', 'port', '-a'] for c in calls), calls

    # Removal disables only owned units and preserves operator drop-in replacements.
    marker.unlink()
    dropin = root / 'etc/systemd/system/heimdall-server.service.d/database.conf'
    dropin.parent.mkdir(parents=True)
    generated = '[Unit]\nRequires=heimdall-postgresql.service\nAfter=heimdall-postgresql.service\n'
    for content in (generated, '[Unit]\nRequires=operator.service\n'):
        dropin.write_text(content)
        result, calls = run(name='preun', count='0', EXPECT_PENDING='0')
        assert result.returncode == 0, result.stdout
        assert dropin.exists() == (content != generated), content
        service_calls = [c for c in calls if c[0] == 'systemctl' and c[1] in ('stop', 'disable')]
        assert service_calls == [[ 'systemctl', operation, unit] for unit in UNITS
                                 for operation in ('stop', 'disable')], service_calls
        assert ['heimdall-cli', 'fapolicyd', 'remove'] in calls, calls
        assert version.read_text() == '18\n' and (config_dir / 'backend.env').exists()
    dropin.unlink()
    dropin.symlink_to(outside)
    result, calls = run(name='preun', count='0', EXPECT_PENDING='0')
    assert result.returncode == 0 and dropin.is_symlink(), result.stdout

print('RPM upgrade guards: PASS (major/path/boolean, backup/stop failures, marker, explicit restart, owned port/unit cleanup)')
