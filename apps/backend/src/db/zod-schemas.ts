import {z} from 'zod';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {users, evaluations, evaluationTags, groups, groupUsers, groupEvaluations, apiKeys} from './schema';

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export const insertEvaluationSchema = createInsertSchema(evaluations);
export const selectEvaluationSchema = createSelectSchema(evaluations);
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type SelectEvaluation = z.infer<typeof selectEvaluationSchema>;

export const insertEvaluationTagSchema = createInsertSchema(evaluationTags);
export const selectEvaluationTagSchema = createSelectSchema(evaluationTags);
export type InsertEvaluationTag = z.infer<typeof insertEvaluationTagSchema>;
export type SelectEvaluationTag = z.infer<typeof selectEvaluationTagSchema>;

export const insertGroupSchema = createInsertSchema(groups);
export const selectGroupSchema = createSelectSchema(groups);
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type SelectGroup = z.infer<typeof selectGroupSchema>;

export const insertGroupUserSchema = createInsertSchema(groupUsers);
export const selectGroupUserSchema = createSelectSchema(groupUsers);
export type InsertGroupUser = z.infer<typeof insertGroupUserSchema>;
export type SelectGroupUser = z.infer<typeof selectGroupUserSchema>;

export const insertGroupEvaluationSchema = createInsertSchema(groupEvaluations);
export const selectGroupEvaluationSchema = createSelectSchema(groupEvaluations);
export type InsertGroupEvaluation = z.infer<typeof insertGroupEvaluationSchema>;
export type SelectGroupEvaluation = z.infer<typeof selectGroupEvaluationSchema>;

export const insertApiKeySchema = createInsertSchema(apiKeys);
export const selectApiKeySchema = createSelectSchema(apiKeys);
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type SelectApiKey = z.infer<typeof selectApiKeySchema>;
