import {BadRequestException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {hash} from 'bcryptjs';
import {count, eq} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import jwt from 'jsonwebtoken';
import {DRIZZLE} from '../db/drizzle.module';
import {apiKeys} from '../db/schema';
import type {DbSchema} from '../db/types';
import type {SelectApiKey} from '../db/zod-schemas';
import env from '../env';
import {APIKeyDto} from './dto/apikey.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<DbSchema>,
  ) {}

  async count(): Promise<number> {
    const [{value}] = await this.db.select({value: count()}).from(apiKeys);
    return value;
  }

  async create(
    target: {id: string | number; email?: string},
    createApiKeyDto: {name?: string},
  ): Promise<{id: string; name: string; apiKey: string}> {
    const isUser = 'email' in target;
    const APIKeySecret = env.API_KEY_SECRET;
    if (!APIKeySecret) {
      throw new BadRequestException(
        'API_KEY_SECRET is not configured. Cannot create API keys.',
      );
    }
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const [newApiKey] = await tx
        .insert(apiKeys)
        .values({
          userId: isUser ? Number(target.id) : null,
          groupId: isUser ? null : Number(target.id),
          name: createApiKeyDto.name ?? null,
          type: isUser ? 'user' : 'group',
          apiKey: '',
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const newJWT = jwt.sign(
        {keyId: newApiKey.id, createdAt: new Date()},
        APIKeySecret,
        {expiresIn: `${env.API_KEY_DEFAULT_EXPIRY_DAYS}d`},
      );
      const JWTSignature = newJWT.split('.')[2];
      const hashedKey = await hash(JWTSignature, env.BCRYPT_COST);

      await tx
        .update(apiKeys)
        .set({apiKey: hashedKey, updatedAt: new Date().toISOString()})
        .where(eq(apiKeys.id, newApiKey.id));

      return {
        id: String(newApiKey.id),
        name: newApiKey.name ?? '',
        apiKey: newJWT,
      };
    });
  }

  async update(
    id: string,
    updateAPIKeyDto: {name: string; currentPassword?: string},
  ): Promise<APIKeyDto> {
    const existing = await this.findById(id);
    const [updated] = await this.db
      .update(apiKeys)
      .set({name: updateAPIKeyDto.name, updatedAt: new Date().toISOString()})
      .where(eq(apiKeys.id, existing.id))
      .returning();
    return new APIKeyDto(updated);
  }

  async remove(id: string): Promise<APIKeyDto> {
    const existing = await this.findById(id);
    await this.db.delete(apiKeys).where(eq(apiKeys.id, existing.id));
    return new APIKeyDto(existing);
  }

  async findById(id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      throw new NotFoundException('API key with given id not found');
    }
    const result = await this.db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, numId),
      with: {user: true, group: true},
    });
    if (!result) {
      throw new NotFoundException('API key with given id not found');
    }
    return result;
  }

  async findAllForUser(user: {id: string | number}): Promise<APIKeyDto[]> {
    const userId = Number(user.id);
    const keys = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, Number.isFinite(userId) ? userId : -1));
    return keys.map((key) => new APIKeyDto(key));
  }

  async findAllForGroup(group: {id: string | number}): Promise<APIKeyDto[]> {
    const groupId = Number(group.id);
    const keys = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.groupId, Number.isFinite(groupId) ? groupId : -1));
    return keys.map((key) => new APIKeyDto(key));
  }
}
