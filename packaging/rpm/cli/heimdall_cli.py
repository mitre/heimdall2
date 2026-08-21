#!/usr/bin/env python3
"""Heimdall CLI — admin tool for Heimdall Server RPM installations."""

import os
import sys
import subprocess
import shutil
import json
from datetime import datetime

# Vendor plac from the same directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'vendor'))
import plac_core as plac  # noqa: E402

# ── ANSI Colors ──────────────────────────────────────────────────────────

def _use_color():
    return sys.stdout.isatty() and os.environ.get('NO_COLOR') is None

def _c(code, text):
    if _use_color():
        return '\033[{}m{}\033[0m'.format(code, text)
    return str(text)

def green(t):  return _c('32', t)
def red(t):    return _c('31', t)
def yellow(t): return _c('33', t)
def cyan(t):   return _c('36', t)
def bold(t):   return _c('1', t)
def dim(t):    return _c('2', t)

# ── Paths ────────────────────────────────────────────────────────────────

ENV_FILE = '/etc/heimdall-server/backend.env'
SERVICE_NAME = 'heimdall-server'
APP_DIR = '/usr/share/heimdall-server'
DATA_DIR = '/var/lib/heimdall-server'
LIBEXEC_DIR = '/usr/libexec/heimdall-server'

# ── Helpers ──────────────────────────────────────────────────────────────

# Try to load config schema for validation and display
try:
    sys.path.insert(0, os.path.dirname(__file__))
    from config_schema import CONFIG_SCHEMA, CATEGORIES, PROVIDERS, \
        keys_for_category, secret_keys as _schema_secret_keys
    HAS_SCHEMA = True
    SECRETS = set(_schema_secret_keys())
except ImportError:
    HAS_SCHEMA = False
    SECRETS = {'DATABASE_PASSWORD', 'JWT_SECRET', 'API_KEY_SECRET',
               'OKTA_CLIENTSECRET', 'GITHUB_CLIENTSECRET', 'GITLAB_SECRET',
               'GOOGLE_CLIENTSECRET', 'OIDC_CLIENT_SECRET', 'LDAP_PASSWORD'}


def _run(cmd, capture=True, check=False):
    """Run a shell command, return (returncode, stdout)."""
    try:
        kwargs = dict(shell=isinstance(cmd, str), timeout=30,
                      stdout=subprocess.PIPE if capture else None,
                      stderr=subprocess.PIPE if capture else None)
        r = subprocess.run(cmd, universal_newlines=True, **kwargs)
        return r.returncode, (r.stdout or '').strip()
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return 1, ''


def _require_root():
    if os.geteuid() != 0:
        print('This command requires root. Use sudo.', file=sys.stderr)
        sys.exit(1)


def _read_env():
    """Parse backend.env into a dict. Handles KEY=VALUE and KEY="VALUE"."""
    env = {}
    if not os.path.isfile(ENV_FILE):
        return env
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' not in line:
                continue
            key, _, val = line.partition('=')
            val = val.strip().strip('"').strip("'")
            env[key.strip()] = val
    return env


def _write_env_key(key, value):
    """Update or add a key in backend.env, preserving comments and order."""
    lines = []
    found = False
    if os.path.isfile(ENV_FILE):
        with open(ENV_FILE) as f:
            lines = f.readlines()

    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith('#') and '=' in stripped:
            k = stripped.split('=', 1)[0].strip()
            if k == key:
                new_lines.append('{}={}\n'.format(key, value))
                found = True
                continue
        new_lines.append(line)

    if not found:
        new_lines.append('{}={}\n'.format(key, value))

    with open(ENV_FILE, 'w') as f:
        f.writelines(new_lines)


def _service_cmd(action):
    """Run systemctl action on heimdall-server."""
    rc, out = _run(['systemctl', action, SERVICE_NAME])
    return rc == 0


def _mask(val):
    """Mask a secret value for display."""
    if not val:
        return '(empty)'
    if len(val) <= 6:
        return '***'
    return val[:3] + '***' + val[-3:]


# ── CLI Commands ─────────────────────────────────────────────────────────

class HeimdallCLI:
    """Heimdall CLI — admin tool for Heimdall Server."""

    commands = ['status', 'reset_password', 'set_port', 'add_cert',
                'backup', 'restore', 'config', 'logs', 'diag',
                'restart', 'stop', 'start']

    def status(self):
        """Show service status, port, database connectivity, and version."""
        env = _read_env()
        port = env.get('HEIMDALL_BACKEND_PORT', env.get('PORT', '3000'))

        # Version
        pkg_json = os.path.join(APP_DIR, 'apps/backend/package.json')
        version = '(unknown)'
        if os.path.isfile(pkg_json):
            try:
                with open(pkg_json) as f:
                    version = json.load(f).get('version', version)
            except Exception:
                pass
        print(bold('Heimdall Server') + ' v{}'.format(version))

        def _ok(label):
            return green('✓') + ' ' + label
        def _warn(label):
            return yellow('⚠') + ' ' + label
        def _fail(label):
            return red('✗') + ' ' + label
        def _skip(label):
            return dim('○ ' + label)

        # ── Service ──
        print()
        print(bold('Service'))
        rc, out = _run(['systemctl', 'is-active', SERVICE_NAME])
        state = out or 'unknown'
        if state == 'active':
            # Get PID and uptime
            rc2, pid_out = _run(
                ['systemctl', 'show', '-p', 'MainPID', '--value', SERVICE_NAME])
            rc3, since_out = _run(
                ['systemctl', 'show', '-p', 'ActiveEnterTimestamp',
                 '--value', SERVICE_NAME])
            extra = ''
            if rc2 == 0 and pid_out:
                extra += '  pid={}'.format(pid_out)
            if rc3 == 0 and since_out:
                extra += '  since {}'.format(since_out)
            print('  ' + _ok('running{}'.format(extra)))
        elif state == 'inactive':
            print('  ' + _warn('stopped'))
        else:
            print('  ' + _fail(state))
        print('  {} listening on port {}'.format(cyan('Port:'), port))

        # ── Database ──
        print()
        print(bold('Database'))
        db_host = env.get('DATABASE_HOST', 'localhost')
        db_port = env.get('DATABASE_PORT', '5432')
        db_name = env.get('DATABASE_NAME', 'heimdall-server-production')
        db_user = env.get('DATABASE_USERNAME', 'postgres')
        print('  {} {}@{}:{}/{}'.format(
            cyan('Target:'), db_user, db_host, db_port, db_name))

        # PostgreSQL service
        pg_running = False
        if db_host in ('localhost', '127.0.0.1', ''):
            # Check for local PostgreSQL
            for ver in range(18, 12, -1):
                rc, _ = _run(['systemctl', 'is-active',
                              'postgresql-{}'.format(ver)])
                if rc == 0:
                    print('  ' + _ok('postgresql-{} running'.format(ver)))
                    pg_running = True
                    break
            if not pg_running:
                rc, _ = _run(['systemctl', 'is-active', 'postgresql'])
                if rc == 0:
                    print('  ' + _ok('postgresql running'))
                    pg_running = True
                else:
                    print('  ' + _fail('no local PostgreSQL service running'))
        else:
            print('  ' + _skip('remote database ({}:{})'.format(
                db_host, db_port)))
            pg_running = True  # assume remote is up

        # DB connectivity test
        db_pass = env.get('DATABASE_PASSWORD', '')
        if db_pass and shutil.which('psql'):
            test_env = os.environ.copy()
            test_env['PGPASSWORD'] = db_pass
            try:
                r = subprocess.run(
                    ['psql', '-h', db_host, '-p', db_port, '-U', db_user,
                     '-d', db_name, '-t', '-A',
                     '-c', "SELECT count(*) FROM information_schema.tables "
                           "WHERE table_schema = 'public'"],
                    env=test_env, stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE, universal_newlines=True,
                    timeout=10)
                rc = r.returncode
                row_out = r.stdout.strip()
            except Exception:
                rc = 1
                row_out = ''
            if rc == 0:
                print('  ' + _ok('connected ({} tables)'.format(
                    row_out or '?')))
            else:
                print('  ' + _fail('connection failed'))
        elif not db_pass:
            print('  ' + _warn('DATABASE_PASSWORD not set'))
        elif not shutil.which('psql'):
            print('  ' + _skip('psql not found — cannot test connection'))

        # ── SELinux ──
        print()
        print(bold('SELinux'))
        rc, out = _run(['getenforce'])
        if rc == 0:
            mode = out.strip()
            if mode == 'Enforcing':
                print('  ' + _ok('Enforcing'))
            elif mode == 'Permissive':
                print('  ' + _warn('Permissive'))
            else:
                print('  ' + _skip('Disabled'))

            # Check if policy module is loaded
            rc, out = _run('semodule -l 2>/dev/null | grep heimdall_server')
            if rc == 0 and out:
                print('  ' + _ok('heimdall_server policy module loaded'))
            else:
                print('  ' + _fail('heimdall_server policy module NOT loaded'))

            # Check port registration
            rc, out = _run(
                'semanage port -l 2>/dev/null | grep heimdall_server_port_t')
            if rc == 0 and out:
                print('  ' + _ok('port type: {}'.format(out.strip())))
            else:
                print('  ' + _fail(
                    'port {} not registered with SELinux'.format(port)))

            # Check for recent denials
            rc, out = _run(
                'ausearch -m avc -ts recent 2>/dev/null | '
                'grep -c heimdall 2>/dev/null')
            denial_count = int(out) if rc == 0 and out.isdigit() else 0
            if denial_count > 0:
                print('  ' + _warn('{} recent AVC denial(s) — '
                                   'run "ausearch -m avc -ts recent | '
                                   'grep heimdall"'.format(denial_count)))
            else:
                print('  ' + _ok('no recent denials'))
        else:
            print('  ' + _skip('not available'))

        # ── fapolicyd ──
        print()
        print(bold('fapolicyd'))
        rc, _ = _run(['systemctl', 'is-active', 'fapolicyd'])
        if rc == 0:
            print('  ' + _ok('running'))
            # Check trust entries
            trust_file = '/etc/fapolicyd/trust.d/heimdall-server'
            if os.path.isfile(trust_file):
                with open(trust_file) as f:
                    count = sum(1 for line in f if line.strip()
                                and not line.startswith('#'))
                print('  ' + _ok('{} trusted file(s) in {}'.format(
                    count, trust_file)))
            else:
                print('  ' + _warn(
                    'no trust file — run "heimdall-cli fix_fapolicyd" or '
                    '"{}/fapolicyd-trust.sh add"'.format(LIBEXEC_DIR)))
        else:
            fap_installed = shutil.which('fapolicyd-cli')
            if fap_installed:
                print('  ' + _skip('installed but not running'))
            else:
                print('  ' + _skip('not installed'))

        # ── firewalld ──
        print()
        print(bold('firewalld'))
        rc, _ = _run(['systemctl', 'is-active', 'firewalld'])
        if rc == 0:
            print('  ' + _ok('running'))

            # Check service definition exists
            svc_file = '/usr/lib/firewalld/services/{}.xml'.format(
                SERVICE_NAME)
            if os.path.isfile(svc_file):
                print('  ' + _ok('service definition installed'))
            else:
                print('  ' + _fail('service definition missing'))

            # Check if service is enabled in active zone
            rc2, _ = _run(
                ['firewall-cmd', '--query-service={}'.format(SERVICE_NAME)])
            if rc2 == 0:
                print('  ' + _ok('heimdall-server service enabled'))
            else:
                print('  ' + _warn(
                    'heimdall-server service not enabled — run '
                    '"firewall-cmd --permanent --add-service=heimdall-server '
                    '&& firewall-cmd --reload"'))

            # Check custom port if not 3000
            if port != '3000':
                rc3, _ = _run(
                    ['firewall-cmd', '--query-port={}/tcp'.format(port)])
                if rc3 == 0:
                    print('  ' + _ok('port {}/tcp open'.format(port)))
                else:
                    print('  ' + _warn('port {}/tcp not open'.format(port)))

            # Show active zone
            rc4, zone_out = _run(['firewall-cmd', '--get-active-zones'])
            if rc4 == 0 and zone_out:
                zone_name = zone_out.splitlines()[0].strip()
                print('  {} {}'.format(cyan('Zone:'), zone_name))
        else:
            fw_installed = shutil.which('firewall-cmd')
            if fw_installed:
                print('  ' + _skip('installed but not running'))
            else:
                print('  ' + _skip('not installed'))

        # ── Config ──
        print()
        print(bold('Config'))
        print('  {} {}'.format(cyan('File:'), ENV_FILE))
        if os.path.isfile(ENV_FILE):
            import stat
            st = os.stat(ENV_FILE)
            perms = oct(stat.S_IMODE(st.st_mode))
            print('  {} {}'.format(cyan('Perms:'), perms))
        # Show enabled auth providers
        providers = []
        if env.get('OKTA_CLIENTID'):
            providers.append('Okta')
        if env.get('GITHUB_CLIENTID'):
            providers.append('GitHub')
        if env.get('GITLAB_CLIENTID'):
            providers.append('GitLab')
        if env.get('GOOGLE_CLIENTID'):
            providers.append('Google')
        if env.get('OIDC_CLIENTID'):
            providers.append('OIDC ({})'.format(
                env.get('OIDC_NAME', 'unnamed')))
        if env.get('LDAP_ENABLED', '').lower() == 'true':
            providers.append('LDAP')
        providers.insert(0, 'Local')
        if env.get('LOCAL_LOGIN_DISABLED', '').lower() == 'true':
            providers[0] = dim('Local (disabled)')
        print('  {} {}'.format(cyan('Auth:'), ', '.join(providers)))

    @plac.pos('email', 'User email address (default: admin@heimdall.local)')
    def reset_password(self, email='admin@heimdall.local'):
        """Reset a user's password to a new random value."""
        _require_root()
        env = _read_env()
        db_host = env.get('DATABASE_HOST', 'localhost')
        db_port = env.get('DATABASE_PORT', '5432')
        db_name = env.get('DATABASE_NAME', 'heimdall-server-production')
        db_user = env.get('DATABASE_USERNAME', 'postgres')
        db_pass = env.get('DATABASE_PASSWORD', '')

        if not db_pass:
            print('Error: DATABASE_PASSWORD not set in {}'.format(ENV_FILE),
                  file=sys.stderr)
            return 1

        # Clear the encrypted password — db-setup will reseed with a new one
        sql = ("UPDATE \"Users\" SET \"encryptedPassword\" = '' "
               "WHERE email = '{}';".format(email.replace("'", "''")))

        run_env = os.environ.copy()
        run_env['PGPASSWORD'] = db_pass
        rc, _ = _run(
            ['psql', '-h', db_host, '-p', db_port, '-U', db_user,
             '-d', db_name, '-c', sql])
        if rc != 0:
            print('Error: failed to update database.', file=sys.stderr)
            return 1

        print('Password cleared for {}. Running db-setup to reseed...'.format(
            email))
        rc, out = _run(['/usr/bin/heimdall-server-db-setup'], capture=False)
        if rc == 0:
            print('Password reset complete. Check output above for new password.')
        else:
            print('db-setup failed. Check logs.', file=sys.stderr)
            return 1

    @plac.pos('port', 'New listen port')
    def set_port(self, port):
        """Change the listen port (updates config, SELinux, firewalld)."""
        _require_root()

        try:
            p = int(port)
            if not (1 <= p <= 65535):
                raise ValueError()
        except ValueError:
            print('Error: port must be 1-65535', file=sys.stderr)
            return 1

        env = _read_env()
        old_port = env.get('HEIMDALL_BACKEND_PORT', env.get('PORT', '3000'))

        _write_env_key('HEIMDALL_BACKEND_PORT', str(p))
        print('Config:    HEIMDALL_BACKEND_PORT={} (was {})'.format(p, old_port))

        # SELinux
        if shutil.which('semanage'):
            _run(['semanage', 'port', '-a', '-t', 'heimdall_server_port_t',
                  '-p', 'tcp', str(p)])
            # Also try -m in case it's already defined as another type
            _run(['semanage', 'port', '-m', '-t', 'heimdall_server_port_t',
                  '-p', 'tcp', str(p)])
            print('SELinux:   port {} registered'.format(p))

        # firewalld
        if shutil.which('firewall-cmd'):
            rc, _ = _run(['systemctl', 'is-active', 'firewalld'])
            if rc == 0:
                if str(p) != '3000':
                    _run(['firewall-cmd', '--permanent',
                          '--add-port={}/tcp'.format(p)])
                _run(['firewall-cmd', '--reload'])
                print('firewalld: port {} opened'.format(p))

        # Restart service
        print()
        print('Restarting service...')
        _service_cmd('restart')
        print('Done. Heimdall now listening on port {}.'.format(p))

    @plac.pos('cert_path', 'Path to CA certificate (.pem or .crt)')
    def add_cert(self, cert_path):
        """Add an organizational CA certificate to the system trust store."""
        _require_root()

        if not os.path.isfile(cert_path):
            print('Error: file not found: {}'.format(cert_path),
                  file=sys.stderr)
            return 1

        basename = os.path.basename(cert_path)
        dest = '/etc/pki/ca-trust/source/anchors/{}'.format(basename)
        shutil.copy2(cert_path, dest)
        print('Copied {} to {}'.format(basename, dest))

        rc, _ = _run(['update-ca-trust'], capture=False)
        if rc == 0:
            print('System trust store updated.')
        else:
            print('Warning: update-ca-trust failed.', file=sys.stderr)

        # Ensure NODE_EXTRA_CA_CERTS is set
        env = _read_env()
        ca_bundle = '/etc/pki/tls/certs/ca-bundle.crt'
        if env.get('NODE_EXTRA_CA_CERTS') != ca_bundle:
            _write_env_key('NODE_EXTRA_CA_CERTS', ca_bundle)
            print('Set NODE_EXTRA_CA_CERTS={} in backend.env'.format(ca_bundle))

        print()
        print('Restart the service to pick up the new certificate:')
        print('  sudo systemctl restart {}'.format(SERVICE_NAME))

    @plac.pos('output', 'Output directory (default: current directory)')
    def backup(self, output='.'):
        """Backup database and configuration to a timestamped archive."""
        _require_root()
        env = _read_env()
        db_host = env.get('DATABASE_HOST', 'localhost')
        db_port = env.get('DATABASE_PORT', '5432')
        db_name = env.get('DATABASE_NAME', 'heimdall-server-production')
        db_user = env.get('DATABASE_USERNAME', 'postgres')
        db_pass = env.get('DATABASE_PASSWORD', '')

        ts = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_dir = os.path.join(output,
                                  'heimdall-backup-{}'.format(ts))
        os.makedirs(backup_dir, exist_ok=True)

        # Config backup
        if os.path.isfile(ENV_FILE):
            shutil.copy2(ENV_FILE, os.path.join(backup_dir, 'backend.env'))
            print('Config:   backed up')

        # Database backup
        if db_pass:
            dump_file = os.path.join(backup_dir, 'database.sql')
            run_env = os.environ.copy()
            run_env['PGPASSWORD'] = db_pass
            rc = subprocess.run(
                ['pg_dump', '-h', db_host, '-p', db_port, '-U', db_user,
                 db_name, '-f', dump_file],
                env=run_env, timeout=300).returncode
            if rc == 0:
                print('Database: backed up ({})'.format(dump_file))
            else:
                print('Database: backup FAILED', file=sys.stderr)
        else:
            print('Database: skipped (no password configured)')

        # Create tarball
        archive = '{}.tar.gz'.format(backup_dir)
        rc, _ = _run(['tar', 'czf', archive, '-C', output,
                       os.path.basename(backup_dir)])
        if rc == 0:
            shutil.rmtree(backup_dir)
            print()
            print('Backup saved to: {}'.format(archive))
        else:
            print('Archive creation failed. Files in: {}'.format(backup_dir))

    @plac.pos('archive', 'Path to backup archive (.tar.gz)')
    def restore(self, archive):
        """Restore database and configuration from a backup archive."""
        _require_root()

        if not os.path.isfile(archive):
            print('Error: file not found: {}'.format(archive),
                  file=sys.stderr)
            return 1

        import tempfile
        tmpdir = tempfile.mkdtemp(prefix='heimdall-restore-')

        rc, _ = _run(['tar', 'xzf', archive, '-C', tmpdir])
        if rc != 0:
            print('Error: failed to extract archive.', file=sys.stderr)
            return 1

        # Find the extracted directory
        entries = os.listdir(tmpdir)
        if len(entries) == 1:
            restore_dir = os.path.join(tmpdir, entries[0])
        else:
            restore_dir = tmpdir

        # Restore config
        env_backup = os.path.join(restore_dir, 'backend.env')
        if os.path.isfile(env_backup):
            shutil.copy2(env_backup, ENV_FILE)
            os.chmod(ENV_FILE, 0o640)
            _run(['chown', 'root:heimdall', ENV_FILE])
            print('Config:   restored')

        # Restore database
        sql_backup = os.path.join(restore_dir, 'database.sql')
        if os.path.isfile(sql_backup):
            env = _read_env()
            db_host = env.get('DATABASE_HOST', 'localhost')
            db_port = env.get('DATABASE_PORT', '5432')
            db_name = env.get('DATABASE_NAME', 'heimdall-server-production')
            db_user = env.get('DATABASE_USERNAME', 'postgres')
            db_pass = env.get('DATABASE_PASSWORD', '')

            if db_pass:
                run_env = os.environ.copy()
                run_env['PGPASSWORD'] = db_pass
                rc = subprocess.run(
                    ['psql', '-h', db_host, '-p', db_port, '-U', db_user,
                     '-d', db_name, '-f', sql_backup],
                    env=run_env, stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE, timeout=300).returncode
                if rc == 0:
                    print('Database: restored')
                else:
                    print('Database: restore FAILED', file=sys.stderr)
            else:
                print('Database: skipped (no password in restored config)')

        shutil.rmtree(tmpdir, ignore_errors=True)
        print()
        print('Restart the service: sudo systemctl restart {}'.format(
            SERVICE_NAME))

    @plac.pos('action', 'get, set, or list', choices=['get', 'set', 'list'])
    @plac.pos('key', 'Configuration key (e.g., PORT, DATABASE_HOST)')
    @plac.pos('value', 'Value to set (only for "set" action)')
    def config(self, action, key='', value=''):
        """View or modify backend.env configuration."""
        if action == 'list':
            # Show all known keys grouped by category
            if HAS_SCHEMA:
                sorted_cats = sorted(CATEGORIES.items(),
                                     key=lambda x: x[1]['order'])
                for cat_id, cat_meta in sorted_cats:
                    cat_keys = keys_for_category(cat_id)
                    if not cat_keys:
                        continue
                    print(bold(cat_meta['label']))
                    for k in cat_keys:
                        info = CONFIG_SCHEMA[k]
                        desc = info.get('description', '')
                        default = info.get('default', '')
                        typ = info.get('type', 'str')
                        line = '  {} {}'.format(cyan(k), dim(desc))
                        if default:
                            line += '  [{}]'.format(default)
                        print(line)
                    print()
            else:
                print('Config schema not available. Showing raw env file.')
                env = _read_env()
                for k, v in sorted(env.items()):
                    if k in SECRETS:
                        print('{}={}'.format(k, _mask(v)))
                    else:
                        print('{}={}'.format(k, v))
        elif action == 'get':
            env = _read_env()
            if key:
                val = env.get(key)
                if val is None:
                    print('Key not found: {}'.format(key))
                    if HAS_SCHEMA and key in CONFIG_SCHEMA:
                        info = CONFIG_SCHEMA[key]
                        print(dim('  Description: {}'.format(
                            info.get('description', ''))))
                        print(dim('  Default: {}'.format(
                            info.get('default', '(none)'))))
                    return 1
                if key in SECRETS:
                    print('{}={}'.format(key, _mask(val)))
                else:
                    print('{}={}'.format(key, val))
                if HAS_SCHEMA and key in CONFIG_SCHEMA:
                    print(dim('  {}'.format(
                        CONFIG_SCHEMA[key].get('description', ''))))
            else:
                # Show all set values
                for k, v in sorted(env.items()):
                    if k in SECRETS:
                        print('{}={}'.format(k, _mask(v)))
                    else:
                        print('{}={}'.format(k, v))
        elif action == 'set':
            _require_root()
            if not key or not value:
                print('Usage: heimdall-cli config set KEY VALUE',
                      file=sys.stderr)
                return 1
            # Validate against schema if available
            if HAS_SCHEMA and key in CONFIG_SCHEMA:
                info = CONFIG_SCHEMA[key]
                if info['type'] == 'int':
                    try:
                        int(value)
                    except ValueError:
                        print('Error: {} must be an integer'.format(key),
                              file=sys.stderr)
                        return 1
                    vr = info.get('validation', '')
                    if vr and '-' in vr:
                        lo, hi = vr.split('-', 1)
                        if not (int(lo) <= int(value) <= int(hi)):
                            print('Error: {} must be {}'.format(key, vr),
                                  file=sys.stderr)
                            return 1
                elif info['type'] == 'bool':
                    if value.lower() not in ('true', 'false'):
                        print('Error: {} must be true or false'.format(key),
                              file=sys.stderr)
                        return 1
                choices = info.get('choices')
                if choices and value not in choices:
                    print('Error: {} must be one of: {}'.format(
                        key, ', '.join(choices)), file=sys.stderr)
                    return 1
            _write_env_key(key, value)
            print('Set {}={}'.format(key, _mask(value) if key in SECRETS
                                     else value))
            print('Restart to apply: sudo systemctl restart {}'.format(
                SERVICE_NAME))

    @plac.opt('lines', 'Number of lines to show', type=int)
    @plac.flg('follow', 'Follow log output')
    def logs(self, lines=50, follow=False):
        """View Heimdall server logs."""
        cmd = ['journalctl', '-u', SERVICE_NAME, '--no-pager',
               '-n', str(lines)]
        if follow:
            cmd.append('-f')
        os.execvp('journalctl', cmd)

    def diag(self):
        """Full diagnostic dump for troubleshooting / support tickets."""
        print('=== Heimdall Server Diagnostic Report ===')
        print('Generated: {}'.format(datetime.now().isoformat()))
        print()

        # OS
        print('--- OS ---')
        rc, out = _run(['cat', '/etc/os-release'])
        if rc == 0:
            for line in out.splitlines():
                if line.startswith(('NAME=', 'VERSION=', 'ID=')):
                    print('  {}'.format(line))
        rc, out = _run(['uname', '-rm'])
        print('  Kernel: {}'.format(out))
        print()

        # Heimdall version + status
        self.status()
        print()

        # SELinux denials
        print('--- SELinux Denials (last 10) ---')
        rc, out = _run(['ausearch', '-m', 'avc', '-ts', 'recent',
                        '--just-one'])
        if rc == 0 and out:
            # Get last 10 denials mentioning heimdall
            rc, out = _run(
                'ausearch -m avc -ts today 2>/dev/null | '
                'grep -i heimdall | tail -10')
            if out:
                print(out)
            else:
                print('  (no heimdall-related denials)')
        else:
            print('  (no recent denials or audit not available)')
        print()

        # systemd security score
        print('--- systemd Security Score ---')
        rc, out = _run(['systemd-analyze', 'security', SERVICE_NAME])
        if rc == 0:
            # Just show the overall score line
            for line in out.splitlines():
                if 'Overall' in line or 'OVERALL' in line:
                    print('  {}'.format(line.strip()))
                    break
        print()

        # Disk usage
        print('--- Disk Usage ---')
        for d in [APP_DIR, DATA_DIR, '/etc/heimdall-server']:
            if os.path.isdir(d):
                rc, out = _run(['du', '-sh', d])
                print('  {}'.format(out))
        print()

        # Memory
        print('--- Memory ---')
        rc, out = _run(['free', '-h'])
        if rc == 0:
            for line in out.splitlines()[:2]:
                print('  {}'.format(line))
        print()

        # Listening ports
        print('--- Listening Ports ---')
        rc, out = _run('ss -tlnp 2>/dev/null | grep -E ":(3000|5432) "')
        if out:
            print(out)
        else:
            print('  (nothing on 3000/5432)')

    def restart(self):
        """Restart the Heimdall server service."""
        _require_root()
        _service_cmd('restart')
        print('Service restarted.')

    def stop(self):
        """Stop the Heimdall server service."""
        _require_root()
        _service_cmd('stop')
        print('Service stopped.')

    def start(self):
        """Start the Heimdall server service."""
        _require_root()
        _service_cmd('start')
        print('Service started.')


def main():
    plac.call(HeimdallCLI(), version='1.0.0')


if __name__ == '__main__':
    main()
