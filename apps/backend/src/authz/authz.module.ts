import { Global, Module } from '@nestjs/common';
import { AuthzService } from './authz.service';

@Global()
@Module({
  exports: [AuthzService],
  providers: [AuthzService],
})
export class AuthzModule {}
