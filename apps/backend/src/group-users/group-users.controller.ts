import {Controller, Get, Param, Request, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {User} from '../users/user.model';
import {GroupUsersService} from './group-users.service';

@Controller('groupusers')
@UseGuards(JwtAuthGuard)
export class GroupUsersController {
  constructor(private readonly groupUsersService: GroupUsersService) {}

  @Get(':id')
  async findAllGroupUsers(
    @Request() request: {user: User},
    @Param('id') groupId: string
  ): Promise<User[]> {
    const userArray = await this.groupUsersService.findUsersInGroup(groupId);
    return userArray;
  }
}
