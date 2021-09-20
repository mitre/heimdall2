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
          RegExp('[a-z]'),
          RegExp('[A-Z]'),
          RegExp('[0-9]'),
          RegExp(/[^A-Za-z0-9]/)
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
          RegExp(/(.)\1{3,}/),
          RegExp('[a-z]{4,}'),
          RegExp('[A-Z]{4,}'),
          RegExp('[0-9]{4,}'),
          RegExp(/[^\w\s]{4,}/)
        ];
        return checks.filter((expr) => expr.test(password)).length === 0;
      }
  }
]

exports.validatePasswordBoolean = (password) =>  {
  return validators.every((validator) => validator.check(password))
}
exports.validators = validators
