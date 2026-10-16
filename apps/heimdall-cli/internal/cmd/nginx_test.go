package cmd

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNginxValidationUsesServiceBindCapability(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	binary := r.Paths.RuntimePath("nginx", "sbin", "nginx")
	pending := r.Paths.ConfigDir + "/nginx/nginx.conf.pending"
	r.FS.(*FakeFileSystem).Files[binary] = []byte("nginx")
	exec := r.Exec.(*FakeExecRunner)
	exec.Results["runuser -u heimdall-nginx -- "+binary+" -t -c "+pending] = FakeExecResult{ExitCode: 1, Stdout: "bind() to 0.0.0.0:443 failed (13: Permission denied)"}
	_, err := r.prepareBundledNginx(map[string]string{"EXTERNAL_URL": "https://localhost", "HEIMDALL_TLS_MODE": "self-signed"})
	require.NoError(t, err)
	require.Contains(t, exec.Calls, FakeExecCall{Name: "setpriv", Args: []string{
		"--reuid=heimdall-nginx", "--regid=heimdall-nginx", "--init-groups",
		"--inh-caps=-all,+net_bind_service", "--ambient-caps=-all,+net_bind_service",
		"--bounding-set=-all,+net_bind_service", "--", binary, "-t", "-c", pending,
	}})
}

func TestSetupNginxDefaultAndBareURL(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = []byte("nginx")
	p := &FakePrompter{IsTTY: true}
	r.Prompter = p
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--interactive", "--reconfigure"})
	require.NoError(t, command.Execute())
	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "nginx", env["HEIMDALL_PROXY_MODE"])
	assert.Equal(t, "self-signed", env["HEIMDALL_TLS_MODE"])
	assert.Equal(t, "localhost", p.InputDefaults["External URL"])
	assert.Equal(t, "https://localhost", env["EXTERNAL_URL"])
}

func TestSetupBareExternalURL(t *testing.T) {
	for _, tc := range []struct{ raw, mode, want string }{
		{"localhost", "bundled", "https://localhost"},
		{"host.example:8443", "external", "https://host.example:8443"},
		{"[::1]:3000", "none", "http://[::1]:3000"},
		{"::1", "external", "https://[::1]"},
	} {
		t.Run(tc.raw, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--reconfigure", "--external-url=" + tc.raw, "--proxy-mode=" + tc.mode})
			require.NoError(t, command.Execute())
			env := r.Env.(*FakeEnvManager).Env
			assert.Equal(t, tc.want, env["EXTERNAL_URL"])
			if strings.Contains(tc.raw, "::1") {
				assert.Equal(t, "::1", env["NGINX_HOST"])
			}
		})
	}
}

func TestNginxConfigurationAndCertificateReuse(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = []byte("nginx")
	env := map[string]string{"EXTERNAL_URL": "https://[::1]", "PORT": "4321", "HEIMDALL_TLS_MODE": "self-signed", "HEIMDALL_TLS_CERT_DAYS": "7"}
	update, err := r.prepareBundledNginx(env)
	require.NoError(t, err)
	require.NoError(t, update.apply())
	dir := r.Paths.ConfigDir + "/nginx"
	config := string(fs.Files[dir+"/nginx.conf"])
	assert.Contains(t, config, "listen 443 ssl;")
	assert.Contains(t, config, "proxy_pass http://127.0.0.1:4321;")
	assert.Contains(t, config, "proxy_set_header Upgrade $http_upgrade;")
	assert.Contains(t, config, "proxy_set_header X-Forwarded-For $remote_addr;")
	assert.NotContains(t, config, "$proxy_add_x_forwarded_for")
	assert.NotContains(t, config, "return ")
	assert.NotContains(t, config, "rewrite ")
	block, _ := pem.Decode(fs.Files[dir+"/certs/server.crt"])
	require.NotNil(t, block)
	cert, err := x509.ParseCertificate(block.Bytes)
	require.NoError(t, err)
	assert.NoError(t, cert.VerifyHostname("::1"))
	assert.Equal(t, x509.SHA256WithRSA, cert.SignatureAlgorithm)
	assert.Equal(t, 4096, cert.PublicKey.(*rsa.PublicKey).N.BitLen())
	assert.InDelta(t, 7*24*time.Hour.Seconds(), cert.NotAfter.Sub(cert.NotBefore).Seconds(), 1)
	before := string(fs.Files[dir+"/certs/server.key"])
	update, err = r.prepareBundledNginx(env)
	require.NoError(t, err)
	require.NoError(t, update.apply())
	assert.Equal(t, before, string(fs.Files[dir+"/certs/server.key"]))
	env["EXTERNAL_URL"] = "https://other.example"
	_, err = r.prepareBundledNginx(env)
	require.ErrorContains(t, err, "certificate")
	assert.Equal(t, before, string(fs.Files[dir+"/certs/server.key"]))
}

func TestSetupRejectsMalformedExternalURL(t *testing.T) {
	for _, raw := range []string{"ftp://localhost", "localhost;include evil;", "localhost\nPORT=4000", "https://localhost/path", "localhost:99999", "https://user@localhost"} {
		t.Run(raw, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--reconfigure", "--external-url=" + raw})
			require.Error(t, command.Execute())
			assert.Empty(t, r.Env.(*FakeEnvManager).Env)
		})
	}
}

func TestFullSetupSwitchesManagedProxies(t *testing.T) {
	for _, tc := range []struct{ previous, next, tls, unit string }{
		{"bundled", "nginx", "internal", bundledCaddyService},
		{"nginx", "bundled", "self-signed", bundledNginxService},
		{"nginx", "external", "self-signed", bundledNginxService},
		{"nginx", "none", "self-signed", bundledNginxService},
	} {
		t.Run(tc.previous+" to "+tc.next, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
			env := r.Env.(*FakeEnvManager).Env
			env["HEIMDALL_PROXY_MODE"], env["HEIMDALL_TLS_MODE"] = tc.previous, tc.tls
			sd := r.Systemd.(*FakeSystemdRunner)
			sd.ActiveServices[tc.unit] = true
			sd.Properties[tc.unit+":MainPID"] = "100"
			sd.Properties[tc.unit+":UnitFileState"] = "enabled"
			exec := r.Exec.(*FakeExecRunner)
			exec.Results["ss -H -ltnp sport = :443"] = FakeExecResult{Stdout: `LISTEN 0 511 0.0.0.0:443 0.0.0.0:* users:(("proxy",pid=100,fd=5))`}
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--proxy-mode=" + tc.next})
			require.NoError(t, command.Execute())
			assert.Equal(t, tc.next, r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"])
			assert.Contains(t, exec.Calls, FakeExecCall{Name: "systemctl", Args: []string{"disable", "--now", tc.unit}})
		})
	}
}

func TestNginxFirstOptionKeepsCaddyAvailable(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = []byte("nginx")
	r.Prompter = &FakePrompter{IsTTY: true, Selects: map[string]int{"TLS/SSL setup": 1}}
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--interactive", "--reconfigure"})
	require.NoError(t, command.Execute())
	assert.Equal(t, "bundled", r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"])
	assert.Equal(t, "internal", r.Env.(*FakeEnvManager).Env["HEIMDALL_TLS_MODE"])
}

func TestOwnedNginxPortRecognizesServiceWorkers(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{
		"ss -H -ltnp":          {Stdout: `LISTEN 0 511 0.0.0.0:443 0.0.0.0:* users:(("nginx",pid=101,fd=5),("nginx",pid=100,fd=5))`},
		"cat /proc/101/cgroup": {Stdout: "0::/system.slice/heimdall-nginx.service\n"},
	}}
	sd := &FakeSystemdRunner{ActiveServices: map[string]bool{bundledNginxService: true}, Properties: map[string]string{bundledNginxService + ":MainPID": "100", bundledNginxService + ":ControlGroup": "/system.slice/heimdall-nginx.service"}}
	require.NoError(t, checkOwnedPort(exec, sd, 443, bundledNginxService, false))
	exec.Results["cat /proc/101/cgroup"] = FakeExecResult{Stdout: "0::/system.slice/foreign.service\n"}
	require.Error(t, checkOwnedPort(exec, sd, 443, bundledNginxService, false))
}

func TestNginxRefusesInvalidSavedCertificatePairs(t *testing.T) {
	crt, key, err := selfSignedCertificate("localhost", 7)
	require.NoError(t, err)
	block, _ := pem.Decode(crt)
	leaf, err := x509.ParseCertificate(block.Bytes)
	require.NoError(t, err)
	keyBlock, _ := pem.Decode(key)
	privateKey, err := x509.ParsePKCS1PrivateKey(keyBlock.Bytes)
	require.NoError(t, err)
	datedCertificate := func(start time.Time) []byte {
		certificate := *leaf
		certificate.NotBefore, certificate.NotAfter = start, start.Add(24*time.Hour)
		der, err := x509.CreateCertificate(rand.Reader, &certificate, &certificate, &privateKey.PublicKey, privateKey)
		require.NoError(t, err)
		return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	}
	for _, tc := range []struct {
		name      string
		cert, key []byte
	}{
		{"missing key", crt, nil}, {"missing certificate", nil, key},
		{"malformed certificate", []byte("invalid PEM"), key},
		{"malformed key", crt, []byte("invalid PEM")},
		{"expired", datedCertificate(time.Now().Add(-48 * time.Hour)), key},
		{"future validity", datedCertificate(time.Now().Add(24 * time.Hour)), key},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			fs := r.FS.(*FakeFileSystem)
			fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = []byte("nginx")
			dir := r.Paths.ConfigDir + "/nginx/certs/"
			if tc.cert != nil {
				fs.Files[dir+"server.crt"] = tc.cert
			}
			if tc.key != nil {
				fs.Files[dir+"server.key"] = tc.key
			}
			_, err := r.prepareBundledNginx(map[string]string{"EXTERNAL_URL": "https://localhost", "HEIMDALL_TLS_MODE": "self-signed"})
			require.Error(t, err)
			assert.Equal(t, tc.cert, fs.Files[dir+"server.crt"])
			assert.Equal(t, tc.key, fs.Files[dir+"server.key"])
			assert.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		})
	}
}

func TestReconfigureRejectsProxyOwnershipChangesBeforeMutation(t *testing.T) {
	for _, tc := range []struct{ previous, next, tls string }{
		{"bundled", "nginx", "internal"},
		{"nginx", "none", "self-signed"},
	} {
		for _, active := range []bool{false, true} {
			t.Run(tc.previous+" to "+tc.next+map[bool]string{false: " enabled inactive", true: " active"}[active], func(t *testing.T) {
				r := bundledSetupFixture(t)
				fs := r.FS.(*FakeFileSystem)
				fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
				env := r.Env.(*FakeEnvManager).Env
				env["HEIMDALL_PROXY_MODE"], env["HEIMDALL_TLS_MODE"] = tc.previous, tc.tls
				unit := bundledCaddyService
				if tc.previous == "nginx" {
					unit = bundledNginxService
				}
				sd := r.Systemd.(*FakeSystemdRunner)
				sd.ActiveServices[unit] = active
				sd.Properties[unit+":UnitFileState"] = "enabled"
				unchanged := assertSetupPortUnchanged(t, r)
				command := NewSetupCmd(r)
				command.SetArgs([]string{"--non-interactive", "--reconfigure", "--proxy-mode=" + tc.next})
				err := command.Execute()
				require.Error(t, err)
				assert.Contains(t, FormatCLIError(err, false), "without --reconfigure")
				unchanged()
				assert.Equal(t, active, sd.ActiveServices[unit])
			})
		}
	}
}
