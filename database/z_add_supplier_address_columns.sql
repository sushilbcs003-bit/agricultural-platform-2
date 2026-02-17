-- Migration: Add address columns to supplier_profiles for registration data
-- Same as buyer_profiles - enables displaying village, tehsil, district, state, pincode, business_address

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_profiles' AND column_name = 'business_address') THEN
    ALTER TABLE supplier_profiles ADD COLUMN business_address TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_profiles' AND column_name = 'village') THEN
    ALTER TABLE supplier_profiles ADD COLUMN village VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_profiles' AND column_name = 'tehsil') THEN
    ALTER TABLE supplier_profiles ADD COLUMN tehsil VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_profiles' AND column_name = 'district') THEN
    ALTER TABLE supplier_profiles ADD COLUMN district VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_profiles' AND column_name = 'state') THEN
    ALTER TABLE supplier_profiles ADD COLUMN state VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_profiles' AND column_name = 'pincode') THEN
    ALTER TABLE supplier_profiles ADD COLUMN pincode VARCHAR(10);
  END IF;
END $$;
