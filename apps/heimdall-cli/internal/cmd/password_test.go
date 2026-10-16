package cmd

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidatePassword_TooShort(t *testing.T) {
	rules := DefaultPasswordRules()
	errs := ValidatePassword("Aa1!short", rules)
	assert.NotEmpty(t, errs)
	assert.Contains(t, errs[0], "at least 15 characters")
}

func TestValidatePassword_MissingClasses(t *testing.T) {
	rules := DefaultPasswordRules()
	// Only lowercase, long enough
	errs := ValidatePassword("abcdefghijklmnopqrst", rules)
	assert.NotEmpty(t, errs)
	found := false
	for _, e := range errs {
		if strings.Contains(e,"lowercase, uppercase") {
			found = true
		}
	}
	assert.True(t, found, "expected character class error")
}

func TestValidatePassword_ConsecutiveSameClass(t *testing.T) {
	rules := DefaultPasswordRules()
	// 4 consecutive lowercase = violation (maxConsecutive is 4)
	errs := ValidatePassword("AAAAbbbb1111!@#$", rules)
	assert.NotEmpty(t, errs)
	found := false
	for _, e := range errs {
		if strings.Contains(e,"consecutive") {
			found = true
		}
	}
	assert.True(t, found, "expected consecutive class error")
}

func TestValidatePassword_Valid(t *testing.T) {
	rules := DefaultPasswordRules()
	// Interleaved: no 4+ consecutive same class
	errs := ValidatePassword("aB1!cD2@eF3#gH4$", rules)
	assert.Empty(t, errs)
}

func TestValidatePassword_ExactlyAtConsecutiveLimit(t *testing.T) {
	rules := DefaultPasswordRules() // MaxConsecutive=4
	// 3 consecutive lowercase is OK
	errs := ValidatePassword("abcD1!efG2@hiJ3#k", rules)
	assert.Empty(t, errs)
}

func TestGeneratePassword_PassesValidation(t *testing.T) {
	rules := DefaultPasswordRules()
	pw, err := GeneratePassword(rules)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(pw), 20)
	errs := ValidatePassword(pw, rules)
	assert.Empty(t, errs, "generated password should pass validation: %s", pw)
}

func TestGeneratePassword_MultipleDifferent(t *testing.T) {
	rules := DefaultPasswordRules()
	pw1, err := GeneratePassword(rules)
	require.NoError(t, err)
	pw2, err := GeneratePassword(rules)
	require.NoError(t, err)
	assert.NotEqual(t, pw1, pw2, "two generated passwords should differ")
}

// --- BcryptHasher tests ---

func TestBcryptHasher_Hash_ProducesValidOutput(t *testing.T) {
	h := BcryptHasher{Cost: 10} // lower cost for faster tests
	hash, err := h.Hash("testPassword123!")
	require.NoError(t, err)
	assert.True(t, len(hash) > 0, "hash should not be empty")
	// bcrypt hashes start with $2a$ or $2b$
	assert.True(t, hash[:4] == "$2a$" || hash[:4] == "$2b$", "hash should start with $2a$ or $2b$, got: %s", hash[:4])
}

func TestBcryptHasher_Hash_Cost14(t *testing.T) {
	h := BcryptHasher{Cost: 14}
	hash, err := h.Hash("aB1!cD2@eF3#gH4$")
	require.NoError(t, err)
	// Cost 14 is encoded as "14" in the hash: $2a$14$...
	assert.Contains(t, hash, "$14$", "hash should encode cost 14")
}

func TestBcryptHasher_Verify_CorrectPassword(t *testing.T) {
	h := BcryptHasher{Cost: 10}
	password := "correctHorse!Battery1"
	hash, err := h.Hash(password)
	require.NoError(t, err)

	ok, err := h.Verify(password, hash)
	require.NoError(t, err)
	assert.True(t, ok, "should verify correct password")
}

func TestBcryptHasher_Verify_WrongPassword(t *testing.T) {
	h := BcryptHasher{Cost: 10}
	hash, err := h.Hash("correctPassword1!")
	require.NoError(t, err)

	ok, err := h.Verify("wrongPassword1!", hash)
	require.NoError(t, err)
	assert.False(t, ok, "should reject wrong password")
}

func TestBcryptHasher_Verify_InvalidHash(t *testing.T) {
	h := BcryptHasher{Cost: 10}
	_, err := h.Verify("anything", "not-a-valid-hash")
	assert.Error(t, err, "should return error for invalid hash")
}

func TestBcryptHasher_VerifyWrongPassword(t *testing.T) {
	h := &BcryptHasher{Cost: 4}
	hash, err := h.Hash("correctpassword")
	assert.NoError(t, err)
	ok, err := h.Verify("wrongpassword", hash)
	assert.NoError(t, err)
	assert.False(t, ok)
}

// --- ConfirmPassword tests ---

func TestConfirmPassword_Match(t *testing.T) {
	p := &FakePrompter{Inputs: map[string]string{
		"New password":     "aB1!cD2@eF3#gH4$",
		"Confirm password": "aB1!cD2@eF3#gH4$",
	}, IsTTY: true}
	pw, err := ConfirmPassword(p, "New password", false)
	require.NoError(t, err)
	assert.Equal(t, "aB1!cD2@eF3#gH4$", pw)
}

func TestConfirmPassword_Mismatch(t *testing.T) {
	p := &FakePrompter{Inputs: map[string]string{
		"New password":     "password1",
		"Confirm password": "password2",
	}, IsTTY: true}
	_, err := ConfirmPassword(p, "New password", false)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "passwords do not match")
}

func TestConfirmPassword_EmptyAllowed(t *testing.T) {
	p := &FakePrompter{Inputs: map[string]string{
		"New password": "",
	}, IsTTY: true}
	pw, err := ConfirmPassword(p, "New password", true)
	require.NoError(t, err)
	assert.Empty(t, pw)
}

func TestConfirmPassword_EmptyNotAllowed(t *testing.T) {
	p := &FakePrompter{Inputs: map[string]string{
		"New password":     "",
		"Confirm password": "",
	}, IsTTY: true}
	pw, err := ConfirmPassword(p, "New password", false)
	require.NoError(t, err)
	assert.Empty(t, pw) // both empty = they match
}
