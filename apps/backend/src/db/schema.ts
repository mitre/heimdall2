import { pgTable, bigserial, bigint, varchar, timestamp, json, boolean, foreignKey, unique, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const apiKeys = pgTable("ApiKeys", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	groupId: bigint({ mode: "number" }),
	name: varchar({ length: 255 }),
	apiKey: varchar({ length: 255 }),
	type: varchar({ length: 255 }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const evaluations = pgTable("Evaluations", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	filename: varchar({ length: 255 }).notNull(),
	data: json().notNull(),
	public: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	groupId: bigint({ mode: "number" }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const evaluationTags = pgTable("EvaluationTags", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	value: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	evaluationId: bigint({ mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.evaluationId],
			foreignColumns: [evaluations.id],
			name: "EvaluationTags_evaluationId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const groups = pgTable("Groups", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	public: boolean().default(false).notNull(),
	desc: text().default('').notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("Groups_name_key").on(table.name),
]);

export const groupUsers = pgTable("GroupUsers", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	role: varchar({ length: 255 }).default('member').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	groupId: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint({ mode: "number" }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "GroupUsers_groupId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "GroupUsers_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("GroupUsers_groupId_userId_key").on(table.groupId, table.userId),
]);

export const users = pgTable("Users", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar({ length: 255 }),
	lastName: varchar({ length: 255 }),
	organization: varchar({ length: 255 }),
	title: varchar({ length: 255 }),
	encryptedPassword: varchar({ length: 255 }).notNull(),
	forcePasswordChange: boolean(),
	lastLogin: timestamp({ withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	loginCount: bigint({ mode: "number" }).default(0).notNull(),
	passwordChangedAt: timestamp({ withTimezone: true, mode: 'string' }),
	role: varchar({ length: 255 }).default('user').notNull(),
	creationMethod: varchar({ length: 255 }).notNull(),
	jwtSecret: varchar({ length: 255 }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("Users_email_key").on(table.email),
]);

export const groupEvaluations = pgTable("GroupEvaluations", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	groupId: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	evaluationId: bigint({ mode: "number" }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "GroupEvaluations_groupId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.evaluationId],
			foreignColumns: [evaluations.id],
			name: "GroupEvaluations_evaluationId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("GroupEvaluations_groupId_evaluationId_key").on(table.groupId, table.evaluationId),
]);
