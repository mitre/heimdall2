package cmd

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLegacyRestorePreflightPreservesLiteralDatabaseName(t *testing.T) {
	sql := filepath.Join(t.TempDir(), "database.sql")
	require.NoError(t, os.WriteFile(sql, []byte("-- Dumped from database version 14.19\n-- Dumped by pg_dump version 14.19\nSELECT 1;\n"), 0600))
	for _, tc := range []struct{ name, argument string }{
		{"dbname=heimdall", "dbname='dbname=heimdall'"},
		{`a='b\c`, `dbname='a=\'b\\c'`},
		{"postgresql://other/db", "dbname='postgresql://other/db'"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			exec := &FakeExecRunner{Results: map[string]FakeExecResult{"psql -X -h": {Stdout: "f\n"}}}
			runner := &RestoreRunner{Exec: exec}
			cfg := DBConfig{Host: "localhost", Port: 5432, User: "app", DBName: tc.name}
			require.NoError(t, runner.preflightDatabaseRestore("psql", sql, cfg, 14))
			require.Len(t, exec.Calls, 1)
			require.Equal(t, []string{"-X", "-h", "localhost", "-p", "5432", "-U", "app", "-d", tc.argument}, exec.Calls[0].Args[:9])
			exec.Verify(t)
		})
	}
}
