package cmd

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseEnvTrailingComments(t *testing.T) {
	for _, test := range []struct{ assignment, want string }{
		{`VALUE=plain # comment`, "plain"},
		{`VALUE="quoted secret" # maintained by DBA`, "quoted secret"},
		{`VALUE='single quoted' # comment`, "single quoted"},
		{`VALUE= # empty value`, ""},
		{`VALUE=#literal`, "#literal"},
		{`VALUE=literal#hash # comment`, "literal#hash"},
		{`VALUE="hash # inside" # outside`, "hash # inside"},
		{`VALUE='hash # inside' # outside`, "hash # inside"},
		{`VALUE="escaped \" # inside" # outside`, "escaped \" # inside"},
		{`VALUE="literal $HOME $(printf secret)" # outside`, "literal $HOME $(printf secret)"},
		{"VALUE=\"literal \\$HOME \\`command\\`\" # outside", "literal $HOME `command`"},
		{"VALUE=plain\t# comment", "plain"},
		{"VALUE=\"line one\n# inside\nline three\" # outside", "line one\n# inside\nline three"},
	} {
		t.Run(test.assignment, func(t *testing.T) {
			require.Equal(t, test.want, ParseEnv(test.assignment)["VALUE"])
		})
	}
}

func TestUpdateEnvPreservesUnchangedInlineComments(t *testing.T) {
	const original = "DATABASE_PASSWORD=\"secret # text\" # maintained by DBA\nPORT=3000 # backend port\n"
	updated, err := updateEnvContent([]byte(original), map[string]string{"DATABASE_PASSWORD": "secret # text", "PORT": "3000"})
	require.NoError(t, err)
	require.Equal(t, original, updated)
}
