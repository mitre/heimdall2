import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  @Get(':id')
  findById(@Param('id') id: number) {
    return `This action returns user ${id}`;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return 'This action creates a new user';
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return `This action updates user ${id}`;
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return `This action removes user ${id}`;
  }
}
