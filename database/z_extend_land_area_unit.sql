-- Migration: Extend LandAreaUnit enum with KATHA, GUNTHA
-- Runs after schema-3nf.sql (z_ prefix ensures execution order)
-- Required for farmer portal land unit options

ALTER TYPE "LandAreaUnit" ADD VALUE IF NOT EXISTS 'KATHA';
ALTER TYPE "LandAreaUnit" ADD VALUE IF NOT EXISTS 'GUNTHA';
