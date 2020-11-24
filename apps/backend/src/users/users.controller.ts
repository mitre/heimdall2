import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import {UniqueConstraintErrorFilter} from '../filters/unique-constraint-error.filter';
import {AbacGuard} from '../guards/abac.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {IsAdminInterceptor} from '../interceptors/is-admin.interceptor';
import {PasswordChangePipe} from '../pipes/password-change.pipe';
import {PasswordComplexityPipe} from '../pipes/password-complexity.pipe';
import {PasswordsMatchPipe} from '../pipes/passwords-match.pipe';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {UsersService} from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: number): Promise<UserDto> {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AbacGuard)
  async findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Post()
  @UsePipes(new PasswordsMatchPipe(), new PasswordComplexityPipe())
  @UseFilters(new UniqueConstraintErrorFilter())
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, AbacGuard)
  @UseInterceptors(IsAdminInterceptor)
  @Put(':id')
  async update(
    @Param('role') role: string, // This comes from IsAdminIntercepter, not from client side
    @Param('id') id: number,
    @Body(
      new PasswordsMatchPipe(),
      new PasswordChangePipe(),
      new PasswordComplexityPipe()
    )
    updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    return this.usersService.update(id, updateUserDto, role === 'admin');
  }

  @UseGuards(JwtAuthGuard, AbacGuard)
  @UseInterceptors(IsAdminInterceptor)
  @Delete(':id')
  async remove(
    @Param('role') role: string,
    @Param('id') id: number,
    @Body() deleteUserDto: DeleteUserDto
  ): Promise<UserDto> {
    return this.usersService.remove(id, deleteUserDto, role === 'admin');
  }
}
