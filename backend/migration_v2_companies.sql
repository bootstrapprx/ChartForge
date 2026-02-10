-- Add is_active column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Drop existing unique constraints if they exist (names might vary, checking standard naming)
-- We need to drop the unique constraint on ucid and name to allow soft deletes
-- Note: Constraint names depend on how they were created. 
-- Assuming standard auto-generated names or we might need to find them.
-- For now, we'll try to drop the indexes which usually enforce the unique constraint.

DROP INDEX IF EXISTS ix_companies_ucid;
DROP INDEX IF EXISTS ix_companies_name;
-- Also drop constraints if they are named explicitly (unlikely from just Column(unique=True))
-- ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_ucid_key;
-- ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_name_key;

-- Create partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS ix_companies_ucid_active ON companies (ucid) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS ix_companies_name_active ON companies (name) WHERE is_active = true;
