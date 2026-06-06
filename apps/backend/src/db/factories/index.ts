import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {groupFactory} from './group.factory';
import {groupMemberFactory} from './group-member.factory';
import {evaluationFactory} from './evaluation.factory';
import {legacyUserFactory} from './legacy-user.factory';

export {userFactory} from './user.factory';
export {groupFactory} from './group.factory';
export {groupMemberFactory} from './group-member.factory';
export {evaluationFactory} from './evaluation.factory';
export {apiKeyFactory} from './api-key.factory';
export {legacyUserFactory} from './legacy-user.factory';

export type {CreateUserOptions} from './user.factory';
export type {CreateEvaluationOptions} from './evaluation.factory';

import type {groups, groupUsers, evaluations} from '../schema';
import type {users} from '../schema';

export interface TestOrg {
  group: typeof groups.$inferSelect;
  users: (typeof users.$inferSelect)[];
  memberships: (typeof groupUsers.$inferSelect)[];
  evaluations: (typeof evaluations.$inferSelect)[];
}

interface CreateTestOrgOptions {
  userCount?: number;
  evaluationCount?: number;
  groupName?: string;
}

export async function createTestOrg(
  db: NodePgDatabase<Record<string, unknown>>,
  options?: CreateTestOrgOptions
): Promise<TestOrg> {
  const {userCount = 2, evaluationCount = 1, groupName} = options ?? {};

  const group = await groupFactory.create(
    db,
    groupName ? {name: groupName} : undefined
  );

  const legacyUsers = [];
  for (let i = 0; i < userCount; i++) {
    const user = await legacyUserFactory.create(db);
    legacyUsers.push(user);
  }

  const memberships = [];
  for (let i = 0; i < legacyUsers.length; i++) {
    const membership = await groupMemberFactory.create(db, {
      userId: legacyUsers[i].id,
      groupId: group.id,
      role: i === 0 ? 'owner' : 'member',
    });
    memberships.push(membership);
  }

  const evalResults = [];
  for (let i = 0; i < evaluationCount; i++) {
    const evaluation = await evaluationFactory.create(db, {
      userId: legacyUsers[0].id,
    });
    evalResults.push(evaluation);
  }

  return {
    group,
    users: legacyUsers,
    memberships,
    evaluations: evalResults,
  };
}
