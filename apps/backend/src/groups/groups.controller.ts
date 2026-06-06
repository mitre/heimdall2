import {ForbiddenError, subject} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {eq} from 'drizzle-orm';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {asAuthUser, type RequestUser} from '../common/auth-helpers';
import {DRIZZLE} from '../db/drizzle.module';
import {groupUsers} from '../db/schema';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {UsersService} from '../users/users.service';
import {AddUserToGroupDto} from './dto/add-user-to-group.dto';
import {CreateGroupDto} from './dto/create-group.dto';
import {EvaluationGroupDto} from './dto/evaluation-group.dto';
import {GroupDto} from './dto/group.dto';
import {RemoveUserFromGroupDto} from './dto/remove-user-from-group.dto';
import {UpdateGroupUserRoleDto} from './dto/update-group-user.dto';
import {GroupsService} from './groups.service';

@Controller('groups')
@UseInterceptors(LoggingInterceptor)
export class GroupsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<any>,
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
    private readonly evaluationsService: EvaluationsService,
    private readonly authz: AuthzService,
  ) {}

  @Get()
  async findAll(@Request() request: {user: RequestUser}): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const allGroups = await this.groupsService.findAll();
    const readable = allGroups.filter((group) =>
      abac.can(Action.Read, subject('Group', {...group, id: String(group.id)})),
    );
    return readable.map((group) => new GroupDto(group));
  }

  @Get('/my')
  async findForUser(@Request() request: {user: {id: string | number}}): Promise<GroupDto[]> {
    const userId = Number(request.user.id);
    const memberships = await this.db
      .select({groupId: groupUsers.groupId})
      .from(groupUsers)
      .where(eq(groupUsers.userId, Number.isFinite(userId) ? userId : -1));
    const memberGroupIds = memberships.map((m) => m.groupId).filter(Boolean) as number[];

    const allGroups = await this.groupsService.findAll();
    const myGroups = allGroups.filter((g) => memberGroupIds.includes(g.id));
    const publicGroups = allGroups.filter(
      (g) => g.public && !memberGroupIds.includes(g.id),
    );
    return myGroups
      .map((group) => new GroupDto(group))
      .concat(publicGroups.map((group) => new GroupDto(group)));
  }

  @Post()
  async create(
    @Request() request: {user: RequestUser},
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    ForbiddenError.from(abac).throwUnlessCan(Action.Create, 'Group');
    const group = await this.groupsService.create(createGroupDto);
    await this.groupsService.addUserToGroup(group.id, Number(request.user.id), 'owner');
    return new GroupDto(group, 'owner');
  }

  @Post('/:id/user')
  async addUserToGroup(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
    @Body() addUserToGroupDto: AddUserToGroupDto,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      subject('Group', {...group, id: String(group.id)}),
    );
    const user = await this.usersService.findById(addUserToGroupDto.userId);
    await this.groupsService.addUserToGroup(
      group.id,
      user.id,
      addUserToGroupDto.groupRole,
    );
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Delete('/:id/user')
  async removeUserFromGroup(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
    @Body() removeUserFromGroupDto: RemoveUserFromGroupDto,
  ): Promise<GroupDto> {
    const group = await this.groupsService.findByPkBang(id);
    if (request.user.role !== 'admin') {
      const abac = this.authz.abac.createForUser(asAuthUser(request.user));
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('Group', {...group, id: String(group.id)}),
      );
    }
    const user = await this.usersService.findById(removeUserFromGroupDto.userId);
    await this.groupsService.removeUserFromGroup(group.id, user.id);
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Post('/:id/evaluation')
  async addEvaluationToGroup(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
    @Body() evaluationGroupDto: EvaluationGroupDto,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.AddEvaluation,
      subject('Group', {...group, id: String(group.id)}),
    );
    const evaluation = await this.evaluationsService.findById(evaluationGroupDto.id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, evaluation);
    await this.groupsService.addEvaluationToGroup(group.id, Number(evaluation.id));
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Delete('/:id/evaluation')
  async removeEvaluationFromGroup(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
    @Body() evaluationGroupDto: EvaluationGroupDto,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.RemoveEvaluation,
      subject('Group', {...group, id: String(group.id)}),
    );
    const evaluation = await this.evaluationsService.findById(evaluationGroupDto.id);
    await this.groupsService.removeEvaluationFromGroup(group.id, Number(evaluation.id));
    return new GroupDto(await this.groupsService.findByPkBang(id));
  }

  @Get(':id')
  async findById(
    @Request() request: {user: RequestUser},
    @Param('id') id: string,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Read,
      subject('Group', {...group, id: String(group.id)}),
    );
    return new GroupDto(group, 'owner');
  }

  @Put(':id')
  async update(
    @Request() request: {user: RequestUser},
    @Param('id') id: string,
    @Body() updateGroup: CreateGroupDto,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const groupToUpdate = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      subject('Group', {...groupToUpdate, id: String(groupToUpdate.id)}),
    );
    const updated = await this.groupsService.update(groupToUpdate.id, updateGroup);
    return new GroupDto(updated);
  }

  @Put(':id/updateGroupUserRole')
  async updateGroupUserRole(
    @Request() request: {user: RequestUser},
    @Param('id') id: string,
    @Body() updateGroupUser: UpdateGroupUserRoleDto,
  ) {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      subject('Group', {...group, id: String(group.id)}),
    );
    return this.groupsService.updateGroupUserRole(group.id, updateGroupUser);
  }

  @Delete(':id')
  async remove(
    @Request() request: {user: RequestUser},
    @Param('id') id: string,
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const groupToDelete = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Delete,
      subject('Group', {...groupToDelete, id: String(groupToDelete.id)}),
    );
    const deleted = await this.groupsService.remove(groupToDelete.id);
    return new GroupDto(deleted);
  }
}
