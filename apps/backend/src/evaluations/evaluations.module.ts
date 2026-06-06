import {Module} from '@nestjs/common';
import {AuthzModule} from '../authz/authz.module';
import {GroupsService} from '../groups/groups.service';
import {UsersService} from '../users/users.service';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';

@Module({
  imports: [
    AuthzModule,
  ],
  providers: [EvaluationsService, UsersService, GroupsService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
