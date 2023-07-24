import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseInterceptors
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {AddGroupRelationDto} from './dto/add-group-relation.dto';
import {GroupRelationDto} from './dto/group-relation.dto';
import {GroupRelationsService} from './group-relations.service';

@Controller('group-relations')
@UseInterceptors(LoggingInterceptor)
export class GroupRelationsController {
  constructor(
    private readonly groupRelationsService: GroupRelationsService,
    private readonly authz: AuthzService
  ) {}

  @Get()
  async findAll(@Request() request: {user: User}): Promise<GroupRelationDto[]> {
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
    const groupRelation = await this.groupRelationsService.create(
      addGroupRelationDto
    );
    return new GroupRelationDto(groupRelation);
  }

  // TODO: Figure out how the "ability factory" works
  @Put(':id')
  async update(
    @Request() request: {user: User},
    @Param('id') id: string,
    @Body() updateGroupRelation: AddGroupRelationDto
  ): Promise<GroupRelationDto> {
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
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<GroupRelationDto> {
    const groupRelationToDelete = await this.groupRelationsService.findByPkBang(
      id
    );
    return new GroupRelationDto(
      await this.groupRelationsService.remove(groupRelationToDelete)
    );
  }
}
