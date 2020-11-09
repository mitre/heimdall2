import {Global, Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzService} from './authz.service';
import {Policy} from './policy.model';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Policy])],
  providers: [AuthzService],
  exports: [AuthzService, SequelizeModule]
})
export class AuthzModule {}
