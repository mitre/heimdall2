package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateHostname(t *testing.T) {
	tests := []struct {
		host    string
		wantErr bool
	}{
		// Valid hostnames
		{"example.com", false},
		{"heimdall.example.com", false},
		{"my-server.internal", false},
		{"localhost", false},
		{"192.168.1.1", false},
		{"10.0.0.1", false},
		{"a", false},

		// Invalid — sed/openssl injection vectors
		{"example.com|touch /tmp/pwned", true},
		{"example.com;echo pwned", true},
		{"example.com\necho pwned", true},
		{`example.com\;echo pwned`, true},
		{"example.com&echo pwned", true},
		{"example.com'DROP TABLE", true},
		{`example.com"DROP TABLE`, true},
		{"", true},
		{"example .com", true},
		{"/CN=evil/O=Attacker", true},
	}

	for _, tt := range tests {
		t.Run(tt.host, func(t *testing.T) {
			err := validateHostname(tt.host)
			if tt.wantErr {
				assert.Error(t, err, "validateHostname(%q) should reject", tt.host)
			} else {
				assert.NoError(t, err, "validateHostname(%q) should accept", tt.host)
			}
		})
	}
}

func TestIsPrivateHostname(t *testing.T) {
	tests := []struct {
		host string
		want bool
	}{
		// Private suffixes — all should return true
		{"heimdall.internal", true},
		{"app.heimdall.internal", true},
		{"heimdall.local", true},
		{"heimdall.lan", true},
		{"heimdall.localdomain", true},
		{"heimdall.home.arpa", true},
		{"heimdall.corp", true},
		{"heimdall.private", true},
		{"heimdall.test", true},

		// Single-label (no dots) — private
		{"heimdall", true},
		{"localhost", true},
		{"myserver", true},

		// Public hostnames — should return false
		{"example.com", false},
		{"heimdall.example.com", false},
		{"app.heimdall.example.com", false},
		{"mitre.org", false},

		// Edge cases
		{"", true},                    // empty string has no dots → private
		{"192.168.1.1", false},        // IP address has dots → not caught as private
		{"10.0.0.1", false},           // IP address
		{"a.b", false},               // two-label, not a private suffix
		{"heimdall.internal.com", false}, // .internal is not the suffix here
	}

	for _, tt := range tests {
		t.Run(tt.host, func(t *testing.T) {
			got := isPrivateHostname(tt.host)
			assert.Equal(t, tt.want, got, "isPrivateHostname(%q)", tt.host)
		})
	}
}
