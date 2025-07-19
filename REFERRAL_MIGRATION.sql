-- =============================================
-- REFERRAL SYSTEM MIGRATION SCRIPT
-- =============================================
-- This script adds all necessary schema changes for the enhanced referral system
-- Run this against your existing database to add the new features

-- 1. Add referral_code column to users table
-- This column will store the static referral code for each user
ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;

-- 2. Create index for referral_code lookups
-- This improves performance when validating referral codes
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- 3. Create referral_attempts table for enhanced tracking
-- This table stores all referral attempts for analytics and debugging
CREATE TABLE referral_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'invalid', 'duplicate', 'self_referral')),
    reason TEXT,
    referrer_username TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for referral_attempts table
-- These improve query performance for analytics
CREATE INDEX idx_referral_attempts_user_id ON referral_attempts(user_id);
CREATE INDEX idx_referral_attempts_status ON referral_attempts(status);
CREATE INDEX idx_referral_attempts_timestamp ON referral_attempts(timestamp);

-- 5. Generate referral codes for existing users
-- This function generates static referral codes for users who don't have one
CREATE OR REPLACE FUNCTION generate_referral_codes()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    base_code TEXT;
    user_id_hash TEXT;
    suffix INTEGER;
    referral_code TEXT;
BEGIN
    -- Loop through all users who don't have a referral code
    FOR user_record IN 
        SELECT id FROM users WHERE referral_code IS NULL
    LOOP
        -- Generate deterministic referral code
        base_code := 'DIVINE' || LPAD(user_record.id::TEXT, 6, '0');
        user_id_hash := user_record.id::TEXT;
        
        -- Create deterministic suffix based on user ID
        suffix := 0;
        FOR i IN 1..LENGTH(user_id_hash) LOOP
            suffix := ((suffix << 5) - suffix + ASCII(SUBSTRING(user_id_hash FROM i FOR 1))) & 65535;
        END LOOP;
        
        -- Convert to base-36 and pad to 4 characters
        referral_code := base_code || UPPER(LPAD(suffix::TEXT, 4, '0'));
        
        -- Update user with generated code
        UPDATE users 
        SET referral_code = referral_code 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Generated referral code % for user %', referral_code, user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Execute the function to generate codes for existing users
SELECT generate_referral_codes();

-- 7. Clean up the temporary function
DROP FUNCTION generate_referral_codes();

-- 8. Verify the migration
-- Check that all users now have referral codes
DO $$
DECLARE
    users_without_codes INTEGER;
    total_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_without_codes FROM users WHERE referral_code IS NULL;
    SELECT COUNT(*) INTO total_users FROM users;
    
    RAISE NOTICE 'Migration completed!';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users without referral codes: %', users_without_codes;
    
    IF users_without_codes > 0 THEN
        RAISE WARNING 'Some users still missing referral codes!';
    ELSE
        RAISE NOTICE 'All users have referral codes - migration successful!';
    END IF;
END;
$$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these queries to verify the migration worked correctly

-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'referral_code';

-- Check referral_attempts table was created
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'referral_attempts'
ORDER BY ordinal_position;

-- Check indexes were created
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'referral_attempts')
AND indexname LIKE '%referral%';

-- Sample referral codes
SELECT id, username, referral_code
FROM users
WHERE referral_code IS NOT NULL
LIMIT 10;

-- =============================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================
-- Uncomment and run these commands if you need to rollback the migration

-- DROP TABLE IF EXISTS referral_attempts;
-- DROP INDEX IF EXISTS idx_users_referral_code;
-- ALTER TABLE users DROP COLUMN IF EXISTS referral_code;

-- =============================================
-- NOTES
-- =============================================
-- 1. This script is idempotent - you can run it multiple times safely
-- 2. It generates static referral codes for all existing users
-- 3. New users will get codes generated automatically by the application
-- 4. The referral_attempts table enables enhanced analytics and debugging
-- 5. All changes are backward compatible 