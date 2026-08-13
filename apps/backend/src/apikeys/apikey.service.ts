import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { sign } from 'jsonwebtoken';
import { CreateApiKeyDto } from '../apikeys/dto/create-apikey.dto';
import { ConfigService } from '../config/config.service';
import { PasswordService } from '../crypto/password.service';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
import { ApiKey } from './apikey.model';
import { APIKeyDto } from './dto/apikey.dto';
import { UpdateAPIKeyDto } from './dto/update-apikey.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey)
    private readonly apiKeyModel: typeof ApiKey,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
  ) {}

  async count(): Promise<number> {
    return this.apiKeyModel.count();
  }

  async create(
    target: Group | User,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<{ apiKey: string; id: string; name: string }> {
    const APIKeySecret = this.configService.get('API_KEY_SECRET') || '';
    const newApiKey = new ApiKey({
      groupId: target instanceof Group ? target.id : undefined,
      name: createApiKeyDto.name,
      type: target instanceof User ? 'user' : 'group',
      userId: target instanceof User ? target.id : undefined,
    });
    await newApiKey.save();
    const newJWT = sign(
      { createdAt: new Date(), keyId: newApiKey.id },
      APIKeySecret,
    );
    // ADR-006 §4 site 7: PBKDF2 via the validated module, PHC output (§2).
    // Only the JWT signature is hashed — originally because of bcrypt's
    // 72-byte limit, kept because changing what is hashed invalidates every
    // existing key (§11/Scope). The save is awaited: create() must not
    // resolve before the hash is persisted (found defect fixed in e25.12).
    const JWTSignature = newJWT.split('.', 3)[2];
    newApiKey.apiKey = await this.passwordService.hash(JWTSignature);
    await newApiKey.save();
    return { apiKey: newJWT, id: newApiKey.id, name: newApiKey.name };
  }

  async findAllForGroup(group: Group): Promise<APIKeyDto[]> {
    const apiKeys = await this.apiKeyModel.findAll({ where: { groupId: group.id } });
    return apiKeys.map(key => new APIKeyDto(key));
  }

  async findAllForUser(user: User): Promise<APIKeyDto[]> {
    const apiKeys = await this.apiKeyModel.findAll({ where: { userId: user.id } });
    return apiKeys.map(key => new APIKeyDto(key));
  }

  async findById(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyModel.findByPk<ApiKey>(id, { include: [User, Group] });
    if (apiKey === null) {
      throw new NotFoundException('API key with given id not found');
    }
    return apiKey;
  }

  async remove(id: string): Promise<APIKeyDto> {
    const apiKeyToDestroy = await this.findById(id);
    await apiKeyToDestroy.destroy();
    return new APIKeyDto(apiKeyToDestroy);
  }

  async update(
    id: string,
    updateAPIKeyDto: UpdateAPIKeyDto,
  ): Promise<APIKeyDto> {
    const apiKey = await this.findById(id);
    apiKey.name = updateAPIKeyDto.name;
    return new APIKeyDto(await apiKey.save());
  }

  /**
   * ADR-006 §7: narrow compare-and-swap writer for lazy API-key rehash — the
   * ApiKeys equivalent of UsersService.updateEncryptedPassword. Rewrites the
   * `apiKey` hash column ONLY, gated on the stored value still matching
   * `originalHash`, silent so updatedAt is not bumped. Same shape as the Users
   * writer (§4 names the updateLoginMetadata/updateUserSecret precedent; the
   * ApiKey field is `apiKey`, so the method is named for it). Returns affected
   * count — 0 means another writer won; the caller does nothing.
   */
  async updateApiKeyHash(
    id: string,
    originalHash: string,
    newHash: string,
  ): Promise<number> {
    const [affected] = await this.apiKeyModel.update(
      { apiKey: newHash },
      { fields: ['apiKey'], silent: true, where: { apiKey: originalHash, id } },
    );
    return affected;
  }
}
