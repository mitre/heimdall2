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
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, request.user);
    return this.apiKeyService.findAllForUser(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAPIKey(
    @Request() request: {user: User},
    @Body() createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; apiKey: string}> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, request.user);
    await this.usersService.testPassword(createApiKeyDto, request.user);
    return this.apiKeyService.create(request.user, createApiKeyDto);
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
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      apiKeyToDelete.user
    );
    await this.usersService.testPassword(deleteApiKeyDto, request.user);
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
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      apiKeyToUpdate.user
    );
    await this.usersService.testPassword(updateApiKeyDto, request.user);
    return this.apiKeyService.update(apiKeyToUpdate.id, updateApiKeyDto);
  }
}
