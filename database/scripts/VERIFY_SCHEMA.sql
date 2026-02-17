-- ==========================================================
-- Schema Verification Queries
-- Run these after applying schema-3nf.sql to verify installation
-- ==========================================================

-- 1. Check all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verify seed data - Countries
SELECT 'Countries' as table_name, COUNT(*) as count FROM countries
UNION ALL
SELECT 'Supplier Types', COUNT(*) FROM supplier_type_master
UNION ALL
SELECT 'Machinery Categories', COUNT(*) FROM machinery_category_master
UNION ALL
SELECT 'Machinery Types', COUNT(*) FROM machinery_type_master;

-- 3. Check ENUM types
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
    'user_role', 'otp_purpose', 'supplier_type_code', 'product_unit',
    'product_status', 'bid_status', 'cart_status', 'cart_item_type',
    'order_type', 'order_status', 'payment_status', 'payment_txn_status',
    'payment_method', 'order_item_status', 'service_item_status',
    'area_unit', 'machinery_category_code', 'machinery_availability', 'payout_method'
)
GROUP BY t.typname
ORDER BY t.typname;

-- 4. Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 6. Verify machinery types seed data
SELECT 
    mcm.name as category,
    mtm.name as machinery_type,
    mtm.is_active
FROM machinery_type_master mtm
JOIN machinery_category_master mcm ON mtm.category_id = mcm.id
ORDER BY mcm.code, mtm.name;

-- 7. Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conrelid::regclass as table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass, conname;

-- 8. Summary statistics
SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Indexes',
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Foreign Keys',
    COUNT(*)::text
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
UNION ALL
SELECT 
    'Total ENUM Types',
    COUNT(DISTINCT typname)::text
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%_role' OR t.typname LIKE '%_status' OR t.typname LIKE '%_type';
