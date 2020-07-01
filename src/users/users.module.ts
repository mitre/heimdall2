import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {User} from './user.model';
import {UsersService} from './users.service';
import {UsersController} from './users.controller';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [SequelizeModule, UsersService]
})
export class UsersModule {}
