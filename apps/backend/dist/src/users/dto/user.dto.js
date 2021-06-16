"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDto = void 0;
class UserDto {
    constructor(user) {
        this.id = user.id;
        this.email = user.email;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.title = user.title;
        this.role = user.role;
        this.organization = user.organization;
        this.loginCount = user.loginCount;
        this.lastLogin = user.lastLogin;
        this.creationMethod = user.creationMethod;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}
exports.UserDto = UserDto;
//# sourceMappingURL=user.dto.js.map