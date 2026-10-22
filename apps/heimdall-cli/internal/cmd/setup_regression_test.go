package cmd

import (
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestSetupPreservesDisabledAPIKeys(t *testing.T) {
	for _, interactive := range []bool{false, true} {
		for _, configured := range []bool{false, true} {
			for _, present := range []bool{false, true} {
				t.Run(fmt.Sprintf("interactive=%t/configured=%t/present=%t", interactive, configured, present), func(t *testing.T) {
					r, _, _ := newTestSetupRunner()
					if configured {
						r = bundledSetupFixture(t)
					}
					env := r.Env.(*FakeEnvManager)
					delete(env.Env, "API_KEY_SECRET")
					if present {
						env.Env["API_KEY_SECRET"] = ""
					}
					r.Interactive = interactive
					r.Prompter = &FakePrompter{IsTTY: true}
					require.NoError(t, r.stepConfigure())
					if configured && present {
						require.Empty(t, env.Env["API_KEY_SECRET"], "an explicitly empty secret disables API keys")
					} else {
						require.NotEmpty(t, env.Env["API_KEY_SECRET"], "fresh or missing secrets are generated")
					}
				})
			}
		}
	}
}

func TestSetupSkipTLSRejectsManagedEndpointChanges(t *testing.T) {
	for _, proxy := range []string{"bundled", "nginx", "standalone"} {
		for _, flag := range []string{"--port=4567", "--external-url=https://changed.example.test"} {
			t.Run(proxy+"/"+flag, func(t *testing.T) {
				r := bundledSetupFixture(t)
				fs := r.FS.(*FakeFileSystem)
				env := r.Env.(*FakeEnvManager)
				if proxy == "nginx" {
					env.Env["HEIMDALL_PROXY_MODE"] = "nginx"
					env.Env["HEIMDALL_TLS_MODE"] = "self-signed"
					fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
				} else if proxy == "standalone" {
					delete(fs.Files, r.Paths.AppDir+"/runtime-manifest.json")
					delete(env.Env, "HEIMDALL_PROXY_MODE")
				}
				before, _ := env.ReadEnv()
				command := NewSetupCmd(r)
				command.SetArgs([]string{"--non-interactive", "--reconfigure", "--skip-tls", flag})
				require.ErrorContains(t, command.Execute(), "endpoint changes require proxy setup")
				require.Equal(t, before, env.Env)
				require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
			})
		}
	}
}

func TestSetupSkipTLSAllowsUnchangedAndUnmanagedEndpoints(t *testing.T) {
	for _, proxy := range []string{"bundled", "external", "none"} {
		t.Run(proxy, func(t *testing.T) {
			r := bundledSetupFixture(t)
			r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"] = proxy
			port, rawURL := "3210", "heimdall.example.test/"
			if proxy != "bundled" {
				port, rawURL = "4567", "https://changed.example.test"
			}
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--reconfigure", "--skip-tls", "--port=" + port, "--external-url=" + rawURL})
			require.NoError(t, command.Execute())
			require.Equal(t, port, r.Env.(*FakeEnvManager).Env["PORT"])
		})
	}
}

func TestSetupSkipTLSRejectsInteractiveEndpointChanges(t *testing.T) {
	for _, startFresh := range []bool{false, true} {
		t.Run(fmt.Sprintf("startFresh=%t", startFresh), func(t *testing.T) {
			r := bundledSetupFixture(t)
			prompter := &FakePrompter{IsTTY: true, Inputs: map[string]string{"Backend port": "4567"}}
			if startFresh {
				delete(r.FS.(*FakeFileSystem).Files, r.Paths.AppDir+"/runtime-manifest.json")
				prompter.Selects = map[string]int{"What would you like to do?": 2}
			}
			r.Prompter = prompter
			before, _ := r.Env.ReadEnv()
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--interactive", "--reconfigure", "--skip-tls"})
			require.ErrorContains(t, command.Execute(), "endpoint changes require proxy setup")
			require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		})
	}
}

func TestSetupSkipTLSStartFreshRejectsProxyOwnershipChanges(t *testing.T) {
	for _, legacy := range []bool{false, true} {
		for _, selection := range []int{1, 3} {
			for _, flag := range []string{"--skip-db", "--reconfigure"} {
				t.Run(fmt.Sprintf("legacy=%t/selection=%d/%s", legacy, selection, flag), func(t *testing.T) {
					r := bundledSetupFixture(t)
					fs := r.FS.(*FakeFileSystem)
					delete(fs.Files, r.Paths.AppDir+"/runtime-manifest.json")
					if legacy {
						delete(r.Env.(*FakeEnvManager).Env, "HEIMDALL_PROXY_MODE")
					}
					const proxy = "https://heimdall.example.test { reverse_proxy 127.0.0.1:3210 }\n"
					fs.Files[standaloneCaddyfile] = []byte(proxy)
					r.Prompter = &FakePrompter{
						IsTTY:   true,
						Selects: map[string]int{"What would you like to do?": 2, "TLS/SSL setup": selection},
						Inputs:  map[string]string{"Backend port": "4567"},
					}
					before, _ := r.Env.ReadEnv()
					command := NewSetupCmd(r)
					command.SetArgs([]string{"--interactive", "--skip-tls", flag})
					require.ErrorContains(t, command.Execute(), "proxy ownership changes require full setup")
					require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
					require.Equal(t, proxy, string(fs.Files[standaloneCaddyfile]))
					require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
				})
			}
		}
	}
}

func TestSetupPublicHostnameTLSDefault(t *testing.T) {
	for _, raw := range []string{"portal.example.com", "portal.example.com:8443", "https://portal.example.com"} {
		t.Run(raw, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--reconfigure", "--proxy-mode=bundled", "--external-url=" + raw})
			require.NoError(t, command.Execute())
			require.Equal(t, "acme", r.Env.(*FakeEnvManager).Env["HEIMDALL_TLS_MODE"])
		})
	}
}

func TestPrivateHostnameTLSIgnoresCase(t *testing.T) {
	for _, host := range []string{"portal.test", "portal.TEST", "portal.LaN", "portal.CORP", "portal.PRIVATE"} {
		t.Run(host, func(t *testing.T) {
			require.Equal(t, "internal", defaultTLSMode("https://"+host, "", ""))
		})
	}
}

func TestCaddyRejectsInvalidCustomCertificate(t *testing.T) {
	cert, key, err := selfSignedCertificate("heimdall.example.test", 7)
	require.NoError(t, err)
	block, _ := pem.Decode(cert)
	leaf, err := x509.ParseCertificate(block.Bytes)
	require.NoError(t, err)
	keyBlock, _ := pem.Decode(key)
	privateKey, err := x509.ParsePKCS1PrivateKey(keyBlock.Bytes)
	require.NoError(t, err)
	for _, kind := range []string{"expired", "future", "wrong hostname", "valid"} {
		certificate := *leaf
		switch kind {
		case "expired":
			certificate.NotBefore = time.Now().Add(-48 * time.Hour)
			certificate.NotAfter = time.Now().Add(-24 * time.Hour)
		case "future":
			certificate.NotBefore = time.Now().Add(24 * time.Hour)
		case "wrong hostname":
			certificate.DNSNames = []string{"other.example.test"}
		}
		der, err := x509.CreateCertificate(rand.Reader, &certificate, &certificate, &privateKey.PublicKey, privateKey)
		require.NoError(t, err)
		candidate := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
		for _, bundled := range []bool{true, false} {
			t.Run(fmt.Sprintf("%s/bundled=%t", kind, bundled), func(t *testing.T) {
				r := bundledSetupFixture(t)
				fs := r.FS.(*FakeFileSystem)
				fs.Files["/candidate.crt"], fs.Files["/candidate.key"] = candidate, key
				before, _ := r.Env.ReadEnv()
				configPath := r.Paths.ConfigDir + "/caddy/Caddyfile"
				fs.Files[configPath] = []byte("previous working configuration")
				if bundled {
					command := NewSetupCmd(r)
					command.SetArgs([]string{"--non-interactive", "--tls-mode=custom", "--tls-cert=/candidate.crt", "--tls-key=/candidate.key"})
					err = command.Execute()
				} else {
					r.TLSCert, r.TLSKey = "/candidate.crt", "/candidate.key"
					err = r.configureCaddyfile(tlsBYO, "heimdall.example.test", "https://heimdall.example.test", configPath)
				}
				if kind == "valid" {
					require.NoError(t, err)
					require.Contains(t, string(fs.Files[configPath]), "reverse_proxy")
				} else {
					if kind == "wrong hostname" {
						require.ErrorContains(t, err, "does not match external hostname")
					} else {
						require.ErrorContains(t, err, "outside its validity period")
					}
					require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
					require.Equal(t, "previous working configuration", string(fs.Files[configPath]))
					require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
				}
			})
		}
	}
}
