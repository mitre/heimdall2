import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {compare, hash} from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {CreateApiKeyDto} from '../apikeys/dto/create-apikey.dto';
import {ConfigService} from '../config/config.service';
import {generateDefault} from '../token/token.providers';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {ApiKey} from './apikey.model';
import {APIKeyDto} from './dto/apikey.dto';
import {UpdateAPIKeyDto} from './dto/update-apikey.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey)
    private readonly apiKeyModel: typeof ApiKey,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {}

  async count(): Promise<number> {
    return this.apiKeyModel.count();
  }

  async checkKey(apikey: string): Promise<User | null> {
    try {
      const jwtPayload = jwt.verify(
        apikey,
        this.configService.get('JWT_SECRET') || generateDefault()
      ) as {token: string; userId: string};
      if (
        jwtPayload &&
        typeof jwtPayload === 'object' &&
        jwtPayload.hasOwnProperty('userId')
      ) {
        return ApiKey.findAll<ApiKey>({
          where: {
            userId: jwtPayload.userId
          }
        }).then(async (keys) => {
          return this.usersService.findById(
            keys.find((key) => compare(apikey, key.apiKey))?.userId as string
          );
        });
      }
    } catch {
      return null;
    }
    return null;
  }

  async create(
    user: User,
    createApiKeyDto: CreateApiKeyDto
  ): Promise<{id: string; apiKey: string}> {
    const newJWT = jwt.sign(
      {userId: user.id, createdAt: new Date()},
      this.configService.get('JWT_SECRET') || generateDefault()
    );
    const newApiKey = new ApiKey({
      userId: user.id,
      name: createApiKeyDto.name,
      apiKey: await hash(newJWT, 14)
    });
    newApiKey.save();
    return {id: newApiKey.id, apiKey: newJWT};
  }

  async delete(id: string): Promise<APIKeyDto> {
    const apiKey = await this.apiKeyModel.findByPk<ApiKey>(id);
    if (apiKey === null) {
      throw new NotFoundException('API key with given id not found');
    } else {
      apiKey.destroy();
      return new APIKeyDto(apiKey);
    }
  }

  async update(
    id: string,
    updateAPIKeyDto: UpdateAPIKeyDto
  ): Promise<APIKeyDto> {
    const apiKey = await this.findByPkBang(id);
    apiKey.name = updateAPIKeyDto.name;
    return new APIKeyDto(await apiKey.save());
  }

  async regenerate(id: string): Promise<string> {
    const apiKey = await this.findByPkBang(id);
    const newJWT = jwt.sign(
      {userId: apiKey.userId, createdAt: new Date()},
      this.configService.get('JWT_SECRET') || generateDefault()
    );
    apiKey.apiKey = await hash(newJWT, 14);
    apiKey.save();
    return newJWT;
  }

  async remove(id: string): Promise<APIKeyDto> {
    const apiKeyToDestroy = await this.findByPkBang(id);
    apiKeyToDestroy.destroy();
    return new APIKeyDto(apiKeyToDestroy);
  }

  async findByPkBang(identifier: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyModel.findByPk<ApiKey>(identifier);
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
