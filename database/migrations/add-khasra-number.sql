-- Migration: Add khasra_number and land_name to land_records table
-- Date: 2025-01-26
-- Description: Adds missing fields that are used in frontend and in-memory backend

-- Add khasra_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'land_records' AND column_name = 'khasra_number'
  ) THEN
    ALTER TABLE land_records ADD COLUMN khasra_number VARCHAR(50);
    RAISE NOTICE 'Added khasra_number column to land_records';
  ELSE
    RAISE NOTICE 'khasra_number column already exists';
  END IF;
END $$;

-- Add land_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'land_records' AND column_name = 'land_name'
  ) THEN
    ALTER TABLE land_records ADD COLUMN land_name VARCHAR(200);
    RAISE NOTICE 'Added land_name column to land_records';
  ELSE
    RAISE NOTICE 'land_name column already exists';
  END IF;
END $$;

-- Create index on khasra_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_land_records_khasra_number ON land_records(khasra_number);

-- Create index on land_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_land_records_land_name ON land_records(land_name);

COMMENT ON COLUMN land_records.khasra_number IS 'Khasra number for land identification';
COMMENT ON COLUMN land_records.land_name IS 'User-friendly name for the land (e.g., "Main Land")';
