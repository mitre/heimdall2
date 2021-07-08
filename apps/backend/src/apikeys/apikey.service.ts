import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {compare, hash} from 'bcryptjs';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
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
      ) as {token: string; keyId: string; createdAt: Date};
      const JWTSignature = apikey.split('.')[2];
      if (_.has(jwtPayload, 'keyId')) {
        const matchingKey = await this.findById(jwtPayload.keyId);
        if (await compare(JWTSignature, matchingKey.apiKey)) {
          return matchingKey.user;
        } else {
          return null;
        }
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
    const newApiKey = new ApiKey({
      userId: user.id,
      name: createApiKeyDto.name
    });
    await newApiKey.save();
    const newJWT = jwt.sign(
      {keyId: newApiKey.id, createdAt: new Date()},
      this.configService.get('JWT_SECRET') || generateDefault()
    );
    // Since BCrypt has a 72 byte limit only hash the JWT signature
    const JWTSignature = newJWT.split('.')[2];
    newApiKey.apiKey = await hash(JWTSignature, 14);
    newApiKey.save();
    return {id: newApiKey.id, apiKey: newJWT};
  }

  async update(
    id: string,
    updateAPIKeyDto: UpdateAPIKeyDto
  ): Promise<APIKeyDto> {
    const apiKey = await this.findById(id);
    apiKey.name = updateAPIKeyDto.name;
    return new APIKeyDto(await apiKey.save());
  }

  async regenerate(id: string): Promise<string> {
    const apiKey = await this.findById(id);
    const newJWT = jwt.sign(
      {keyId: id, createdAt: new Date()},
      this.configService.get('JWT_SECRET') || generateDefault()
    );
    const JWTSignature = newJWT.split('.')[2];
    apiKey.apiKey = await hash(JWTSignature, 14);
    await apiKey.save();
    return newJWT;
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
