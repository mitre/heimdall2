import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get(':id')
  async findById(@Param('id') id: number): Promise<UserDto> {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return `This action updates user ${id}`;
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<UserDto> {
    return this.usersService.remove(id)
  }
}
