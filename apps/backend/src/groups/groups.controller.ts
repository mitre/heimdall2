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
import {EvaluationsService} from '../evaluations/evaluations.service';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {AddUserToGroupDto} from './dto/add-user-to-group.dto';
import {CreateGroupDto} from './dto/create-group.dto';
import {EvaluationGroupDto} from './dto/evaluation-group.dto';
import {GroupDto} from './dto/group.dto';
import {RemoveUserFromGroupDto} from './dto/remove-user-from-group.dto';
import {GroupsService} from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
    private readonly evaluationsService: EvaluationsService,
    private readonly authz: AuthzService
  ) {}

  @Get()
  async findAll(@Request() request: {user: User}): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(request.user);

    let groups = await this.groupsService.findAll();
    groups = groups.filter((group) => abac.can(Action.Read, group));

    return groups.map((group) => new GroupDto(group));
  }

  @Get('/my')
  async findForUser(@Request() request: {user: User}): Promise<GroupDto[]> {
    const groups = await request.user.$get('groups');
    return groups.map((group) => new GroupDto(group));
  }

  @Post()
  async create(
    @Request() request: {user: User},
    @Body() createGroupDto: CreateGroupDto
  ): Promise<GroupDto> {
    const group = await this.groupsService.create(createGroupDto);
    await this.groupsService.addUserToGroup(group, request.user, 'owner');

    return new GroupDto(group, 'owner');
  }

  @Post('/user')
  async addUserToGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() addUserToGroupDto: AddUserToGroupDto
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, group);
    const userToAdd = await this.usersService.findById(
      addUserToGroupDto.userId
    );
    await this.groupsService.addUserToGroup(
      group,
      userToAdd,
      addUserToGroupDto.groupRole
    );
    return new GroupDto(group);
  }

  @Delete('/user/:id')
  async removeUserFromGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() removeUserFromGroupDto: RemoveUserFromGroupDto
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, group);
    const userToRemove = await this.usersService.findById(
      removeUserFromGroupDto.userId
    );
    return new GroupDto(
      await this.groupsService.removeUserFromGroup(group, userToRemove)
    );
  }

  @Post('/evaluation')
  async addEvaluationToGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() evaluationGroupDto: EvaluationGroupDto
  ): Promise<GroupDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const group = await this.groupsService.findByPkBang(id);
    // Group Permissions
    ForbiddenError.from(abac).throwUnlessCan(Action.AddEvaluation, group);
    const evaluationToAdd = await this.evaluationsService.findById(
      evaluationGroupDto.id
    );
    // Evaluation Permissions
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, evaluationToAdd);
    await this.groupsService.addEvaluationToGroup(group, evaluationToAdd);
    return new GroupDto(group);
  }

  @Delete('/evaluation/:id')
  async removeEvaluationFromGroup(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() evaluationGroupDto: EvaluationGroupDto
  ): Promise<GroupDto> {
    // This must perform validation checks to ensure the user performing the action has permission to remove evaluations from a group.
    const abac = this.authz.abac.createForUser(request.user);
    const group = await this.groupsService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.RemoveEvaluation, group);
    const evaluationToRemove = await this.evaluationsService.findById(
      evaluationGroupDto.id
    );
    return new GroupDto(
      await this.groupsService.removeEvaluationFromGroup(
        group,
        evaluationToRemove
      )
    );
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
