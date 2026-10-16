package cmd

import (
	"fmt"
	"maps"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Model the firewalld command boundary; application configuration and setup remain real.
type firewallExec struct {
	*FakeExecRunner
	rules       map[string]bool
	failure     string
	failures    []string
	defaultZone string
	zones       map[string]string
}

func (e *firewallExec) Run(name string, args ...string) (string, int, error) {
	if name != "firewall-cmd" {
		return e.FakeExecRunner.Run(name, args...)
	}
	e.Calls = append(e.Calls, FakeExecCall{Name: name, Args: args})
	full := strings.Join(args, " ")
	if full == "--get-default-zone" {
		if e.defaultZone != "" {
			return e.defaultZone, 0, nil
		}
		return "public\n", 0, nil
	}
	if full == "--get-zones" || full == "--permanent --get-zones" {
		if value, ok := e.zones[full]; ok {
			return value, 0, nil
		}
		return "public dmz\n", 0, nil
	}
	scope, zone, action, value := "runtime", "public", "", ""
	for _, arg := range args {
		if arg == "--permanent" {
			scope = "permanent"
		}
		if strings.HasPrefix(arg, "--zone=") {
			zone = strings.TrimPrefix(arg, "--zone=")
		}
		for _, candidate := range []string{"query-port", "add-port", "remove-port", "query-service", "add-service", "remove-service"} {
			if suffix, ok := strings.CutPrefix(arg, "--"+candidate+"="); ok {
				action, value = candidate, suffix
			}
		}
	}
	if full == "--reload" {
		for key := range e.rules {
			if strings.HasPrefix(key, "runtime ") {
				delete(e.rules, key)
			}
		}
		for key := range e.rules {
			if strings.HasPrefix(key, "permanent ") {
				e.rules[strings.Replace(key, "permanent ", "runtime ", 1)] = true
			}
		}
		return "", 0, nil
	}
	if action == "" {
		return "unexpected firewall command: " + full, 2, nil
	}
	key := scope + " " + zone + " " + value
	if strings.HasPrefix(action, "query") {
		if e.rules[key] {
			return "yes", 0, nil
		}
		return "no", 1, nil
	}
	if len(e.failures) > 0 && strings.Contains(full, e.failures[0]) {
		e.failures = e.failures[1:]
		return "firewall operation failed", 2, nil
	}
	if strings.Contains(full, e.failure) && e.failure != "" {
		e.failure = ""
		return "firewall operation failed", 2, nil
	}
	if strings.HasPrefix(action, "add") {
		e.rules[key] = true
	} else {
		delete(e.rules, key)
	}
	return "", 0, nil
}
func firewallFixture(t *testing.T, mode string) (*SetupRunner, *firewallExec) {
	r := bundledSetupFixture(t)
	r.FS.(*FakeFileSystem).Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
	env := r.Env.(*FakeEnvManager).Env
	env["HEIMDALL_PROXY_MODE"] = mode
	if mode == "nginx" {
		env["HEIMDALL_TLS_MODE"] = "self-signed"
	}
	return r, enableFirewall(r)
}
func enableFirewall(r *SetupRunner) *firewallExec {
	r.Systemd.(*FakeSystemdRunner).ActiveServices["firewalld"] = true
	e := &firewallExec{FakeExecRunner: r.Exec.(*FakeExecRunner), rules: map[string]bool{}}
	r.Exec = e
	if fs, ok := r.FS.(*FakeFileSystem); ok {
		r.FS = &securityFS{FakeFileSystem: fs}
	}
	return e
}

func firewallSetup(t *testing.T, r *SetupRunner, args ...string) error {
	t.Helper()
	command := NewSetupCmd(r)
	command.SetArgs(append([]string{"--non-interactive"}, args...))
	return command.Execute()
}
func firewallSetPort(r *SetupRunner, port string) error {
	return (&SetPortRunner{Exec: r.Exec, FS: r.FS, Paths: r.Paths, Systemd: r.Systemd, Env: r.Env, Out: r.Out}).Run(port)
}
func TestManagedProxyPortChangeKeepsBackendPrivate(t *testing.T) {
	for _, mode := range []string{"nginx", "bundled"} {
		t.Run(mode, func(t *testing.T) {
			r, e := firewallFixture(t, mode)
			require.NoError(t, firewallSetPort(r, "3456"))
			for _, scope := range []string{"runtime", "permanent"} {
				assert.False(t, e.rules[scope+" public 3456/tcp"])
				assert.True(t, e.rules[scope+" public https"])
			}
		})
	}
}
func TestManagedProxySkipTLSKeepsBackendPrivate(t *testing.T) {
	r, e := firewallFixture(t, "nginx")
	require.NoError(t, firewallSetup(t, r, "--skip-tls"))
	assert.False(t, e.rules["runtime public 3210/tcp"])
	assert.False(t, e.rules["permanent public 3210/tcp"])
}
func TestBackendFirewallOwnershipSurvivesTopologyChange(t *testing.T) {
	r, e := firewallFixture(t, "none")
	e.rules["runtime dmz 9000/tcp"], e.rules["permanent public 9001/tcp"] = true, true
	require.NoError(t, firewallSetup(t, r, "--proxy-mode=none"))
	require.True(t, e.rules["runtime public 3210/tcp"])
	require.True(t, e.rules["permanent public 3210/tcp"])
	require.NoError(t, firewallSetup(t, r, "--proxy-mode=nginx"))
	assert.False(t, e.rules["runtime public 3210/tcp"])
	assert.False(t, e.rules["permanent public 3210/tcp"])
	assert.True(t, e.rules["runtime dmz 9000/tcp"])
	assert.True(t, e.rules["permanent public 9001/tcp"])
}
func TestManagedProxyRejectsUnownedBackendRule(t *testing.T) {
	for _, scope := range []string{"runtime", "permanent"} {
		t.Run(scope, func(t *testing.T) {
			r, e := firewallFixture(t, "nginx")
			e.rules[scope+" dmz 3456/tcp"] = true
			before := maps.Clone(e.rules)
			err := firewallSetPort(r, "3456")
			require.Error(t, err)
			assert.Contains(t, err.Error(), "--zone=dmz")
			assert.Contains(t, err.Error(), "--remove-port=3456/tcp")
			assert.Equal(t, before, e.rules)
			assert.NotContains(t, r.Systemd.(*FakeSystemdRunner).Actions, "restart:"+ServiceName)
			assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
		})
	}
}
func TestFirewallFailureRollsBackPortAndRules(t *testing.T) {
	r, e := firewallFixture(t, "none")
	e.failure = "--permanent"
	require.ErrorContains(t, firewallSetPort(r, "3456"), "firewall operation failed")
	assert.Empty(t, e.rules)
	assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
}
func TestSetPortRestartFailureDoesNotOpenFirewall(t *testing.T) {
	r, e := firewallFixture(t, "none")
	r.Systemd = &portFailureSystemd{FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: "restart"}
	require.Error(t, firewallSetPort(r, "3456"))
	assert.Empty(t, e.rules)
}
func TestSetupFirewallFailureRestoresOwnership(t *testing.T) {
	r, e := firewallFixture(t, "none")
	require.NoError(t, firewallSetup(t, r, "--proxy-mode=none"))
	before := maps.Clone(e.rules)
	e.failure = "--remove-port=3210/tcp"
	err := firewallSetup(t, r, "--proxy-mode=nginx")
	require.Error(t, err)
	assert.Equal(t, before, e.rules)
	assert.Equal(t, "none", r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"])
}

func TestFirewallRollbackFailureRetainsOwnedRule(t *testing.T) {
	r, e := firewallFixture(t, "none")
	e.failures = []string{"--permanent --add-port=3210/tcp", "--remove-port=3210/tcp"}
	require.Error(t, firewallSetup(t, r))
	require.True(t, e.rules["runtime public 3210/tcp"])
	data, err := r.FS.ReadFile(r.Paths.ConfigDir + "/firewalld-ports")
	require.NoError(t, err)
	require.Equal(t, "runtime public 3210/tcp\n", string(data))
	require.NoError(t, firewallSetup(t, r, "--proxy-mode=nginx"))
	assert.False(t, e.rules["runtime public 3210/tcp"])
}
func TestFirewallPortChangePreservesUnownedRulesAcrossZones(t *testing.T) {
	r, e := firewallFixture(t, "none")
	e.rules["runtime dmz 9000/tcp"] = true
	require.NoError(t, firewallSetPort(r, "3456"))
	e.defaultZone = "dmz"
	require.NoError(t, firewallSetPort(r, "4567"))
	assert.False(t, e.rules["runtime public 3456/tcp"])
	assert.False(t, e.rules["permanent public 3456/tcp"])
	assert.True(t, e.rules["runtime dmz 4567/tcp"])
	assert.True(t, e.rules["permanent dmz 4567/tcp"])
	assert.True(t, e.rules["runtime dmz 9000/tcp"])
}
func TestManagedProxyChecksPermanentOnlyZones(t *testing.T) {
	r, e := firewallFixture(t, "nginx")
	e.zones = map[string]string{"--get-zones": "public", "--permanent --get-zones": "public saved"}
	e.rules["permanent saved 3456/tcp"] = true
	require.ErrorContains(t, firewallSetPort(r, "3456"), "--zone=saved --permanent --remove-port=3456/tcp")
	assert.NotContains(t, r.Systemd.(*FakeSystemdRunner).Actions, "restart:"+ServiceName)
}
func TestUnownedNonmanagedBackendRuleIsNeverAdopted(t *testing.T) {
	r, e := firewallFixture(t, "none")
	e.rules["runtime public 3210/tcp"], e.rules["permanent public 3210/tcp"] = true, true
	require.NoError(t, firewallSetup(t, r))
	assert.False(t, r.FS.Exists(r.Paths.ConfigDir+"/firewalld-ports"))
	require.ErrorContains(t, firewallSetup(t, r, "--proxy-mode=nginx"), "unowned")
	assert.True(t, e.rules["runtime public 3210/tcp"])
	assert.True(t, e.rules["permanent public 3210/tcp"])
}

func TestFirewallRejectsInvalidOwnershipLedgerBeforeMutation(t *testing.T) {
	for _, data := range []string{"runtime public 0/tcp\n", "runtime public 3456/udp\n", "other public 3456/tcp\n", "runtime public 3456/tcp extra\n"} {
		t.Run(data, func(t *testing.T) {
			r, e := firewallFixture(t, "none")
			require.NoError(t, r.FS.WriteFile(r.Paths.ConfigDir+"/firewalld-ports", []byte(data), 0600))
			require.ErrorContains(t, firewallSetPort(r, "3456"), "ownership ledger")
			assert.Empty(t, e.rules)
			assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
			assert.NotContains(t, r.Systemd.(*FakeSystemdRunner).Actions, "restart:"+ServiceName)
		})
	}
}
func TestFirewallLedgerWriteFailureClosesNewRules(t *testing.T) {
	r, e := firewallFixture(t, "none")
	r.FS.(*securityFS).failRename = true
	require.ErrorContains(t, firewallSetPort(r, "3456"), "rename denied")
	assert.Empty(t, e.rules)
	assert.False(t, r.FS.Exists(r.Paths.ConfigDir+"/firewalld-ports"))
	assert.False(t, r.FS.Exists(r.Paths.ConfigDir+"/firewalld-ports.pending"))
	assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
}

func TestCaddyCustomPublicPortForSetupAndSetPort(t *testing.T) {
	for _, command := range []string{"setup", "set-port"} {
		t.Run(command, func(t *testing.T) {
			r, exec := firewallFixture(t, "bundled")
			r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
			backend := "3210"
			if command == "setup" {
				require.NoError(t, firewallSetup(t, r))
			} else {
				backend = "3456"
				require.NoError(t, firewallSetPort(r, backend))
			}
			ledger, err := r.FS.ReadFile(r.Paths.ConfigDir + "/firewalld-ports")
			require.NoError(t, err)
			for _, scope := range []string{"runtime", "permanent"} {
				assert.True(t, exec.rules[scope+" public 8443/tcp"])
				assert.False(t, exec.rules[scope+" public "+backend+"/tcp"])
				assert.Contains(t, string(ledger), scope+" public 8443/tcp\n")
			}
			before := maps.Clone(exec.rules)
			require.NoError(t, firewallSetup(t, r))
			assert.Equal(t, before, exec.rules)
		})
	}
}

func TestCaddyCustomPublicPortOwnership(t *testing.T) {
	for _, preexisting := range []bool{false, true} {
		t.Run(fmt.Sprint(preexisting), func(t *testing.T) {
			r, exec := firewallFixture(t, "bundled")
			r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
			if preexisting {
				exec.rules["runtime public 8443/tcp"] = true
				exec.rules["permanent public 8443/tcp"] = true
			}
			exec.rules["runtime dmz 9000/tcp"] = true
			require.NoError(t, firewallSetup(t, r))
			require.NoError(t, firewallSetup(t, r, "--external-url=https://heimdall.example.test:9443"))
			for _, scope := range []string{"runtime", "permanent"} {
				assert.Equal(t, preexisting, exec.rules[scope+" public 8443/tcp"])
				assert.True(t, exec.rules[scope+" public 9443/tcp"])
			}
			assert.True(t, exec.rules["runtime dmz 9000/tcp"])
			require.NoError(t, firewallSetup(t, r, "--external-url=https://heimdall.example.test"))
			for _, scope := range []string{"runtime", "permanent"} {
				assert.Equal(t, preexisting, exec.rules[scope+" public 8443/tcp"])
				assert.False(t, exec.rules[scope+" public 9443/tcp"])
				assert.True(t, exec.rules[scope+" public https"])
			}
		})
	}
}

func TestCaddyCustomPublicPortFirewallFailureRollsBack(t *testing.T) {
	for _, failure := range []string{"firewall", "ledger", "restart"} {
		t.Run(failure, func(t *testing.T) {
			r, exec := firewallFixture(t, "bundled")
			r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
			exec.rules["runtime dmz 9000/tcp"] = true
			before := maps.Clone(exec.rules)
			switch failure {
			case "firewall":
				exec.failure = "--permanent --add-port=8443/tcp"
			case "ledger":
				r.FS.(*securityFS).failRename = true
			case "restart":
				r.Systemd = &portFailureSystemd{
					FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: "restart",
				}
			}
			require.Error(t, firewallSetPort(r, "3456"))
			assert.Equal(t, before, exec.rules)
			assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
			assert.False(t, r.FS.Exists(r.Paths.ConfigDir+"/firewalld-ports"))
		})
	}
}

func TestSetPortRejectsStoppedProxyPublicPort(t *testing.T) {
	r, exec := firewallFixture(t, "bundled")
	r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
	require.ErrorContains(t, firewallSetPort(r, "8443"), "reserved for the selected proxy")
	assert.Empty(t, exec.rules)
	assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
	assert.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
}

func TestCaddyPublicEndpointFirewallRules(t *testing.T) {
	for _, tc := range []struct{ endpoint, rule string }{
		{"http://heimdall.example.test", "http"},
		{"https://heimdall.example.test", "https"},
		{"https://heimdall.example.test:00443", "https"},
		{"http://heimdall.example.test:81", "81/tcp"},
	} {
		t.Run(tc.endpoint, func(t *testing.T) {
			r, exec := firewallFixture(t, "bundled")
			r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = tc.endpoint
			for range 2 {
				require.NoError(t, firewallSetPort(r, "3456"))
				for _, scope := range []string{"runtime", "permanent"} {
					assert.True(t, exec.rules[scope+" public "+tc.rule])
					assert.False(t, exec.rules[scope+" public 3456/tcp"])
				}
			}
		})
	}
}
