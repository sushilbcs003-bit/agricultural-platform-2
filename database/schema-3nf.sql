-- ==========================================================
-- PostgreSQL 13+ | UUID everywhere | 3NF+ Database Design
-- Agricultural Trading Platform - Complete Schema
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- ENUMs
-- -------------------------
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('FARMER','BUYER','SUPPLIER','ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE otp_purpose AS ENUM ('LOGIN','REGISTER','PHONE_VERIFY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE supplier_type_code AS ENUM ('FARMING_MACHINERY','TRANSPORT_MACHINERY','LABOUR_SERVICES'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_unit AS ENUM ('KG','QUINTAL','TON','LITER','PIECE','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_status AS ENUM ('DRAFT','PUBLISHED','SUSPENDED','SOLD_OUT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE bid_status AS ENUM ('PLACED','ACCEPTED','REJECTED','COUNTERED','EXPIRED','WITHDRAWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cart_status AS ENUM ('ACTIVE','CHECKED_OUT','ABANDONED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cart_item_type AS ENUM ('PRODUCT','SERVICE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_type AS ENUM ('PRODUCE','SERVICE','MIXED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('CREATED','FINALIZED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('UNPAID','PENDING','PAID','FAILED','REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_txn_status AS ENUM ('INITIATED','PENDING','SUCCESS','FAILED','REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER','UPI','WALLET','CARD','CASH','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_item_status AS ENUM ('CREATED','ACCEPTED','REJECTED','FULFILLED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE service_item_status AS ENUM ('CREATED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE area_unit AS ENUM ('ACRE','HECTARE','SQM','BISWA','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE machinery_category_code AS ENUM ('FARMING','TRANSPORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE machinery_availability AS ENUM ('AVAILABLE','LIMITED','UNAVAILABLE','MAINTENANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payout_method AS ENUM ('BANK','UPI','WALLET'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Additional enums for farmer profiles (created separately, adding to schema for consistency)
DO $$ BEGIN CREATE TYPE "LandAreaUnit" AS ENUM ('BIGHA','HECTARE','ACRE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IrrigationSource" AS ENUM ('RAINWATER','TUBE_WELL','CANAL','RIVER','POND','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OwnershipType" AS ENUM ('OWNED','LEASED','SHARED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -------------------------
-- Users & OTP
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  phone         VARCHAR(20) NOT NULL UNIQUE,
  email         VARCHAR(255) UNIQUE,
  gst_number    VARCHAR(30) UNIQUE,
  password_hash TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  phone      VARCHAR(20) NOT NULL,
  gst_number VARCHAR(30),
  purpose    otp_purpose NOT NULL,
  otp_hash   TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose_created ON otp_requests(phone, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_gst_purpose_created ON otp_requests(gst_number, purpose, created_at DESC);

-- -------------------------
-- Location hierarchy
-- -------------------------
CREATE TABLE IF NOT EXISTS countries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  iso_code   VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS states (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  name       VARCHAR(120) NOT NULL,
  lgd_code   VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS districts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id   UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
  name       VARCHAR(120) NOT NULL,
  lgd_code   VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state_id, name)
);

CREATE TABLE IF NOT EXISTS tehsils (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  name        VARCHAR(120) NOT NULL,
  lgd_code    VARCHAR(30),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(district_id, name)
);

CREATE TABLE IF NOT EXISTS villages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tehsil_id  UUID NOT NULL REFERENCES tehsils(id) ON DELETE RESTRICT,
  name       VARCHAR(160) NOT NULL,
  lgd_code   VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tehsil_id, name)
);

CREATE INDEX IF NOT EXISTS idx_villages_name ON villages(name);
CREATE INDEX IF NOT EXISTS idx_villages_lgd_code ON villages(lgd_code);

CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id  UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  state_id    UUID REFERENCES states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  tehsil_id   UUID REFERENCES tehsils(id) ON DELETE SET NULL,
  village_id  UUID REFERENCES villages(id) ON DELETE SET NULL,
  line1       VARCHAR(255),
  line2       VARCHAR(255),
  pincode     VARCHAR(20),
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- Role profiles
-- -------------------------
CREATE TABLE IF NOT EXISTS farmer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- Legacy fields (currently in use)
  village VARCHAR(100),
  tehsil VARCHAR(100),
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10),
  about TEXT,
  main_road_connectivity BOOLEAN NOT NULL DEFAULT FALSE,
  land_area_value NUMERIC(10,2),
  land_area_unit "LandAreaUnit",
  irrigation_source "IrrigationSource",
  ownership_type "OwnershipType",
  profile_image_url TEXT,
  -- New normalized fields (for future migration)
  full_name VARCHAR(200),
  aadhaar_enc BYTEA,
  aadhaar_last4 VARCHAR(4),
  dob DATE,
  primary_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  aadhaar_enc BYTEA,
  aadhaar_last4 VARCHAR(4),
  dob DATE NOT NULL,
  business_name VARCHAR(250) NOT NULL,
  gst_number VARCHAR(30) NOT NULL UNIQUE,
  business_domain VARCHAR(200),
  website VARCHAR(255),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(250) NOT NULL,
  contact_name VARCHAR(200) NOT NULL,
  gst_number VARCHAR(30) NOT NULL UNIQUE,
  website VARCHAR(255),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplier types master + mapping
CREATE TABLE IF NOT EXISTS supplier_type_master (
  id UUID PRIMARY KEY,
  code supplier_type_code NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_types (
  supplier_user_id UUID NOT NULL REFERENCES supplier_profiles(user_id) ON DELETE CASCADE,
  supplier_type_id UUID NOT NULL REFERENCES supplier_type_master(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (supplier_user_id, supplier_type_id)
);

-- -------------------------
-- Farmer locations & land
-- -------------------------
CREATE TABLE IF NOT EXISTS farmer_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE CASCADE,
  label VARCHAR(120),
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS land_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  khasra_number VARCHAR(50),
  land_name VARCHAR(200),
  area_value NUMERIC(12,3) NOT NULL,
  area_unit area_unit NOT NULL,
  notes VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- Lands (farmer portal - flat structure for compatibility)
-- References farmer_profiles.user_id (= users.id)
-- -------------------------
DO $$ BEGIN CREATE TYPE land_status AS ENUM ('SAVED','ACTIVE','INACTIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  land_name VARCHAR(200),
  village_name VARCHAR(100),
  state_code VARCHAR(10),
  district_code VARCHAR(10),
  subdistrict_code VARCHAR(10),
  land_area NUMERIC(12,3) DEFAULT 0,
  land_unit "LandAreaUnit",
  ownership_type "OwnershipType",
  status land_status NOT NULL DEFAULT 'SAVED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lands_farmer ON lands(farmer_id);

-- -------------------------
-- Products
-- -------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  unit product_unit NOT NULL,
  stock_qty NUMERIC(12,3) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  status product_status NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_farmer ON products(farmer_user_id);
CREATE INDEX IF NOT EXISTS idx_products_market ON products(is_available, status);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- Bids & shortlist
-- -------------------------
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID NOT NULL REFERENCES buyer_profiles(user_id) ON DELETE CASCADE,
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bid_quantity NUMERIC(12,3) NOT NULL,
  bid_price NUMERIC(12,2) NOT NULL,
  message TEXT,
  status bid_status NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bids_buyer_created ON bids(buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_farmer_created ON bids(farmer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_product ON bids(product_id);

CREATE TABLE IF NOT EXISTS buyer_shortlists (
  buyer_user_id UUID NOT NULL REFERENCES buyer_profiles(user_id) ON DELETE CASCADE,
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (buyer_user_id, farmer_user_id)
);

-- -------------------------
-- Machinery master & supplier inventory
-- -------------------------
CREATE TABLE IF NOT EXISTS machinery_category_master (
  id UUID PRIMARY KEY,
  code machinery_category_code NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS machinery_type_master (
  id UUID PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES machinery_category_master(id) ON DELETE RESTRICT,
  name VARCHAR(160) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS supplier_machinery_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_user_id UUID NOT NULL REFERENCES supplier_profiles(user_id) ON DELETE CASCADE,
  machinery_type_id UUID NOT NULL REFERENCES machinery_type_master(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  coverage_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  coverage_radius_km NUMERIC(8,2),
  availability_status machinery_availability NOT NULL DEFAULT 'AVAILABLE',
  capacity_tons NUMERIC(10,2),
  refrigeration BOOLEAN,
  horsepower INT,
  suitable_crops TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smi_supplier ON supplier_machinery_inventory(supplier_user_id);
CREATE INDEX IF NOT EXISTS idx_smi_type ON supplier_machinery_inventory(machinery_type_id);
CREATE INDEX IF NOT EXISTS idx_smi_avail ON supplier_machinery_inventory(availability_status);

-- -------------------------
-- Carts
-- -------------------------
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status cart_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One ACTIVE cart per user (Postgres partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_owner_active ON carts(owner_user_id) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  item_type cart_item_type NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  machinery_inventory_id UUID REFERENCES supplier_machinery_inventory(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2),
  meta_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_cart_item_ref CHECK (
    (item_type = 'PRODUCT' AND product_id IS NOT NULL AND machinery_inventory_id IS NULL)
    OR
    (item_type = 'SERVICE' AND machinery_inventory_id IS NOT NULL AND product_id IS NULL)
  )
);

-- -------------------------
-- Orders & payments
-- -------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(40) UNIQUE,
  buyer_user_id UUID REFERENCES buyer_profiles(user_id) ON DELETE SET NULL,
  farmer_user_id UUID REFERENCES farmer_profiles(user_id) ON DELETE SET NULL,
  supplier_user_id UUID REFERENCES supplier_profiles(user_id) ON DELETE SET NULL,
  order_type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'CREATED',
  payment_status payment_status NOT NULL DEFAULT 'UNPAID',
  delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE RESTRICT,
  land_record_id UUID REFERENCES land_records(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  status order_item_status NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oi_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oi_land ON order_items(land_record_id);

CREATE TABLE IF NOT EXISTS service_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  machinery_inventory_id UUID NOT NULL REFERENCES supplier_machinery_inventory(id) ON DELETE RESTRICT,
  supplier_user_id UUID NOT NULL REFERENCES supplier_profiles(user_id) ON DELETE RESTRICT,
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  service_status service_item_status NOT NULL DEFAULT 'CREATED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  method payment_method,
  provider VARCHAR(80),
  provider_ref VARCHAR(120),
  status payment_txn_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- Quality testing
-- -------------------------
CREATE TABLE IF NOT EXISTS quality_test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  farmer_user_id UUID NOT NULL REFERENCES farmer_profiles(user_id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  score NUMERIC(6,2) NOT NULL,
  grade VARCHAR(40) NOT NULL,
  test_provider VARCHAR(200) NOT NULL,
  recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qtr_product ON quality_test_reports(product_id);

CREATE TABLE IF NOT EXISTS quality_test_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES quality_test_reports(id) ON DELETE CASCADE,
  metric_name VARCHAR(120) NOT NULL,
  metric_value VARCHAR(120) NOT NULL,
  unit VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_test_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES quality_test_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- Payment profiles + audit
-- -------------------------
CREATE TABLE IF NOT EXISTS payment_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(200),
  account_holder_name VARCHAR(200),
  account_number_enc BYTEA,
  ifsc_code VARCHAR(20),
  upi_id VARCHAR(120),
  paytm_id VARCHAR(120),
  bharatpe_id VARCHAR(120),
  google_pay_id VARCHAR(120),
  apple_pay_id VARCHAR(120),
  preferred_payout_method payout_method,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_profile_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_value_json JSONB NOT NULL,
  new_value_json JSONB NOT NULL
);

-- ==========================================================
-- Seed Inserts (Fixed UUIDs for stable FK references)
-- ==========================================================

-- Countries: India
INSERT INTO countries (id, name, iso_code)
VALUES ('11111111-1111-1111-1111-111111111111', 'India', 'IN')
ON CONFLICT (id) DO NOTHING;

-- Supplier Type Master
INSERT INTO supplier_type_master (id, code, name)
VALUES
  ('22222222-2222-2222-2222-222222222221', 'FARMING_MACHINERY', 'Farming Machinery'),
  ('22222222-2222-2222-2222-222222222222', 'TRANSPORT_MACHINERY', 'Transport Machinery'),
  ('22222222-2222-2222-2222-222222222223', 'LABOUR_SERVICES', 'Labour Services')
ON CONFLICT (id) DO NOTHING;

-- Machinery Categories
INSERT INTO machinery_category_master (id, code, name)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'FARMING', 'Farming Machinery'),
  ('33333333-3333-3333-3333-333333333332', 'TRANSPORT', 'Transport Machinery')
ON CONFLICT (id) DO NOTHING;

-- Machinery Types (Admin-controlled master list)
-- Farming
INSERT INTO machinery_type_master (id, category_id, name, is_active)
VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333331', 'Tractor', TRUE),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333331', 'Power Tiller', TRUE),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333331', 'Rotavator', TRUE),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333331', 'Seed Drill', TRUE),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333331', 'Sprayer', TRUE),
  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333331', 'Harvester', TRUE),
  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333331', 'Thresher', TRUE),
  ('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333331', 'Cultivator', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Transport
INSERT INTO machinery_type_master (id, category_id, name, is_active)
VALUES
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333332', 'Mini Truck (Tata Ace)', TRUE),
  ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333332', 'Tractor Trolley', TRUE),
  ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333332', '6-Wheeler Truck', TRUE),
  ('55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333332', '10-Wheeler Truck', TRUE),
  ('55555555-5555-5555-5555-555555555505', '33333333-3333-3333-3333-333333333332', 'Refrigerated Van', TRUE),
  ('55555555-5555-5555-5555-555555555506', '33333333-3333-3333-3333-333333333332', 'Bulk Carrier', TRUE),
  ('55555555-5555-5555-5555-555555555507', '33333333-3333-3333-3333-333333333332', 'Tempo', TRUE)
ON CONFLICT (id) DO NOTHING;
