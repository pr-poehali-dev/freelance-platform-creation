-- Add login/password columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for faster username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);