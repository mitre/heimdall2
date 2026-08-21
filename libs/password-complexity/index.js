const LOWERCASE_RE = /[a-z]/v;
const UPPERCASE_RE = /[A-Z]/v;
const DIGIT_RE = /\d/v;
const SPECIAL_RE = /[^0-9a-z]/iv;
const REPEAT_RE = /(?<repeated>.)\k<repeated>{3,}/v;
const CONSECUTIVE_LOWER_RE = /[a-z]{4,}/v;
const CONSECUTIVE_UPPER_RE = /[A-Z]{4,}/v;
const CONSECUTIVE_DIGIT_RE = /\d{4,}/v;
const CONSECUTIVE_SPECIAL_RE = /[^0-9a-z]{4,}/iv;

const validators = [
  {
    check: function isLongEnough(password) {
      return password.length >= 15;
    },
    name: 'Password must be at least 15 characters',
  },
  {
    check: function hasAllClasses(password) {
      const checks = [LOWERCASE_RE, UPPERCASE_RE, DIGIT_RE, SPECIAL_RE];
      return checks.filter(expr => expr.test(password)).length === checks.length;
    },
    name: 'Password must contain a combination of lowercase letters, uppercase letters, numbers, and special characters',
  },
  {
    check: function hasNoConsecutiveRepeats(password) {
      const checks = [
        REPEAT_RE,
        CONSECUTIVE_LOWER_RE,
        CONSECUTIVE_UPPER_RE,
        CONSECUTIVE_DIGIT_RE,
        CONSECUTIVE_SPECIAL_RE,
      ];
      return checks.every(expr => !expr.test(password));
    },
    name: 'Password must not contain 4 consecutive characters of the same character class',
  },
];

exports.isValidPassword = (password) => {
  return validators.every(validator => validator.check(password));
};
exports.validators = validators;
