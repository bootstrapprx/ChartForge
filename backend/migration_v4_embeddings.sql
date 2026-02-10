-- Enable vector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_ucid VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    content TEXT NOT NULL,
    vector vector(1536),
    meta_data JSON
);

CREATE INDEX IF NOT EXISTS ix_embeddings_company_ucid ON embeddings (company_ucid);
-- Create vector index for faster search (optional but recommended)
-- CREATE INDEX ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);
