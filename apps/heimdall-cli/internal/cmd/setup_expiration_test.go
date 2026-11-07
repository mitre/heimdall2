package cmd

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func expirationSetupFixture(t *testing.T) (*SetupRunner, *FakePrompter) {
	t.Helper()
	r, _, _ := newTestSetupRunner()
	r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{"runtimes":{"node":{"version":"22.23.3"},"postgresql":{"version":"18.6"},"caddy":{"version":"2.11.4"}}}`)
	p := &FakePrompter{IsTTY: true}
	r.Prompter = p
	return r, p
}

func TestInteractiveExpirationDefaultsAndPersistence(t *testing.T) {
	for _, tc := range []struct {
		name, savedJWT, savedDays, inputJWT, inputDays, wantJWT, wantDays string
		answer                                                            bool
	}{
		{name: "fresh defaults", wantJWT: "1d", wantDays: "7"},
		{name: "saved defaults", savedJWT: "25m", savedDays: "30", wantJWT: "25m", wantDays: "30"},
		{name: "cleared fresh defaults", answer: true, wantJWT: "1d", wantDays: "7"},
		{name: "cleared saved defaults", savedJWT: "1.5h", savedDays: "14", answer: true, wantJWT: "1.5h", wantDays: "14"},
		{name: "explicit values", inputJWT: "25m", inputDays: "30", answer: true, wantJWT: "25m", wantDays: "30"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, p := expirationSetupFixture(t)
			r.Env.(*FakeEnvManager).Env = map[string]string{
				"JWT_EXPIRE_TIME": tc.savedJWT, "HEIMDALL_TLS_CERT_DAYS": tc.savedDays,
			}
			jwtDefault, daysDefault := tc.savedJWT, tc.savedDays
			if jwtDefault == "" {
				jwtDefault = "1d"
			}
			if daysDefault == "" {
				daysDefault = "7"
			}
			jwtPrompt := "JWT expiration (e.g. 1d or 25m)"
			daysPrompt := "Certificate lifetime in days"
			if tc.answer {
				p.Inputs = map[string]string{jwtPrompt: tc.inputJWT, daysPrompt: tc.inputDays}
			}
			cmd := NewSetupCmd(r)
			cmd.SetArgs([]string{"--interactive", "--reconfigure"})
			require.NoError(t, cmd.Execute())
			assert.Equal(t, jwtDefault, p.InputDefaults[jwtPrompt])
			assert.Equal(t, daysDefault, p.InputDefaults[daysPrompt])
			env := r.Env.(*FakeEnvManager).Env
			assert.Equal(t, tc.wantJWT, env["JWT_EXPIRE_TIME"])
			assert.Equal(t, tc.wantDays, env["HEIMDALL_TLS_CERT_DAYS"])
			assert.Equal(t, "https://localhost", env["EXTERNAL_URL"])

			before, err := r.Env.ReadEnv()
			require.NoError(t, err)
			cmd = NewSetupCmd(r)
			cmd.SetArgs([]string{"--non-interactive", "--reconfigure"})
			require.NoError(t, cmd.Execute())
			assert.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		})
	}
}

func TestInteractiveCertificateLifetimePromptOwnership(t *testing.T) {
	for _, tc := range []struct {
		name   string
		args   []string
		legacy bool
		prompt bool
	}{
		{name: "bundled internal", prompt: true},
		{name: "bundled internal public hostname", args: []string{"--external-url=https://heimdall.example.com", "--tls-mode=internal"}, prompt: true},
		{name: "ACME", args: []string{"--external-url=https://heimdall.example.com", "--tls-mode=acme"}},
		{name: "custom certificate", args: []string{"--tls-cert=/cert.pem", "--tls-key=/key.pem"}},
		{name: "external termination", args: []string{"--proxy-mode=external"}},
		{name: "no TLS", args: []string{"--proxy-mode=none"}},
		{name: "skip TLS", args: []string{"--skip-tls"}},
		{name: "HTTP URL", args: []string{"--external-url=http://localhost:3000", "--port=3210"}},
		{name: "legacy private hostname", args: []string{"--external-url=https://heimdall.internal"}, legacy: true, prompt: true},
		{name: "legacy IP", args: []string{"--external-url=https://192.168.1.100"}, legacy: true, prompt: true},
		{name: "legacy public hostname", args: []string{"--external-url=https://heimdall.example.com"}, legacy: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, p := expirationSetupFixture(t)
			if tc.legacy {
				delete(r.FS.(*FakeFileSystem).Files, r.Paths.AppDir+"/runtime-manifest.json")
			}
			r.Env.(*FakeEnvManager).Env["HEIMDALL_TLS_CERT_DAYS"] = "14"
			cmd := NewSetupCmd(r)
			cmd.SetArgs(append([]string{"--interactive", "--reconfigure"}, tc.args...))
			require.NoError(t, cmd.Execute())
			prompted := false
			for title, defaultValue := range p.InputDefaults {
				if strings.HasPrefix(title, "Certificate lifetime in days") {
					prompted = true
					assert.Equal(t, "14", defaultValue)
				}
			}
			assert.Equal(t, tc.prompt, prompted)
			assert.Equal(t, "14", r.Env.(*FakeEnvManager).Env["HEIMDALL_TLS_CERT_DAYS"])
			assert.Equal(t, "1d", p.InputDefaults["JWT expiration (e.g. 1d or 25m)"])
		})
	}
}

func TestExpirationSchemaValidation(t *testing.T) {
	for _, tc := range []struct {
		key     string
		valid   []string
		invalid []string
	}{
		{
			key:     "JWT_EXPIRE_TIME",
			valid:   []string{"25m", "1d", "1.5h", "2 days", "90000", "7d"},
			invalid: []string{"", "garbage", "0", "0m", "-1d", "1h30m", "1d\nPORT=1234"},
		},
		{
			key:     "HEIMDALL_TLS_CERT_DAYS",
			valid:   []string{"1", "7", "365"},
			invalid: []string{"", "0", "-1", "366", "1.5", "7d", "7\nPORT=1234"},
		},
	} {
		t.Run(tc.key, func(t *testing.T) {
			require.Contains(t, ConfigSchema, tc.key)
			for _, value := range tc.valid {
				assert.NoError(t, ValidateValue(tc.key, value), "value %q", value)
			}
			for _, value := range tc.invalid {
				assert.Error(t, ValidateValue(tc.key, value), "value %q", value)
			}
		})
	}
}

func TestInteractiveInvalidExpirationHasNoSideEffects(t *testing.T) {
	for _, tc := range []struct {
		name, title, value string
	}{
		{"JWT garbage", "JWT expiration (e.g. 1d or 25m)", "garbage"},
		{"JWT zero", "JWT expiration (e.g. 1d or 25m)", "0m"},
		{"JWT negative", "JWT expiration (e.g. 1d or 25m)", "-1d"},
		{"JWT newline", "JWT expiration (e.g. 1d or 25m)", "1d\nPORT=1234"},
		{"certificate zero", "Certificate lifetime in days", "0"},
		{"certificate over limit", "Certificate lifetime in days", "366"},
		{"certificate fraction", "Certificate lifetime in days", "1.5"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, p := expirationSetupFixture(t)
			p.Inputs = map[string]string{tc.title: tc.value}
			before, err := r.Env.ReadEnv()
			require.NoError(t, err)
			fs := r.FS.(*FakeFileSystem)
			files := map[string][]byte{}
			for path, data := range fs.Files {
				files[path] = append([]byte(nil), data...)
			}
			cmd := NewSetupCmd(r)
			cmd.SetArgs([]string{"--interactive", "--reconfigure"})
			require.Error(t, cmd.Execute())
			assert.Equal(t, before, r.Env.(*FakeEnvManager).Env)
			assert.Equal(t, files, fs.Files)
			assert.Empty(t, fs.Dirs)
			assert.Empty(t, r.Exec.(*FakeExecRunner).Calls)
			assert.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		})
	}
}
