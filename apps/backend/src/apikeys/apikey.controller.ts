import {ForbiddenError} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {ApiKeyService} from './apikey.service';
import {APIKeyDto} from './dto/apikey.dto';
import {CreateApiKeyDto} from './dto/create-apikey.dto';
import {UpdateAPIKeyDto} from './dto/update-apikey.dto';

@Controller('apikeys')
export class ApiKeyController {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiKeyService: ApiKeyService,
    private readonly authz: AuthzService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAPIKeys(@Request() request: {user: User}): Promise<APIKeyDto[]> {
    return this.apiKeyService.findAllForUser(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAPIKey(
    @Request() request: {user: User},
    @Body() createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; apiKey: string}> {
    return this.apiKeyService.create(request.user, createApiKeyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAPIKey(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<APIKeyDto> {
    const apiKeyToDelete = await this.apiKeyService.findByPkBang(id);
    const apiKeyOwner = await this.usersService.findById(apiKeyToDelete.userId);
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, apiKeyOwner);
    return this.apiKeyService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateAPIKey(
    @Request() request: {user: User},
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateAPIKeyDto
  ): Promise<APIKeyDto> {
    const apiKeyToUpdate = await this.apiKeyService.findByPkBang(id);
    const apiKeyOwner = await this.usersService.findById(apiKeyToUpdate.userId);
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, apiKeyOwner);
    return this.apiKeyService.update(apiKeyToUpdate.id, updateApiKeyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async regenerateAPIKey(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<{key: string}> {
    const apiKeyToUpdate = await this.apiKeyService.findByPkBang(id);
    const apiKeyOwner = await this.usersService.findById(apiKeyToUpdate.userId);
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, apiKeyOwner);
    return {key: await this.apiKeyService.regenerate(apiKeyToUpdate.id)};
  }
}
