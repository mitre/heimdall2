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
