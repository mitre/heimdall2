package cmd

import (
	"errors"
	"fmt"
	"maps"
	"os"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

const firewallCommand = "firewall-cmd"

type firewallRule struct{ scope, zone, kind, value string }

type firewallChange struct {
	rule firewallRule
	add  bool
}

func (r firewallRule) args(action string) []string {
	args := []string{"--zone=" + r.zone}
	if r.scope == "permanent" {
		args = append(args, "--permanent")
	}
	return append(args, "--"+action+"-"+r.kind+"="+r.value)
}
func (r firewallRule) record() string { return r.scope + " " + r.zone + " " + r.value }

var firewallZone = regexp.MustCompile(`^[A-Za-z0-9_.-]+$`)

// Track only exact TCP port rules this CLI created; pre-existing rules belong to the administrator.
func (r *SetupRunner) configureFirewall(port, mode, externalURL string) (func() error, error) {
	undo := func() error { return nil }
	active, err := r.Systemd.IsActive("firewalld")
	if err != nil {
		return undo, err
	}
	if !active {
		fmt.Fprintln(r.Out, "  firewalld: not running (skipped)")
		return undo, nil
	}
	zone, err := r.readFirewall("--get-default-zone")
	if err != nil {
		return undo, err
	}
	if !firewallZone.MatchString(zone) {
		return undo, fmt.Errorf("invalid firewalld default zone %q", zone)
	}
	ledger := r.Paths.ConfigDir + "/firewalld-ports"
	if err := rootManagedFile(r.FS, ledger); err != nil {
		return undo, err
	}
	if err := r.reconcileFirewallLedger(ledger); err != nil {
		return undo, err
	}
	before, err := snapshotFile(r.FS, ledger)
	if err != nil {
		return undo, err
	}
	owned, err := parseFirewallLedger(before.data, ledger)
	if err != nil {
		return undo, err
	}
	kind, value, err := firewallEndpoint(port, mode, externalURL)
	if err != nil {
		return undo, err
	}
	desired := map[string]firewallRule{}
	for _, scope := range []string{"runtime", "permanent"} {
		rule := firewallRule{scope, zone, kind, value}
		desired[rule.record()] = rule
	}
	managed := mode == "bundled" || mode == "nginx"
	if managed {
		if err := r.checkPrivateFirewallPort(owned, port); err != nil {
			return undo, err
		}
	}
	changes, err := r.planFirewallChanges(owned, desired, zone, value)
	if err != nil {
		return undo, err
	}
	undo, err = r.applyFirewallChanges(changes, owned, ledger, before)
	if err != nil {
		return undo, err
	}
	if managed {
		fmt.Fprintf(r.Out, "  firewalld: proxy endpoint %s enabled; CLI-managed backend ports closed\n", value)
	} else {
		fmt.Fprintf(r.Out, "  firewalld: port %s/tcp enabled\n", port)
	}
	return undo, nil
}

// A failed rollback may leave its only ownership evidence in the pending file.
func (r *SetupRunner) reconcileFirewallLedger(ledger string) error {
	pending := ledger + ".pending"
	if err := rootManagedFile(r.FS, pending); err != nil {
		return err
	}
	data, err := r.FS.ReadFile(pending)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	owned, err := parseFirewallLedger(data, pending)
	if err != nil {
		return err
	}
	before, err := snapshotFile(r.FS, ledger)
	if err != nil {
		return err
	}
	previous, err := parseFirewallLedger(before.data, ledger)
	if err != nil {
		return err
	}
	maps.Copy(owned, previous)
	for key, rule := range owned {
		present, err := r.firewallRulePresent(rule)
		if err != nil {
			return err
		}
		if !present {
			delete(owned, key)
		}
	}
	// Force persistence even when all pending rules were successfully removed.
	before.exists = true
	return r.saveFirewallLedger(owned, ledger, before)
}

func (r *SetupRunner) readFirewall(args ...string) (string, error) {
	out, code, err := r.Exec.Run(firewallCommand, args...)
	if err != nil || code != 0 {
		return "", fmt.Errorf("firewall-cmd %s failed (exit %d): %s: %v", strings.Join(args, " "), code, strings.TrimSpace(out), err)
	}
	return strings.TrimSpace(out), nil
}

func (r *SetupRunner) firewallRulePresent(rule firewallRule) (bool, error) {
	out, code, err := r.Exec.Run(firewallCommand, rule.args("query")...)
	if err != nil || (code != 0 && code != 1) {
		return false, fmt.Errorf("querying firewalld rule %s (exit %d): %s: %v", rule.record(), code, strings.TrimSpace(out), err)
	}
	return code == 0, nil
}

func parseFirewallLedger(data []byte, ledger string) (map[string]firewallRule, error) {
	owned := map[string]firewallRule{}
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) != 3 || (fields[0] != "runtime" && fields[0] != "permanent") || !firewallZone.MatchString(fields[1]) {
			return nil, fmt.Errorf("invalid firewalld ownership ledger %s", ledger)
		}
		n, parseErr := strconv.Atoi(strings.TrimSuffix(fields[2], "/tcp"))
		if !strings.HasSuffix(fields[2], "/tcp") || parseErr != nil || n < 1 || n > 65535 {
			return nil, fmt.Errorf("invalid firewalld ownership ledger %s", ledger)
		}
		rule := firewallRule{fields[0], fields[1], "port", fields[2]}
		owned[rule.record()] = rule
	}
	return owned, nil
}

func firewallEndpoint(port, mode, externalURL string) (kind, value string, err error) {
	if mode == "nginx" {
		return "service", "https", nil
	}
	if mode != "bundled" {
		return "port", port + "/tcp", nil
	}
	target, err := validatePublicURL(externalURL)
	if err != nil {
		return "", "", err
	}
	publicPort := "80"
	if target.Scheme == "https" {
		publicPort = "443"
	}
	if target.Port() != "" {
		n, _ := strconv.Atoi(target.Port())
		publicPort = strconv.Itoa(n)
	}
	switch publicPort {
	case "443":
		return "service", "https", nil
	case "80":
		return "service", "http", nil
	default:
		return "port", publicPort + "/tcp", nil
	}
}

func (r *SetupRunner) firewallZones(scope string) ([]string, error) {
	args := []string{"--get-zones"}
	if scope == "permanent" {
		args = append([]string{"--permanent"}, args...)
	}
	zones, err := r.readFirewall(args...)
	if err != nil {
		return nil, err
	}
	if zones == "" {
		return nil, fmt.Errorf("firewalld returned no zones")
	}
	return strings.Fields(zones), nil
}

func (r *SetupRunner) checkPrivateFirewallPort(owned map[string]firewallRule, port string) error {
	for _, scope := range []string{"runtime", "permanent"} {
		zones, err := r.firewallZones(scope)
		if err != nil {
			return err
		}
		for _, zone := range zones {
			if !firewallZone.MatchString(zone) {
				return fmt.Errorf("invalid firewalld zone %q", zone)
			}
			if err := r.checkUnownedFirewallPort(owned, scope, zone, port); err != nil {
				return err
			}
		}
	}
	return nil
}

func (r *SetupRunner) checkUnownedFirewallPort(owned map[string]firewallRule, scope, zone, port string) error {
	rule := firewallRule{scope, zone, "port", port + "/tcp"}
	exists, err := r.firewallRulePresent(rule)
	if err != nil {
		return err
	}
	if _, ours := owned[rule.record()]; exists && !ours {
		return fmt.Errorf("selected backend TCP port %s is allowed by an unowned firewalld rule; choose another backend port or review and remove this rule before managed HTTPS setup: sudo firewall-cmd %s", port, strings.Join(rule.args("remove"), " "))
	}
	return nil
}

func (r *SetupRunner) planFirewallChanges(owned, desired map[string]firewallRule, zone, value string) ([]firewallChange, error) {
	var changes []firewallChange
	for _, key := range slices.Sorted(maps.Keys(owned)) {
		rule := owned[key]
		if _, keep := desired[rule.record()]; keep {
			continue
		}
		exists, err := r.firewallRulePresent(rule)
		if err != nil {
			return nil, err
		}
		if exists {
			changes = append(changes, firewallChange{rule, false})
		} else {
			delete(owned, key)
		}
	}
	for _, scope := range []string{"runtime", "permanent"} {
		rule := desired[scope+" "+zone+" "+value]
		exists, err := r.firewallRulePresent(rule)
		if err != nil {
			return nil, err
		}
		if !exists {
			changes = append(changes, firewallChange{rule, true})
		}
	}
	return changes, nil
}

func (r *SetupRunner) saveFirewallLedger(owned map[string]firewallRule, ledger string, before savedFile) error {
	lines := slices.Sorted(maps.Keys(owned))
	if !before.exists && len(lines) == 0 {
		return nil
	}
	data := strings.Join(lines, "\n")
	if data != "" {
		data += "\n"
	}
	// A partial write must not truncate the only pending or committed evidence.
	if err := savePortLedger(r.Exec, r.FS, ledger, ledger+".reconcile", []byte(data)); err != nil {
		return err
	}
	return r.FS.RemoveAll(ledger + ".pending")
}

func updateFirewallOwnership(owned map[string]firewallRule, rule firewallRule, add bool) {
	if rule.kind != "port" {
		return
	}
	if add {
		owned[rule.record()] = rule
	} else {
		delete(owned, rule.record())
	}
}

// Keep a persisted superset until all external changes (including undo) finish.
func (r *SetupRunner) saveFirewallIntent(changes []firewallChange, owned map[string]firewallRule, ledger string, before savedFile) error {
	intended := maps.Clone(owned)
	for _, change := range changes {
		updateFirewallOwnership(intended, change.rule, true)
	}
	return r.saveFirewallLedger(intended, ledger, before)
}

func (r *SetupRunner) undoFirewallChanges(applied []firewallChange, owned map[string]firewallRule, ledger string, before savedFile) error {
	if len(applied) != 0 {
		if err := r.saveFirewallIntent(applied, owned, ledger, before); err != nil {
			return err
		}
	}
	var failures []error
	for i := len(applied) - 1; i >= 0; i-- {
		item := applied[i]
		action := "add"
		if item.add {
			action = "remove"
		}
		if err := runChecked(r.Exec, firewallCommand, item.rule.args(action)...); err != nil {
			failures = append(failures, err)
			continue
		}
		updateFirewallOwnership(owned, item.rule, !item.add)
	}
	if len(failures) == 0 {
		if before.exists {
			previous, err := parseFirewallLedger(before.data, ledger)
			if err == nil {
				err = r.saveFirewallLedger(previous, ledger, before)
			}
			failures = append(failures, err)
		} else if err := r.FS.RemoveAll(ledger); err != nil {
			failures = append(failures, err)
		} else {
			failures = append(failures, r.FS.RemoveAll(ledger+".pending"))
		}
	} else {
		failures = append(failures, r.saveFirewallLedger(owned, ledger, before))
	}
	return errors.Join(failures...)
}

func (r *SetupRunner) applyFirewallChanges(changes []firewallChange, owned map[string]firewallRule, ledger string, before savedFile) (undo func() error, err error) {
	undo = func() error { return nil }
	if err = r.saveFirewallIntent(changes, owned, ledger, before); err != nil {
		return undo, err
	}
	var applied []firewallChange
	undo = func() error {
		err := r.undoFirewallChanges(applied, owned, ledger, before)
		applied = nil
		return err
	}
	defer func() {
		if err != nil {
			err = errors.Join(err, undo())
			undo = func() error { return nil }
		}
	}()
	for _, item := range changes {
		action := "remove"
		if item.add {
			action = "add"
		}
		if err = runChecked(r.Exec, firewallCommand, item.rule.args(action)...); err != nil {
			return undo, err
		}
		applied = append(applied, item)
		updateFirewallOwnership(owned, item.rule, item.add)
	}
	if err = r.saveFirewallLedger(owned, ledger, before); err != nil {
		return undo, err
	}
	return undo, nil
}
