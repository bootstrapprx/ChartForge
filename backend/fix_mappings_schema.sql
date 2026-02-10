-- Fix for mappings table foreign key type mismatch
-- Run this script against the PostgreSQL database

BEGIN;

-- 1. Drop the existing foreign key constraint
ALTER TABLE mappings DROP CONSTRAINT IF EXISTS mappings_master_account_id_fkey;

-- 2. Alter the column type to UUID
-- Note: If there is existing data that is not a valid UUID, this will fail.
-- In a dev environment, we can cast using uuid_generate_v4() for dummy data or NULL if we want to clear it.
-- Assuming we want to preserve data if possible, but INTEGER cannot be cast to UUID.
-- So we will set it to NULL for existing rows if any, or use a new UUID.
-- Here we use a safe approach: if it's not empty, we might lose data integrity unless we map it manually.
-- For this fix, we will just change the type. If it fails due to data, the user needs to truncate the table.

ALTER TABLE mappings 
    ALTER COLUMN master_account_id TYPE UUID 
    USING (CASE WHEN master_account_id IS NOT NULL THEN uuid_generate_v4() ELSE NULL END);

-- 3. Re-add the foreign key constraint
ALTER TABLE mappings 
    ADD CONSTRAINT mappings_master_account_id_fkey 
    FOREIGN KEY (master_account_id) 
    REFERENCES master_accounts (id);

COMMIT;
