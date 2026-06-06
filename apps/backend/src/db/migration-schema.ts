import {pgTable, text} from 'drizzle-orm/pg-core';

export const userIdMapping = pgTable('user_id_mapping', {
  oldId: text('old_id').primaryKey(),
  newId: text('new_id').notNull().unique(),
});
