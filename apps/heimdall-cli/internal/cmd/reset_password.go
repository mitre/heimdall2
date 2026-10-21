package cmd

import (
	"fmt"
	"io"
	"net/mail"
	"strings"

	"github.com/spf13/cobra"
)

// ResetPasswordRunner holds dependencies for the reset-password command.
type ResetPasswordRunner struct {
	Paths     Paths
	FS        FileSystem
	Exec      ExecRunner
	Env       EnvManager
	Hasher    PasswordHasher
	Prompter  Prompter
	Out       io.Writer
	ErrOut    io.Writer
	CheckRoot func() error
}

// Run executes the reset-password logic.
func (r *ResetPasswordRunner) Run(email, password string) error {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	// Wrapping the addr-spec excludes display names and comments without banning quoted local parts.
	_, err := mail.ParseAddress("<" + email + ">")
	if err != nil || strings.TrimSpace(email) != email || strings.ContainsAny(email, "\r\n\x00") {
		return fmt.Errorf("invalid email format")
	}

	env, err := r.Env.ReadEnv()
	if err != nil {
		return fmt.Errorf("failed to read env: %w", err)
	}

	dbCfg, err := resolveDBConfig(env)
	if err != nil {
		return err
	}
	binary, err := postgresClient(r.Paths, r.FS, "psql")
	if err != nil {
		return err
	}

	if dbCfg.Password == "" {
		return fmt.Errorf("DATABASE_PASSWORD not set in %s", r.Env.GetEnvFilePath())
	}

	rules := DefaultPasswordRules()
	generated := false

	if password == "" && r.Prompter != nil && r.Prompter.CanPrompt() {
		// Interactive: prompt twice with masked input
		pw, err := ConfirmPassword(r.Prompter, "New password (blank to auto-generate)", true)
		if err != nil {
			return err
		}
		password = pw
	}

	if password == "" {
		pw, err := GeneratePassword(rules)
		if err != nil {
			return fmt.Errorf("failed to generate password: %w", err)
		}
		password = pw
		generated = true
	} else {
		errs := ValidatePassword(password, rules)
		if len(errs) > 0 {
			fmt.Fprintln(r.ErrOut, "Password does not meet complexity requirements:")
			for _, e := range errs {
				fmt.Fprintf(r.ErrOut, "  - %s\n", e)
			}
			fmt.Fprintln(r.ErrOut)
			fmt.Fprintln(r.ErrOut, "Requirements: 15+ chars, all 4 character classes (lower, upper, digit, special),")
			fmt.Fprintln(r.ErrOut, "no 4+ consecutive chars from the same class.")
			return fmt.Errorf("password validation failed")
		}
	}

	fmt.Fprintln(r.Out, "Hashing password...")
	hashed, err := r.Hasher.Hash(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Use psql -v variable binding to avoid SQL injection.
	// :'varname' is psql's parameterized literal syntax.
	sql := `UPDATE "Users" SET "encryptedPassword" = :'hash', "passwordChangedAt" = NOW(), "forcePasswordChange" = false, "updatedAt" = NOW() WHERE email = :'email';`

	pgEnv := dbCfg.PgEnv()
	stdout, code, err := r.Exec.RunWithEnvAndStdin(pgEnv, sql+"\n", binary,
		"-h", dbCfg.Host, "-p", dbCfg.PortStr(), "-U", dbCfg.User,
		"-d", pgDatabaseName(dbCfg.DBName), "-X", "-v", "ON_ERROR_STOP=1",
		"-v", "hash="+hashed, "-v", "email="+email, "-tA",
	)
	if err != nil {
		return fmt.Errorf("database update failed: %w", err)
	}

	if code != 0 {
		return fmt.Errorf("database update failed: psql exited with status %d", code)
	}

	if strings.Contains(stdout, "UPDATE 0") {
		return &CLIError{
			Summary:    "user not found",
			Suggestion: "Verify the email exists: sudo heimdall-cli config get ADMIN_EMAIL",
		}
	}

	fmt.Fprintln(r.Out)
	fmt.Fprintf(r.Out, "Password reset for %s\n", email)
	if generated {
		fmt.Fprintln(r.Out)
		fmt.Fprintf(r.Out, "  New password: %s\n", password)
		fmt.Fprintln(r.Out)
		fmt.Fprintln(r.Out, "  Save this password — it will not be shown again.")
	}

	return nil
}

// NewResetPasswordCmd creates the reset-password cobra command.
func NewResetPasswordCmd(runner *ResetPasswordRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &ResetPasswordRunner{
			Exec:      &execRunner{},
			Env:       NewFileEnvManager(),
			Hasher:    &BcryptHasher{Cost: 14},
			CheckRoot: requireRoot,
		}
	}
	var password string

	cmd := &cobra.Command{
		Use:   "reset-password [email]",
		Short: "Reset a user's password",
		Long: `Reset the password for a Heimdall Server user account. If no email is
provided, defaults to admin@heimdall.local. If no --password flag is
given, a cryptographically secure password is auto-generated and
displayed once.

Password complexity requirements (matching upstream Heimdall rules):
  - Minimum 15 characters
  - All 4 character classes required (lowercase, uppercase, digit, special)
  - No more than 4 consecutive characters from the same class

The password is hashed with bcrypt (cost 14) and written directly to
the database via psql. Requires root privileges and a configured
DATABASE_PASSWORD in backend.env.`,
		Example: `  # Reset the default admin password (auto-generates a new one)
  sudo heimdall-cli reset-password

  # Reset password for a specific user
  sudo heimdall-cli reset-password user@example.com

  # Set an explicit password for a user
  sudo heimdall-cli reset-password user@example.com --password 'MyStr0ng!Pass#2026'`,
		Args: cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if production {
				runner.Paths = commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: runner.Paths.EnvFile}
			}
			initIO(&runner.Out, &runner.ErrOut, cmd)

			email := "admin@heimdall.local"
			if len(args) > 0 {
				email = args[0]
			}

			return runner.Run(email, password)
		},
	}

	cmd.Flags().StringVarP(&password, "password", "p", "", "New password (generated if omitted)")
	return cmd
}
