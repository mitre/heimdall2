import {Ability, AbilityBuilder, AbilityClass} from '@casl/ability';
import {Injectable} from '@nestjs/common';
import {Evaluation} from '../evaluations/evaluation.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';

type Subjects =
  | typeof User
  | User
  | typeof Evaluation
  | Evaluation
  | typeof Group
  | Group
  | 'all';

export enum Action {
  Manage = 'manage', // manage is a special keyword in CASL which represents "any" action.
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  ReadAll = 'read-all',
  ReadSlim = 'read-slim',
  DeleteNoPassword = 'delete-no-password',
  UpdateNoPassword = 'update-no-password',
  SkipForcePasswordChange = 'skip-force-password-change',
  UpdateRole = 'update-role',
  AddEvaluation = 'add-evaluation',
  RemoveEvaluation = 'remove-evaluation'
}

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User): Ability {
    const {can, cannot, build} = new AbilityBuilder<
      Ability<[Action, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    if (user.role === 'admin') {
      // read-write access to everything
      can(Action.Manage, 'all');
      // Force admins to supply their password when editing their own user.
      cannot(Action.Manage, User, {id: user.id});
    }
    can([Action.ReadSlim], User);

    can([Action.Read, Action.Update, Action.Delete], User, {id: user.id});

    can([Action.Create], Group);

    can([Action.Read], Group, {public: true});
    // Trying to compare the whole object here doesn't work since the
    // user object includes `GroupUser` and therefore the passed in user
    // is not equal to the user on the Group
    can([Action.Read, Action.AddEvaluation, Action.RemoveEvaluation], Group, {
      'users.id': user.id
    });

    can([Action.Manage], Group, {
      'users.id': user.id,
      'users.GroupUser.role': 'owner'
    });

    // This really isn't the best method to do this since
    // it requires every evaluation to have a join on Groups and then another join on Users
    can([Action.Create], Evaluation);

    can([Action.Read], Evaluation, {public: true});

    can([Action.Manage], Evaluation, {
      userId: user.id
    });

    can([Action.Read], Evaluation, {'groups.users.id': user.id});

    can([Action.Manage], Evaluation, {
      'groups.users.id': user.id,
      'groups.users.GroupUser.role': 'owner'
    });

    return build();
  }
}
