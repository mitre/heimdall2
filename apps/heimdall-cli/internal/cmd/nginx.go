package cmd

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"net"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const bundledNginxService = "heimdall-nginx"

type nginxUpdate = caddyUpdate

func normalizeExternalURL(raw, mode string) (string, error) {
	if strings.ContainsAny(raw, "\r\n\t\x00") {
		return "", fmt.Errorf("EXTERNAL_URL contains unsafe characters")
	}
	if !strings.Contains(raw, "://") {
		if net.ParseIP(raw) != nil && strings.Contains(raw, ":") {
			raw = "[" + raw + "]"
		}
		scheme := "https"
		if mode == "none" {
			scheme = "http"
		}
		raw = scheme + "://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("invalid EXTERNAL_URL: %w", err)
	}
	origin := *u
	origin.Path, origin.RawPath = "", ""
	if _, err := validatePublicURL(origin.String()); err != nil {
		return "", err
	}
	if u.Path == "/" {
		u.Path, u.RawPath = "", ""
	}
	return u.String(), nil
}

func renderPrivateNginx(env map[string]string, dir string) (string, error) {
	portValue := envDefault(env, "PORT", DefaultAppPort)
	if err := ValidateValue("PORT", portValue); err != nil {
		return "", err
	}
	port, _ := strconv.Atoi(portValue)
	u, err := validatePublicURL(env["EXTERNAL_URL"])
	if err != nil {
		return "", err
	}
	if env["HEIMDALL_TLS_MODE"] != "self-signed" || u.Scheme != "https" || (u.Port() != "" && u.Port() != "443") {
		return "", fmt.Errorf("managed Nginx requires self-signed TLS and an HTTPS external URL on port 443")
	}
	return fmt.Sprintf(`worker_processes auto;
pid /run/heimdall-nginx/nginx.pid;
error_log stderr warn;
events { worker_connections 1024; }
http {
    access_log syslog:server=unix:/dev/log,tag=heimdall_nginx;
    client_body_temp_path /var/lib/heimdall-nginx/client_body;
    proxy_temp_path /var/lib/heimdall-nginx/proxy;
    map $http_upgrade $connection_upgrade { default upgrade; '' close; }
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name %s;
        ssl_certificate %s;
        ssl_certificate_key %s;
        ssl_protocols TLSv1.2 TLSv1.3;
        client_max_body_size 500m;
        location / {
            proxy_pass http://127.0.0.1:%d;
            proxy_http_version 1.1;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }
    }
}
`, strconv.Quote(u.Hostname()), strconv.Quote(dir+"/certs/server.crt"), strconv.Quote(dir+"/certs/server.key"), port), nil
}

func selfSignedCertificate(host string, days int) ([]byte, []byte, error) {
	key, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, nil, err
	}
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return nil, nil, err
	}
	now := time.Now().UTC()
	cert := &x509.Certificate{SerialNumber: serial, Subject: pkix.Name{CommonName: host}, NotBefore: now, NotAfter: now.Add(time.Duration(days) * 24 * time.Hour), SignatureAlgorithm: x509.SHA256WithRSA, KeyUsage: x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}, BasicConstraintsValid: true}
	if ip := net.ParseIP(host); ip != nil {
		cert.IPAddresses = []net.IP{ip}
	} else {
		cert.DNSNames = []string{host}
	}
	der, err := x509.CreateCertificate(rand.Reader, cert, cert, &key.PublicKey, key)
	if err != nil {
		return nil, nil, err
	}
	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)}), nil
}

func (r *SetupRunner) prepareBundledNginx(env map[string]string) (*nginxUpdate, error) {
	dir := r.Paths.ConfigDir + "/nginx"
	config, err := renderPrivateNginx(env, dir)
	if err != nil {
		return nil, err
	}
	binary := r.Paths.RuntimePath("nginx", "sbin", "nginx")
	if err := requireRegular(r.FS, binary); err != nil {
		return nil, err
	}
	owner := bundledNginxService
	if r.previousProxyMode == "bundled" {
		owner = bundledCaddyService
	}
	if err := checkOwnedPort(r.Exec, r.Systemd, 443, owner, false); err != nil {
		return nil, err
	}
	update := &nginxUpdate{runner: r, unit: bundledNginxService, group: "heimdall-nginx", runDir: "/run/heimdall-nginx", config: config, pending: dir + "/nginx.conf.pending", certs: map[string][]byte{}}
	update.active, err = r.Systemd.IsActive(bundledNginxService)
	if err != nil {
		return nil, err
	}
	state, err := r.Systemd.ShowProperty(bundledNginxService, "UnitFileState")
	if err != nil {
		return nil, err
	}
	update.enabled = state == "enabled" || state == "enabled-runtime"
	for _, path := range []string{dir + "/nginx.conf", dir + "/certs/server.crt", dir + "/certs/server.key"} {
		saved, err := snapshotFile(r.FS, path)
		if err != nil {
			return nil, err
		}
		update.saved = append(update.saved, saved)
	}
	u, _ := validatePublicURL(env["EXTERNAL_URL"])
	cert, key := update.saved[1], update.saved[2]
	if cert.exists != key.exists {
		return nil, fmt.Errorf("incomplete Nginx certificate/key pair; restore both files before setup")
	}
	if cert.exists {
		pair, err := tls.X509KeyPair(cert.data, key.data)
		if err != nil {
			return nil, fmt.Errorf("invalid Nginx certificate/key: %w", err)
		}
		leaf, err := x509.ParseCertificate(pair.Certificate[0])
		if err != nil {
			return nil, fmt.Errorf("invalid Nginx certificate: %w", err)
		}
		if err := leaf.VerifyHostname(u.Hostname()); err != nil {
			return nil, fmt.Errorf("existing Nginx certificate does not match external hostname: %w", err)
		}
		if time.Now().Before(leaf.NotBefore) || !time.Now().Before(leaf.NotAfter) {
			return nil, fmt.Errorf("existing Nginx certificate is outside its validity period; replace the certificate/key pair before setup")
		}
	} else {
		days, err := certificateLifetimeDays(env)
		if err != nil {
			return nil, err
		}
		crt, pemKey, err := selfSignedCertificate(u.Hostname(), days)
		if err != nil {
			return nil, fmt.Errorf("generating Nginx certificate: %w", err)
		}
		update.certs[cert.path], update.certs[key.path] = crt, pemKey
	}
	for _, path := range []string{update.pending, cert.path + ".pending", key.path + ".pending", "/var/lib/heimdall-nginx/.heimdall-check", "/run/heimdall-nginx/.heimdall-check"} {
		if err := safeManagedPath(r.FS, path); err != nil {
			return nil, err
		}
	}
	for _, path := range []string{dir, dir + "/certs"} {
		if err := r.FS.MkdirAll(path, 0750); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chown", "root:heimdall-nginx", path); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chmod", "0750", path); err != nil {
			return nil, err
		}
	}
	if err := runChecked(r.Exec, "chmod", "0751", r.Paths.ConfigDir); err != nil {
		return nil, err
	}
	for _, path := range []string{"/var/lib/heimdall-nginx", "/run/heimdall-nginx"} {
		if err := r.FS.MkdirAll(path, 0750); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chown", "heimdall-nginx:heimdall-nginx", path); err != nil {
			return nil, err
		}
	}
	if err := runChecked(r.Exec, "runuser", "-u", "heimdall-nginx", "--", "mkdir", "-p", "/var/lib/heimdall-nginx/client_body", "/var/lib/heimdall-nginx/proxy"); err != nil {
		return nil, err
	}
	if cert.exists {
		for _, path := range []string{cert.path, key.path} {
			if err := runChecked(r.Exec, "chown", "root:heimdall-nginx", path); err != nil {
				return nil, err
			}
			if err := runChecked(r.Exec, "chmod", "0640", path); err != nil {
				return nil, err
			}
		}
	}
	defer update.cleanup()
	candidate := config
	for path, data := range update.certs {
		if err := r.FS.RemoveAll(path + ".pending"); err != nil {
			return nil, err
		}
		if err := r.FS.WriteFile(path+".pending", data, 0640); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chown", "root:heimdall-nginx", path+".pending"); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chmod", "0640", path+".pending"); err != nil {
			return nil, err
		}
		candidate = strings.ReplaceAll(candidate, strconv.Quote(path), strconv.Quote(path+".pending"))
	}
	if err := r.FS.RemoveAll(update.pending); err != nil {
		return nil, err
	}
	if err := r.FS.WriteFile(update.pending, []byte(candidate), 0640); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "chown", "root:heimdall-nginx", update.pending); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "chmod", "0640", update.pending); err != nil {
		return nil, err
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.RuntimePath("nginx"), dir); err != nil {
		return nil, err
	}
	// Nginx config tests bind listeners, so grant the service's bind capability.
	if err := runChecked(r.Exec, "setpriv", "--reuid=heimdall-nginx", "--regid=heimdall-nginx", "--init-groups",
		"--inh-caps=-all,+net_bind_service", "--ambient-caps=-all,+net_bind_service", "--bounding-set=-all,+net_bind_service",
		"--", binary, "-t", "-c", update.pending); err != nil {
		return nil, fmt.Errorf("validating Nginx configuration as service account: %w", err)
	}
	return update, nil
}

func proxyPortOwner(previous, fallback string) string {
	if previous == "nginx" {
		return bundledNginxService
	}
	return fallback
}
