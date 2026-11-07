package cmd

import "fmt"

// Deployment records ownership independently of service endpoints.
type Deployment struct {
	DatabaseMode string
	ProxyMode    string
	TLSMode      string
}

func resolveDeployment(env map[string]string, requested Deployment, configured bool) (Deployment, error) {
	defaults := Deployment{"bundled", "bundled", "internal"}
	if configured {
		defaults.DatabaseMode, defaults.ProxyMode = "external", "external"
	}
	choose := func(explicit, saved, fallback string) string {
		if explicit != "" {
			return explicit
		}
		if saved != "" {
			return saved
		}
		return fallback
	}
	d := Deployment{
		choose(requested.DatabaseMode, env["HEIMDALL_DATABASE_MODE"], defaults.DatabaseMode),
		choose(requested.ProxyMode, env["HEIMDALL_PROXY_MODE"], defaults.ProxyMode),
		choose(requested.TLSMode, env["HEIMDALL_TLS_MODE"], defaults.TLSMode),
	}
	if d.DatabaseMode != "bundled" && d.DatabaseMode != "external" {
		return Deployment{}, fmt.Errorf("database mode must be bundled or external")
	}
	if d.ProxyMode != "nginx" && d.ProxyMode != "bundled" && d.ProxyMode != "external" && d.ProxyMode != "none" {
		return Deployment{}, fmt.Errorf("proxy mode must be nginx, bundled, external, or none")
	}
	if d.TLSMode != "self-signed" && d.TLSMode != "acme" && d.TLSMode != "internal" && d.TLSMode != "custom" {
		return Deployment{}, fmt.Errorf("TLS mode must be self-signed, acme, internal, or custom")
	}
	if (d.ProxyMode == "nginx") != (d.TLSMode == "self-signed") {
		return Deployment{}, fmt.Errorf("nginx proxy requires self-signed TLS; self-signed TLS requires nginx proxy")
	}
	return d, nil
}

// The RPM ships an unconfigured template containing endpoints but no secrets.
func isConfigured(env map[string]string) bool {
	return env["DATABASE_PASSWORD"] != "" || env["DATABASE_URL"] != "" || env["JWT_SECRET"] != "" || env["API_KEY_SECRET"] != ""
}
