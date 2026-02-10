-- Migration V5: Enriched Chart of Accounts with all fields from standard CSV
-- Run this migration to add new columns to master_accounts table

-- Add new columns to master_accounts table
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS fs_mapping VARCHAR(100);
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS normal_balance VARCHAR(10);
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS default_vendors TEXT[];
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS regulatory_mapping TEXT;
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS cash_flow_classification VARCHAR(100);
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS cost_center VARCHAR(50);
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS gaap_classification VARCHAR(100);
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE master_accounts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Modify type column to allow longer values
ALTER TABLE master_accounts ALTER COLUMN type TYPE VARCHAR(10);

-- Create COA versions table for versioning support
CREATE TABLE IF NOT EXISTS coa_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    description TEXT,
    account_count INTEGER NOT NULL DEFAULT 0,
    accounts_data JSONB NOT NULL,
    change_summary JSONB,
    source VARCHAR(50),
    company_ucid VARCHAR(20)
);

-- Create index on coa_versions
CREATE INDEX IF NOT EXISTS ix_coa_versions_version_number ON coa_versions(version_number);
CREATE INDEX IF NOT EXISTS ix_coa_versions_company_ucid ON coa_versions(company_ucid);

-- Create import history table
CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    filename VARCHAR(500),
    source_type VARCHAR(50),
    total_records INTEGER NOT NULL DEFAULT 0,
    created INTEGER NOT NULL DEFAULT 0,
    updated INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    import_log JSONB,
    version_id UUID,
    company_ucid VARCHAR(20)
);

-- Create index on import_history
CREATE INDEX IF NOT EXISTS ix_import_history_company_ucid ON import_history(company_ucid);
CREATE INDEX IF NOT EXISTS ix_import_history_created_at ON import_history(created_at);

-- Add index on parent_code for faster hierarchy queries
CREATE INDEX IF NOT EXISTS ix_master_accounts_parent_code ON master_accounts(parent_code);

-- Update existing records with default values for normal_balance based on category
UPDATE master_accounts 
SET normal_balance = CASE 
    WHEN category IN ('Asset', 'Expense', 'Cost of Goods Sold') THEN 'Debit'
    WHEN category IN ('Liability', 'Equity', 'Revenue') THEN 'Credit'
    ELSE 'Debit'
END
WHERE normal_balance IS NULL;

-- Set default fs_mapping based on category
UPDATE master_accounts 
SET fs_mapping = CASE 
    WHEN category IN ('Asset', 'Liability', 'Equity') THEN 'Balance Sheet'
    WHEN category IN ('Revenue', 'Expense', 'Cost of Goods Sold', 'Other') THEN 'Income Statement'
    ELSE 'Balance Sheet'
END
WHERE fs_mapping IS NULL;

-- Add comment to tables
COMMENT ON TABLE coa_versions IS 'Stores version snapshots of the Chart of Accounts for rollback capability';
COMMENT ON TABLE import_history IS 'Tracks all import operations for audit purposes';

