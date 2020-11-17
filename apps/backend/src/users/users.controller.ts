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
  UsePipes
} from '@nestjs/common';
import {UniqueConstraintErrorFilter} from '../filters/unique-constraint-error.filter';
import {AbacGuard} from '../guards/abac.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
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

  @Post()
  @UsePipes(new PasswordsMatchPipe(), new PasswordComplexityPipe())
  @UseFilters(new UniqueConstraintErrorFilter())
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, AbacGuard)
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body(
      new PasswordsMatchPipe(),
      new PasswordChangePipe(),
      new PasswordComplexityPipe()
    )
    updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, AbacGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: number,
    @Body() deleteUserDto: DeleteUserDto
  ): Promise<UserDto> {
    return this.usersService.remove(id, deleteUserDto);
  }
}
