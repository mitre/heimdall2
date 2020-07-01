import {Module, Global} from '@nestjs/common';
import {AuthzService} from './authz.service';
import {SequelizeModule} from '@nestjs/sequelize';
import {Policy} from './policy.model';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Policy])],
  providers: [AuthzService],
  exports: [AuthzService, SequelizeModule]
})
export class AuthzModule {}
