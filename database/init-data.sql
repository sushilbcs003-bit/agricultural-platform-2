-- Agricultural Platform Database Initialization
-- This file will be executed when PostgreSQL starts for the first time

-- Create extensions (required for schema-3nf.sql)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: 
-- 1. Extensions are created here for compatibility
-- 2. Full schema should be applied using schema-3nf.sql
-- 3. Run: ./database/apply-schema.sh OR
--    docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Agricultural Platform database extensions initialized successfully!';
    RAISE NOTICE 'Next step: Apply schema-3nf.sql using apply-schema.sh script';
END $$;
