import {Controller, Post, UseGuards} from '@nestjs/common';
import {ConfigService} from 'src/config/config.service';
import {DevelopmentGuard} from 'src/guards/development.guard';
import {UsersService} from 'src/users/users.service';
import clear from './clear';
import {DatabaseService} from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private databaseService: DatabaseService
  ) {}

  @Post('clear')
  @UseGuards(DevelopmentGuard)
  async clear(): Promise<void> {
    clear();
  }
}
