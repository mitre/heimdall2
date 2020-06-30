import { Controller, Get, Post, Put, Delete, Param, Body, UseFilters, UsePipes, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UsersService } from './users.service';
import { UniqueConstraintErrorFilter } from '../filters/unique-constraint-error.filter';
import { PasswordsMatchPipe } from '../pipes/passwords-match.pipe';
import { PasswordComplexityPipe } from '../pipes/password-complexity.pipe';
import { PasswordChangePipe } from '../pipes/password-change.pipe';
import { AbacGuard } from '../guards/abac.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';
import { IsAdminInterceptor } from '../interceptors/is-admin.interceptor';

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
  @UseInterceptors(IsAdminInterceptor)
  @Put(':id')
  async update(@Param('role') role: string, @Param('id') id: number, @Body(new PasswordsMatchPipe(), new PasswordChangePipe(), new PasswordComplexityPipe()) updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto, role == 'admin');
  }

  @UseGuards(JwtAuthGuard, AbacGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @Body() deleteUserDto: DeleteUserDto): Promise<UserDto> {
    return this.usersService.remove(id, deleteUserDto)
  }
}
