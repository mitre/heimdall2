import {Module} from '@nestjs/common';
// import {User} from './user.model';
import {EchoController} from './echo.controller';
import {EchoService} from './echo.service';

@Module({
  imports: [
    // SequelizeModule.forFeature([User]),
    // ApiKeyModule,
    // AuthzModule,
    // ConfigModule
  ],
  providers: [EchoService],
  controllers: [EchoController]
  //   exports: [EchoService]
})
export class EchoModule {}
