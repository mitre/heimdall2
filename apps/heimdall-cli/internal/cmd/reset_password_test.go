package cmd

import (
	"bytes"
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newResetPasswordRunner(exec *FakeExecRunner, env *FakeEnvManager) (*ResetPasswordRunner, *bytes.Buffer, *bytes.Buffer) {
	out := new(bytes.Buffer)
	errOut := new(bytes.Buffer)
	return &ResetPasswordRunner{
		Exec:   exec,
		Env:    env,
		Hasher: &FakePasswordHasher{HashResult: "$2a$14$testhash"},
		Out:    out,
		ErrOut: errOut,
	}, out, errOut
}

func TestResetPassword_GeneratedPasswordDisplayed(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{
		"psql -h": {Stdout: "UPDATE 1", ExitCode: 0},
	}}
	env := &FakeEnvManager{Env: map[string]string{
		"DATABASE_PASSWORD": "secret",
	}}
	runner, out, _ := newResetPasswordRunner(exec, env)

	err := runner.Run("admin@heimdall.local", "")
	require.NoError(t, err)
	assert.Contains(t, out.String(), "New password:")
	assert.Contains(t, out.String(), "Save this password")
}

func TestResetPassword_ProvidedValidPassword(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{
		"psql -h": {Stdout: "UPDATE 1", ExitCode: 0},
	}}
	env := &FakeEnvManager{Env: map[string]string{
		"DATABASE_PASSWORD": "secret",
	}}
	runner, out, _ := newResetPasswordRunner(exec, env)

	err := runner.Run("admin@heimdall.local", "aB1!cD2@eF3#gH4$")
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Password reset for admin@heimdall.local")
	assert.NotContains(t, out.String(), "New password:")
}

func TestResetPassword_ProvidedInvalidPassword(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
	env := &FakeEnvManager{Env: map[string]string{
		"DATABASE_PASSWORD": "secret",
	}}
	runner, _, errOut := newResetPasswordRunner(exec, env)

	err := runner.Run("admin@heimdall.local", "short")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "password validation failed")
	assert.Contains(t, errOut.String(), "complexity requirements")
}

func TestResetPassword_AcceptsApplicationEmailForms(t *testing.T) {
	for _, email := range []string{
		"o'connor@example.com",
		"user!#$%&'*+-/=?^_`{|}~@example.com",
		"josé@example.com",
		"user@例え.テスト",
		`"quoted name"@example.com`,
		`"o'connor; admin"@example.com`,
	} {
		t.Run(email, func(t *testing.T) {
			exec := &FakeExecRunner{Results: map[string]FakeExecResult{"psql -h": {Stdout: "UPDATE 1"}}}
			runner, out, _ := newResetPasswordRunner(exec, &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "secret"}})
			require.NoError(t, runner.Run(email, "aB1!cD2@eF3#gH4$"))
			require.Len(t, exec.Calls, 1)
			require.Contains(t, exec.Calls[0].Args, "email="+email)
			require.Contains(t, exec.Calls[0].Stdin, "WHERE email = :'email'")
			require.NotContains(t, exec.Calls[0].Stdin, email)
			require.Contains(t, out.String(), "Password reset for "+email)
		})
	}
}

func TestResetPassword_NoDatabasePassword(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
	env := &FakeEnvManager{Env: map[string]string{}}
	runner, _, _ := newResetPasswordRunner(exec, env)

	err := runner.Run("admin@heimdall.local", "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "DATABASE_PASSWORD not set")
}

func TestResetPassword_UserNotFound(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{
		"psql -h": {Stdout: "UPDATE 0", ExitCode: 0},
	}}
	env := &FakeEnvManager{Env: map[string]string{
		"DATABASE_PASSWORD": "secret",
	}}
	runner, out, _ := newResetPasswordRunner(exec, env)

	err := runner.Run("nobody@example.com", "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "user not found")
	assert.NotContains(t, out.String(), "Password reset for")
	assert.NotContains(t, out.String(), "New password:")
}

func TestResetPassword_PsqlFailure(t *testing.T) {
	for _, failure := range []FakeExecResult{{ExitCode: 1, Err: fmt.Errorf("connection refused")}, {ExitCode: 1}, {Stdout: "ERROR: SQL fixture failure", ExitCode: 3}} {
		exec := &FakeExecRunner{Results: map[string]FakeExecResult{"psql -h": failure}}
		env := &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "secret"}}
		runner, out, _ := newResetPasswordRunner(exec, env)
		err := runner.Run("admin@heimdall.local", "")
		require.ErrorContains(t, err, "database update failed")
		require.NotContains(t, out.String(), "Password reset for")
		require.NotContains(t, out.String(), "New password:")
	}
}

func TestResetPassword_RejectsInvalidEmail(t *testing.T) {
	tests := []struct {
		name  string
		email string
	}{
		{"SQL injection single quote", "admin'; DROP TABLE Users; --"},
		{"SQL injection double dash", "admin@test.com' --"},
		{"no at sign", "notanemail"},
		{"empty string", ""},
		{"just at sign", "@"},
		{"spaces", "admin @test.com"},
		{"newlines", "admin@test.com\nDROP TABLE"},
		{"semicolons", "admin;evil@test.com"},
		{"display name", "Admin <admin@test.com>"},
		{"angle address", "<admin@test.com>"},
		{"comment", "admin(comment)@test.com"},
		{"leading whitespace", " admin@test.com"},
		{"consecutive dots", "admin..test@example.com"},
		{"NUL", "admin\x00@test.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
			env := &FakeEnvManager{Env: map[string]string{
				"DATABASE_PASSWORD": "secret",
			}}
			runner, _, _ := newResetPasswordRunner(exec, env)
			err := runner.Run(tt.email, "aB1!cD2@eF3#gH4$")
			require.Error(t, err)
			assert.Contains(t, err.Error(), "invalid email")
		})
	}
}

func TestResetPassword_ErrorDoesNotLeakEmail(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{
		"psql -h": {Stdout: "UPDATE 0"},
	}}
	env := &FakeEnvManager{Env: map[string]string{
		"DATABASE_PASSWORD": "secret",
	}}
	runner, _, _ := newResetPasswordRunner(exec, env)
	err := runner.Run("sensitive@secret.com", "aB1!cD2@eF3#gH4$")
	require.Error(t, err)
	// Error message should NOT contain the email (finding #19)
	assert.NotContains(t, err.Error(), "sensitive@secret.com")
	assert.Contains(t, err.Error(), "user not found")
}

func TestResetPassword_InteractiveDoubleEntry(t *testing.T) {
	password := strings.Repeat("aB1!", 4)
	runner := &ResetPasswordRunner{
		Exec:   &FakeExecRunner{Results: map[string]FakeExecResult{"psql -h": {Stdout: "UPDATE 1"}}},
		Env:    &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "dbpass"}},
		Hasher: &FakePasswordHasher{},
		Prompter: &FakePrompter{
			Inputs: map[string]string{
				"New password (blank to auto-generate)": password,
				"Confirm password":                      password,
			},
			IsTTY: true,
		},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := runner.Run("admin@heimdall.local", "")
	require.NoError(t, err)
	assert.Contains(t, runner.Out.(*bytes.Buffer).String(), "Password reset for admin@heimdall.local")
}

func TestResetPassword_InteractiveMismatch(t *testing.T) {
	runner := &ResetPasswordRunner{
		Exec:   &FakeExecRunner{Results: map[string]FakeExecResult{}},
		Env:    &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "dbpass"}},
		Hasher: &FakePasswordHasher{},
		Prompter: &FakePrompter{
			Inputs: map[string]string{
				"New password (blank to auto-generate)": "aB1!cD2@eF3#gH4$",
				"Confirm password":                      "different-password",
			},
			IsTTY: true,
		},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := runner.Run("admin@heimdall.local", "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "passwords do not match")
}

func TestResetPassword_InteractiveBlankAutoGenerates(t *testing.T) {
	runner := &ResetPasswordRunner{
		Exec:   &FakeExecRunner{Results: map[string]FakeExecResult{"psql -h": {Stdout: "UPDATE 1"}}},
		Env:    &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "dbpass"}},
		Hasher: &FakePasswordHasher{},
		Prompter: &FakePrompter{
			Inputs: map[string]string{
				"New password (blank to auto-generate)": "",
			},
			IsTTY: true,
		},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := runner.Run("admin@heimdall.local", "")
	require.NoError(t, err)
	assert.Contains(t, runner.Out.(*bytes.Buffer).String(), "New password:")
}

func TestResetPasswordUsesInputAndPrivateConnectionEnvironment(t *testing.T) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{"psql -h": {Stdout: "UPDATE 1"}}}
	env := &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "db-secret"}}
	runner, _, _ := newResetPasswordRunner(exec, env)
	require.NoError(t, runner.Run("admin+audit@example.com", "aB1!cD2@eF3#gH4$"))
	require.Len(t, exec.Calls, 1)
	call := exec.Calls[0]
	require.Contains(t, call.Stdin, "WHERE email = :'email'")
	require.Contains(t, call.Args, "hash=$2a$14$testhash")
	require.Contains(t, call.Args, "email=admin+audit@example.com")
	require.Contains(t, call.Args, "-X")
	require.Contains(t, call.Args, "ON_ERROR_STOP=1")
	require.NotContains(t, call.Args, "-tAc")
	require.Equal(t, "db-secret", call.Env["PGPASSWORD"])
	require.NotContains(t, strings.Join(call.Args, " "), "db-secret")
}
