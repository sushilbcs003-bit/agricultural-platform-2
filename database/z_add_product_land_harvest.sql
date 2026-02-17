-- Migration: Add harvest_date and land_id to products (for product-land association)
-- Runs on init after schema-3nf. Required for product edit form (Land, Harvest Date).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'harvest_date') THEN
    ALTER TABLE products ADD COLUMN harvest_date DATE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'land_id') THEN
    -- Plain UUID: can reference lands(id) or userId for "Main Land (from registration)" fallback
    ALTER TABLE products ADD COLUMN land_id UUID;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
    ALTER TABLE products ADD COLUMN category VARCHAR(50) DEFAULT 'OTHER';
  END IF;
END $$;
