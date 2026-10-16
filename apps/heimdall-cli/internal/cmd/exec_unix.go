//go:build unix

package cmd

import "syscall"

func defaultExecSyscall(path string, args []string, envv []string) error {
	return syscall.Exec(path, args, envv)
}
