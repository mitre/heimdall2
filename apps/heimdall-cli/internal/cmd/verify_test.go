package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFakeExecRunner_Verify_AllMatched(t *testing.T) {
	f := &FakeExecRunner{
		Results: map[string]FakeExecResult{
			"semanage port": {ExitCode: 0},
		},
	}

	// Call the registered command
	f.Run("semanage", "port", "-a", "-t", "heimdall_server_port_t")

	// Verify should pass — all stubs matched
	// Using the real *testing.T here; if Verify fails, the test fails
	f.Verify(t)
}

func TestFakeExecRunner_Verify_DetectsUnmatched(t *testing.T) {
	f := &FakeExecRunner{
		Results: map[string]FakeExecResult{
			"semanage port": {ExitCode: 0},
			"caddy trust":   {ExitCode: 0},
		},
	}

	// Only call one of the two registered commands
	f.Run("semanage", "port", "-a")

	// Check that "caddy trust" is NOT matched
	result := f.Results["caddy trust"]
	assert.False(t, result.matched, "caddy trust should be unmatched")

	// The semanage one should be matched
	result2 := f.Results["semanage port"]
	assert.True(t, result2.matched, "semanage port should be matched")
}

func TestFakeExecRunner_Verify_NoStubs(t *testing.T) {
	f := &FakeExecRunner{
		Results: map[string]FakeExecResult{},
	}

	// No stubs registered, no calls made — should pass
	f.Verify(t)
}

func TestFakeExecRunner_RunWithStdin_RecordsStdinAndReturnsResult(t *testing.T) {
	f := &FakeExecRunner{
		Results: map[string]FakeExecResult{
			"psql -d postgres": {Stdout: "ok", ExitCode: 0},
		},
	}

	stdout, code, err := f.RunWithStdin("CREATE ROLE bob;\n", "psql", "-d", "postgres")

	assert.NoError(t, err)
	assert.Equal(t, 0, code)
	assert.Equal(t, "ok", stdout)
	assert.Len(t, f.Calls, 1)
	assert.Equal(t, "psql", f.Calls[0].Name)
	assert.Equal(t, []string{"-d", "postgres"}, f.Calls[0].Args)
	assert.Equal(t, "CREATE ROLE bob;\n", f.Calls[0].Stdin,
		"FakeExecCall must record the stdin payload")
}
