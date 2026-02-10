-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() at time zone 'utc'),
    user_id VARCHAR,
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id VARCHAR,
    payload JSON
);

-- Add columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS inactivated_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS inactivated_by VARCHAR;
