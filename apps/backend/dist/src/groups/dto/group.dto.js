"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupDto = void 0;
const slim_user_dto_1 = require("../../users/dto/slim-user.dto");
class GroupDto {
    constructor(group, role) {
        var _a;
        this.id = group.id;
        this.name = group.name;
        this.role = role || ((_a = group === null || group === void 0 ? void 0 : group.GroupUser) === null || _a === void 0 ? void 0 : _a.role);
        this.public = group.public;
        this.users =
            group.users === undefined
                ? []
                : group.users.map((user) => {
                    return new slim_user_dto_1.SlimUserDto(user, user.GroupUser.role);
                });
        this.createdAt = group.createdAt;
        this.updatedAt = group.updatedAt;
    }
}
exports.GroupDto = GroupDto;
//# sourceMappingURL=group.dto.js.map