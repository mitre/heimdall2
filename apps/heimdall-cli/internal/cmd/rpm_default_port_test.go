package cmd

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSetupRPMDefaultPortResolution(t *testing.T) {
	for _, tc := range []struct {
		name, saved, argument, want string
		rpm, configured             bool
	}{
		{name: "fresh standalone", want: "3000"},
		{name: "fresh RPM", rpm: true, want: "3002"},
		{name: "RPM template", rpm: true, saved: "3002", want: "3002"},
		{name: "fresh RPM saved legacy port", rpm: true, saved: "3000", want: "3000"},
		{name: "fresh RPM saved custom port", rpm: true, saved: "3210", want: "3210"},
		{name: "configured RPM implicit legacy port", rpm: true, configured: true, want: "3000"},
		{name: "configured RPM saved legacy port", rpm: true, configured: true, saved: "3000", want: "3000"},
		{name: "configured RPM saved custom port", rpm: true, configured: true, saved: "3210", want: "3210"},
		{name: "fresh RPM explicit legacy default", rpm: true, argument: "3000", want: "3000"},
		{name: "fresh RPM explicit custom port", rpm: true, argument: "3456", want: "3456"},
		{name: "RPM explicit legacy default beats saved", rpm: true, saved: "3210", argument: "3000", want: "3000"},
		{name: "RPM explicit new default beats saved", rpm: true, saved: "3210", argument: "3002", want: "3002"},
		{name: "standalone explicit port beats saved", saved: "3210", argument: "3000", want: "3000"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			if tc.rpm {
				r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			}
			env := r.Env.(*FakeEnvManager).Env
			if tc.saved != "" {
				env["PORT"] = tc.saved
			}
			if tc.configured {
				env["JWT_SECRET"] = "saved-secret"
			}
			command := NewSetupCmd(r)
			require.Equal(t, "3000", command.Flags().Lookup("port").DefValue)
			args := []string{"--non-interactive", "--reconfigure"}
			if tc.argument != "" {
				args = append(args, "--port="+tc.argument)
			}
			command.SetArgs(args)
			require.NoError(t, command.Execute())
			require.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
			command = NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--reconfigure"})
			require.NoError(t, command.Execute())
			require.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
		})
	}
}

func TestSetupRPMDefaultPortDirectRunner(t *testing.T) {
	for _, tc := range []struct {
		name, initial, saved, want string
		rpm, configured            bool
	}{
		{name: "empty standalone", want: "3000"},
		{name: "initialized standalone", initial: "3000", want: "3000"},
		{name: "empty RPM", rpm: true, want: "3002"},
		{name: "initialized RPM", rpm: true, initial: "3000", want: "3002"},
		{name: "initialized RPM saved port", rpm: true, initial: "3000", saved: "3210", want: "3210"},
		{name: "RPM saved legacy", rpm: true, saved: "3000", want: "3000"},
		{name: "RPM custom override", rpm: true, initial: "3456", saved: "3210", want: "3456"},
		{name: "configured RPM implicit legacy", rpm: true, configured: true, want: "3000"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			if tc.rpm {
				r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			}
			if tc.saved != "" {
				r.Env.(*FakeEnvManager).Env["PORT"] = tc.saved
			}
			if tc.configured {
				r.Env.(*FakeEnvManager).Env["JWT_SECRET"] = "saved-secret"
			}
			r.Port = tc.initial
			require.Nil(t, r.flagChanged)
			_, err := r.readConfiguration()
			require.NoError(t, err)
			require.Equal(t, tc.want, r.Port)
		})
	}
}

func TestSetupRPMDefaultAvoidsStockSELinuxPort(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	fs.Files["/sys/fs/selinux/enforce"] = []byte("1")
	exec := r.Exec.(*FakeExecRunner)
	exec.Results["semanage port -l"] = FakeExecResult{Stdout: "ntop_port_t tcp 3000-3001\nhttp_port_t tcp 80,443\npostgresql_port_t tcp 5432\n"}
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--non-interactive", "--reconfigure"})
	require.NoError(t, command.Execute())
	require.Equal(t, "3002", r.Env.(*FakeEnvManager).Env["PORT"])
	for _, call := range exec.Calls {
		if call.Name == "semanage" {
			require.Equal(t, []string{"port", "-l"}, call.Args)
		}
	}
}

func TestSetupRPMDefaultPortConflictsStillFailBeforeMutation(t *testing.T) {
	for _, tc := range []struct {
		name, saved, argument, port, problem string
		occupied                             bool
	}{
		{name: "default occupied", port: "3002", problem: "occupied", occupied: true},
		{name: "default SELinux conflict", port: "3002", problem: "other_port_t"},
		{name: "explicit legacy SELinux conflict", argument: "3000", port: "3000", problem: "other_port_t"},
		{name: "saved legacy SELinux conflict", saved: "3000", port: "3000", problem: "other_port_t"},
	} {
		for _, reconfigure := range []bool{false, true} {
			t.Run(tc.name+map[bool]string{false: " full", true: " reconfigure"}[reconfigure], func(t *testing.T) {
				r, _, _ := newTestSetupRunner()
				fs := r.FS.(*FakeFileSystem)
				fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
				if tc.saved != "" {
					r.Env.(*FakeEnvManager).Env["PORT"] = tc.saved
				}
				exec := r.Exec.(*FakeExecRunner)
				if tc.occupied {
					exec.Results["ss -H -ltnp sport = :"+tc.port] = FakeExecResult{Stdout: `LISTEN 0 100 127.0.0.1:` + tc.port + ` 0.0.0.0:* users:(("other",pid=123,fd=1))`}
				} else {
					fs.Files["/sys/fs/selinux/enforce"] = []byte("1")
					exec.Results["semanage port -l"] = FakeExecResult{Stdout: "other_port_t tcp " + tc.port + "\n"}
				}
				unchanged := assertSetupPortUnchanged(t, r)
				command := NewSetupCmd(r)
				args := []string{"--non-interactive"}
				if reconfigure {
					args = append(args, "--reconfigure")
				}
				if tc.argument != "" {
					args = append(args, "--port="+tc.argument)
				}
				command.SetArgs(args)
				err := command.Execute()
				require.ErrorContains(t, err, tc.problem)
				unchanged()
			})
		}
	}
}
