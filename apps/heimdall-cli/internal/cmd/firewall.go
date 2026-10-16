package cmd

import (
	"errors"
	"fmt"
	"maps"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

type firewallRule struct{ scope, zone, kind, value string }

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
func (r *SetupRunner) configureFirewall(port, mode, previousPort, externalURL string) (undo func() error, err error) {
	undo = func() error { return nil }
	active, err := r.Systemd.IsActive("firewalld")
	if err != nil {
		return undo, err
	}
	if !active {
		fmt.Fprintln(r.Out, "  firewalld: not running (skipped)")
		return undo, nil
	}
	read := func(args ...string) (string, error) {
		out, code, err := r.Exec.Run("firewall-cmd", args...)
		if err != nil || code != 0 {
			return "", fmt.Errorf("firewall-cmd %s failed (exit %d): %s: %v", strings.Join(args, " "), code, strings.TrimSpace(out), err)
		}
		return strings.TrimSpace(out), nil
	}
	present := func(rule firewallRule) (bool, error) {
		out, code, err := r.Exec.Run("firewall-cmd", rule.args("query")...)
		if err != nil || (code != 0 && code != 1) {
			return false, fmt.Errorf("querying firewalld rule %s (exit %d): %s: %v", rule.record(), code, strings.TrimSpace(out), err)
		}
		return code == 0, nil
	}
	zone, err := read("--get-default-zone")
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
	before, err := snapshotFile(r.FS, ledger)
	if err != nil {
		return undo, err
	}
	owned := map[string]firewallRule{}
	for _, line := range strings.Split(strings.TrimSpace(string(before.data)), "\n") {
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) != 3 || (fields[0] != "runtime" && fields[0] != "permanent") || !firewallZone.MatchString(fields[1]) {
			return undo, fmt.Errorf("invalid firewalld ownership ledger %s", ledger)
		}
		n, parseErr := strconv.Atoi(strings.TrimSuffix(fields[2], "/tcp"))
		if !strings.HasSuffix(fields[2], "/tcp") || parseErr != nil || n < 1 || n > 65535 {
			return undo, fmt.Errorf("invalid firewalld ownership ledger %s", ledger)
		}
		rule := firewallRule{fields[0], fields[1], "port", fields[2]}
		owned[rule.record()] = rule
	}
	managed := mode == "bundled" || mode == "nginx"
	kind, value := "port", port+"/tcp"
	if mode == "nginx" {
		kind, value = "service", "https"
	} else if mode == "bundled" {
		target, err := validatePublicURL(externalURL)
		if err != nil {
			return undo, err
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
			kind, value = "service", "https"
		case "80":
			kind, value = "service", "http"
		default:
			kind, value = "port", publicPort+"/tcp"
		}
	}
	desired := map[string]firewallRule{}
	for _, scope := range []string{"runtime", "permanent"} {
		rule := firewallRule{scope, zone, kind, value}
		desired[rule.record()] = rule
	}
	if managed {
		for _, scope := range []string{"runtime", "permanent"} {
			args := []string{"--get-zones"}
			if scope == "permanent" {
				args = append([]string{"--permanent"}, args...)
			}
			zones, err := read(args...)
			if err != nil {
				return undo, err
			}
			if zones == "" {
				return undo, fmt.Errorf("firewalld returned no zones")
			}
			for _, zone := range strings.Fields(zones) {
				if !firewallZone.MatchString(zone) {
					return undo, fmt.Errorf("invalid firewalld zone %q", zone)
				}
				for _, candidate := range []string{port, previousPort} {
					if candidate == "" {
						continue
					}
					rule := firewallRule{scope, zone, "port", candidate + "/tcp"}
					exists, err := present(rule)
					if err != nil {
						return undo, err
					}
					if _, ours := owned[rule.record()]; exists && !ours {
						return undo, fmt.Errorf("backend TCP port %s is exposed by an unowned firewalld rule; review and remove it before managed HTTPS setup: sudo firewall-cmd %s", candidate, strings.Join(rule.args("remove"), " "))
					}
				}
			}
		}
	}

	type change struct {
		rule firewallRule
		add  bool
	}
	var changes []change
	for _, key := range slices.Sorted(maps.Keys(owned)) {
		rule := owned[key]
		if _, keep := desired[rule.record()]; keep {
			continue
		}
		exists, err := present(rule)
		if err != nil {
			return undo, err
		}
		if exists {
			changes = append(changes, change{rule, false})
		} else {
			delete(owned, key)
		}
	}
	for _, scope := range []string{"runtime", "permanent"} {
		rule := desired[scope+" "+zone+" "+value]
		exists, err := present(rule)
		if err != nil {
			return undo, err
		}
		if !exists {
			changes = append(changes, change{rule, true})
		}
	}
	save := func() error {
		var lines []string
		for _, key := range slices.Sorted(maps.Keys(owned)) {
			lines = append(lines, key)
		}
		if !before.exists && len(lines) == 0 {
			return nil
		}
		data := strings.Join(lines, "\n")
		if data != "" {
			data += "\n"
		}
		return savePortLedger(r.Exec, r.FS, ledger, ledger+".pending", []byte(data))
	}
	var applied []change
	undo = func() error {
		var failures []error
		for i := len(applied) - 1; i >= 0; i-- {
			item := applied[i]
			action := "add"
			if item.add {
				action = "remove"
			}
			if err := runChecked(r.Exec, "firewall-cmd", item.rule.args(action)...); err != nil {
				failures = append(failures, err)
				continue
			}
			if item.rule.kind == "port" {
				if item.add {
					delete(owned, item.rule.record())
				} else {
					owned[item.rule.record()] = item.rule
				}
			}
		}
		applied = nil
		if len(failures) == 0 {
			failures = append(failures, before.restore(r.FS))
		} else {
			failures = append(failures, save())
		}
		failures = append(failures, r.FS.RemoveAll(ledger+".pending"))
		return errors.Join(failures...)
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
		if err = runChecked(r.Exec, "firewall-cmd", item.rule.args(action)...); err != nil {
			return undo, err
		}
		applied = append(applied, item)
		if item.rule.kind == "port" {
			if item.add {
				owned[item.rule.record()] = item.rule
			} else {
				delete(owned, item.rule.record())
			}
		}
	}
	if err = save(); err != nil {
		return undo, err
	}
	if managed {
		fmt.Fprintf(r.Out, "  firewalld: proxy endpoint %s enabled; CLI-managed backend ports closed\n", value)
	} else {
		fmt.Fprintf(r.Out, "  firewalld: port %s/tcp enabled\n", port)
	}
	return undo, nil
}
