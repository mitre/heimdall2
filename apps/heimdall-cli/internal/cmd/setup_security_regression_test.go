package cmd

import (
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestBackendPrivilegedPortsRejectedBeforeMutation(t *testing.T) {
	for _, value := range []string{"1", "81", "1023"} {
		for _, entry := range []string{"setup", "set-port", "config"} {
			t.Run(entry+" "+value, func(t *testing.T) {
				r := bundledSetupFixture(t)
				unchanged := assertSetupPortUnchanged(t, r)
				var err error
				if entry == "setup" {
					command := NewSetupCmd(r)
					command.SetArgs([]string{"--non-interactive", "--reconfigure", "--port=" + value})
					err = command.Execute()
				} else {
					port := &SetPortRunner{Exec: r.Exec, FS: r.FS, Paths: r.Paths, Systemd: r.Systemd, Env: r.Env, Out: r.Out}
					if entry == "config" {
						err = (&ConfigRunner{Env: r.Env, Port: port, Out: r.Out}).Set("PORT", value)
					} else {
						err = port.Run(value)
					}
				}
				require.Error(t, err)
				assert.Contains(t, err.Error(), "1024")
				unchanged()
			})
		}
	}
	require.NoError(t, ValidateValue("PORT", "1024"))
	require.NoError(t, ValidateValue("DATABASE_PORT", "81"))
}

func TestSetupLeavesLegacyBackupsUntouched(t *testing.T) {
	r := bundledSetupFixture(t)
	exec := r.Exec.(*FakeExecRunner)
	exec.Results["runuser -u heimdall -- chmod 0700 "+r.Paths.DataDir+"/backups"] = FakeExecResult{ExitCode: 1, Stdout: "Operation not permitted"}
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--non-interactive"})
	require.NoError(t, command.Execute())
	assert.NotContains(t, exec.Calls, FakeExecCall{Name: "chmod", Args: []string{"0700", r.Paths.DataDir + "/backups"}})
	assert.NotContains(t, exec.Calls, FakeExecCall{Name: "runuser", Args: []string{"-u", "heimdall", "--", "chmod", "0700", r.Paths.DataDir + "/backups"}})
}
