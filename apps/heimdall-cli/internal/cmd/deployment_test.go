package cmd

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func TestResolveDeployment(t *testing.T) {
	for _, tc := range []struct {
		name       string
		saved      map[string]string
		requested  Deployment
		configured bool
		want       Deployment
	}{
		{"fresh", nil, Deployment{}, false, Deployment{"bundled", "bundled", "internal"}},
		{"legacy", nil, Deployment{}, true, Deployment{"external", "external", "internal"}},
		{"localhost external", map[string]string{"DATABASE_HOST": "localhost", "HEIMDALL_DATABASE_MODE": "external", "HEIMDALL_PROXY_MODE": "bundled", "HEIMDALL_TLS_MODE": "acme"}, Deployment{}, true, Deployment{"external", "bundled", "acme"}},
		{"explicit wins", map[string]string{"HEIMDALL_PROXY_MODE": "bundled"}, Deployment{ProxyMode: "external"}, true, Deployment{"external", "external", "internal"}},
		{"saved rerun", map[string]string{"HEIMDALL_DATABASE_MODE": "bundled", "HEIMDALL_PROXY_MODE": "none", "HEIMDALL_TLS_MODE": "custom"}, Deployment{}, true, Deployment{"bundled", "none", "custom"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := resolveDeployment(tc.saved, tc.requested, tc.configured)
			require.NoError(t, err)
			require.Equal(t, tc.want, got)
		})
	}
	for _, d := range []Deployment{{DatabaseMode: "localhost"}, {ProxyMode: "nginx"}, {TLSMode: "off"}} {
		_, err := resolveDeployment(nil, d, false)
		require.Error(t, err)
	}
}
