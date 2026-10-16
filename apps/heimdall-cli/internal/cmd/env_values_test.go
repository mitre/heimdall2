package cmd

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestEnvValueCodec(t *testing.T) {
	for _, value := range []string{
		"", "plain", " spaces stay ", "'single-quoted'", "\"double-quoted\"",
		"backslash\\ dollar$ backtick` and quote\"", "literal\\n", "tab\tvalue",
	} {
		t.Run(value, func(t *testing.T) {
			encoded, err := encodeEnvValue(value)
			require.NoError(t, err)
			require.Equal(t, value, decodeEnvValue(encoded))
		})
	}
	for _, value := range []string{"line\nbreak", "carriage\rreturn", "nul\x00byte"} {
		t.Run("reject "+value, func(t *testing.T) {
			_, err := encodeEnvValue(value)
			require.Error(t, err)
		})
	}
}

func TestDecodeEnvValue(t *testing.T) {
	for _, test := range []struct{ input, want string }{
		{"", ""},
		{"plain", "plain"},
		{"'single quoted'", "single quoted"},
		{"\"double quoted\"", "double quoted"},
		{"'\"keep inner quotes\"'", "\"keep inner quotes\""},
		{"\"\\\"inner\\\"\"", "\"inner\""},
		{"\"\\\\ \\\" \\$ \\` \\n \\q\"", "\\ \" $ ` \\n \\q"},
		{"'$HOME \\n `text`'", "$HOME \\n `text`"},
		{"\"$HOME $(printf test)\"", "$HOME $(printf test)"},
		{"'unmatched", "'unmatched"},
	} {
		t.Run(test.input, func(t *testing.T) {
			require.Equal(t, test.want, decodeEnvValue(test.input))
		})
	}
}
