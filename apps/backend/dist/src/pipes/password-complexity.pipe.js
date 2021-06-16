"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordComplexityPipe = void 0;
const common_1 = require("@nestjs/common");
let PasswordComplexityPipe = class PasswordComplexityPipe {
    transform(value, _metadata) {
        if (!value.password && !value.passwordConfirmation) {
            return value;
        }
        if (typeof value.password == 'string' &&
            this.hasClasses(value.password) &&
            this.noRepeats(value.password)) {
            return value;
        }
        else {
            throw new common_1.BadRequestException('Password does not meet complexity requirements. Passwords are a minimum of 15' +
                ' characters in length. Passwords must contain at least one special character, number, upper-case letter, and' +
                ' lower-case letter. Passwords cannot contain more than three consecutive repeating characters.' +
                ' Passwords cannot contain more than four repeating characters from the same character class.');
        }
    }
    hasClasses(password) {
        const validators = [
            RegExp('[a-z]'),
            RegExp('[A-Z]'),
            RegExp('[0-9]'),
            RegExp(/[^\w\s]/),
            RegExp('.{15,}')
        ];
        return (validators.filter((expr) => expr.test(password)).length ==
            validators.length);
    }
    noRepeats(password) {
        const validators = [
            RegExp(/(.)\1{3,}/),
            RegExp('[a-z]{4,}'),
            RegExp('[A-Z]{4,}'),
            RegExp('[0-9]{4,}'),
            RegExp(/[^\w\s]{4,}/)
        ];
        return validators.filter((expr) => expr.test(password)).length === 0;
    }
};
PasswordComplexityPipe = __decorate([
    common_1.Injectable()
], PasswordComplexityPipe);
exports.PasswordComplexityPipe = PasswordComplexityPipe;
//# sourceMappingURL=password-complexity.pipe.js.map