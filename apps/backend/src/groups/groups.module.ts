import {forwardRef, Module} from '@nestjs/common';
import {AuthzModule} from '../authz/authz.module';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {UsersModule} from '../users/users.module';
import {GroupsController} from './groups.controller';
import {GroupsService} from './groups.service';

@Module({
  imports: [
    AuthzModule,
    forwardRef(() => UsersModule),
    EvaluationsModule,
  ],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
