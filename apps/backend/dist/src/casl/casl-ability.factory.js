"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaslAbilityFactory = exports.Action = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const evaluation_model_1 = require("../evaluations/evaluation.model");
const group_model_1 = require("../groups/group.model");
const user_model_1 = require("../users/user.model");
var Action;
(function (Action) {
    Action["Manage"] = "manage";
    Action["Create"] = "create";
    Action["Read"] = "read";
    Action["Update"] = "update";
    Action["Delete"] = "delete";
    Action["ReadAll"] = "read-all";
    Action["ReadSlim"] = "read-slim";
    Action["DeleteNoPassword"] = "delete-no-password";
    Action["UpdateNoPassword"] = "update-no-password";
    Action["SkipForcePasswordChange"] = "skip-force-password-change";
    Action["UpdateRole"] = "update-role";
    Action["AddEvaluation"] = "add-evaluation";
    Action["RemoveEvaluation"] = "remove-evaluation";
    Action["ViewStatistics"] = "view-statistics";
    Action["ForceRegistration"] = "force-registration";
})(Action = exports.Action || (exports.Action = {}));
let CaslAbilityFactory = class CaslAbilityFactory {
    createForUser(user) {
        const { can, cannot, build } = new ability_1.AbilityBuilder(ability_1.Ability);
        if (user.role === 'admin') {
            can(Action.Manage, 'all');
            can(Action.ViewStatistics, 'all');
            cannot(Action.Manage, user_model_1.User, { id: user.id });
        }
        can([Action.ReadSlim], user_model_1.User);
        can([Action.Read, Action.Update, Action.Delete], user_model_1.User, { id: user.id });
        can([Action.Create], group_model_1.Group);
        can([Action.Read], group_model_1.Group, { public: true });
        can([Action.Read, Action.AddEvaluation, Action.RemoveEvaluation], group_model_1.Group, {
            'users.id': user.id
        });
        can([Action.Manage], group_model_1.Group, {
            users: {
                $elemMatch: { id: user.id, 'GroupUser.role': 'owner' }
            }
        });
        can([Action.Create], evaluation_model_1.Evaluation);
        can([Action.Read], evaluation_model_1.Evaluation, { public: true });
        can([Action.Manage], evaluation_model_1.Evaluation, {
            userId: user.id
        });
        can([Action.Read], evaluation_model_1.Evaluation, {
            'groups.users.id': user.id
        });
        can([Action.Manage], evaluation_model_1.Evaluation, {
            'groups.users': {
                $elemMatch: { id: user.id, 'GroupUser.role': 'owner' }
            }
        });
        return build({
            detectSubjectType: (object) => object.constructor
        });
    }
    createForAnonymous() {
        const { cannot, build } = new ability_1.AbilityBuilder(ability_1.Ability);
        cannot(Action.Manage, 'all');
        return build();
    }
};
CaslAbilityFactory = __decorate([
    common_1.Injectable()
], CaslAbilityFactory);
exports.CaslAbilityFactory = CaslAbilityFactory;
//# sourceMappingURL=casl-ability.factory.js.map