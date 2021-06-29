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
      ) as {token: string; userId: string; createdAt: Date};
      const JWTSignature = apikey.split('.')[2];
      if (
        jwtPayload &&
        typeof jwtPayload === 'object' &&
        jwtPayload.hasOwnProperty('userId')
      ) {
        const keysForUser = ApiKey.findAll<ApiKey>({
          where: {
            userId: jwtPayload.userId
          }
        });
        const matchingIndex = await Promise.all(
          (
            await keysForUser
          ).map(async (key) => compare(JWTSignature, key.apiKey))
        ).then((matchingKeysResult) => matchingKeysResult.indexOf(true));

        const user = this.usersService.findById(
          (await keysForUser)[matchingIndex].userId
        );

        return user || null;
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
    // Since BCrypt has a 72 byte limit only hash the JWT signature
    const JWTSignature = newJWT.split('.')[2];
    const newApiKey = new ApiKey({
      userId: user.id,
      name: createApiKeyDto.name,
      apiKey: await hash(JWTSignature, 14)
    });
    await newApiKey.save();
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
    const JWTSignature = newJWT.split('.')[2];
    apiKey.apiKey = await hash(JWTSignature, 14);
    await apiKey.save();
    return newJWT;
  }

  async remove(id: string): Promise<APIKeyDto> {
    const apiKeyToDestroy = await this.findByPkBang(id);
    await apiKeyToDestroy.destroy();
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
