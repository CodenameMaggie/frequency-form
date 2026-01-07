-- =====================================================
-- FREQUENCY & FORM - DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify all tables exist
-- =====================================================

-- Check all tables in public schema
SELECT
    table_name,
    CASE
        WHEN table_name LIKE 'brand%' THEN 'Brand System'
        WHEN table_name LIKE 'bot%' OR table_name LIKE 'ai%' THEN 'Bot System'
        WHEN table_name IN ('contacts', 'users', 'emails', 'email_inbound', 'email_queue') THEN 'Core CRM'
        WHEN table_name LIKE 'product%' OR table_name = 'sales' OR table_name = 'payouts' THEN 'Marketplace'
        WHEN table_name LIKE 'annie%' OR table_name = 'tickets' THEN 'Support System'
        ELSE 'Other'
    END as category
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY category, table_name;

-- Expected tables count
SELECT
    'Expected: 35+ tables' as check_name,
    COUNT(*) as actual_count,
    CASE
        WHEN COUNT(*) >= 35 THEN '✅ PASS'
        ELSE '❌ NEEDS SETUP'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Check critical brand outreach tables
SELECT
    'Brand Outreach Tables' as check_name,
    COUNT(*) as tables_found,
    CASE
        WHEN COUNT(*) = 3 THEN '✅ COMPLETE'
        ELSE '❌ MISSING - Run frequency-form-brand-outreach-setup.sql'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('brand_prospects', 'brand_outreach_queue', 'brand_emails');

-- Check bot system tables
SELECT
    'Bot System Tables' as check_name,
    COUNT(*) as tables_found,
    CASE
        WHEN COUNT(*) >= 10 THEN '✅ COMPLETE'
        ELSE '❌ INCOMPLETE - Run bot system SQL files'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'bot%' OR table_name LIKE 'ai%');

-- Check marketplace tables
SELECT
    'Marketplace Tables' as check_name,
    COUNT(*) as tables_found,
    CASE
        WHEN COUNT(*) >= 5 THEN '✅ COMPLETE'
        ELSE '❌ INCOMPLETE - Run marketplace-schema.sql'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('brand_partners', 'brand_applications', 'products', 'sales', 'payouts');

-- Check if brand_prospects has seeded data
SELECT
    'Brand Prospects Seeded' as check_name,
    COUNT(*) as brand_count,
    CASE
        WHEN COUNT(*) >= 20 THEN '✅ SEEDED'
        WHEN COUNT(*) > 0 THEN '⚠️ PARTIAL'
        ELSE '❌ EMPTY - Run brand outreach SQL'
    END as status
FROM brand_prospects
WHERE 1=1;  -- Will error if table doesn't exist

-- Summary
SELECT
    '=== DATABASE HEALTH SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    'Check results above for details' as note;
