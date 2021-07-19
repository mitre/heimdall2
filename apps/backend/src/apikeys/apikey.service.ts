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
    const JWTSecret = this.configService.get('JWT_SECRET');
    const apiKeysAllowed =
      this.configService.get('API_KEYS_DISABLED')?.toLowerCase() !== 'true';
    if (apiKeysAllowed && JWTSecret) {
      const newApiKey = new ApiKey({
        userId: user.id,
        name: createApiKeyDto.name
      });
      await newApiKey.save();
      const newJWT = jwt.sign(
        {keyId: newApiKey.id, createdAt: new Date()},
        JWTSecret
      );
      // Since BCrypt has a 72 byte limit only hash the JWT signature
      const JWTSignature = newJWT.split('.')[2];
      newApiKey.apiKey = await hash(JWTSignature, 14);
      newApiKey.save();
      return {id: newApiKey.id, name: newApiKey.name, apiKey: newJWT};
    } else {
      throw new ForbiddenException('API Keys have been disabled');
    }
  }

  async update(
    id: string,
    updateAPIKeyDto: UpdateAPIKeyDto
  ): Promise<APIKeyDto> {
    const apiKey = await this.findById(id);
    apiKey.name = updateAPIKeyDto.name;
    return new APIKeyDto(await apiKey.save());
  }

  async remove(id: string): Promise<APIKeyDto> {
    const apiKeyToDestroy = await this.findById(id);
    await apiKeyToDestroy.destroy();
    return new APIKeyDto(apiKeyToDestroy);
  }

  async findById(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyModel.findByPk<ApiKey>(id, {
      include: [User]
    });
    if (apiKey === null) {
      throw new NotFoundException('API key with given id not found');
    } else {
      return apiKey;
    }
  }

  async findAllForUser(user: User): Promise<APIKeyDto[]> {
    const apiKeys = await this.apiKeyModel.findAll({where: {userId: user.id}});
    return apiKeys.map((key) => new APIKeyDto(key));
  }
}
