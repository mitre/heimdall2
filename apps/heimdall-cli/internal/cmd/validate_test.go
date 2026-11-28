package cmd

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

func newTestValidateRunner() *ValidateRunner {
	return &ValidateRunner{
		Env: &FakeEnvManager{
			Env: map[string]string{
				"DATABASE_PASSWORD": "secret123",
				"JWT_SECRET":        "jwt-secret-value",
				"DATABASE_HOST":     "localhost",
				"DATABASE_PORT":     "5432",
				"DATABASE_USERNAME": "postgres",
				"DATABASE_NAME":     "heimdall-server-production",
				"PORT":              "3000",
			},
		},
		FS: NewFakeFileSystem(),
		DB: &FakeDBConnector{},
	}
}

func runValidate(r *ValidateRunner, args ...string) (string, error) {
	buf := new(bytes.Buffer)
	r.Out = buf
	cmd := NewValidateCmd(r)
	cmd.SetOut(buf)
	cmd.SetArgs(args)
	err := cmd.Execute()
	return buf.String(), err
}

func TestValidate_AllGood(t *testing.T) {
	r := newTestValidateRunner()
	out, err := runValidate(r)
	assert.NoError(t, err)
	assert.Contains(t, out, "Configuration valid")
}

func TestValidate_MissingDatabasePassword(t *testing.T) {
	r := newTestValidateRunner()
	delete(r.Env.(*FakeEnvManager).Env, "DATABASE_PASSWORD")
	_, err := runValidate(r)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "DATABASE_PASSWORD")
}

func TestValidate_MissingJWTSecret(t *testing.T) {
	r := newTestValidateRunner()
	delete(r.Env.(*FakeEnvManager).Env, "JWT_SECRET")
	_, err := runValidate(r)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "JWT_SECRET")
}

func TestValidate_EmptyRequiredVar(t *testing.T) {
	r := newTestValidateRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = ""
	_, err := runValidate(r)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "DATABASE_PASSWORD")
}

func TestValidate_DBUnreachable(t *testing.T) {
	r := newTestValidateRunner()
	r.DB.(*FakeDBConnector).ConnErr = assert.AnError
	_, err := runValidate(r)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "database")
}

func TestValidate_SkipDB(t *testing.T) {
	r := newTestValidateRunner()
	r.DB.(*FakeDBConnector).ConnErr = assert.AnError
	out, err := runValidate(r, "--skip-db")
	assert.NoError(t, err)
	assert.Contains(t, out, "Configuration valid")
}
