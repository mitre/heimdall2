import {ForbiddenError} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseFilters,
  UseGuards,
  UsePipes
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {ConfigService} from '../config/config.service';
import {UniqueConstraintErrorFilter} from '../filters/unique-constraint-error.filter';
import {ImplicitAllowJwtAuthGuard} from '../guards/implicit-allow-jwt-auth.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {TestGuard} from '../guards/test.guard';
import {PasswordChangePipe} from '../pipes/password-change.pipe';
import {PasswordComplexityPipe} from '../pipes/password-complexity.pipe';
import {PasswordsMatchPipe} from '../pipes/passwords-match.pipe';
import {User} from '../users/user.model';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {SlimUserDto} from './dto/slim-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {UsersService} from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly authz: AuthzService
  ) {}

  @Get('/user-find-all')
  @UseGuards(JwtAuthGuard)
  async userFindAll(@Request() request: {user: User}): Promise<SlimUserDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.ReadSlim, User);
    const users = await this.usersService.userFindAll();
    return users.map((user) => new SlimUserDto(user));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<UserDto> {
    const user = await this.usersService.findById(id);

    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, user);

    return new UserDto(user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async adminFindAll(@Request() request: {user: User}): Promise<UserDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.ReadAll, User);

    const users = await this.usersService.adminFindAll();
    return users.map((user) => new UserDto(user));
  }

  @Post()
  @UsePipes(new PasswordsMatchPipe(), new PasswordComplexityPipe())
  @UseFilters(new UniqueConstraintErrorFilter())
  @UseGuards(ImplicitAllowJwtAuthGuard)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() request: {user?: User}
  ): Promise<UserDto> {
    const abac = request.user
      ? this.authz.abac.createForUser(request.user)
      : this.authz.abac.createForAnonymous();
    // If registration is not allowed then validate the current user has the permission to bypass this check
    if (!this.configService.isRegistrationAllowed()) {
      ForbiddenError.from(abac)
        .setMessage(
          'User registration is disabled. Please ask your system administrator to create the account.'
        )
        .throwUnlessCan(Action.ForceRegistration, User);
    }
    return new UserDto(await this.usersService.create(createUserDto));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body(
      new PasswordsMatchPipe(),
      new PasswordChangePipe(),
      new PasswordComplexityPipe()
    )
    updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const userToUpdate = await this.usersService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, userToUpdate);

    return new UserDto(
      await this.usersService.update(userToUpdate, updateUserDto, abac)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() deleteUserDto: DeleteUserDto
  ): Promise<UserDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const userToDelete = await this.usersService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Delete, userToDelete);

    return new UserDto(
      await this.usersService.remove(userToDelete, deleteUserDto, abac)
    );
  }

  @UseGuards(TestGuard)
  @Post('clear')
  async clear(): Promise<void> {
    User.destroy({where: {}});
  }
}
