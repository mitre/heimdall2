import {ForbiddenError} from '@casl/ability';
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
  UseInterceptors
} from '@nestjs/common';
import {AuthnService} from '../authn/authn.service';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {GroupsService} from '../groups/groups.service';
import {APIKeysEnabled} from '../guards/api-keys-enabled.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
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
    private readonly groupsService: GroupsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAPIKeys(
    @Request() request: {user: User},
    @Query('userId') userId: string,
    @Query('groupId') groupId: string
  ): Promise<APIKeyDto[]> {
    const abac = this.authz.abac.createForUser(request.user);

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
      ForbiddenError.from(abac).throwUnlessCan(Action.Read, user);
      return this.apiKeyService.findAllForUser(user);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAPIKey(
    @Request() request: {user: User},
    @Body() createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; apiKey: string}> {
    const abac = this.authz.abac.createForUser(request.user);

    let target;

    if (createApiKeyDto.userId) {
      target = await this.usersService.findById(createApiKeyDto.userId);
    } else if (createApiKeyDto.groupId) {
      target = await this.groupsService.findByPkBang(createApiKeyDto.groupId);
    } else if (createApiKeyDto.userEmail) {
      target = await this.usersService.findByEmail(createApiKeyDto.userEmail);
    } else {
      target = request.user;
    }

    ForbiddenError.from(abac).throwUnlessCan(Action.Update, target);
    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(createApiKeyDto, request.user);
    }

    return this.apiKeyService.create(target, createApiKeyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAPIKey(
    @Request() request: {user: User},
    @Param('id') id: string,
    @Body() deleteApiKeyDto: DeleteAPIKeyDto
  ): Promise<APIKeyDto> {
    const apiKeyToDelete = await this.apiKeyService.findById(id);
    const abac = this.authz.abac.createForUser(request.user);

    if (apiKeyToDelete.type === 'user') {
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        apiKeyToDelete.user
      );
    } else if (apiKeyToDelete.type === 'group') {
      const group = await this.groupsService.findByPkBang(
        apiKeyToDelete.groupId
      );
      ForbiddenError.from(abac).throwUnlessCan(Action.Update, group);
    } else {
      throw new BadRequestException('Unknown API key type');
    }

    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(deleteApiKeyDto, request.user);
    }
    return this.apiKeyService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async updateAPIKey(
    @Request() request: {user: User},
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateAPIKeyDto
  ): Promise<APIKeyDto> {
    const apiKeyToUpdate = await this.apiKeyService.findById(id);
    const abac = this.authz.abac.createForUser(request.user);
    if (apiKeyToUpdate.type === 'group') {
      const group = await this.groupsService.findByPkBang(
        apiKeyToUpdate.groupId
      );
      ForbiddenError.from(abac).throwUnlessCan(Action.Update, group);
    } else if (apiKeyToUpdate.type === 'user') {
      ForbiddenError.from(abac).throwUnlessCan(
        Action.Update,
        apiKeyToUpdate.user
      );
    } else {
      throw new BadRequestException('Unknown API key type');
    }

    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(updateApiKeyDto, request.user);
    }
    return this.apiKeyService.update(apiKeyToUpdate.id, updateApiKeyDto);
  }
}
