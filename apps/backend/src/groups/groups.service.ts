import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {and, count, eq, inArray, ne} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {DRIZZLE} from '../db/drizzle.module';
import {groups, groupUsers, groupEvaluations, users} from '../db/schema';
import type {DbSchema} from '../db/types';
import type {SelectGroup} from '../db/zod-schemas';
import env from '../env';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<DbSchema>,
  ) {}

  async findAll() {
    return this.db.query.groups.findMany({
      with: {groupUsers: {with: {user: true}}},
    });
  }

  async count(): Promise<number> {
    const [{value}] = await this.db.select({value: count()}).from(groups);
    return value;
  }

  async findByPkBang(id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      throw new NotFoundException('Group with given id not found');
    }
    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, numId),
      with: {groupUsers: {with: {user: true}}},
    });
    if (!group) {
      throw new NotFoundException('Group with given id not found');
    }
    return group;
  }

  async findByName(name: string) {
    const group = await this.db.query.groups.findFirst({
      where: eq(groups.name, name),
      with: {groupUsers: {with: {user: true}}},
    });
    if (!group) {
      throw new NotFoundException('Group with given name not found');
    }
    return group;
  }

  async findByIds(ids: string[]) {
    const numIds = ids.map(Number).filter((n) => Number.isFinite(n) && n >= 1);
    if (numIds.length === 0) return [];
    return this.db.query.groups.findMany({
      where: inArray(groups.id, numIds),
      with: {groupUsers: {with: {user: true}}},
    });
  }

  async addUserToGroup(
    groupId: number,
    userId: number,
    role: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.insert(groupUsers).values({
      groupId,
      userId,
      role,
      createdAt: now,
      updatedAt: now,
    });
  }

  async removeUserFromGroup(
    groupId: number,
    userId: number,
  ): Promise<void> {
    await this.ensureGroupHasOwner(groupId, userId);
    await this.db
      .delete(groupUsers)
      .where(and(eq(groupUsers.groupId, groupId), eq(groupUsers.userId, userId)));
  }

  async ensureGroupHasOwner(
    groupId: number,
    userBeingRemovedId: number,
  ): Promise<void> {
    const owners = await this.db
      .select()
      .from(groupUsers)
      .where(and(eq(groupUsers.groupId, groupId), eq(groupUsers.role, 'owner')));

    const isLastOwner =
      owners.length === 0 ||
      (owners.length === 1 && owners[0].userId === userBeingRemovedId);

    if (!isLastOwner) return;

    const adminEmail = env.ADMIN_EMAIL;
    let [admin] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.email, adminEmail)));

    if (!admin) {
      const admins = await this.db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);
      admin = admins[0];
    }

    if (!admin) {
      throw new ForbiddenException('No admin to be promoted');
    }

    const [existingMembership] = await this.db
      .select()
      .from(groupUsers)
      .where(and(eq(groupUsers.groupId, groupId), eq(groupUsers.userId, admin.id)));

    if (existingMembership) {
      await this.db
        .update(groupUsers)
        .set({role: 'owner', updatedAt: new Date().toISOString()})
        .where(eq(groupUsers.id, existingMembership.id));
    } else {
      await this.addUserToGroup(groupId, admin.id, 'owner');
    }
  }

  async updateGroupUserRole(
    groupId: number,
    updateGroupUser: {userId: string; groupRole: string},
  ) {
    const userId = Number(updateGroupUser.userId);
    const [membership] = await this.db
      .select()
      .from(groupUsers)
      .where(and(eq(groupUsers.groupId, groupId), eq(groupUsers.userId, userId)));

    if (!membership) return undefined;

    if (membership.role === 'owner') {
      await this.ensureGroupHasOwner(groupId, userId);
    }

    const [updated] = await this.db
      .update(groupUsers)
      .set({role: updateGroupUser.groupRole, updatedAt: new Date().toISOString()})
      .where(eq(groupUsers.id, membership.id))
      .returning();
    return updated;
  }

  async addEvaluationToGroup(
    groupId: number,
    evaluationId: number,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.insert(groupEvaluations).values({
      groupId,
      evaluationId,
      createdAt: now,
      updatedAt: now,
    });
  }

  async removeEvaluationFromGroup(
    groupId: number,
    evaluationId: number,
  ): Promise<void> {
    await this.db
      .delete(groupEvaluations)
      .where(
        and(
          eq(groupEvaluations.groupId, groupId),
          eq(groupEvaluations.evaluationId, evaluationId),
        ),
      );
  }

  async create(createGroupDto: {
    name: string;
    public?: boolean;
    desc?: string;
  }): Promise<SelectGroup> {
    const existing = await this.db
      .select({id: groups.id})
      .from(groups)
      .where(eq(groups.name, createGroupDto.name));
    if (existing.length > 0) {
      throw new ForbiddenException(
        'Duplicate key detected. The names of groups must be unique.',
      );
    }

    const now = new Date().toISOString();
    const [group] = await this.db
      .insert(groups)
      .values({
        name: createGroupDto.name,
        public: createGroupDto.public ?? false,
        desc: createGroupDto.desc ?? '',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return group;
  }

  async update(
    groupId: number,
    groupDto: {name: string; public?: boolean; desc?: string},
  ): Promise<SelectGroup> {
    const duplicates = await this.db
      .select({id: groups.id})
      .from(groups)
      .where(and(eq(groups.name, groupDto.name), ne(groups.id, groupId)));
    if (duplicates.length > 0) {
      throw new ForbiddenException(
        'Duplicate key detected. The names of groups must be unique.',
      );
    }

    const [updated] = await this.db
      .update(groups)
      .set({
        name: groupDto.name,
        public: groupDto.public ?? false,
        desc: groupDto.desc ?? '',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(groups.id, groupId))
      .returning();
    return updated;
  }

  async remove(groupId: number): Promise<SelectGroup> {
    const [deleted] = await this.db
      .delete(groups)
      .where(eq(groups.id, groupId))
      .returning();
    return deleted;
  }

  async syncUserGroups(userId: number, groupNames: string[]): Promise<void> {
    const currentMemberships = await this.db.query.groupUsers.findMany({
      where: eq(groupUsers.userId, userId),
      with: {group: true},
    });

    const currentGroupNames = currentMemberships
      .filter((m) => m.group != null)
      .map((m) => m.group!.name);

    const groupsToLeave = currentMemberships.filter(
      (m) => m.group != null && !groupNames.includes(m.group.name),
    );

    for (const membership of groupsToLeave) {
      await this.removeUserFromGroup(membership.groupId!, userId);
    }

    const namesToAdd = groupNames.filter((n) => !currentGroupNames.includes(n));
    if (namesToAdd.length > 0) {
      const existingGroups = await this.db.query.groups.findMany({
        where: inArray(groups.name, namesToAdd),
      });
      for (const group of existingGroups) {
        await this.addUserToGroup(group.id, userId, 'member');
      }
    }
  }
}
