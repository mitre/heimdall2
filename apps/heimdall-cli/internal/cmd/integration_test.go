//go:build integration

package cmd

import (
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

// TestPGContainer_AcceptsConnections proves the newPGContainer helper
// returns host, port, cleanup and the container accepts connections using
// the package-private credential constants.
func TestPGContainer_AcceptsConnections(t *testing.T) {
	host, port, cleanup := newPGContainer(t)
	defer cleanup()

	require.NotEmpty(t, host, "host must be non-empty")
	require.Greater(t, port, 0, "port must be a valid mapped port")

	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, pgUser, pgPassword, pgDB,
	)

	db, err := sql.Open("postgres", dsn)
	require.NoError(t, err, "sql.Open must succeed")
	defer db.Close()

	var result int
	err = db.QueryRow("SELECT 1").Scan(&result)
	require.NoError(t, err, "SELECT 1 must succeed against the container")
	require.Equal(t, 1, result, "SELECT 1 must return 1")
}

// TestInitContainer_SystemdReady proves the newInitContainer helper starts
// a privileged container with systemd as PID 1 across multiple EL major
// versions. UBI10 is omitted until its init image is published in the
// public registry — add to the table when available.
func TestInitContainer_SystemdReady(t *testing.T) {
	cases := []struct {
		name  string
		image string
	}{
		{"UBI8", ubi8InitImage},
		{"UBI9", ubi9InitImage},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			exec, cleanup := newInitContainer(t, tc.image)
			defer cleanup()

			stdout, code, err := exec("systemctl", "--version")
			require.NoError(t, err, "exec systemctl --version must not error")
			require.Equal(t, 0, code, "systemctl --version must exit 0")
			require.Contains(t, stdout, "systemd",
				"systemctl --version stdout must mention systemd")
		})
	}
}
