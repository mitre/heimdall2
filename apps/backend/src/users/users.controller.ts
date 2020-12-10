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
import {UniqueConstraintErrorFilter} from '../filters/unique-constraint-error.filter';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {TestGuard} from '../guards/test.guard';
import {PasswordChangePipe} from '../pipes/password-change.pipe';
import {PasswordComplexityPipe} from '../pipes/password-complexity.pipe';
import {PasswordsMatchPipe} from '../pipes/passwords-match.pipe';
import {User} from '../users/user.model';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {User} from './user.model';
import {UsersService} from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authz: AuthzService
  ) {}
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
  async findAll(@Request() request: {user: User}): Promise<UserDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.ReadAll, User);

    return this.usersService.findAll();
  }

  @Post()
  @UsePipes(new PasswordsMatchPipe(), new PasswordComplexityPipe())
  @UseFilters(new UniqueConstraintErrorFilter())
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
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

    return this.usersService.update(userToUpdate, updateUserDto, abac);
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

    return this.usersService.remove(userToDelete, deleteUserDto, abac);
  }

  @UseGuards(TestGuard)
  @Post('clear')
  async clear(): Promise<void> {
    User.destroy({where: {}});
  }
}
