import {forwardRef, Module} from '@nestjs/common';
import {AuthzModule} from '../authz/authz.module';
import {GroupsModule} from '../groups/groups.module';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

@Module({
  imports: [AuthzModule,
 forwardRef(() => GroupsModule)],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
