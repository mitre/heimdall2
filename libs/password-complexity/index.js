const validators = [
  {
    name: 'Password must be at least 15 characters',
    check: function checkLength(password) {
      return password.length >= 15;
    }
  },
  {
    name: 'Password must contain a combination of lowercase letters, uppercase letters, numbers, and special characters',
    check: function hasClasses(password) {
        const checks = [
          RegExp('[a-z]'), // Lowercase characters
          RegExp('[A-Z]'), // Uppercase characters
          RegExp('[0-9]'), // Numbers
          RegExp(/[^A-Za-z0-9]/) // Special characters (Non Alphanumeric)
        ];
        return (
          checks.filter((expr) => expr.test(password)).length ===
          checks.length
        );
      }
  },
  {
    name: 'Password must not contain 4 consecutive characters of the same character class',
    check: function noRepeats(password) {
        const checks = [
          RegExp(/(.)\1{3,}/), // 4 or more repeating of the same exact character
          RegExp('[a-z]{4,}'), // 5 or more of lowercase characters in a row
          RegExp('[A-Z]{4,}'), // 5 or more of uppercase characters in a row
          RegExp('[0-9]{4,}'), // 5 or more numbers in a row
          RegExp(/[^A-Za-z0-9]{4,}/) // 5 or more special characters in a row
        ];
        return checks.filter((expr) => expr.test(password)).length === 0;
      }
  }
]

exports.validatePasswordBoolean = (password) =>  {
  return validators.every((validator) => validator.check(password))
}
exports.validators = validators
