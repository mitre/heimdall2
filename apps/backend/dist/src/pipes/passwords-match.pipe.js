"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordsMatchPipe = void 0;
const common_1 = require("@nestjs/common");
let PasswordsMatchPipe = class PasswordsMatchPipe {
    transform(value, _metadata) {
        if (value.currentPassword != null &&
            value.password == null &&
            value.passwordConfirmation == null) {
            return value;
        }
        if (value.password == value.passwordConfirmation) {
            return value;
        }
        else {
            throw new common_1.BadRequestException('Passwords do not match');
        }
    }
};
PasswordsMatchPipe = __decorate([
    common_1.Injectable()
], PasswordsMatchPipe);
exports.PasswordsMatchPipe = PasswordsMatchPipe;
//# sourceMappingURL=passwords-match.pipe.js.map