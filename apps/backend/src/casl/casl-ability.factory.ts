import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';

export enum Action {
  AddEvaluation = 'add-evaluation',
  Create = 'create',
  Delete = 'delete',
  DeleteNoPassword = 'delete-no-password',
  ForceRegistration = 'force-registration',
  Manage = 'manage', // manage is a special keyword in CASL which represents "any" action.
  Read = 'read',
  ReadAll = 'read-all',
  ReadSlim = 'read-slim',
  RemoveEvaluation = 'remove-evaluation',
  SkipForcePasswordChange = 'skip-force-password-change',
  Update = 'update',
  UpdateNoPassword = 'update-no-password',
  UpdateRole = 'update-role',
  ViewStatistics = 'view-statistics',
}

export type AppAbility = MongoAbility<PossibleAbilities>;
type AllTypes = typeof Evaluation | typeof Group | typeof User;

type EvaluationQuery = Evaluation & {
  'groups.users': UserQuery[];
  'groups.users.id': User['id'];
};

type GroupQuery = Group & {
  users: UserQuery[];
  'users.id': User['id'];
};

type PossibleAbilities = [Action, Subjects];

type Subjects = 'all' | InferSubjects<AllTypes, true>;

type UserQuery = User & {
  GroupUser: GroupUser;
  'GroupUser.role': GroupUser['role'];
  id: User['id'];
};

@Injectable()
export class CaslAbilityFactory {
  // This provides the ability to use the same codepath for validating
  // user abilities and non-registered user abilities. Useful for the
  // few anonymous endpoints we have.
  createForAnonymous(): MongoAbility {
    const { build, cannot } = new AbilityBuilder(createMongoAbility);
    cannot(Action.Manage, 'all');

    return build();
  }

  createForUser(user: User): MongoAbility {
    const { build, can, cannot } = new AbilityBuilder(createMongoAbility);
    if (user.role === 'admin') {
      // all is a special keyword in CASL that represents "any subject".
      // read-write access to everything
      can(Action.Manage, 'all');
      // Read statistics about this heimdall deployment
      can(Action.ViewStatistics, 'all');
      // Force admins to supply their password when editing their own user.
      cannot(Action.Manage, User, { id: user.id });
    }
    can([Action.ReadSlim], User);

    can([Action.Read, Action.Update, Action.Delete], User, { id: user.id });

    can([Action.Create], Group);

    can([Action.Read], Group, { public: true });
    // Trying to compare the whole object here doesn't work since the
    // user object includes `GroupUser` and therefore the passed in user
    // is not equal to the user on the Group
    can<GroupQuery>(
      [Action.Read, Action.AddEvaluation, Action.RemoveEvaluation],
      Group,
      { 'users.id': user.id },
    );

    can<GroupQuery>([Action.Manage], Group, { users: { $elemMatch: { 'GroupUser.role': 'owner', id: user.id } } });

    // This really isn't the best method to do this since
    // it requires every evaluation to have a join on Groups and then another join on Users
    can([Action.Create], Evaluation);

    can(Action.Read, Evaluation, { public: true });

    can([Action.Manage], Evaluation, { userId: user.id });

    can<EvaluationQuery>([Action.Read], Evaluation, { 'groups.users.id': user.id });

    can<EvaluationQuery>([Action.Manage], Evaluation, { 'groups.users': { $elemMatch: { 'GroupUser.role': 'owner', id: user.id } } });

    return build({
      detectSubjectType: object =>
        object.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
