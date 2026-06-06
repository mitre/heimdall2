// Drizzle definitions for existing Sequelize tables.
// Used ONLY for reading legacy data during migration.
// Source: drizzle-kit introspect of the production schema, filtered to tables needed for migration.
import {
  bigserial,
  boolean,
  integer,
  pgTable,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'Users',
  {
    id: bigserial({mode: 'bigint'}).primaryKey().notNull(),
    email: varchar({length: 255}).notNull(),
    createdAt: timestamp({withTimezone: true, mode: 'string'}).notNull(),
    updatedAt: timestamp({withTimezone: true, mode: 'string'}).notNull(),
    firstName: varchar({length: 255}),
    lastName: varchar({length: 255}),
    organization: varchar({length: 255}),
    title: varchar({length: 255}),
    encryptedPassword: varchar({length: 255}).notNull(),
    passwordChangedAt: varchar({length: 255}),
    forcePasswordChange: boolean(),
    role: varchar({length: 255}).default('user').notNull(),
    loginCount: integer(),
    lastLogin: timestamp({withTimezone: true, mode: 'string'}),
    creationMethod: varchar({length: 255}).default('local'),
    jwtSecret: varchar({length: 255}),
  },
  (table) => [unique('Users_email_key').on(table.email)]
);
