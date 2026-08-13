const characterClassChecks = [
  /[a-z]/, // Lowercase characters
  /[A-Z]/, // Uppercase characters
  /[0-9]/, // Numbers
  /[^0-9A-Za-z]/ // Special characters (Non Alphanumeric)
];

const consecutiveRunChecks = [
  /(.)\1{3,}/, // 4 or more repeating of the same exact character
  /[a-z]{4,}/, // 4 or more lowercase characters in a row
  /[A-Z]{4,}/, // 4 or more uppercase characters in a row
  /[0-9]{4,}/, // 4 or more numbers in a row
  /[^0-9A-Za-z]{4,}/ // 4 or more special characters in a row
];

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
        return (
          characterClassChecks.filter((expr) => expr.test(password)).length ===
          characterClassChecks.length
        );
      }
  },
  {
    name: 'Password must not contain 4 consecutive characters of the same character class',
    check: function noRepeats(password) {
        return consecutiveRunChecks.filter((expr) => expr.test(password)).length === 0;
      }
  }
]

exports.validatePasswordBoolean = (password) =>  {
  return validators.every((validator) => validator.check(password))
}
exports.validators = validators
