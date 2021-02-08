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
  UseGuards
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {GroupDto} from './dto/group.dto';
import {GroupsService} from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly authz: AuthzService
  ) {}

  @Get()
  async findAll(@Request() request: {user: User}): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(request.user);

    let groups = await this.groupsService.findAll();
    groups = groups.filter((group) => abac.can(Action.Read, group));

    return groups.map((group) => new GroupDto(group));
  }

  @Post()
  async create(
    @Request() request: {user: User},
    @Body() createGroupDto: CreateGroupDto
  ): Promise<GroupDto> {
    const group = await this.groupsService.create(createGroupDto);
    await this.groupsService.addUserToGroup(group, request.user, 'owner');

    return new GroupDto(group);
  }

  @Post()
  async addUserToGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() addUserToGroupDto: {userId: string, role: string} // AddUserToGroupDto
  ): Promise<GroupDto> {
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Delete(':id')
  async removeUserFromGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() removeUserFromGroupDto: {userId: string} // RemoveUserFromGroupDto
  ): Promise<GroupDto> {
    // This must perform validation checks to ensure the user performing the action is an owner of this group.
    // This should remove a user as long as it is not the only owner in the group

    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Post()
  async addEvaluationToGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() groupEvaluationUpdateDto: {evaluationId: string} // groupEvaluationUpdateDto
  ): Promise<GroupDto> {
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Delete(':id')
  async removeEvaluationFromGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() groupEvaluationUpdateDto: {evaluationId: string} // groupEvaluationUpdateDto
  ): Promise<GroupDto> {
    // This must perform validation checks to ensure the user performing the action has permission to remove evaluations from a group.
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Put(':id')
  async update(
    @Request() request: {user: User},
    @Param('id') id: string,
    @Body() updateGroup: CreateGroupDto
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const groupToUpdate = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, groupToUpdate);

    return new GroupDto(
      await this.groupsService.update(groupToUpdate, updateGroup)
    );
  }

  @Delete(':id')
  async remove(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const groupToDelete = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Delete, groupToDelete);

    return new GroupDto(await this.groupsService.remove(groupToDelete));
  }
}
