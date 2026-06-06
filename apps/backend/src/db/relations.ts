import {relations} from 'drizzle-orm/relations';
import {apiKeys, evaluations, evaluationTags, groups, groupUsers, users, groupEvaluations} from './schema';

export const usersRelations = relations(users, ({many}) => ({
  evaluations: many(evaluations),
  groupUsers: many(groupUsers),
  apiKeys: many(apiKeys),
}));

export const evaluationsRelations = relations(evaluations, ({one, many}) => ({
  user: one(users, {
    fields: [evaluations.userId],
    references: [users.id],
  }),
  evaluationTags: many(evaluationTags),
  groupEvaluations: many(groupEvaluations),
}));

export const evaluationTagsRelations = relations(evaluationTags, ({one}) => ({
  evaluation: one(evaluations, {
    fields: [evaluationTags.evaluationId],
    references: [evaluations.id],
  }),
}));

export const groupsRelations = relations(groups, ({many}) => ({
  groupUsers: many(groupUsers),
  groupEvaluations: many(groupEvaluations),
}));

export const groupUsersRelations = relations(groupUsers, ({one}) => ({
  group: one(groups, {
    fields: [groupUsers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupUsers.userId],
    references: [users.id],
  }),
}));

export const groupEvaluationsRelations = relations(groupEvaluations, ({one}) => ({
  group: one(groups, {
    fields: [groupEvaluations.groupId],
    references: [groups.id],
  }),
  evaluation: one(evaluations, {
    fields: [groupEvaluations.evaluationId],
    references: [evaluations.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [apiKeys.groupId],
    references: [groups.id],
  }),
}));