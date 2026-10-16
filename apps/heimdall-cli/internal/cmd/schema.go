package cmd

import (
	"fmt"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"strings"
)

// ConfigEntry describes a single configuration key.
type ConfigEntry struct {
	Key         string
	Category    string
	Type        string // str, int, bool, secret, url, email, path
	Default     string
	Description string
	Validation  string   // e.g. "1-65535" for int range
	Choices     []string // allowed values
	Required    bool
}

// Category groups config entries for display.
type Category struct {
	ID    string
	Label string
	Order int
}

// Categories in display order.
var Categories = []Category{
	{"core", "Core", 0},
	{"database", "Database", 1},
	{"auth", "Authentication", 2},
	{"ui", "UI / Branding", 3},
	{"github", "GitHub OAuth", 4},
	{"gitlab", "GitLab OAuth", 5},
	{"google", "Google OAuth", 6},
	{"okta", "Okta OIDC", 7},
	{"oidc", "Generic OIDC", 8},
	{"ldap", "LDAP", 9},
	{"proxy", "Proxy / TLS", 10},
	{"integrations", "External Services", 11},
}

// ConfigSchema is the full schema keyed by env var name.
// Entries are defined in declaration order within each category.
var ConfigSchema = buildSchema()

// SchemaKeys returns keys in schema-definition order.
var SchemaKeys = buildSchemaKeys()

func buildSchemaKeys() []string {
	entries := schemaEntries()
	keys := make([]string, len(entries))
	for i, e := range entries {
		keys[i] = e.Key
	}
	return keys
}

func buildSchema() map[string]ConfigEntry {
	m := make(map[string]ConfigEntry)
	for _, e := range schemaEntries() {
		m[e.Key] = e
	}
	return m
}

func schemaEntries() []ConfigEntry {
	return []ConfigEntry{
		// Core
		{Key: "NODE_ENV", Category: "core", Type: "str", Default: "production", Description: "Application environment.", Choices: []string{"production", "development", "test"}, Required: true},
		{Key: "PORT", Category: "core", Type: "int", Default: "3000", Validation: "1024-65535", Description: "HTTP listen port."},
		{Key: "EXTERNAL_URL", Category: "core", Type: "url", Default: "", Description: "Public URL users access Heimdall at. Required for OAuth callbacks."},
		{Key: "NGINX_HOST", Category: "core", Type: "str", Default: "localhost", Description: "Hostname used by frontend defaults."},
		{Key: "LOG_FILE", Category: "core", Type: "path", Default: "", Description: "Log file path. If unset, logs go to journald."},

		// Deployment ownership is applied by setup, not a service restart.
		{Key: "HEIMDALL_DATABASE_MODE", Category: "database", Type: "str", Choices: []string{"bundled", "external"}, Description: "Database ownership; change through setup."},
		{Key: "HEIMDALL_PROXY_MODE", Category: "proxy", Type: "str", Choices: []string{"nginx", "bundled", "external", "none"}, Description: "Proxy ownership; change through setup."},
		{Key: "HEIMDALL_TLS_MODE", Category: "proxy", Type: "str", Choices: []string{"self-signed", "acme", "internal", "custom"}, Description: "Bundled proxy TLS mode; change through setup."},
		{Key: "HEIMDALL_TLS_CERT", Category: "proxy", Type: "path", Description: "Custom TLS certificate path; change through setup."},
		{Key: "HEIMDALL_TLS_KEY", Category: "proxy", Type: "path", Description: "Custom TLS private key path; change through setup."},
		{Key: "HEIMDALL_TLS_CERT_DAYS", Category: "proxy", Type: "int", Default: "7", Validation: "1-365", Description: "Requested lifetime in days for new local certificates; change through setup."},
		// Database
		{Key: "DATABASE_HOST", Category: "database", Type: "str", Default: "localhost", Description: "PostgreSQL hostname."},
		{Key: "DATABASE_PORT", Category: "database", Type: "int", Default: "5432", Validation: "1-65535", Description: "PostgreSQL port."},
		{Key: "DATABASE_USERNAME", Category: "database", Type: "str", Default: "postgres", Description: "PostgreSQL username."},
		{Key: "DATABASE_PASSWORD", Category: "database", Type: "secret", Default: "", Description: "PostgreSQL password.", Required: true},
		{Key: "DATABASE_NAME", Category: "database", Type: "str", Default: "heimdall-server-production", Description: "Database name."},
		{Key: "DATABASE_URL", Category: "database", Type: "url", Default: "", Description: "Full connection URL. Overrides individual DB settings if set."},
		{Key: "DATABASE_SSL", Category: "database", Type: "bool", Default: "false", Description: "Enable SSL for database connection."},
		{Key: "DATABASE_SSL_KEY", Category: "database", Type: "path", Default: "", Description: "SSL key file path or PEM content."},
		{Key: "DATABASE_SSL_CERT", Category: "database", Type: "path", Default: "", Description: "SSL certificate file path or PEM content."},
		{Key: "DATABASE_SSL_CA", Category: "database", Type: "path", Default: "", Description: "SSL CA certificate file path or PEM content."},
		{Key: "DATABASE_SSL_INSECURE", Category: "database", Type: "bool", Default: "false", Description: "Skip SSL certificate verification."},

		// Authentication
		{Key: "JWT_SECRET", Category: "auth", Type: "secret", Default: "", Description: "Secret key for JWT signing. Auto-generated by setup.", Required: true},
		{Key: "JWT_EXPIRE_TIME", Category: "auth", Type: "str", Default: "1d", Description: "JWT expiration duration (e.g., 60s, 1h, 1d)."},
		{Key: "API_KEY_SECRET", Category: "auth", Type: "secret", Default: "", Description: "Secret for API key generation. Leave blank to disable API keys."},
		{Key: "ADMIN_EMAIL", Category: "auth", Type: "email", Default: "admin@heimdall.local", Description: "Initial admin user email (used during db:seed)."},
		{Key: "ADMIN_PASSWORD", Category: "auth", Type: "secret", Default: "", Description: "Initial admin password. Auto-generated if blank."},
		{Key: "ADMIN_USES_EXTERNAL_AUTH", Category: "auth", Type: "bool", Default: "false", Description: "Admin authenticates via external provider instead of local."},
		{Key: "LOCAL_LOGIN_DISABLED", Category: "auth", Type: "bool", Default: "false", Description: "Disable local username/password login."},
		{Key: "REGISTRATION_DISABLED", Category: "auth", Type: "bool", Default: "false", Description: "Disable public user registration."},
		{Key: "ONE_SESSION_PER_USER", Category: "auth", Type: "bool", Default: "false", Description: "Only allow one active session per user."},
		{Key: "MAX_FILE_UPLOAD_SIZE", Category: "auth", Type: "int", Default: "50", Description: "Maximum evaluation upload size in MB."},

		// UI / Branding
		{Key: "WARNING_BANNER", Category: "ui", Type: "str", Default: "", Description: "Warning banner text displayed to users."},
		{Key: "CLASSIFICATION_BANNER_TEXT", Category: "ui", Type: "str", Default: "", Description: "Classification banner text (e.g., CUI, FOUO)."},
		{Key: "CLASSIFICATION_BANNER_TEXT_COLOR", Category: "ui", Type: "str", Default: "white", Description: "Classification banner text color."},
		{Key: "CLASSIFICATION_BANNER_COLOR", Category: "ui", Type: "str", Default: "red", Description: "Classification banner background color."},

		// GitHub OAuth
		{Key: "GITHUB_CLIENTID", Category: "github", Type: "str", Default: "", Description: "GitHub OAuth app client ID. Set to enable GitHub login."},
		{Key: "GITHUB_CLIENTSECRET", Category: "github", Type: "secret", Default: "", Description: "GitHub OAuth app client secret."},
		{Key: "GITHUB_ENTERPRISE_INSTANCE_BASE_URL", Category: "github", Type: "url", Default: "https://github.com/", Description: "GitHub Enterprise base URL."},
		{Key: "GITHUB_ENTERPRISE_INSTANCE_API_URL", Category: "github", Type: "url", Default: "https://api.github.com/", Description: "GitHub Enterprise API URL."},

		// GitLab OAuth
		{Key: "GITLAB_CLIENTID", Category: "gitlab", Type: "str", Default: "", Description: "GitLab OAuth app client ID. Set to enable GitLab login."},
		{Key: "GITLAB_CLIENTSECRET", Category: "gitlab", Type: "secret", Default: "", Description: "GitLab OAuth app client secret."},
		{Key: "GITLAB_BASEURL", Category: "gitlab", Type: "url", Default: "https://gitlab.com", Description: "GitLab instance URL."},

		// Google OAuth
		{Key: "GOOGLE_CLIENTID", Category: "google", Type: "str", Default: "", Description: "Google OAuth client ID. Set to enable Google login."},
		{Key: "GOOGLE_CLIENTSECRET", Category: "google", Type: "secret", Default: "", Description: "Google OAuth client secret."},

		// Okta OIDC
		{Key: "OKTA_DOMAIN", Category: "okta", Type: "str", Default: "", Description: "Okta domain (e.g., your-org.okta.com)."},
		{Key: "OKTA_CLIENTID", Category: "okta", Type: "str", Default: "", Description: "Okta OAuth app client ID. Set to enable Okta login."},
		{Key: "OKTA_CLIENTSECRET", Category: "okta", Type: "secret", Default: "", Description: "Okta OAuth app client secret."},
		{Key: "OKTA_ISSUER_URL", Category: "okta", Type: "url", Default: "", Description: "Okta issuer URL. Auto-computed from OKTA_DOMAIN if not set."},
		{Key: "OKTA_AUTHORIZATION_URL", Category: "okta", Type: "url", Default: "", Description: "Okta authorization endpoint. Auto-computed from OKTA_DOMAIN."},
		{Key: "OKTA_TOKEN_URL", Category: "okta", Type: "url", Default: "", Description: "Okta token endpoint. Auto-computed from OKTA_DOMAIN."},
		{Key: "OKTA_USER_INFO_URL", Category: "okta", Type: "url", Default: "", Description: "Okta userinfo endpoint. Auto-computed from OKTA_DOMAIN."},
		{Key: "OKTA_USE_HTTPS_PROXY", Category: "okta", Type: "bool", Default: "false", Description: "Route Okta requests through HTTPS_PROXY."},

		// Generic OIDC
		{Key: "OIDC_NAME", Category: "oidc", Type: "str", Default: "", Description: "Display name for OIDC provider (shown on login page)."},
		{Key: "OIDC_ISSUER", Category: "oidc", Type: "url", Default: "", Description: "OIDC provider issuer URL."},
		{Key: "OIDC_AUTHORIZATION_URL", Category: "oidc", Type: "url", Default: "", Description: "OIDC authorization endpoint."},
		{Key: "OIDC_TOKEN_URL", Category: "oidc", Type: "url", Default: "", Description: "OIDC token endpoint."},
		{Key: "OIDC_USER_INFO_URL", Category: "oidc", Type: "url", Default: "", Description: "OIDC userinfo endpoint."},
		{Key: "OIDC_CLIENTID", Category: "oidc", Type: "str", Default: "", Description: "OIDC client ID. Set to enable generic OIDC login."},
		{Key: "OIDC_CLIENT_SECRET", Category: "oidc", Type: "secret", Default: "", Description: "OIDC client secret."},
		{Key: "OIDC_USE_HTTPS_PROXY", Category: "oidc", Type: "bool", Default: "false", Description: "Route OIDC requests through HTTPS_PROXY."},
		{Key: "OIDC_USES_PKCE_S256", Category: "oidc", Type: "bool", Default: "false", Description: "Use PKCE with SHA-256 challenge method."},
		{Key: "OIDC_USES_PKCE_PLAIN", Category: "oidc", Type: "bool", Default: "false", Description: "Use PKCE with plain text challenge method."},
		{Key: "OIDC_USES_VERIFIED_EMAIL", Category: "oidc", Type: "bool", Default: "true", Description: "Require verified email from OIDC provider."},
		{Key: "OIDC_EXTERNAL_GROUPS", Category: "oidc", Type: "bool", Default: "false", Description: "Synchronize user groups from OIDC provider claims."},

		// LDAP
		{Key: "LDAP_ENABLED", Category: "ldap", Type: "bool", Default: "false", Description: "Enable LDAP authentication."},
		{Key: "LDAP_HOST", Category: "ldap", Type: "str", Default: "", Description: "LDAP server hostname."},
		{Key: "LDAP_PORT", Category: "ldap", Type: "int", Default: "389", Validation: "1-65535", Description: "LDAP server port."},
		{Key: "LDAP_BINDDN", Category: "ldap", Type: "str", Default: "", Description: "Bind DN for LDAP lookups."},
		{Key: "LDAP_PASSWORD", Category: "ldap", Type: "secret", Default: "", Description: "Bind password for LDAP lookups."},
		{Key: "LDAP_SEARCHBASE", Category: "ldap", Type: "str", Default: "", Description: "LDAP search base DN."},
		{Key: "LDAP_SEARCHFILTER", Category: "ldap", Type: "str", Default: "(sAMAccountName={{username}})", Description: "LDAP search filter. {{username}} is replaced at login."},
		{Key: "LDAP_NAMEFIELD", Category: "ldap", Type: "str", Default: "name", Description: "LDAP attribute containing display name."},
		{Key: "LDAP_MAILFIELD", Category: "ldap", Type: "str", Default: "mail", Description: "LDAP attribute containing email address."},
		{Key: "LDAP_SSL", Category: "ldap", Type: "bool", Default: "false", Description: "Use SSL for LDAP connections."},
		{Key: "LDAP_SSL_INSECURE", Category: "ldap", Type: "bool", Default: "false", Description: "Skip LDAP SSL certificate verification."},
		{Key: "LDAP_SSL_CA", Category: "ldap", Type: "path", Default: "", Description: "LDAP SSL CA certificate file path or PEM content."},

		// Proxy / TLS
		{Key: "HTTPS_PROXY", Category: "proxy", Type: "url", Default: "", Description: "HTTPS proxy URL for OAuth/OIDC outbound requests."},
		{Key: "NODE_EXTRA_CA_CERTS", Category: "proxy", Type: "path", Default: "", Description: "Path to CA bundle for TLS inspection proxies."},

		// External Services
		{Key: "TENABLE_HOST_URL", Category: "integrations", Type: "url", Default: "", Description: "Tenable.SC instance URL."},
		{Key: "SPLUNK_HOST_URL", Category: "integrations", Type: "url", Default: "", Description: "Splunk instance URL."},
		{Key: "FORCE_TENABLE_FRONTEND", Category: "integrations", Type: "bool", Default: "false", Description: "Force Tenable.SC UI on frontend."},
	}
}

// KeysForCategory returns schema keys belonging to a category in definition order.
func KeysForCategory(catID string) []string {
	var keys []string
	for _, e := range schemaEntries() {
		if e.Category == catID {
			keys = append(keys, e.Key)
		}
	}
	return keys
}

// Match the backend's ms duration syntax; JWT lifetimes must be positive.
var jwtDurationPattern = regexp.MustCompile(`(?i)^((?:[0-9]+)?\.?[0-9]+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$`)

// ValidateValue validates a value against the schema entry for key.
// Returns nil if valid or no schema entry exists, error otherwise.
func ValidateValue(key, value string) error {
	entry, ok := ConfigSchema[key]
	if !ok {
		return nil // unknown keys pass validation
	}
	if key == "JWT_EXPIRE_TIME" {
		if err := validateJWTDuration(value); err != nil {
			return err
		}
	}

	switch entry.Type {
	case "int":
		if err := validateInteger(entry, key, value); err != nil {
			return err
		}
	case "bool":
		lower := strings.ToLower(value)
		if lower != "true" && lower != "false" {
			return fmt.Errorf("%s must be true or false", key)
		}
	}

	if len(entry.Choices) > 0 && !slices.Contains(entry.Choices, value) {
		return fmt.Errorf("%s must be one of: %s", key, strings.Join(entry.Choices, ", "))
	}

	return nil
}

// IsSecret returns true if the key holds a secret value.
func IsSecret(key string) bool {
	if SecretsSet[key] {
		return true
	}
	if entry, ok := ConfigSchema[key]; ok {
		return entry.Type == "secret"
	}
	return false
}

// SortedCategories returns categories sorted by Order.
func SortedCategories() []Category {
	sorted := make([]Category, len(Categories))
	copy(sorted, Categories)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Order < sorted[j].Order
	})
	return sorted
}

func validateJWTDuration(value string) error {
	match := jwtDurationPattern.FindStringSubmatch(value)
	if len(value) > 100 || match == nil {
		return fmt.Errorf("JWT_EXPIRE_TIME must be a positive duration such as 1d or 25m")
	}
	n, err := strconv.ParseFloat(match[1], 64)
	if err != nil || n <= 0 {
		return fmt.Errorf("JWT_EXPIRE_TIME must be a positive duration such as 1d or 25m")
	}
	return nil
}

func validateInteger(entry ConfigEntry, key, value string) error {
	n, err := strconv.Atoi(value)
	if err != nil {
		return fmt.Errorf("%s must be an integer", key)
	}
	if entry.Validation != "" {
		parts := strings.SplitN(entry.Validation, "-", 2)
		if len(parts) == 2 {
			lo, _ := strconv.Atoi(parts[0])
			hi, _ := strconv.Atoi(parts[1])
			if n < lo || n > hi {
				return fmt.Errorf("%s must be %s", key, entry.Validation)
			}
		}
	}
	return nil
}
