package cmd

import (
	"fmt"
	"strings"
)

// trimEnvComment removes comments after unquoted whitespace, preserving literal
// hashes and shell expressions without evaluating them.
func trimEnvComment(value string) string {
	var quote byte
	wordStart := false // A hash immediately after '=' belongs to the value.
	for i := 0; i < len(value); i++ {
		ch := value[i]
		if quote != 0 {
			switch {
			case ch == quote:
				quote = 0
			case quote == '"' && ch == '\\':
				i++
			}
			continue
		}
		if ch == '#' && wordStart {
			return strings.TrimSpace(value[:i])
		}
		if ch == '\\' {
			i++
		} else if ch == '\'' || ch == '"' {
			quote = ch
		}
		wordStart = ch == ' ' || ch == '\t'
	}
	return strings.TrimSpace(value)
}

// decodeEnvValue reads the supported quoted literal format without interpolation.
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
	if strings.ContainsAny(value, "\r\x00") {
		return "", fmt.Errorf("environment values must not contain carriage returns or NUL bytes")
	}
	escaped := strings.NewReplacer("\\", "\\\\", "\"", "\\\"", "$", "\\$", "`", "\\`").Replace(value)
	return "\"" + escaped + "\"", nil
}

// envLines keeps quoted multiline assignments together so parsing and updates
// agree about which physical lines belong to a value.
func envLines(content string) []string {
	physical := strings.Split(content, "\n")
	var lines []string
	for i := 0; i < len(physical); i++ {
		line := physical[i]
		trimmed := strings.TrimSpace(line)
		if idx := strings.Index(trimmed, "="); idx >= 0 && !strings.HasPrefix(trimmed, "#") {
			value := strings.TrimSpace(trimmed[idx+1:])
			for quotedEnvEnd(value) < 0 && i+1 < len(physical) {
				i++
				line += "\n" + physical[i]
				value += "\n" + physical[i]
			}
		}
		lines = append(lines, line)
	}
	return lines
}

func quotedEnvEnd(value string) int {
	if value == "" || (value[0] != '\'' && value[0] != '"') {
		return len(value)
	}
	for i := 1; i < len(value); i++ {
		if value[0] == '"' && value[i] == '\\' {
			i++
		} else if value[i] == value[0] {
			return i
		}
	}
	return -1
}
