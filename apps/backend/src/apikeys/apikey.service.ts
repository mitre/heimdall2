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

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey)
    private apiKeyModel: typeof ApiKey,
    private configService: ConfigService,
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
        const user: Promise<User | null> = ApiKey.findAll<ApiKey>({
          where: {
            userId: jwtPayload.userId
          }
        }).then(async (keys) => {
          return this.usersService.findById(
            keys.find((key) => compare(apikey, key.apiKey))?.userId as string
          );
        });
        return user;
      }
    } catch {
      return null;
    }
    return null;
  }

  async create(user: User, createApiKeyDto: CreateApiKeyDto): Promise<string> {
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
    return newJWT;
  }

  async update(id: string): Promise<string> {
    const apiKey = await this.findByPkBang(id);
    const newJWT = jwt.sign(
      {userId: apiKey.userId, createdAt: new Date()},
      this.configService.get('JWT_SECRET') || generateDefault()
    );
    apiKey.apiKey = await hash(newJWT, 14);
    apiKey.save();
    return newJWT;
  }

  async remove(id: string): Promise<ApiKey> {
    const apiKeyToDestroy = await this.findByPkBang(id);
    apiKeyToDestroy.destroy();
    return apiKeyToDestroy;
  }

  async findByPkBang(
    identifier: string | number | Buffer | undefined
  ): Promise<ApiKey> {
    const apiKey = await this.apiKeyModel.findByPk<ApiKey>(identifier);
    if (apiKey === null) {
      throw new NotFoundException('API key with given id not found');
    } else {
      return apiKey;
    }
  }
}
