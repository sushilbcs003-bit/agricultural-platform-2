-- Migration: Add address columns to buyer_profiles for registration data
-- Enables displaying village, tehsil, district, state, pincode, business_address, contact_person

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'business_address') THEN
    ALTER TABLE buyer_profiles ADD COLUMN business_address TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'village') THEN
    ALTER TABLE buyer_profiles ADD COLUMN village VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'tehsil') THEN
    ALTER TABLE buyer_profiles ADD COLUMN tehsil VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'district') THEN
    ALTER TABLE buyer_profiles ADD COLUMN district VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'state') THEN
    ALTER TABLE buyer_profiles ADD COLUMN state VARCHAR(100);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'pincode') THEN
    ALTER TABLE buyer_profiles ADD COLUMN pincode VARCHAR(10);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyer_profiles' AND column_name = 'contact_person') THEN
    ALTER TABLE buyer_profiles ADD COLUMN contact_person VARCHAR(200);
  END IF;
END $$;
