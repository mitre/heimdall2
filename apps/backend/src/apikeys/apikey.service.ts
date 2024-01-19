import {hashAndSaltPassword} from '@heimdall/common/crypto';
import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import jwt from 'jsonwebtoken';
import {CreateApiKeyDto} from '../apikeys/dto/create-apikey.dto';
import {ConfigService} from '../config/config.service';
import {Group} from '../groups/group.model';
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
    target: User | Group,
    createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; name: string; apiKey: string}> {
    const APIKeySecret = this.configService.get('API_KEY_SECRET') || '';
    const newApiKey = new ApiKey({
      userId: target instanceof User ? target.id : undefined,
      groupId: target instanceof Group ? target.id : undefined,
      name: createApiKeyDto.name,
      type: target instanceof User ? 'user' : 'group'
    });
    await newApiKey.save();
    const newJWT = jwt.sign(
      {keyId: newApiKey.id, createdAt: new Date()},
      APIKeySecret
    );
    // Since BCrypt has a 72 byte limit only hash the JWT signature
    const JWTSignature = newJWT.split('.')[2];
    newApiKey.apiKey = await hashAndSaltPassword(
      JWTSignature,
      !(
        this.configService.get('USE_NEW_ENCRYPTION_STRATEGY')?.toLowerCase() ===
        'true'
      )
    );
    newApiKey.save();
    return {id: newApiKey.id, name: newApiKey.name, apiKey: newJWT};
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
      include: [User, Group]
    });
    if (apiKey === null) {
      throw new NotFoundException('API key with given id not found');
    } else {
      return apiKey;
    }
  }

  async findAllForUser(user: User): Promise<APIKeyDto[]> {
    const apiKeys = await this.apiKeyModel.findAll({
      where: {userId: user.id}
    });
    return apiKeys.map((key) => new APIKeyDto(key));
  }

  async findAllForGroup(group: Group): Promise<APIKeyDto[]> {
    const apiKeys = await this.apiKeyModel.findAll({
      where: {groupId: group.id}
    });
    return apiKeys.map((key) => new APIKeyDto(key));
  }
}
