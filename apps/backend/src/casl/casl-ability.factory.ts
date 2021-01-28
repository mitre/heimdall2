import {Ability, AbilityBuilder, AbilityClass} from '@casl/ability';
import {Injectable} from '@nestjs/common';
import {supportedOauth} from '../config/config.service';
import {Evaluation} from '../evaluations/evaluation.model';
import {User} from '../users/user.model';

type Subjects = typeof User | User | typeof Evaluation | Evaluation | 'all';

export enum Action {
  Manage = 'manage', // manage is a special keyword in CASL which represents "any" action.
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  ReadAll = 'read-all',
  DeleteNoPassword = 'delete-no-password',
  UpdateNoPassword = 'update-no-password',
  SkipForcePasswordChange = 'skip-force-password-change',
  UpdateRole = 'update-role'
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
    if (supportedOauth.includes(user.creationMethod)) {
      can(Action.UpdateNoPassword, User, {id: user.id});
    }
    can([Action.Read, Action.Update, Action.Delete], User, {id: user.id});

    return build();
  }
}
