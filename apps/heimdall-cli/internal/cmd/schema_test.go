package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateValue_BoolInvalid(t *testing.T) {
	err := ValidateValue("LDAP_ENABLED", "maybe")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "true")
}

func TestValidateValue_UnknownKey(t *testing.T) {
	err := ValidateValue("TOTALLY_UNKNOWN_KEY", "value")
	assert.NoError(t, err)
}
