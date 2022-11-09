import {ForbiddenError} from '@casl/ability';
import {
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
    private readonly usersService: UsersService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAPIKeys(
    @Request() request: {user: User},
    @Query('userId') userId: string
  ): Promise<APIKeyDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    const user = userId
      ? await this.usersService.findById(userId)
      : request.user;
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, user);
    return this.apiKeyService.findAllForUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAPIKey(
    @Request() request: {user: User},
    @Body() createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; apiKey: string}> {
    const abac = this.authz.abac.createForUser(request.user);

    let user;

    if (createApiKeyDto.userId) {
      user = await this.usersService.findById(createApiKeyDto.userId);
    } else if (createApiKeyDto.userEmail) {
      user = await this.usersService.findByEmail(createApiKeyDto.userEmail);
    } else {
      user = request.user;
    }

    ForbiddenError.from(abac).throwUnlessCan(Action.Update, user);
    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(createApiKeyDto, request.user);
    }
    return this.apiKeyService.create(user, createApiKeyDto);
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
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      apiKeyToUpdate.user
    );
    if (request.user.creationMethod === 'local') {
      await this.authnService.testPassword(updateApiKeyDto, request.user);
    }
    return this.apiKeyService.update(apiKeyToUpdate.id, updateApiKeyDto);
  }
}
