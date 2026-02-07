-- Migration: Add instructor_number column to users table
-- Date: 2026-02-07

-- Add instructor_number column with constraint (1-100000)
ALTER TABLE users ADD COLUMN IF NOT EXISTS instructor_number INTEGER;

-- Add check constraint for valid range
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instructor_number_check;
ALTER TABLE users ADD CONSTRAINT users_instructor_number_check
  CHECK (instructor_number >= 1 AND instructor_number <= 100000);

-- Add unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instructor_number_unique;
ALTER TABLE users ADD CONSTRAINT users_instructor_number_unique UNIQUE (instructor_number);
