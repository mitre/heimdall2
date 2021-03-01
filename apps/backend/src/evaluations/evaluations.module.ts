import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import {DatabaseModule} from '../database/database.module';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {Evaluation} from './evaluation.model';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';
@Module({
  imports: [
    SequelizeModule.forFeature([
      Evaluation,
      EvaluationTag,
      User,
      Group,
      GroupUser,
      GroupEvaluation
    ]),
    ConfigModule,
    DatabaseModule
  ],
  providers: [EvaluationsService, UsersService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
