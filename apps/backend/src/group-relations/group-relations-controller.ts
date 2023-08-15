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
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {GroupsService} from '../groups/groups.service';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {AddGroupRelationDto} from './dto/add-group-relation.dto';
import {GroupRelationDto} from './dto/group-relation.dto';
import {GroupRelationsService} from './group-relations.service';

@Controller('group-relations')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
export class GroupRelationsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupRelationsService: GroupRelationsService,
    private readonly authz: AuthzService
  ) {}

  @Get()
  async findAll(
    @Request() _request: {user: User}
  ): Promise<GroupRelationDto[]> {
    const groupRelations = await this.groupRelationsService.findAll();
    return groupRelations.map(
      (groupRelation) => new GroupRelationDto(groupRelation)
    );
  }

  @Post()
  async create(
    @Request() request: {user: User},
    @Body() addGroupRelationDto: AddGroupRelationDto
  ) {
    // Check that the user has access to update both child and parent groups
    const abac = this.authz.abac.createForUser(request.user);
    const parentGroup = await this.groupsService.findByPkBang(
      addGroupRelationDto.parentId
    );
    const childGroup = await this.groupsService.findByPkBang(
      addGroupRelationDto.childId
    );

    ForbiddenError.from(abac).throwUnlessCan(Action.Update, parentGroup);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, childGroup);

    const groupRelation = await this.groupRelationsService.create(
      addGroupRelationDto
    );
    return new GroupRelationDto(groupRelation);
  }

  @Put(':id')
  async update(
    @Request() request: {user: User},
    @Param('id') id: string,
    @Body() updateGroupRelation: AddGroupRelationDto
  ): Promise<GroupRelationDto> {
    // Check that the user has access to update both child and parent groups
    const abac = this.authz.abac.createForUser(request.user);
    const parentGroup = await this.groupsService.findByPkBang(
      updateGroupRelation.parentId
    );
    const childGroup = await this.groupsService.findByPkBang(
      updateGroupRelation.childId
    );

    ForbiddenError.from(abac).throwUnlessCan(Action.Update, parentGroup);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, childGroup);

    const groupRelationToUpdate = await this.groupRelationsService.findByPkBang(
      id
    );
    return new GroupRelationDto(
      await this.groupRelationsService.update(
        groupRelationToUpdate,
        updateGroupRelation
      )
    );
  }

  @Delete(':id')
  async remove(
    @Request() _request: {user: User},
    @Param('id') id: string
  ): Promise<GroupRelationDto> {
    const groupRelationToDelete = await this.groupRelationsService.findByPkBang(
      id
    );
    return new GroupRelationDto(
      await this.groupRelationsService.remove(groupRelationToDelete)
    );
  }

  @Get('/all-descendants/:id')
  async getAllDescendants(
    @Request() _request: {user: User},
    @Param('id') parentId: string
  ): Promise<string[]> {
    const allDescendants = await this.groupRelationsService.getAllDescendants(
      parentId
    );
    return allDescendants;
  }

  @Get('/adjacent-descendants/:id')
  async getAdjacentDescendants(
    @Request() _request: {user: User},
    @Param('id') parentId: string
  ): Promise<string[]> {
    return this.groupRelationsService.getAdjacentDescendants(parentId);
  }
}
