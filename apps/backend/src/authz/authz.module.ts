import {Global, Module} from '@nestjs/common';
import {AuthzService} from './authz.service';

@Global()
@Module({
  providers: [AuthzService],
  exports: [AuthzService]
})
export class AuthzModule {}
