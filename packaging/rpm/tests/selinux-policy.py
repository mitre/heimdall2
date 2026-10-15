#!/usr/bin/env python3
"""Check effective permissions in the installed, compiled targeted policy."""
from pathlib import Path
import subprocess
import sys
import unittest

import setools


policy_path = sys.argv[1] if len(sys.argv) > 1 else str(max(
    Path('/etc/selinux/targeted/policy').glob('policy.*'),
    key=lambda path: int(path.suffix[1:])))
policy = setools.SELinuxPolicy(policy_path)


class HeimdallPolicyTest(unittest.TestCase):
    def permissions(self, target, tclass, source='heimdall_server_t'):
        rules = setools.TERuleQuery(policy, ruletype=['allow'],
                                   source=source, target=target,
                                   tclass=[tclass]).results()
        return {permission for rule in rules if rule.enabled()
                for permission in rule.perms}

    def test_systemd_launches_wrapper_in_backend_domain(self):
        context = subprocess.check_output(
            ['matchpathcon', '-n', '/usr/bin/heimdall-server'],
            universal_newlines=True).strip()
        entrypoint = context.split(':')[2]
        transitions = setools.TERuleQuery(
            policy, ruletype=['type_transition'], source='init_t',
            target=entrypoint, tclass=['process']).results()
        self.assertEqual({str(rule.default) for rule in transitions},
                         {'heimdall_server_t'})
        self.assertIn('nnp_transition', self.permissions(
            'heimdall_server_t', 'process2', source='init_t'))

    def test_wrapper_can_execute_shell_helpers_and_node(self):
        for target in ('shell_exec_t', 'bin_t', 'heimdall_server_exec_t'):
            with self.subTest(target=target):
                required = {'getattr', 'open', 'read', 'map', 'execute', 'execute_no_trans'}
                self.assertFalse(required - self.permissions(target, 'file'))
        self.assertIn('fork', self.permissions('heimdall_server_t', 'process'))

    def test_backend_can_load_system_libraries(self):
        for target in ('ld_so_t', 'ld_so_cache_t', 'lib_t'):
            with self.subTest(target=target):
                required = {'getattr', 'open', 'read', 'map'}
                self.assertFalse(required - self.permissions(target, 'file'))

    def test_wrapper_can_read_config_and_create_log_file(self):
        self.assertFalse({'getattr', 'open', 'read'} - self.permissions(
            'heimdall_server_conf_t', 'file'))
        self.assertFalse({'search', 'write', 'add_name', 'create'} - self.permissions(
            'heimdall_server_log_t', 'dir'))
        self.assertFalse({'create', 'open', 'append'} - self.permissions(
            'heimdall_server_log_t', 'file'))

    def test_backend_can_resolve_dns_over_tcp(self):
        self.assertIn('name_connect', self.permissions('dns_port_t', 'tcp_socket'))

    def test_backend_can_load_application_tree(self):
        for tclass, required in (
            ('dir', {'getattr', 'search', 'open', 'read'}),
            ('file', {'getattr', 'open', 'read', 'map', 'execute'}),
            ('lnk_file', {'getattr', 'read'}),
        ):
            with self.subTest(tclass=tclass):
                allowed = self.permissions('heimdall_server_exec_t', tclass)
                self.assertFalse(required - allowed, 'Missing: ' + str(required - allowed))

    def test_application_tree_stays_read_only(self):
        for tclass in ('dir', 'file', 'lnk_file'):
            with self.subTest(tclass=tclass):
                allowed = self.permissions('heimdall_server_exec_t', tclass)
                self.assertFalse(allowed & {'write', 'append', 'create', 'unlink',
                                            'rename', 'add_name', 'remove_name', 'rmdir'})

    def test_backend_can_connect_to_ldap_and_ldaps(self):
        self.assertIn('name_connect', self.permissions('ldap_port_t', 'tcp_socket'))


if __name__ == '__main__':
    unittest.main(argv=[sys.argv[0]], verbosity=2)
