import {Controller, Get, UseGuards, Request, Body, Post} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {GroupDto} from './dto/group.dto';
import {GroupsService} from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly authz: AuthzService
  ) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() request: {user: User}): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(request.user);

    return this.groupsService.findAll();
  }

  @Post()
  async create(
    @Request() request: {user: User},
    @Body() createGroupDto: CreateGroupDto
  ): Promise<GroupDto> {
    const group = await this.groupsService.create(createGroupDto);
    this.groupsService.addUserToGroup(group, request.user, 'owner');

    return new GroupDto(group);
  }
}
