-- Truncate all tables in the agricultural platform database
-- This script truncates all tables while respecting foreign key constraints
-- Handles missing tables gracefully

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate tables that exist (using DO block to handle missing tables gracefully)
DO $$
DECLARE
  table_name TEXT;
  tables_to_truncate TEXT[] := ARRAY[
    'quality_test_images',
    'quality_test_metrics',
    'quality_test_reports',
    'payment_profile_audit',
    'payment_profiles',
    'payments',
    'service_order_items',
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'supplier_machinery_inventory',
    'machinery_type_master',
    'machinery_category_master',
    'buyer_shortlists',
    'bids',
    'product_images',
    'products',
    'lands',
    'land_records',
    'farmer_locations',
    'supplier_types',
    'supplier_type_master',
    'supplier_profiles',
    'buyer_profiles',
    'farmer_profiles',
    'addresses',
    'villages',
    'tehsils',
    'districts',
    'states',
    'countries',
    'otp_requests',
    'users'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_truncate
  LOOP
    BEGIN
      EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
    EXCEPTION
      WHEN undefined_table THEN
        -- Table doesn't exist, skip it
        NULL;
    END;
  END LOOP;
END $$;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

SELECT 'All existing tables truncated successfully' AS result;
