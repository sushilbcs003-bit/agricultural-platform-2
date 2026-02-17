-- Migration: Add profile columns to users (for farmer/buyer/supplier registration)
-- Required for backend compatibility

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE users ADD COLUMN name VARCHAR(200);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified') THEN
    ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'aadhaar_encrypted') THEN
    ALTER TABLE users ADD COLUMN aadhaar_encrypted TEXT;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'date_of_birth') THEN
    ALTER TABLE users ADD COLUMN date_of_birth DATE;
  END IF;
END $$;
