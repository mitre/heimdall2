import {ForbiddenError} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Request,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {AllowAnonymous} from '@thallesp/nestjs-better-auth';
import {sql} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {asAuthUser, caslSubject} from '../common/auth-helpers';
import {isLocalLoginAllowed, isRegistrationAllowed} from '../env';
import {DRIZZLE} from '../db/drizzle.module';
import {users} from '../db/schema';
import type {SelectUser} from '../db/zod-schemas';
import {TestGuard} from '../guards/test.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {PasswordChangePipe} from '../pipes/password-change.pipe';
import {PasswordComplexityPipe} from '../pipes/password-complexity.pipe';
import {PasswordsMatchPipe} from '../pipes/passwords-match.pipe';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {SlimUserDto} from './dto/slim-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {UsersService} from './users.service';

@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authz: AuthzService,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
  ) {}

  @Get('/user-find-all')
  async findAllUsers(
    @Request() request: {user: SelectUser},
  ): Promise<SlimUserDto[]> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    ForbiddenError.from(abac).throwUnlessCan(Action.ReadSlim, 'User');
    const foundUsers = await this.usersService.findAllUsers();
    return foundUsers.map((user) => new SlimUserDto(user));
  }

  @Get(':id')
  async findUserById(
    @Param('id') id: string,
    @Request() request: {user: SelectUser},
  ): Promise<UserDto> {
    const user = await this.usersService.findById(id);

    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, caslSubject('User', user));

    return new UserDto(user);
  }

  @Get()
  async adminFindAllUsers(
    @Request() request: {user: SelectUser},
  ): Promise<UserDto[]> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    ForbiddenError.from(abac).throwUnlessCan(Action.ReadAll, 'User');

    const foundUsers = await this.usersService.adminFindAllUsers();
    return foundUsers.map((user) => new UserDto(user));
  }

  @Post()
  @UsePipes(new PasswordsMatchPipe(), new PasswordComplexityPipe())
  @AllowAnonymous()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() request: {user?: SelectUser},
  ): Promise<UserDto> {
    const abac = request.user
      ? this.authz.abac.createForUser(asAuthUser(request.user))
      : this.authz.abac.createForAnonymous();
    if (!isLocalLoginAllowed()) {
      throw new ForbiddenException(
        'Local user login is disabled. Please disable LOCAL_LOGIN_DISABLED to use this feature.',
      );
    }
    if (!isRegistrationAllowed()) {
      ForbiddenError.from(abac)
        .setMessage(
          'User registration is disabled. Please ask your system administrator to create the account.',
        )
        .throwUnlessCan(Action.ForceRegistration, 'User');
    }
    return new UserDto(await this.usersService.create(createUserDto));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() request: {user: SelectUser},
    @Body(
      new PasswordsMatchPipe(),
      new PasswordChangePipe(),
      new PasswordComplexityPipe(),
    )
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const userToUpdate = await this.usersService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      caslSubject('User', userToUpdate),
    );

    return new UserDto(
      await this.usersService.update(userToUpdate, updateUserDto, abac),
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: SelectUser},
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<UserDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const userToDelete = await this.usersService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Delete,
      caslSubject('User', userToDelete),
    );

    return new UserDto(
      await this.usersService.remove(userToDelete, deleteUserDto, abac),
    );
  }

  @Post('/logout')
  async logOut(@Request() request: {user: SelectUser}): Promise<void> {
    return this.usersService.updateUserSecret(request.user);
  }

  @UseGuards(TestGuard)
  @Post('/clear')
  async clear(): Promise<void> {
    await this.db.delete(users);
  }
}
