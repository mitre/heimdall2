"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordChangePipe = void 0;
const common_1 = require("@nestjs/common");
const levenshtein = require("js-levenshtein");
let PasswordChangePipe = class PasswordChangePipe {
    transform(value, _metadata) {
        if ((!value.password && !value.passwordConfirmation) ||
            !value.currentPassword) {
            return value;
        }
        else if (typeof value.password == 'string' &&
            typeof value.currentPassword == 'string' &&
            levenshtein(value.password, value.currentPassword) > 8 &&
            this.classesChanged(value.password, value.currentPassword)) {
            return value;
        }
        else {
            throw new common_1.BadRequestException('A minimum of four character classes must be changed when updating a password.' +
                ' A minimum of eight of the total number of characters must be changed when updating a password.');
        }
    }
    classesChanged(future, current) {
        const validators = [
            RegExp('[a-z]', 'g'),
            RegExp('[A-Z]', 'g'),
            RegExp('[0-9]', 'g'),
            RegExp(/[^\w\s]/, 'g')
        ];
        for (const validator of validators) {
            const currentMatch = [...current.matchAll(validator)];
            const futureMatch = [...future.matchAll(validator)];
            if (JSON.stringify(currentMatch) === JSON.stringify(futureMatch)) {
                return false;
            }
        }
        return true;
    }
};
PasswordChangePipe = __decorate([
    common_1.Injectable()
], PasswordChangePipe);
exports.PasswordChangePipe = PasswordChangePipe;
//# sourceMappingURL=password-change.pipe.js.map