-- Add Labour Services as a supplier type
-- Run: psql -U postgres -d agricultural_platform -f database/migrations/007_add_labour_services.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'supplier_type_code' AND e.enumlabel = 'LABOUR_SERVICES') THEN
    ALTER TYPE supplier_type_code ADD VALUE 'LABOUR_SERVICES';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END
$$;

INSERT INTO supplier_type_master (id, code, name, created_at)
VALUES ('22222222-2222-2222-2222-222222222223', 'LABOUR_SERVICES', 'Labour Services', now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;
