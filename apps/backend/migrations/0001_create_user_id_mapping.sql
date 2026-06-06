-- Migration: Create user_id_mapping table for BIGINT→UUID user ID mapping
-- Used by: scripts/migrate-users-to-better-auth.ts
-- This table maps old Sequelize Users.id (BIGINT) to new better-auth ba_user.id (text UUID)
-- It is retained after migration for FK reference updates across all tables.

CREATE TABLE IF NOT EXISTS user_id_mapping (
  old_id TEXT PRIMARY KEY,
  new_id TEXT NOT NULL UNIQUE
);
