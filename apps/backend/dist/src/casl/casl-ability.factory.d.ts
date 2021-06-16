import { Ability, InferSubjects } from '@casl/ability';
import { Evaluation } from '../evaluations/evaluation.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
declare type AllTypes = typeof User | typeof Evaluation | typeof Group;
declare type Subjects = InferSubjects<AllTypes> | 'all';
export declare enum Action {
    Manage = "manage",
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete",
    ReadAll = "read-all",
    ReadSlim = "read-slim",
    DeleteNoPassword = "delete-no-password",
    UpdateNoPassword = "update-no-password",
    SkipForcePasswordChange = "skip-force-password-change",
    UpdateRole = "update-role",
    AddEvaluation = "add-evaluation",
    RemoveEvaluation = "remove-evaluation",
    ViewStatistics = "view-statistics",
    ForceRegistration = "force-registration"
}
export declare type AppAbility = Ability<[Action, Subjects]>;
export declare class CaslAbilityFactory {
    createForUser(user: User): Ability;
    createForAnonymous(): Ability;
}
export {};
