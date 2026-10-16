package cmd

import (
	"fmt"
	"strings"
)

// decodeEnvValue reads the supported single-line literal format without interpolation.
func decodeEnvValue(value string) string {
	if len(value) >= 2 && value[0] == '\'' && value[len(value)-1] == '\'' {
		return value[1 : len(value)-1]
	}
	if len(value) < 2 || value[0] != '"' || value[len(value)-1] != '"' {
		return value
	}
	inner := value[1 : len(value)-1]
	var out strings.Builder
	for i := 0; i < len(inner); i++ {
		if inner[i] == '\\' && i+1 < len(inner) && strings.ContainsRune("\\\"$`", rune(inner[i+1])) {
			i++
		}
		out.WriteByte(inner[i])
	}
	return out.String()
}

func encodeEnvValue(value string) (string, error) {
	if strings.ContainsAny(value, "\r\n\x00") {
		return "", fmt.Errorf("environment values must be single-line literals")
	}
	escaped := strings.NewReplacer("\\", "\\\\", "\"", "\\\"", "$", "\\$", "`", "\\`").Replace(value)
	return "\"" + escaped + "\"", nil
}
