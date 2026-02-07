-- Migration: Add madar role to users role constraint
-- Date: 2026-02-07

-- Update role check constraint to include madar
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'madar', 'instructor', 'tester', 'student'));
