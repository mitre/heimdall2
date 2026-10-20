package cmd

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const recoverySQLFormatFile = "database.restore"
const recoverySQLFormat = "pg_dump-clean-v1\n"

// A newer pg_dump can read an older server but emit SQL that it cannot restore.
func matchingDumpClient(exec ExecRunner, fs FileSystem, selected string, major int) (string, error) {
	candidates := []string{
		selected,
		fmt.Sprintf("/usr/pgsql-%d/bin/pg_dump", major),
		fmt.Sprintf("/usr/lib/postgresql/%d/bin/pg_dump", major),
		"/usr/bin/pg_dump",
	}
	for _, binary := range candidates {
		if binary != selected {
			if err := requireRegular(fs, binary); err != nil {
				continue
			}
		}
		out, code, err := exec.Run(binary, "--version")
		if err != nil || code != 0 {
			continue
		}
		version, ok := strings.CutPrefix(strings.TrimSpace(out), "pg_dump (PostgreSQL) ")
		if !ok {
			continue
		}
		if found, err := dumpVersionMajor(version); err == nil && found == major {
			return binary, nil
		}
	}
	return "", fmt.Errorf("backup requires a PostgreSQL %d pg_dump; install the matching PostgreSQL client in /usr/pgsql-%d/bin, /usr/lib/postgresql/%d/bin, or /usr/bin", major, major, major)
}

func dumpVersionMajor(version string) (int, error) {
	fields := strings.Fields(version)
	if len(fields) == 0 {
		return 0, fmt.Errorf("missing PostgreSQL dump version")
	}
	major, _, _ := strings.Cut(fields[0], ".")
	n, err := strconv.Atoi(major)
	if err != nil || n < 1 {
		return 0, fmt.Errorf("invalid PostgreSQL dump version %q", version)
	}
	return n, nil
}

func recoveryDumpVersions(path string) (server, client int, err error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, 0, err
	}
	defer file.Close()
	// pg_dump writes both headers before any SQL. Never scan user table data
	// for text that could be mistaken for a version header.
	scanner := bufio.NewScanner(io.LimitReader(file, 64*1024))
	for scanner.Scan() {
		line := scanner.Text()
		var target *int
		var version string
		if value, ok := strings.CutPrefix(line, "-- Dumped from database version "); ok {
			target, version = &server, value
		} else if value, ok := strings.CutPrefix(line, "-- Dumped by pg_dump version "); ok {
			target, version = &client, value
		} else if line != "" && !strings.HasPrefix(line, "--") && !strings.HasPrefix(line, `\restrict `) {
			break
		}
		if target != nil {
			*target, err = dumpVersionMajor(version)
			if err != nil {
				return 0, 0, err
			}
		}
		if server != 0 && client != 0 {
			return server, client, nil
		}
	}
	if err := scanner.Err(); err != nil {
		return 0, 0, err
	}
	return 0, 0, fmt.Errorf("database.sql lacks valid pg_dump version headers; verify and restore this legacy dump manually")
}

func (r *RestoreRunner) preflightDatabaseRestore(binary, sqlBackup string, cfg DBConfig, major int) error {
	source, dump, err := recoveryDumpVersions(sqlBackup)
	if err != nil {
		return err
	}
	if source > major || dump > major || dump < source {
		return fmt.Errorf("database.sql was produced by pg_dump %d from PostgreSQL %d and cannot safely restore to PostgreSQL %d; use a compatible backup or restore to a compatible server", dump, source, major)
	}
	format, err := os.ReadFile(filepath.Join(filepath.Dir(sqlBackup), recoverySQLFormatFile))
	if err == nil {
		if string(format) != recoverySQLFormat {
			return fmt.Errorf("unsupported database restore format")
		}
		return nil
	}
	if !os.IsNotExist(err) {
		return err
	}
	// Legacy dumps have no DROP statements. An empty target is their only
	// supported automatic restore path; reject before changing installed state.
	const nonempty = `SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_namespace n
  WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
    AND (n.nspname <> 'public'
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relnamespace=n.oid)
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE pronamespace=n.oid)
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_type WHERE typnamespace=n.oid)))`
	out, code, err := r.Exec.RunWithEnv(cfg.PgEnv(), binary, "-X", "-h", cfg.Host, "-p", cfg.PortStr(), "-U", cfg.User, "-d", cfg.DBName, "-v", "ON_ERROR_STOP=1", "-tAc", nonempty)
	if err != nil || code != 0 {
		return fmt.Errorf("checking legacy restore destination failed (exit %d): %v", code, err)
	}
	if strings.TrimSpace(out) != "f" {
		return fmt.Errorf("legacy database dump requires an empty destination; retain a verified backup and prepare an empty database before restoring")
	}
	return nil
}
