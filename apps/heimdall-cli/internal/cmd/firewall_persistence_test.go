package cmd

import (
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

type firewallPartialWriteFS struct {
	FileSystem
	ledger string
}

func (f *firewallPartialWriteFS) WriteFile(path string, data []byte, mode os.FileMode) error {
	if strings.HasPrefix(path, f.ledger) {
		if err := f.FileSystem.WriteFile(path, nil, mode); err != nil {
			return err
		}
		return fmt.Errorf("disk full after truncation")
	}
	return f.FileSystem.WriteFile(path, data, mode)
}
func TestFirewallPartialWritePreservesPendingEvidence(t *testing.T) {
	for _, operation := range []string{"reconcile", "failed rollback"} {
		t.Run(operation, func(t *testing.T) {
			r, e := firewallFixture(t, "none")
			ledger := r.Paths.ConfigDir + "/firewalld-ports"
			record := []byte("runtime public 3456/tcp\n")
			require.NoError(t, r.FS.WriteFile(ledger+".pending", record, 0600))
			e.rules["runtime public 3456/tcp"] = true
			r.FS = &firewallPartialWriteFS{FileSystem: r.FS, ledger: ledger}
			if operation == "reconcile" {
				require.ErrorContains(t, r.reconcileFirewallLedger(ledger), "disk full")
			} else {
				rule := firewallRule{"runtime", "public", "port", "3456/tcp"}
				e.failure = "--remove-port=3456/tcp"
				require.Error(t, r.undoFirewallChanges([]firewallChange{{rule, true}}, map[string]firewallRule{rule.record(): rule}, ledger, savedFile{path: ledger}))
			}
			saved, err := r.FS.ReadFile(ledger + ".pending")
			require.NoError(t, err)
			require.Equal(t, record, saved, "failed writes must retain the sole ownership evidence")
		})
	}
}

type interruptedFirewallExec struct {
	*firewallExec
	after string
}

func (e *interruptedFirewallExec) Run(name string, args ...string) (string, int, error) {
	out, code, err := e.firewallExec.Run(name, args...)
	if name == firewallCommand && contains(args, e.after) && code == 0 {
		panic("process interrupted after external mutation")
	}
	return out, code, err
}
func TestFirewallInterruptionRetainsOwnershipForRetry(t *testing.T) {
	for _, operation := range []string{"apply", "rollback"} {
		t.Run(operation, func(t *testing.T) {
			r, e := firewallFixture(t, "none")
			action := func() { _, _ = r.configureFirewall("3456", "none", "") }
			if operation == "rollback" {
				_, err := r.configureFirewall("3456", "none", "")
				require.NoError(t, err)
				undo, err := r.configureFirewall("4567", "none", "")
				require.NoError(t, err)
				action = func() { _ = undo() }
			}
			r.Exec = &interruptedFirewallExec{firewallExec: e, after: "--add-port=3456/tcp"}
			require.Panics(t, action)
			require.True(t, e.rules["runtime public 3456/tcp"] || e.rules["permanent public 3456/tcp"])
			ledger := r.Paths.ConfigDir + "/firewalld-ports"
			data, err := r.FS.ReadFile(ledger)
			require.NoError(t, err)
			require.Contains(t, string(data), "public 3456/tcp")
			r.Exec = e
			_, err = r.configureFirewall("3456", "bundled", "https://localhost")
			require.NoError(t, err)
			for key := range e.rules {
				require.NotContains(t, key, "/tcp")
			}
		})
	}
}
