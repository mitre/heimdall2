package cmd

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// BcryptHasher implements PasswordHasher using Go-native bcrypt.
// NOTE: bcrypt uses Blowfish which is NOT FIPS 140-2/140-3 approved.
// GOEXPERIMENT=boringcrypto only covers TLS/SHA/AES — bcrypt runs in
// pure Go regardless. FIPS compliance requires migrating to PBKDF2
// (tracked separately: app must add dual-verify support first).
// Cost factor 14 matches the Heimdall app's bcryptjs configuration.
type BcryptHasher struct {
	Cost int
}

// Hash hashes a password using bcrypt at the configured cost factor.
func (h *BcryptHasher) Hash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), h.Cost)
	if err != nil {
		return "", fmt.Errorf("bcrypt hash failed: %w", err)
	}
	return string(hash), nil
}

// Verify checks a password against a bcrypt hash.
func (h *BcryptHasher) Verify(password, hashedPassword string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

// ValidatePassword checks a password against the given rules.
// Returns a slice of error strings (empty means valid).
func ValidatePassword(password string, rules PasswordRules) []string {
	var errs []string

	if len(password) < rules.MinLength {
		errs = append(errs, fmt.Sprintf("Password must be at least %d characters", rules.MinLength))
	}

	hasLower := false
	hasUpper := false
	hasDigit := false
	hasSpecial := false
	for _, ch := range password {
		switch {
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsDigit(ch):
			hasDigit = true
		default:
			hasSpecial = true
		}
	}
	classCount := boolToInt(hasLower) + boolToInt(hasUpper) + boolToInt(hasDigit) + boolToInt(hasSpecial)
	if classCount < rules.RequireClasses {
		errs = append(errs, fmt.Sprintf(
			"Password must contain at least %d of: lowercase, uppercase, numbers, special characters (has %d)",
			rules.RequireClasses, classCount))
	}

	// Check consecutive same-class runs
	if hasConsecutiveRun(password, rules.MaxConsecutive) {
		errs = append(errs, fmt.Sprintf(
			"Password must not contain %d or more consecutive characters of the same class",
			rules.MaxConsecutive))
	}

	return errs
}

// charClass returns a class identifier for the character.
func charClass(ch rune) int {
	switch {
	case unicode.IsLower(ch):
		return 0
	case unicode.IsUpper(ch):
		return 1
	case unicode.IsDigit(ch):
		return 2
	default:
		return 3
	}
}

// hasConsecutiveRun checks if password has maxConsec or more consecutive chars of the same class.
func hasConsecutiveRun(password string, maxConsec int) bool {
	if maxConsec <= 0 {
		return false
	}
	runes := []rune(password)
	if len(runes) == 0 {
		return false
	}
	run := 1
	prevClass := charClass(runes[0])
	for i := 1; i < len(runes); i++ {
		cls := charClass(runes[i])
		if cls == prevClass {
			run++
			if run >= maxConsec {
				return true
			}
		} else {
			run = 1
			prevClass = cls
		}
	}
	return false
}

// GeneratePassword creates a random password that passes the given rules.
// It interleaves character classes to avoid consecutive-class violations.
func GeneratePassword(rules PasswordRules) (string, error) {
	length := rules.MinLength
	if length < 20 {
		length = 20
	}

	lower := "abcdefghijklmnopqrstuvwxyz"
	upper := "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	special := "!@#$%^&*()-_=+[]{}|;:,.<>?"
	classes := []string{lower, upper, digits, special}

	for attempt := 0; attempt < 100; attempt++ {
		var sb strings.Builder
		for i := 0; i < length; i++ {
			pool := classes[i%len(classes)]
			idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(pool))))
			if err != nil {
				return "", fmt.Errorf("crypto/rand failed: %w", err)
			}
			sb.WriteByte(pool[idx.Int64()])
		}
		pw := sb.String()
		if errs := ValidatePassword(pw, rules); len(errs) == 0 {
			return pw, nil
		}
	}
	return "", fmt.Errorf("failed to generate valid password after 100 attempts")
}

// ConfirmPassword prompts for a password twice and verifies they match.
// If allowEmpty is true, empty input is accepted (caller handles auto-generation).
// Returns the confirmed password or an error if they don't match.
func ConfirmPassword(p Prompter, prompt string, allowEmpty bool) (string, error) {
	p1, err := p.Password(prompt)
	if err != nil {
		return "", err
	}
	if p1 == "" && allowEmpty {
		return "", nil
	}
	p2, err := p.Password("Confirm password")
	if err != nil {
		return "", err
	}
	if p1 != p2 {
		return "", &CLIError{
			Summary:    "passwords do not match",
			Suggestion: "Try again — enter the same password both times",
		}
	}
	return p1, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
