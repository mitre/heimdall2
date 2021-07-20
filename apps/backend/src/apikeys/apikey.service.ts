import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {hash} from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {CreateApiKeyDto} from '../apikeys/dto/create-apikey.dto';
import {ConfigService} from '../config/config.service';
import {User} from '../users/user.model';
import {ApiKey} from './apikey.model';
import {APIKeyDto} from './dto/apikey.dto';
import {UpdateAPIKeyDto} from './dto/update-apikey.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey)
    private readonly apiKeyModel: typeof ApiKey,
    private readonly configService: ConfigService
  ) {}

  async count(): Promise<number> {
    return this.apiKeyModel.count();
  }

  async create(
    user: User,
    createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; name: string; apiKey: string}> {
    const APIKeySecret = this.configService.get('API_KEY_SECRET');
    if (APIKeySecret) {
      const newApiKey = new ApiKey({
        userId: user.id,
        name: createApiKeyDto.name
      });
      await newApiKey.save();
      const newJWT = jwt.sign(
        {keyId: newApiKey.id, createdAt: new Date()},
        APIKeySecret
      );
      // Since BCrypt has a 72 byte limit only hash the JWT signature
      const JWTSignature = newJWT.split('.')[2];
      newApiKey.apiKey = await hash(JWTSignature, 14);
      newApiKey.save();
      return {id: newApiKey.id, name: newApiKey.name, apiKey: newJWT};
    } else {
      throw new ForbiddenException(
        'Creating API Keys has been disabled as the API-Key secret is not set'
      );
    }
  }

  async update(
    id: string,
    updateAPIKeyDto: UpdateAPIKeyDto
  ): Promise<APIKeyDto> {
    if (this.configService.get('API_KEY_SECRET')) {
      const apiKey = await this.findById(id);
      apiKey.name = updateAPIKeyDto.name;
      return new APIKeyDto(await apiKey.save());
    } else {
      throw new ForbiddenException(
        'Updating API Keys have been disabled as the API-Key secret is not set'
      );
    }
  }

  async remove(id: string): Promise<APIKeyDto> {
    if (this.configService.get('API_KEY_SECRET')) {
      const apiKeyToDestroy = await this.findById(id);
      await apiKeyToDestroy.destroy();
      return new APIKeyDto(apiKeyToDestroy);
    } else {
      throw new ForbiddenException(
        'Removing API Keys have been disabled as the API-Key secret is not set'
      );
    }
  }

  async findById(id: string): Promise<ApiKey> {
    if (this.configService.get('API_KEY_SECRET')) {
      const apiKey = await this.apiKeyModel.findByPk<ApiKey>(id, {
        include: [User]
      });
      if (apiKey === null) {
        throw new NotFoundException('API key with given id not found');
      } else {
        return apiKey;
      }
    } else {
      throw new ForbiddenException(
        'API Keys have been disabled as the API-Key secret is not set'
      );
    }
  }

  async findAllForUser(user: User): Promise<APIKeyDto[]> {
    if (this.configService.get('API_KEY_SECRET')) {
      const apiKeys = await this.apiKeyModel.findAll({
        where: {userId: user.id}
      });
      return apiKeys.map((key) => new APIKeyDto(key));
    } else {
      throw new ForbiddenException(
        'API Keys have been disabled as the API-Key secret is not set'
      );
    }
  }
}
