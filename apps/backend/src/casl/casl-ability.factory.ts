import {
  AbilityBuilder,
  createMongoAbility,
  detectSubjectType,
  MongoAbility,
} from '@casl/ability';
import {Injectable} from '@nestjs/common';

export interface AuthUser {
  id: string;
  role: string;
}

type Subjects = 'User' | 'Evaluation' | 'Group' | 'all';
type PossibleAbilities = [Action, Subjects];

export enum Action {
  Manage = 'manage',
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
  RemoveEvaluation = 'remove-evaluation',
  ViewStatistics = 'view-statistics',
  ForceRegistration = 'force-registration',
}

export type AppAbility = MongoAbility<PossibleAbilities>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUser): MongoAbility {
    const {can, cannot, build} = new AbilityBuilder(createMongoAbility);
    if (user.role === 'admin') {
      can(Action.Manage, 'all');
      can(Action.ViewStatistics, 'all');
      cannot(Action.Manage, 'User', {id: user.id});
    }
    can([Action.ReadSlim], 'User');

    can([Action.Read, Action.Update, Action.Delete], 'User', {id: user.id});

    can([Action.Create], 'Group');

    can([Action.Read], 'Group', {public: true});
    can(
      [Action.Read, Action.AddEvaluation, Action.RemoveEvaluation],
      'Group',
      {'groupUsers.user.id': user.id},
    );

    can([Action.Manage], 'Group', {
      groupUsers: {
        $elemMatch: {'user.id': user.id, role: 'owner'},
      },
    });

    can([Action.Create], 'Evaluation');

    can(Action.Read, 'Evaluation', {public: true});

    can([Action.Manage], 'Evaluation', {
      userId: user.id,
    });

    can([Action.Read], 'Evaluation', {
      'groupEvaluations.group.groupUsers.user.id': user.id,
    });

    can([Action.Manage], 'Evaluation', {
      'groupEvaluations.group.groupUsers': {
        $elemMatch: {'user.id': user.id, role: 'owner'},
      },
    });

    return build({detectSubjectType});
  }

  createForAnonymous(): MongoAbility {
    const {cannot, build} = new AbilityBuilder(createMongoAbility);
    cannot(Action.Manage, 'all');

    return build();
  }
}
