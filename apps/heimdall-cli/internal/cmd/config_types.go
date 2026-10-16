package cmd

// Paths — FHS defaults matching the RPM layout.
// These are var (not const) so they can be overridden at compile time via:
//
//	go build -ldflags "-X 'github.com/mitre/heimdall2/apps/heimdall-cli/internal/cmd.AppDir=/custom'"
var (
	EnvFile     = "/etc/heimdall-server/backend.env"
	AppDir      = "/usr/share/heimdall-server"
	DataDir     = "/var/lib/heimdall-server"
	LibExecDir  = "/usr/libexec/heimdall-server"
	CertDir     = "/etc/pki/heimdall-server"
	ConfigDir   = "/etc/heimdall-server"
	LogDir      = "/var/log/heimdall-server"
)

// Paths holds resolved filesystem paths for the Heimdall installation.
// Injected into runners to avoid global Viper state.
type Paths struct {
	AppDir     string
	DataDir    string
	LibExecDir string
	ConfigDir  string
	CertDir    string
	LogDir     string
	EnvFile    string
}

// DefaultPaths returns compile-time FHS defaults.
func DefaultPaths() Paths {
	return Paths{
		AppDir:     AppDir,
		DataDir:    DataDir,
		LibExecDir: LibExecDir,
		ConfigDir:  ConfigDir,
		CertDir:    CertDir,
		LogDir:     LogDir,
		EnvFile:    EnvFile,
	}
}

// ServiceName is a constant — not configurable via paths.
const ServiceName = "heimdall-server"

// Default port constants.
const (
	DefaultAppPort    = "3000"
	DefaultRPMAppPort = "3002"
	DefaultDBPort     = 5432
)

// SecretsSet lists env keys whose values must be masked in output.
var SecretsSet = map[string]bool{
	"DATABASE_PASSWORD":   true,
	"JWT_SECRET":          true,
	"API_KEY_SECRET":      true,
	"ADMIN_PASSWORD":      true,
	"OKTA_CLIENTSECRET":   true,
	"GITHUB_CLIENTSECRET": true,
	"GITLAB_CLIENTSECRET": true,
	"GOOGLE_CLIENTSECRET": true,
	"OIDC_CLIENT_SECRET":  true,
	"LDAP_PASSWORD":       true,
}

// PasswordRules holds password complexity settings.
type PasswordRules struct {
	MinLength      int
	RequireClasses int
	MaxConsecutive int
}

// DefaultPasswordRules returns the defaults matching upstream libs/password-complexity.
func DefaultPasswordRules() PasswordRules {
	return PasswordRules{
		MinLength:      15,
		RequireClasses: 4,
		MaxConsecutive: 4,
	}
}
