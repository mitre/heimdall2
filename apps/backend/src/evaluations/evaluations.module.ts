import {Module} from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import { ConfigService } from '../config/config.service';
import {DatabaseModule} from '../database/database.module';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {Evaluation} from './evaluation.model';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';

// eslint-disable-next-line n/no-unsupported-features/es-syntax -- The backend requires Node.js >=22.18.0, which supports Unicode sets.
const INTEGER_MIB = /^\d+$/v;

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
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get('MAX_FILE_UPLOAD_SIZE') ?? '50';
        const size = Number(raw);
        const bytes = size * 1024 * 1024;
        if (!INTEGER_MIB.test(raw) || size <= 0 || !Number.isSafeInteger(bytes)) {
          throw new Error('MAX_FILE_UPLOAD_SIZE must be a positive integer in MiB');
        }
        return { limits: { files: 100, fileSize: bytes } };
      },
    }),
    DatabaseModule
  ],
  providers: [EvaluationsService, UsersService, GroupsService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
