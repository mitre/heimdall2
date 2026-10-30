package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSecretsSet_ContainsAllSecretKeys(t *testing.T) {
	// Every key marked as type "secret" in the schema must be in SecretsSet
	for key, entry := range ConfigSchema {
		if entry.Type == "secret" {
			assert.True(t, SecretsSet[key] || IsSecret(key),
				"secret schema key %q should be detected by IsSecret()", key)
		}
	}
}

func TestSecretsSet_CorrectKeyNames(t *testing.T) {
	// Verify SecretsSet keys actually exist in the schema
	for key := range SecretsSet {
		_, exists := ConfigSchema[key]
		assert.True(t, exists, "SecretsSet key %q does not exist in ConfigSchema — possible typo", key)
	}
}

func TestIsSecret_AdminPassword(t *testing.T) {
	assert.True(t, IsSecret("ADMIN_PASSWORD"), "ADMIN_PASSWORD should be a secret")
}

func TestIsSecret_GitlabClientSecret(t *testing.T) {
	assert.True(t, IsSecret("GITLAB_CLIENTSECRET"), "GITLAB_CLIENTSECRET should be a secret")
}
