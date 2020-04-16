import { Controller, Get, Post, Put, Delete, Param, Body, UseFilters } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UniqueConstraintErrorFilter } from '../filters/unique-constraint-error.filter';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get(':id')
  async findById(@Param('id') id: number): Promise<UserDto> {
    return this.usersService.findById(id);
  }

  @Post()
  @UseFilters(new UniqueConstraintErrorFilter())
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<UserDto> {
    return this.usersService.remove(id)
  }
}
