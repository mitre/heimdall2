import { Op } from 'sequelize';
import { afterEach, expect, it, vi } from 'vitest';
import { GroupUser } from '../group-users/group-user.model';
import type { User } from '../users/user.model';
import type { Group } from './group.model';
import { GroupsService } from './groups.service';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

type Admin = { email: string; id: string; role: string };
type Membership = { role: string; update: (change: { role: string }) => Promise<Membership>; userId: string };

function fixture(isWithReplacement: boolean, configured = 'departing@example.test') {
  vi.stubEnv('ADMIN_EMAIL', configured);
  const departing: Admin = { email: 'departing@example.test', id: '1', role: 'admin' };
  const admins = [departing];
  if (isWithReplacement) {
    admins.push({ email: 'other@example.test', id: '2', role: 'admin' });
  }
  const members = new Map<string, Membership>();
  const addMember = (id: string, role: string) => {
    const member: Membership = {
      role,
      update: change => Promise.resolve(Object.assign(member, change)),
      userId: id,
    };
    members.set(id, member);
  };
  addMember(departing.id, 'owner');

  vi.spyOn(GroupUser, 'findOne').mockImplementation((options) => {
    const where = options!.where as { role?: string; userId?: string | { [Op.ne]: string } };
    const member = members.values().find(item =>
      (!where.role || item.role === where.role)
      && (typeof where.userId === 'string' ? item.userId === where.userId : item.userId !== where.userId?.[Op.ne]),
    );
    return Promise.resolve((member || null) as unknown as GroupUser | null);
  });
  const users = {
    findOne: vi.fn(({ where }: { where: { email?: string; id?: { [Op.ne]: string } } }) =>
      Promise.resolve(admins.find(admin => (!where.email || admin.email === where.email) && admin.id !== where.id?.[Op.ne]) || null),
    ),
  };
  const group = {
    $add: vi.fn((_relation: string, admin: Admin, options: { through: { role: string } }) =>
      Promise.resolve(addMember(admin.id, options.through.role)),
    ),
    $remove: vi.fn((_relation: string, user: Admin) => Promise.resolve(members.delete(user.id))),
    id: '10',
  };
  const service = new GroupsService({} as typeof Group, users as unknown as typeof User);
  return { departing: departing as unknown as User, group: group as unknown as Group, members, service };
}

it.each(['departing@example.test', 'missing@example.test'])('does not choose the departing admin as replacement with configured email %s', async (configured) => {
  const { departing, group, members, service } = fixture(true, configured);
  await service.removeUserFromGroup(group, departing);
  expect(members.has('1')).toBe(false);
  expect(members.get('2')?.role).toBe('owner');
});

it('preserves the sole administrator membership if no replacement exists', async () => {
  const { departing, group, members, service } = fixture(false);
  await expect(service.removeUserFromGroup(group, departing)).rejects.toThrow('No admin to be promoted');
  expect(members.get('1')?.role).toBe('owner');
});

it('demotes the departing administrator only after assigning another owner', async () => {
  const { group, members, service } = fixture(true);
  await service.updateGroupUserRole(group, { groupRole: 'member', userId: '1' });
  expect(members.get('1')?.role).toBe('member');
  expect(members.get('2')?.role).toBe('owner');
});

it('allows the sole administrator to retain their owner role', async () => {
  const { group, members, service } = fixture(false);
  await service.updateGroupUserRole(group, { groupRole: 'owner', userId: '1' });
  expect(members.get('1')?.role).toBe('owner');
});

it.each([false, true])('synchronizes external groups when a replacement owner exists: %s', async (hasReplacement) => {
  const { departing, group, members, service } = fixture(hasReplacement);
  Object.assign(departing, { $get: vi.fn().mockResolvedValue([group]) });
  vi.spyOn(service.logger, 'warn').mockReturnValue(service.logger);

  await expect(service.syncUserGroups(departing, [])).resolves.toBeUndefined();

  expect(members.get('1')?.role).toBe(hasReplacement ? undefined : 'owner');
  expect(members.get('2')?.role).toBe(hasReplacement ? 'owner' : undefined);
});

it.each([false, true])('restores ownership after concurrent external group departures; departing admin=%s', async (isAdminDeparting) => {
  const members = new Map([
    ['1', { role: 'owner', userId: '1' }],
    ['2', { role: 'owner', userId: '2' }],
  ]);
  const admin = { email: 'admin@example.test', id: isAdminDeparting ? '2' : '3', role: 'admin' };
  let ownerChecks = 0;
  let releaseChecks!: () => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers -- Node.js 16 lacks Promise.withResolvers.
  const bothChecked = new Promise<void>((resolve) => {
    releaseChecks = resolve;
  });
  let releaseAdminDelete!: () => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers -- Node.js 16 lacks Promise.withResolvers.
  const regularUserFinished = new Promise<void>((resolve) => {
    releaseAdminDelete = resolve;
  });
  vi.spyOn(GroupUser, 'findOne').mockImplementation(async (options) => {
    const where = options!.where as { role?: string; userId?: string | { [Op.ne]: string } };
    const member = members.values().find(item =>
      (!where.role || item.role === where.role)
      && (typeof where.userId === 'string' ? item.userId === where.userId : item.userId !== where.userId?.[Op.ne]),
    );
    // Both requests observe another owner before either deletes its membership.
    if (where.role === 'owner' && ownerChecks < 2) {
      ownerChecks++;
      if (ownerChecks === 2) {
        releaseChecks();
      }
      await bothChecked;
    }
    return (member || null) as unknown as GroupUser | null;
  });
  const group = {
    $add: (_relation: string, user: Admin, options: { through: { role: string } }) => {
      members.set(user.id, { role: options.through.role, userId: user.id });
      return Promise.resolve();
    },
    $remove: async (_relation: string, user: Admin) => {
      if (isAdminDeparting && user.id === admin.id) {
        await regularUserFinished;
      }
      return members.delete(user.id);
    },
    id: '10',
    name: 'external-group',
  };
  const users = {
    findOne: ({ where }: { where: { id?: { [Op.ne]: string } } }) =>
      Promise.resolve(admin.id === where.id?.[Op.ne] ? null : admin),
  };
  const service = new GroupsService({} as typeof Group, users as unknown as typeof User);
  const departingUsers = ['1', '2'].map(id => ({ $get: () => Promise.resolve([group]), id }) as unknown as User);

  await Promise.all(departingUsers.map(async (user) => {
    try {
      await service.syncUserGroups(user, []);
    } finally {
      if (user.id === '1') {
        releaseAdminDelete();
      }
    }
  }));

  expect(members.has('1')).toBe(false);
  expect(members.has('2')).toBe(isAdminDeparting);
  expect(members.get(admin.id)?.role).toBe('owner');
});
