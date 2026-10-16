package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDefaultPasswordRules(t *testing.T) {
	rules := DefaultPasswordRules()
	assert.Equal(t, 15, rules.MinLength, "MinLength must match upstream libs/password-complexity")
	assert.Equal(t, 4, rules.RequireClasses, "RequireClasses must be 4 (upper, lower, digit, special)")
	assert.Equal(t, 4, rules.MaxConsecutive, "MaxConsecutive must be 4")
}

func TestDefaultAppPort(t *testing.T) {
	assert.Equal(t, "3000", DefaultAppPort, "default Heimdall port is 3000")
}

func TestDefaultDBPort(t *testing.T) {
	assert.Equal(t, 5432, DefaultDBPort, "default PostgreSQL port is 5432")
}

func TestServiceNameConstant(t *testing.T) {
	assert.Equal(t, "heimdall-server", ServiceName)
}

func TestSecretsSet_ContainsAllExpectedKeys(t *testing.T) {
	expectedSecrets := []string{
		"DATABASE_PASSWORD",
		"JWT_SECRET",
		"API_KEY_SECRET",
		"ADMIN_PASSWORD",
		"OKTA_CLIENTSECRET",
		"GITHUB_CLIENTSECRET",
		"GITLAB_CLIENTSECRET",
		"GOOGLE_CLIENTSECRET",
		"OIDC_CLIENT_SECRET",
		"LDAP_PASSWORD",
	}
	for _, key := range expectedSecrets {
		assert.True(t, SecretsSet[key], "SecretsSet must include %s", key)
	}
}

func TestSecretsSet_DoesNotContainNonSecrets(t *testing.T) {
	nonSecrets := []string{
		"PORT",
		"DATABASE_HOST",
		"NODE_ENV",
		"EXTERNAL_URL",
	}
	for _, key := range nonSecrets {
		assert.False(t, SecretsSet[key], "SecretsSet must not include %s", key)
	}
}

func TestSecretsSet_Length(t *testing.T) {
	assert.Equal(t, 10, len(SecretsSet), "SecretsSet should have exactly 10 entries")
}

func TestPathDefaults_AreAbsolute(t *testing.T) {
	paths := map[string]string{
		"EnvFile":    EnvFile,
		"AppDir":     AppDir,
		"DataDir":    DataDir,
		"LibExecDir": LibExecDir,
		"CertDir":    CertDir,
		"ConfigDir":  ConfigDir,
		"LogDir":     LogDir,
	}
	for name, path := range paths {
		assert.NotEmpty(t, path, "%s must not be empty", name)
		assert.Equal(t, "/", string(path[0]), "%s must be an absolute path, got: %s", name, path)
	}
}
