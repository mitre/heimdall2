import {ForbiddenError} from '@casl/ability';
import {subject} from '@casl/ability';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {AuthnService} from '../authn/authn.service';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {asAuthUser} from '../common/auth-helpers';
import type {SelectUser} from '../db/zod-schemas';
import {GroupsService} from '../groups/groups.service';
import {APIKeysEnabled} from '../guards/api-keys-enabled.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {UsersService} from '../users/users.service';

type ApiKeyRequestUser = SelectUser & {creationMethod?: string | null};
import {ApiKeyService} from './apikey.service';
import {APIKeyDto} from './dto/apikey.dto';
import {CreateApiKeyDto} from './dto/create-apikey.dto';
import {DeleteAPIKeyDto} from './dto/delete-apikey.dto';
import {UpdateAPIKeyDto} from './dto/update-apikey.dto';

@UseInterceptors(LoggingInterceptor)
@UseGuards(APIKeysEnabled)
@Controller('apikeys')
export class ApiKeyController {
  constructor(
    private readonly authnService: AuthnService,
    private readonly apiKeyService: ApiKeyService,
    private readonly authz: AuthzService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Get()
  async findAPIKeys(
    @Request() request: {user: ApiKeyRequestUser},
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<APIKeyDto[]> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));

    if (userId && groupId) {
      throw new BadRequestException('Cannot specify both userId and groupId');
    }

    if (groupId) {
      const group = await this.groupsService.findByPkBang(groupId);
      ForbiddenError.from(abac).throwUnlessCan(Action.Read, group);
      return this.apiKeyService.findAllForGroup(group);
    } else {
      const user = userId
        ? await this.usersService.findById(userId)
        : request.user;
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Read,
        subject('User', {...user, id: String(user.id)}),
      );
      return this.apiKeyService.findAllForUser(user);
    }
  }

  @Post()
  async createAPIKey(
    @Request() request: {user: ApiKeyRequestUser},
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<{id: string; apiKey: string}> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));

    let target: {id: string | number; email?: string};

    if (createApiKeyDto.userId) {
      target = await this.usersService.findById(createApiKeyDto.userId);
    } else if (createApiKeyDto.groupId) {
      target = await this.groupsService.findByPkBang(createApiKeyDto.groupId);
    } else if (createApiKeyDto.userEmail) {
      target = await this.usersService.findByEmail(createApiKeyDto.userEmail);
    } else {
      target = request.user;
    }

    if ('email' in target) {
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('User', {...target, id: String(target.id)}),
      );
    } else {
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('Group', {...target, id: String(target.id)}),
      );
    }

    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(createApiKeyDto, request.user);
    }

    return this.apiKeyService.create(target, createApiKeyDto);
  }

  @Delete(':id')
  async deleteAPIKey(
    @Request() request: {user: ApiKeyRequestUser},
    @Param('id') id: string,
    @Body() deleteApiKeyDto: DeleteAPIKeyDto,
  ): Promise<APIKeyDto> {
    const apiKeyToDelete = await this.apiKeyService.findById(id);
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));

    if (apiKeyToDelete.type === 'user' && apiKeyToDelete.user) {
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('User', {
          ...apiKeyToDelete.user,
          id: String(apiKeyToDelete.user.id),
        }),
      );
    } else if (apiKeyToDelete.type === 'group' && apiKeyToDelete.groupId) {
      const group = await this.groupsService.findByPkBang(
        String(apiKeyToDelete.groupId),
      );
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('Group', {...group, id: String(group.id)}),
      );
    } else {
      throw new BadRequestException('Unknown API key type');
    }

    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(deleteApiKeyDto, request.user);
    }
    return this.apiKeyService.remove(id);
  }

  @Put('/:id')
  async updateAPIKey(
    @Request() request: {user: ApiKeyRequestUser},
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateAPIKeyDto,
  ): Promise<APIKeyDto> {
    const apiKeyToUpdate = await this.apiKeyService.findById(id);
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));

    if (apiKeyToUpdate.type === 'group' && apiKeyToUpdate.groupId) {
      const group = await this.groupsService.findByPkBang(
        String(apiKeyToUpdate.groupId),
      );
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('Group', {...group, id: String(group.id)}),
      );
    } else if (apiKeyToUpdate.type === 'user' && apiKeyToUpdate.user) {
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        subject('User', {
          ...apiKeyToUpdate.user,
          id: String(apiKeyToUpdate.user.id),
        }),
      );
    } else {
      throw new BadRequestException('Unknown API key type');
    }

    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(updateApiKeyDto, request.user);
    }
    return this.apiKeyService.update(String(apiKeyToUpdate.id), updateApiKeyDto);
  }
}
