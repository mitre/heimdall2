package cmd

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateFilePath(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		wantErr bool
	}{
		{"valid absolute path", "/etc/pki/tls/certs/heimdall.pem", false},
		{"valid nested path", "/opt/certs/my-cert.pem", false},
		{"empty path", "", true},
		{"relative path", "certs/cert.pem", true},
		{"path traversal", "/etc/pki/../../etc/shadow", true},
		{"shell metachar ampersand", "/etc/certs/a&b.pem", true},
		{"shell metachar space", "/etc/certs/a b.pem", true},
		{"shell metachar semicolon", "/etc/certs/a;rm -rf.pem", true},
		{"shell metachar pipe", "/etc/certs/a|b.pem", true},
		{"shell metachar backtick", "/etc/certs/a`id`.pem", true},
		{"newline injection", "/etc/certs/a\nb.pem", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateFilePath(tt.path)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestStepTLS_BYOCertUnsafePath(t *testing.T) {
	r, _ := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})
	r.TLSCert = "/etc/certs/legit.pem"
	r.TLSKey = "/etc/keys/a;rm -rf /.key"

	err := r.stepTLS()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unsafe TLS key path")
}

func TestDetermineTLSStrategy(t *testing.T) {
	tests := []struct {
		name     string
		host     string
		cert     string
		key      string
		expected tlsStrategy
	}{
		{"BYO cert", "example.com", "/cert.pem", "/key.pem", tlsBYO},
		{"private hostname .internal", "heimdall.internal", "", "", tlsPrivate},
		{"private hostname .local", "myserver.local", "", "", tlsPrivate},
		{"private hostname single-label", "myserver", "", "", tlsPrivate},
		{"public hostname", "heimdall.example.com", "", "", tlsPublic},
		{"IP address", "192.168.1.100", "", "", tlsIP},
		{"IPv6 loopback", "::1", "", "", tlsIP},
		{"BYO overrides IP", "192.168.1.100", "/c.pem", "/k.pem", tlsBYO},
		{"BYO overrides private", "heimdall.internal", "/c.pem", "/k.pem", tlsBYO},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := determineTLSStrategy(tt.host, tt.cert, tt.key)
			assert.Equal(t, tt.expected, got)
		})
	}
}

func newTLSTestRunner(env map[string]string) (*SetupRunner, *bytes.Buffer) {
	out := new(bytes.Buffer)
	fs := NewFakeFileSystem()
	// Caddyfile template exists by default
	fs.Files[DefaultPaths().LibExecDir+"/heimdall-Caddyfile"] = []byte(":443 {\n\treverse_proxy 127.0.0.1:3000\n}\n")
	// Main Caddyfile exists
	fs.Files["/etc/caddy/Caddyfile"] = []byte("# default\n")

	r := &SetupRunner{
		Exec: &FakeExecRunner{
			Results: map[string]FakeExecResult{
				// caddy is installed
				`sh -c command -v "$1"`: {ExitCode: 0},
			},
		},
		Systemd: &FakeSystemdRunner{
			ActiveServices: make(map[string]bool),
			Properties:     make(map[string]string),
		},
		Env:   &FakeEnvManager{Env: env},
		FS:    fs,
		Out:   out,
		Paths: DefaultPaths(),
	}
	return r, out
}

func TestStepTLS_CaddyNotInstalled(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{})
	r.Exec.(*FakeExecRunner).Results[`sh -c command -v "$1"`] = FakeExecResult{ExitCode: 1}

	err := r.stepTLS()

	require.NoError(t, err)
	assert.Contains(t, out.String(), "Caddy not installed")
	assert.Contains(t, out.String(), "heimdall-cli setup --skip-db")
}

func TestStepTLS_CaddyfileTemplateMissing(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://heimdall.example.com"})
	// Remove Caddyfile template
	delete(r.FS.(*FakeFileSystem).Files, DefaultPaths().LibExecDir+"/heimdall-Caddyfile")

	err := r.stepTLS()

	require.NoError(t, err)
	assert.Contains(t, out.String(), "Caddyfile template not found")
}

func TestStepTLS_BYOCertificate(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})
	r.TLSCert = "/etc/pki/tls/certs/heimdall.pem"
	r.TLSKey = "/etc/pki/tls/private/heimdall.key"

	err := r.stepTLS()

	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "configured with provided certificate")
	assert.Contains(t, output, "/etc/pki/tls/certs/heimdall.pem")
	assert.Contains(t, output, "/etc/pki/tls/private/heimdall.key")

	// Verify sed was called to insert tls directive
	foundSed := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "sed" {
			for _, arg := range c.Args {
				if arg == "s|^:443 {|heimdall.example.com {|" {
					foundSed = true
				}
			}
		}
	}
	assert.True(t, foundSed, "sed should replace :443 with hostname for BYO cert")
}

func TestStepTLS_PrivateHostname(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.internal",
	})

	err := r.stepTLS()

	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "private hostname detected")
	assert.Contains(t, output, "internal CA")
	assert.Contains(t, output, "root.crt")

	// Verify the internal issuer and default lifetime were added via sed.
	foundTLSInternal := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "sed" {
			for _, arg := range c.Args {
				if arg == `/reverse_proxy/i\\ttls {\n\t\tissuer internal {\n\t\t\tlifetime 168h\n\t\t}\n\t}` {
					foundTLSInternal = true
				}
			}
		}
	}
	assert.True(t, foundTLSInternal, "sed should configure the internal issuer lifetime for private hostnames")
}

func TestStepTLS_PublicHostname(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})

	err := r.stepTLS()

	require.NoError(t, err)
	assert.Contains(t, out.String(), "public hostname")
	assert.Contains(t, out.String(), "Let's Encrypt")

	// Verify hostname replaces :443
	foundHostReplace := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "sed" {
			for _, arg := range c.Args {
				if arg == "s|^:443 {|heimdall.example.com {|" {
					foundHostReplace = true
				}
			}
		}
	}
	assert.True(t, foundHostReplace, "sed should replace :443 with public hostname")
}

func TestStepTLS_IPBased(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://192.168.1.100",
	})

	err := r.stepTLS()

	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "self-signed cert")
	assert.Contains(t, output, "192.168.1.100")

	// Verify openssl was called
	foundOpenssl := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "openssl" {
			foundOpenssl = true
			// Check subjectAltName includes the IP
			for _, arg := range c.Args {
				if arg == "subjectAltName=IP:192.168.1.100,DNS:localhost" {
					break
				}
			}
		}
	}
	assert.True(t, foundOpenssl, "openssl should generate self-signed cert for IP")
}

func TestStepTLS_IPBased_ExistingCert(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://10.0.0.1",
	})
	// Cert already exists
	certDir := DefaultPaths().CertDir
	r.FS.(*FakeFileSystem).Files[certDir+"/server.crt"] = []byte("existing cert")
	r.FS.(*FakeFileSystem).Files[certDir+"/server.key"] = []byte("existing key")

	err := r.stepTLS()

	require.NoError(t, err)
	// Should NOT regenerate cert
	assert.NotContains(t, out.String(), "Generated self-signed cert")
	// But should still configure Caddyfile
	assert.Contains(t, out.String(), "self-signed cert")
}

func TestStepTLS_FallbackToHostname(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{})
	// No EXTERNAL_URL, hostname -f returns a hostname
	r.Exec.(*FakeExecRunner).Results["hostname -f"] = FakeExecResult{Stdout: "myserver.local"}

	err := r.stepTLS()

	require.NoError(t, err)
	// Should use hostname as private (single-label or .local)
	assert.Contains(t, out.String(), "EXTERNAL_URL=https://myserver.local")
}

func TestStepTLS_CaddyfileImportAdded(t *testing.T) {
	r, _ := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})
	// Main Caddyfile exists but has no import line
	r.FS.(*FakeFileSystem).Files["/etc/caddy/Caddyfile"] = []byte("# no import\n")

	err := r.stepTLS()

	require.NoError(t, err)
	// Verify import was appended via sh -c echo
	foundImport := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "sh" {
			for _, arg := range c.Args {
				if arg == `echo 'import /etc/caddy/Caddyfile.d/*.caddy' >> /etc/caddy/Caddyfile` {
					foundImport = true
				}
			}
		}
	}
	assert.True(t, foundImport, "should append import to main Caddyfile")
}

func TestStepTLS_CaddyfileImportAlreadyExists(t *testing.T) {
	r, _ := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})
	r.FS.(*FakeFileSystem).Files["/etc/caddy/Caddyfile"] = []byte("import /etc/caddy/Caddyfile.d/*.caddy\n")

	err := r.stepTLS()

	require.NoError(t, err)
	// Should NOT append import again
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "sh" {
			for _, arg := range c.Args {
				assert.NotContains(t, arg, "import /etc/caddy/Caddyfile.d/", "should not duplicate import")
			}
		}
	}
}

func TestStepTLS_CaddyTrustCalled(t *testing.T) {
	r, _ := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})

	err := r.stepTLS()

	require.NoError(t, err)
	foundTrust := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "update-ca-trust" {
			foundTrust = true
		}
	}
	assert.True(t, foundTrust, "update-ca-trust should be called")
}

func TestStepTLS_CaddyServiceEnabled(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})

	err := r.stepTLS()

	require.NoError(t, err)
	assert.Contains(t, out.String(), "Caddy: enabled and running")

	assert.Equal(t, []string{"enable:caddy", "restart:caddy"}, r.Systemd.(*FakeSystemdRunner).Actions)
}

func TestStepTLS_SELinuxBooleanSet(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{
		"EXTERNAL_URL": "https://heimdall.example.com",
	})

	err := r.stepTLS()

	require.NoError(t, err)
	assert.Contains(t, out.String(), "httpd_can_network_connect")

	foundSetsebool := false
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		if c.Name == "setsebool" {
			foundSetsebool = true
			assert.Contains(t, c.Args, "httpd_can_network_connect")
			assert.Contains(t, c.Args, "on")
		}
	}
	assert.True(t, foundSetsebool, "setsebool should enable httpd_can_network_connect")
}

func TestStepTLS_PrivateHostnameSiteAddress(t *testing.T) {
	r, _ := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://heimdall.internal"})
	require.NoError(t, r.stepTLS())
	require.Contains(t, r.Exec.(*FakeExecRunner).Calls, FakeExecCall{
		Name: "sed", Args: []string{"-i", "s|^:443 {|heimdall.internal {|", "/etc/caddy/Caddyfile.d/heimdall-server.caddy"},
	})
}

func TestStepTLS_RequiredCommandFailure(t *testing.T) {
	for _, command := range []string{
		"mkdir -p", "sed -i", "sh -c echo 'import /etc/caddy/Caddyfile.d/*.caddy' >> /etc/caddy/Caddyfile",
		"openssl req", "chown root:caddy", "chmod 640", "chmod 644",
	} {
		for _, result := range []FakeExecResult{{ExitCode: 1}, {Err: errors.New("cannot execute")}} {
			t.Run(command, func(t *testing.T) {
				r, out := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://192.168.1.100"})
				r.Exec.(*FakeExecRunner).Results[command] = result
				require.Error(t, r.stepTLS())
				require.NotContains(t, out.String(), "Caddy: enabled and running")
				require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
			})
		}
	}
}

func TestStepTLS_LookupExecutionFailure(t *testing.T) {
	r, out := newTLSTestRunner(map[string]string{})
	r.Exec.(*FakeExecRunner).Results[`sh -c command -v "$1"`] = FakeExecResult{Err: errors.New("cannot execute")}
	require.ErrorContains(t, r.stepTLS(), "cannot execute")
	require.NotContains(t, out.String(), "Caddy: enabled and running")
}

type tlsFailFS struct {
	FileSystem
	operation string
}

func (f tlsFailFS) CopyFile(src, dst string) error {
	if f.operation == "copy" {
		return errors.New("copy denied")
	}
	return f.FileSystem.CopyFile(src, dst)
}
func (f tlsFailFS) ReadFile(path string) ([]byte, error) {
	if f.operation == "read" {
		return nil, errors.New("read denied")
	}
	return f.FileSystem.ReadFile(path)
}
func (f tlsFailFS) MkdirAll(path string, perm os.FileMode) error {
	if f.operation == "mkdir" {
		return errors.New("mkdir denied")
	}
	return f.FileSystem.MkdirAll(path, perm)
}

func TestStepTLS_RequiredFileFailure(t *testing.T) {
	for _, operation := range []string{"copy", "read", "mkdir"} {
		t.Run(operation, func(t *testing.T) {
			r, out := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://192.168.1.100"})
			r.FS = tlsFailFS{FileSystem: r.FS, operation: operation}
			require.ErrorContains(t, r.stepTLS(), operation+" denied")
			require.NotContains(t, out.String(), "Caddy: enabled and running")
			require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		})
	}
}

func TestBundledCaddyUsesConfiguredPort(t *testing.T) {
	config, err := renderBundledCaddy(map[string]string{"PORT": "3210", "EXTERNAL_URL": "https://heimdall.example.test", "HEIMDALL_TLS_MODE": "internal"})
	require.NoError(t, err)
	require.Contains(t, config, "127.0.0.1:3210")
	require.Contains(t, config, "unix//run/heimdall-caddy/admin.sock")
	require.Contains(t, config, "issuer internal")
	require.NotContains(t, config, "127.0.0.1:3000")
}

func TestLocalCertificateLifetime(t *testing.T) {
	for _, tc := range []struct {
		days, hours, intermediateHours string
	}{
		{"", "168", "1008"},
		{"30", "720", "4320"},
	} {
		t.Run("bundled_"+tc.days, func(t *testing.T) {
			config, err := renderBundledCaddy(map[string]string{
				"EXTERNAL_URL": "https://localhost", "HEIMDALL_TLS_MODE": "internal", "HEIMDALL_TLS_CERT_DAYS": tc.days,
			})
			require.NoError(t, err)
			require.Contains(t, config, "issuer internal {\n\t\t\tlifetime "+tc.hours+"h\n")
			require.Contains(t, config, "intermediate_lifetime "+tc.intermediateHours+"h")
			require.NotContains(t, config, "sign_with_root")
		})
		t.Run("legacy_private_"+tc.days, func(t *testing.T) {
			r, _ := newTLSTestRunner(map[string]string{
				"EXTERNAL_URL": "https://localhost", "HEIMDALL_TLS_CERT_DAYS": tc.days,
			})
			require.NoError(t, r.stepTLS())
			found := false
			for _, call := range r.Exec.(*FakeExecRunner).Calls {
				if call.Name == "sed" && strings.Contains(strings.Join(call.Args, " "), "lifetime "+tc.hours+"h") {
					found = true
				}
			}
			require.True(t, found, "legacy Caddy must receive the requested local certificate lifetime")
		})
	}
	for _, tc := range []struct{ days, want string }{{"", "7"}, {"30", "30"}} {
		t.Run("legacy_ip_"+tc.days, func(t *testing.T) {
			r, _ := newTLSTestRunner(map[string]string{
				"EXTERNAL_URL": "https://192.168.1.100", "HEIMDALL_TLS_CERT_DAYS": tc.days,
			})
			require.NoError(t, r.stepTLS())
			found := false
			for _, call := range r.Exec.(*FakeExecRunner).Calls {
				if call.Name == "openssl" {
					found = true
					require.Contains(t, strings.Join(call.Args, " "), "-days "+tc.want+" -newkey")
				}
			}
			require.True(t, found)
		})
	}
}

func TestBundledCaddyRejectsInvalidCertificateLifetime(t *testing.T) {
	for _, days := range []string{"0", "-1", "1.5", "366", "7\n}"} {
		_, err := renderBundledCaddy(map[string]string{
			"EXTERNAL_URL": "https://localhost", "HEIMDALL_TLS_MODE": "internal", "HEIMDALL_TLS_CERT_DAYS": days,
		})
		require.ErrorContains(t, err, "HEIMDALL_TLS_CERT_DAYS", days)
	}
}

func TestBundledCaddyRejectsUnsafeSettings(t *testing.T) {
	for _, value := range []string{"https://u:p@example.test", "https://example.test/path", "https://example.test?q=x", "https://example.test#x", "file:///tmp/x", "https://example.test:99999", "https://bad_{host}.test"} {
		_, err := renderBundledCaddy(map[string]string{"PORT": "3210", "EXTERNAL_URL": value, "HEIMDALL_TLS_MODE": "internal"})
		require.Error(t, err, value)
	}
	_, err := renderBundledCaddy(map[string]string{"PORT": "3000\ntls internal", "EXTERNAL_URL": "https://example.test", "HEIMDALL_TLS_MODE": "internal"})
	require.Error(t, err)
}

func TestBundledCaddyCustomAndRerunPreserveCA(t *testing.T) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	certificate := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour), DNSNames: []string{"heimdall.example.test"}}
	der, err := x509.CreateCertificate(rand.Reader, certificate, certificate, &key.PublicKey, key)
	require.NoError(t, err)
	keyDER, err := x509.MarshalECPrivateKey(key)
	require.NoError(t, err)
	cert := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	private := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})
	r := bundledSetupFixture(t)
	r.SkipDB = true
	r.TLSMode = "custom"
	r.TLSCert = "/source/cert.pem"
	r.TLSKey = "/source/key.pem"
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.TLSCert] = cert
	fs.Files[r.TLSKey] = private
	fs.Files[bundledCaddyRoot] = []byte("unchanged CA")
	require.NoError(t, r.Run())
	env := r.Env.(*FakeEnvManager).Env
	require.Equal(t, r.Paths.ConfigDir+"/caddy/certs/server.crt", env["HEIMDALL_TLS_CERT"])
	require.Equal(t, private, fs.Files[env["HEIMDALL_TLS_KEY"]])
	require.Contains(t, string(fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"]), `tls "/etc/heimdall-server/caddy/certs/server.crt" "/etc/heimdall-server/caddy/certs/server.key"`)
	delete(fs.Files, "/source/cert.pem")
	delete(fs.Files, "/source/key.pem")
	r.TLSCert, r.TLSKey = "", ""
	require.NoError(t, r.Run())
	require.Equal(t, cert, fs.Files[env["HEIMDALL_TLS_CERT"]])
	require.Equal(t, "unchanged CA", string(fs.Files[bundledCaddyRoot]))
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		require.NotEqual(t, "update-ca-trust", call.Name)
	}
}

func TestBundledCaddyRejectsCertificateBeforeReplacingConfig(t *testing.T) {
	r := bundledSetupFixture(t)
	r.SkipDB = true
	r.TLSMode = "custom"
	r.TLSCert = "/bad.crt"
	r.TLSKey = "/bad.key"
	fs := r.FS.(*FakeFileSystem)
	fs.Files["/bad.crt"] = []byte("invalid")
	fs.Files["/bad.key"] = []byte("invalid")
	fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"] = []byte("retained")
	before, _ := r.Env.ReadEnv()
	require.Error(t, r.Run())
	require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
	require.Equal(t, "retained", string(fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"]))
	require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
}

func TestBundledManagedPathsRejectSymlinks(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "target")
	require.NoError(t, os.Mkdir(target, 0700))
	link := filepath.Join(dir, "link")
	require.NoError(t, os.Symlink(target, link))
	require.ErrorContains(t, safeManagedPath(&osFileSystem{}, link+"/Caddyfile"), "unsafe managed path")
	file := filepath.Join(target, "file")
	require.NoError(t, os.WriteFile(file, []byte("unchanged"), 0600))
	require.NoError(t, os.Symlink(file, filepath.Join(target, "Caddyfile")))
	require.ErrorContains(t, safeManagedPath(&osFileSystem{}, filepath.Join(target, "Caddyfile")), "unsafe managed path")
	require.NoError(t, os.Link(file, filepath.Join(target, "hardlink")))
	require.ErrorContains(t, safeManagedPath(&osFileSystem{}, filepath.Join(target, "hardlink")), "hard-linked")
	data, err := os.ReadFile(file)
	require.NoError(t, err)
	require.Equal(t, "unchanged", string(data))
}

func TestBundledCaddyStartFailureRestoresConfiguration(t *testing.T) {
	r := bundledSetupFixture(t)
	r.SkipDB = true
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"] = []byte("old config")
	r.Systemd = &caddyStartFailure{r.Systemd.(*FakeSystemdRunner)}
	before, _ := r.Env.ReadEnv()
	require.Error(t, r.Run())
	require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
	require.Equal(t, "old config", string(fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"]))
	require.NotContains(t, r.Systemd.(*caddyStartFailure).Actions, "restart:"+ServiceName)
}

type caddyStartFailure struct{ *FakeSystemdRunner }

func (s *caddyStartFailure) Start(unit string) error {
	if unit == bundledCaddyService {
		return fmt.Errorf("start failed")
	}
	return s.FakeSystemdRunner.Start(unit)
}

func TestBundledCaddyCanonicalWhitespace(t *testing.T) {
	config, err := renderBundledCaddy(map[string]string{"PORT": "3210", "EXTERNAL_URL": "https://heimdall.example.test", "HEIMDALL_TLS_MODE": "internal"})
	require.NoError(t, err)
	require.Equal(t, "{\n\tadmin unix//run/heimdall-caddy/admin.sock\n\tskip_install_trust\n\tpki {\n\t\tca local {\n\t\t\tintermediate_lifetime 1008h\n\t\t}\n\t}\n}\n\"https://heimdall.example.test\" {\n\ttls {\n\t\tissuer internal {\n\t\t\tlifetime 168h\n\t\t}\n\t}\n\treverse_proxy \"127.0.0.1:3210\"\n}\n", config)
}
