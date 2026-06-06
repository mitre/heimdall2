import {Ability, subject} from '@casl/ability';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {compare, hash} from 'bcryptjs';
import {count, eq, sql} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {v4} from 'uuid';
import {Action} from '../casl/casl-ability.factory';
import {DRIZZLE} from '../db/drizzle.module';
import {ba_user} from '../db/auth-schema.generated';
import {groupUsers, users} from '../db/schema';
import type {SelectUser} from '../db/zod-schemas';
import env from '../env';
import {GroupsService} from '../groups/groups.service';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
    private readonly groupsService: GroupsService,
  ) {}

  async adminFindAllUsers(): Promise<SelectUser[]> {
    return this.db.select().from(users);
  }

  async findAllUsers(): Promise<
    Pick<SelectUser, 'id' | 'email' | 'title' | 'firstName' | 'lastName'>[]
  > {
    return this.db
      .select({
        id: users.id,
        email: users.email,
        title: users.title,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users);
  }

  async count(): Promise<number> {
    const [{value}] = await this.db.select({value: count()}).from(users);
    return value;
  }

  async findById(id: string): Promise<SelectUser> {
    return this.findByPkBang(id);
  }

  async findByPkBang(
    identifier: string | number | undefined,
  ): Promise<SelectUser> {
    if (identifier === undefined || identifier === null) {
      throw new NotFoundException('User with given id not found');
    }
    const numId =
      typeof identifier === 'number'
        ? identifier
        : Number(String(identifier));

    if (Number.isFinite(numId) && numId >= 1) {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, numId));
      if (user) return user;
    }

    if (typeof identifier === 'string' && identifier.length > 0) {
      const [baUser] = await this.db
        .select()
        .from(ba_user)
        .where(eq(ba_user.id, identifier));
      if (baUser) {
        return {
          id: 0,
          email: baUser.email,
          firstName: baUser.firstName,
          lastName: baUser.lastName,
          organization: baUser.organization,
          title: baUser.title,
          encryptedPassword: '',
          forcePasswordChange: baUser.forcePasswordChange,
          lastLogin: baUser.lastLogin ? baUser.lastLogin.toISOString() : null,
          loginCount: baUser.loginCount ?? 0,
          passwordChangedAt: baUser.passwordChangedAt ? baUser.passwordChangedAt.toISOString() : null,
          role: baUser.role ?? 'user',
          creationMethod: baUser.creationMethod ?? 'local',
          jwtSecret: null,
          createdAt: baUser.createdAt.toISOString(),
          updatedAt: baUser.updatedAt.toISOString(),
        };
      }
    }

    throw new NotFoundException('User with given id not found');
  }

  async findByEmail(email: string): Promise<SelectUser> {
    return this.findOneBang('email', email);
  }

  async findOneBang(
    field: 'email',
    value: string,
  ): Promise<SelectUser> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users[field], value));
    if (!user) {
      throw new NotFoundException('User with given id not found');
    }
    return user;
  }

  private static readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async create(createUserDto: CreateUserDto): Promise<SelectUser> {
    if (!UsersService.EMAIL_RE.test(createUserDto.email)) {
      throw new BadRequestException(
        'Validation isEmail on email failed',
      );
    }
    let encryptedPassword: string;
    try {
      encryptedPassword = await hash(createUserDto.password, env.BCRYPT_COST);
    } catch {
      throw new BadRequestException();
    }
    const now = new Date().toISOString();
    const [user] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        firstName: createUserDto.firstName || null,
        lastName: createUserDto.lastName || null,
        title: createUserDto.title || null,
        organization: createUserDto.organization || null,
        role: createUserDto.role,
        creationMethod: createUserDto.creationMethod,
        encryptedPassword,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return user;
  }

  async update(
    userToUpdate: SelectUser,
    updateUserDto: UpdateUserDto,
    abac: Ability,
  ): Promise<SelectUser> {
    if (!abac.can(Action.UpdateNoPassword, subject('User', {...userToUpdate, id: String(userToUpdate.id)}))) {
      if (
        !(await compare(
          updateUserDto.currentPassword || '',
          userToUpdate.encryptedPassword,
        ))
      ) {
        throw new ForbiddenException('Current password is incorrect');
      }
    }

    if (
      (updateUserDto.password === undefined ||
        updateUserDto.password === null) &&
      userToUpdate.forcePasswordChange &&
      !abac.can(Action.SkipForcePasswordChange, subject('User', {...userToUpdate, id: String(userToUpdate.id)}))
    ) {
      throw new BadRequestException('You must change your password');
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (updateUserDto.password) {
      updates.encryptedPassword = await hash(
        updateUserDto.password,
        env.BCRYPT_COST,
      );
      updates.passwordChangedAt = new Date().toISOString();
      updates.forcePasswordChange = false;
    }
    if (updateUserDto.email) updates.email = updateUserDto.email;
    if (updateUserDto.firstName) updates.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) updates.lastName = updateUserDto.lastName;
    if (updateUserDto.title) updates.title = updateUserDto.title;
    if (updateUserDto.organization)
      updates.organization = updateUserDto.organization;
    if (abac.can(Action.UpdateRole, subject('User', {...userToUpdate, id: String(userToUpdate.id)})) && updateUserDto.role) {
      updates.role = updateUserDto.role;
    }
    if (
      updateUserDto.forcePasswordChange !== undefined &&
      abac.can(Action.Manage, subject('User', {...userToUpdate, id: String(userToUpdate.id)}))
    ) {
      updates.forcePasswordChange = updateUserDto.forcePasswordChange;
    }

    const [updated] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, userToUpdate.id))
      .returning();
    return updated;
  }

  async updateLoginMetadata(user: SelectUser): Promise<void> {
    await this.db
      .update(users)
      .set({
        lastLogin: new Date().toISOString(),
        loginCount: sql`${users.loginCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));
  }

  async updateUserSecret(user: SelectUser): Promise<void> {
    await this.db
      .update(users)
      .set({
        jwtSecret: v4(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));
  }

  async updateOAuthProfile(
    user: SelectUser,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    if (user.firstName === firstName && user.lastName === lastName) {
      return;
    }
    await this.db
      .update(users)
      .set({
        firstName,
        lastName,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));
  }

  async remove(
    userToDelete: SelectUser,
    deleteUserDto: DeleteUserDto,
    abac: Ability,
  ): Promise<SelectUser> {
    if (
      abac.cannot(Action.DeleteNoPassword, subject('User', {...userToDelete, id: String(userToDelete.id)})) &&
      !(await compare(
        deleteUserDto.password || '',
        userToDelete.encryptedPassword,
      ))
    ) {
      throw new ForbiddenException(
        'Password was incorrect, could not delete account',
      );
    }

    const [{value: adminCount}] = await this.db
      .select({value: count()})
      .from(users)
      .where(eq(users.role, 'admin'));

    if (userToDelete.role === 'admin' && adminCount < 2) {
      throw new ForbiddenException(
        'Cannot destroy only administrator account, please promote another user to administrator first',
      );
    }

    const userMemberships = await this.db
      .select({groupId: groupUsers.groupId})
      .from(groupUsers)
      .where(eq(groupUsers.userId, userToDelete.id));
    await Promise.all(
      userMemberships
        .filter((m) => m.groupId != null)
        .map((m) => this.groupsService.ensureGroupHasOwner(m.groupId!, userToDelete.id)),
    );

    const [deleted] = await this.db
      .delete(users)
      .where(eq(users.id, userToDelete.id))
      .returning();
    return deleted;
  }
}
