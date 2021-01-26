import {Body, Controller, Get, Post, Request, UseGuards} from '@nestjs/common';
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
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() request: {user: User}): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(request.user);

    const groups = await this.groupsService.findAll();
    return groups.map((group) => new GroupDto(group));
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
