import {Controller, Post, UseGuards} from '@nestjs/common';
import {ConfigService} from '../config/config.service';
import {DevelopmentGuard} from '../guards/development.guard';
import {UsersService} from '../users/users.service';
import clear from './clear';
import {DatabaseService} from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  @Post('clear')
  @UseGuards(DevelopmentGuard)
  async clear(): Promise<void> {
    clear();
  }
}
