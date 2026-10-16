package cmd

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDetectCloud(t *testing.T) {
	tests := []struct {
		name    string
		results map[string]FakeExecResult
		want    string
	}{
		{
			name: "AWS EC2 — metadata responds",
			results: map[string]FakeExecResult{
				// curl -sf ... matches first call (EC2), returns instance ID
				"curl -sf": {Stdout: "i-0123456789abcdef0", ExitCode: 0},
			},
			want: "ec2",
		},
		{
			name: "bare-metal — all metadata fail",
			results: map[string]FakeExecResult{
				"curl -sf": {Stdout: "", ExitCode: 1},
			},
			want: "bare-metal",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			out := new(bytes.Buffer)
			r := &SetupRunner{
				Exec: &FakeExecRunner{Results: tt.results},
				Out:  out,
			}
			got := r.detectCloud()
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestPrintCloudHint(t *testing.T) {
	tests := []struct {
		cloud    string
		contains string
	}{
		{"ec2", "Security Group"},
		{"azure", "Network Security Group"},
		{"gcp", "VPC firewall"},
		{"bare-metal", ""},
	}

	for _, tt := range tests {
		t.Run(tt.cloud, func(t *testing.T) {
			out := new(bytes.Buffer)
			r := &SetupRunner{Out: out}
			r.printCloudHint(tt.cloud)
			if tt.contains != "" {
				assert.Contains(t, out.String(), tt.contains)
			} else {
				assert.Empty(t, out.String(), "bare-metal should print nothing")
			}
		})
	}
}
