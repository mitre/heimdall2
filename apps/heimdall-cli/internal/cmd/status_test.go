package cmd

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestStatusRunner() (*StatusRunner, *bytes.Buffer) {
	out := new(bytes.Buffer)
	r := &StatusRunner{
		Exec: &FakeExecRunner{
			Results: make(map[string]FakeExecResult),
		},
		Systemd: &FakeSystemdRunner{
			ActiveServices: make(map[string]bool),
			Properties:     make(map[string]string),
		},
		Env: &FakeEnvManager{
			Env: map[string]string{
				"DATABASE_HOST":     "localhost",
				"DATABASE_PORT":     "5432",
				"DATABASE_USERNAME": "postgres",
				"DATABASE_PASSWORD": "secret",
				"DATABASE_NAME":     "heimdall-server-production",
				"PORT":              "3000",
			},
		},
		FS:    NewFakeFileSystem(),
		DB:    &FakeDBConnector{},
		Out:   out,
		Paths: DefaultPaths(),
	}
	return r, out
}

func TestStatusCmd_Help(t *testing.T) {
	cmd := NewStatusCmd(nil)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"--help"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "status")
}

func TestStatusRunner_ServiceActive(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Systemd.(*FakeSystemdRunner).ActiveServices[ServiceName] = true
	r.Systemd.(*FakeSystemdRunner).Properties[ServiceName+":MainPID"] = "1234"
	r.Systemd.(*FakeSystemdRunner).Properties[ServiceName+":ActiveEnterTimestamp"] = "Mon 2026-01-01 00:00:00 UTC"
	r.DB.(*FakeDBConnector).Tables = 15

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "pid=1234")
	assert.Contains(t, output, "since Mon 2026-01-01 00:00:00 UTC")
}

func TestStatusRunner_ServiceInactive(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Systemd.(*FakeSystemdRunner).ActiveServices[ServiceName] = false

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "stopped")
}

func TestStatusRunner_DBConnectionSuccess(t *testing.T) {
	r, out := newTestStatusRunner()
	r.DB.(*FakeDBConnector).Tables = 42

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "42 tables")
}

func TestStatusRunner_DBConnectionFailure(t *testing.T) {
	r, out := newTestStatusRunner()
	r.DB.(*FakeDBConnector).TableErr = errors.New("connection refused")

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "connection failed")
}

func TestStatusRunner_SELinuxEnforcing(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Exec.(*FakeExecRunner).Results["getenforce"] = FakeExecResult{Stdout: "Enforcing"}
	r.Exec.(*FakeExecRunner).Results["semodule -l"] = FakeExecResult{Stdout: "heimdall_server"}
	r.Exec.(*FakeExecRunner).Results["semanage port"] = FakeExecResult{Stdout: "heimdall_server_port_t"}

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Enforcing")
}

func TestStatusRunner_PasswordNotLeaked(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = "supersecretpassword123"
	r.DB.(*FakeDBConnector).Tables = 5

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	// The raw password must NOT appear anywhere in the status output
	assert.NotContains(t, output, "supersecretpassword123")
	// But the connection should have been attempted (password was set)
	assert.Contains(t, output, "5 tables")
}

func TestExtractJSONField(t *testing.T) {
	tests := []struct {
		name  string
		data  string
		field string
		want  string
	}{
		{"standard field", `{"version":"2.0.0","name":"app"}`, "version", "2.0.0"},
		{"nested in larger JSON", `{"name":"heimdall","version":"2.12.6","description":"test"}`, "version", "2.12.6"},
		{"field not found", `{"name":"app"}`, "version", ""},
		{"empty string", "", "version", ""},
		{"no value", `{"version":}`, "version", ""},
		{"first field", `{"name":"heimdall"}`, "name", "heimdall"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractJSONField(tt.data, tt.field)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestStatusRunner_AuthProviders(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["OKTA_CLIENTID"] = "abc123"
	r.Env.(*FakeEnvManager).Env["GITHUB_CLIENTID"] = "gh123"

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Local")
	assert.Contains(t, output, "Okta")
	assert.Contains(t, output, "GitHub")
}

func TestStatusRunner_SELinuxPermissive(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Exec.(*FakeExecRunner).Results["getenforce"] = FakeExecResult{Stdout: "Permissive"}
	r.Exec.(*FakeExecRunner).Results["semodule -l"] = FakeExecResult{Stdout: "some_other_module"}
	r.Exec.(*FakeExecRunner).Results["semanage port"] = FakeExecResult{Stdout: "something_else"}

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Permissive")
	// Policy module NOT loaded
	assert.Contains(t, output, "NOT loaded")
	// Port not registered
	assert.Contains(t, output, "not registered")
}

func TestStatusRunner_SELinuxDisabled(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Exec.(*FakeExecRunner).Results["getenforce"] = FakeExecResult{Stdout: "Disabled"}
	r.Exec.(*FakeExecRunner).Results["semodule -l"] = FakeExecResult{Stdout: ""}
	r.Exec.(*FakeExecRunner).Results["semanage port"] = FakeExecResult{Stdout: ""}

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Disabled")
}

func TestStatusRunner_SELinuxNotAvailable(t *testing.T) {
	r, out := newTestStatusRunner()
	// getenforce not available (returns error)
	r.Exec.(*FakeExecRunner).Results["getenforce"] = FakeExecResult{Err: fmt.Errorf("not found")}

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "not available")
}

func TestStatusRunner_FapolicydRunningWithTrustFile(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Systemd.(*FakeSystemdRunner).ActiveServices["fapolicyd"] = true
	r.FS.(*FakeFileSystem).Files["/etc/fapolicyd/trust.d/heimdall-server"] = []byte(
		"# trust file\n/usr/bin/node\n/usr/share/heimdall-server/app.js\n")

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "running")
	assert.Contains(t, output, "2 trusted file(s)")
}

func TestStatusRunner_FapolicydRunningNoTrustFile(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Systemd.(*FakeSystemdRunner).ActiveServices["fapolicyd"] = true
	// No trust file in FakeFileSystem — ReadFile will return os.ErrNotExist

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "running")
	assert.Contains(t, output, "no trust file")
}

func TestStatusRunner_FapolicydNotInstalled(t *testing.T) {
	r, out := newTestStatusRunner()
	// fapolicyd is not active (default in newTestStatusRunner)

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "not installed")
}

func TestStatusRunner_FirewalldRunningWithService(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Systemd.(*FakeSystemdRunner).ActiveServices["firewalld"] = true
	r.Exec.(*FakeExecRunner).Results["firewall-cmd --query-service="+ServiceName] = FakeExecResult{ExitCode: 0}
	r.Exec.(*FakeExecRunner).Results["firewall-cmd --get-active-zones"] = FakeExecResult{
		Stdout: "public\n  interfaces: eth0", ExitCode: 0,
	}

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "running")
	assert.Contains(t, output, "service enabled")
	assert.Contains(t, output, "Zone: public")
}

func TestStatusRunner_FirewalldRunningWithoutService(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Systemd.(*FakeSystemdRunner).ActiveServices["firewalld"] = true
	r.Exec.(*FakeExecRunner).Results["firewall-cmd --query-service="+ServiceName] = FakeExecResult{ExitCode: 1}
	r.Exec.(*FakeExecRunner).Results["firewall-cmd --get-active-zones"] = FakeExecResult{
		Stdout: "public\n  interfaces: eth0", ExitCode: 0,
	}

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "service not enabled")
}

func TestStatusRunner_FirewalldNotInstalled(t *testing.T) {
	r, out := newTestStatusRunner()
	// firewalld not active (default)

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	// The firewalld section should show "not installed"
	assert.Contains(t, output, "firewalld")
}

func TestStatusRunner_AuthProviderOIDCWithName(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["OIDC_CLIENTID"] = "oidc-client-123"
	r.Env.(*FakeEnvManager).Env["OIDC_NAME"] = "Keycloak"

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "OIDC (Keycloak)")
}

func TestStatusRunner_AuthProviderOIDCWithoutName(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["OIDC_CLIENTID"] = "oidc-client-123"
	// No OIDC_NAME set

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "OIDC (unnamed)")
}

func TestStatusRunner_AuthProviderLDAP(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["LDAP_ENABLED"] = "true"

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "LDAP")
}

func TestStatusRunner_AuthProviderLocalDisabled(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["LOCAL_LOGIN_DISABLED"] = "true"

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Local (disabled)")
}

func TestStatusRunner_AuthProviderAllProviders(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["OKTA_CLIENTID"] = "okta"
	r.Env.(*FakeEnvManager).Env["GITHUB_CLIENTID"] = "gh"
	r.Env.(*FakeEnvManager).Env["GITLAB_CLIENTID"] = "gl"
	r.Env.(*FakeEnvManager).Env["GOOGLE_CLIENTID"] = "goog"
	r.Env.(*FakeEnvManager).Env["OIDC_CLIENTID"] = "oidc"
	r.Env.(*FakeEnvManager).Env["OIDC_NAME"] = "AzureAD"
	r.Env.(*FakeEnvManager).Env["LDAP_ENABLED"] = "TRUE" // case-insensitive

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Okta")
	assert.Contains(t, output, "GitHub")
	assert.Contains(t, output, "GitLab")
	assert.Contains(t, output, "Google")
	assert.Contains(t, output, "OIDC (AzureAD)")
	assert.Contains(t, output, "LDAP")
}

func TestStatusRunner_RemoteDatabase(t *testing.T) {
	r, out := newTestStatusRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_HOST"] = "db.remote.example.com"

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "remote database")
}

func TestStatusRunner_DBPasswordNotSet(t *testing.T) {
	r, out := newTestStatusRunner()
	delete(r.Env.(*FakeEnvManager).Env, "DATABASE_PASSWORD")

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "DATABASE_PASSWORD not set")
}

func TestStatusRunner_VersionFromPackageJSON(t *testing.T) {
	r, out := newTestStatusRunner()
	r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/apps/backend/package.json"] = []byte(
		`{"name":"heimdall","version":"2.12.6"}`)

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "v2.12.6")
}

func TestStatusRunner_LocalPostgresqlVersioned(t *testing.T) {
	r, out := newTestStatusRunner()
	// Simulate postgresql-15 running
	r.Systemd.(*FakeSystemdRunner).ActiveServices["postgresql-15"] = true

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "postgresql-15 running")
}

func TestStatusRunner_LocalPostgresqlGeneric(t *testing.T) {
	r, out := newTestStatusRunner()
	// No versioned PG, but generic postgresql is running
	r.Systemd.(*FakeSystemdRunner).ActiveServices["postgresql"] = true

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "postgresql running")
}

func TestStatusRunner_LocalPostgresqlNotRunning(t *testing.T) {
	r, out := newTestStatusRunner()
	// No postgresql services running at all — default

	err := r.Run()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "no local PostgreSQL service running")
}

func TestStatusCmd_JSONOutput(t *testing.T) {
	r := &StatusRunner{
		Exec: &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		Systemd: &FakeSystemdRunner{
			ActiveServices: map[string]bool{ServiceName: true},
			Properties: map[string]string{
				ServiceName + ":MainPID":              "5678",
				ServiceName + ":ActiveEnterTimestamp": "Mon 2026-01-01 00:00:00 UTC",
			},
		},
		Env: &FakeEnvManager{Env: map[string]string{
			"PORT":              "3000",
			"DATABASE_PASSWORD": "pass",
			"DATABASE_HOST":     "localhost",
		}},
		FS:    NewFakeFileSystem(),
		DB:    &FakeDBConnector{Tables: 12},
		Paths: DefaultPaths(),
		JSON:  true,
	}
	cmd := NewStatusCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"--output", "json"})
	err := cmd.Execute()
	require.NoError(t, err)

	// Parse the output as JSON
	var result map[string]interface{}
	err = json.Unmarshal(out.Bytes(), &result)
	require.NoError(t, err, "output should be valid JSON: %s", out.String())

	// Verify key fields
	svc, ok := result["service"].(map[string]interface{})
	require.True(t, ok, "should have service key")
	assert.Equal(t, true, svc["running"])
	assert.Equal(t, "5678", svc["pid"])

	db, ok := result["database"].(map[string]interface{})
	require.True(t, ok, "should have database key")
	assert.Equal(t, float64(12), db["tables"])
}

func TestStatusRPMReportsOwnershipWithoutHostnameInference(t *testing.T) {
	for _, mode := range []string{"bundled", "external"} {
		r, out := newTestStatusRunner()
		fs := r.FS.(*FakeFileSystem)
		fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
		fs.Files[r.Paths.RuntimePath("postgresql", "bin", "psql")] = nil
		r.Env.(*FakeEnvManager).Env["HEIMDALL_DATABASE_MODE"] = mode
		r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"] = "external"
		r.Systemd.(*FakeSystemdRunner).ActiveServices["heimdall-postgresql"] = true
		require.NoError(t, r.Run())
		require.Contains(t, out.String(), "Database mode: "+mode)
		require.NotContains(t, out.String(), "no local PostgreSQL service running")
		if mode == "bundled" {
			require.Contains(t, out.String(), "heimdall-postgresql running")
		}
		require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
	}
}

func TestStatusBundledRuntimeInventoryAndSelectedUnits(t *testing.T) {
	for _, mode := range []string{"bundled", "external"} {
		t.Run(mode, func(t *testing.T) {
			r, out := newTestStatusRunner()
			r.JSON = true
			r.Env.(*FakeEnvManager).Env = map[string]string{"HEIMDALL_DATABASE_MODE": mode, "HEIMDALL_PROXY_MODE": mode, "DATABASE_HOST": "localhost", "DATABASE_PORT": "55432", "EXTERNAL_URL": "https://example.test"}
			fs := r.FS.(*FakeFileSystem)
			fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{"runtimes":{"node":{"version":"22.23.3"},"postgresql":{"version":"18.6"},"caddy":{"version":"2.11.4"}}}`)
			fs.Files[r.Paths.RuntimePath("postgresql", "bin", "psql")] = nil
			require.NoError(t, r.Run())
			require.Contains(t, out.String(), `"node": "22.23.3"`)
			require.Contains(t, out.String(), `"url": "https://example.test"`)
			if mode == "bundled" {
				require.Contains(t, out.String(), `"heimdall-postgresql": false`)
				require.Contains(t, out.String(), `"heimdall-caddy": false`)
			} else {
				require.NotContains(t, out.String(), `"heimdall-postgresql"`)
				require.NotContains(t, out.String(), `"heimdall-caddy"`)
			}
		})
	}
}
