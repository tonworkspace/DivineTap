-- =============================================
-- MINIMAL REFERRAL CODE MIGRATION
-- =============================================
-- This script only adds the referral_code column to users table
-- Since referral_attempts table already exists

-- 1. Add referral_code column to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
        RAISE NOTICE '✅ Added referral_code column to users table';
    ELSE
        RAISE NOTICE '⚠️  referral_code column already exists in users table';
    END IF;
END $$;

-- 2. Create index for referral_code lookups
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_referral_code'
    ) THEN
        CREATE INDEX idx_users_referral_code ON users(referral_code);
        RAISE NOTICE '✅ Created idx_users_referral_code index';
    ELSE
        RAISE NOTICE '⚠️  idx_users_referral_code index already exists';
    END IF;
END $$;

-- 3. Generate referral codes for existing users (only for users without codes)
DO $$
DECLARE
    user_record RECORD;
    base_code TEXT;
    user_id_hash TEXT;
    suffix INTEGER;
    new_referral_code TEXT;
    users_updated INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Generating referral codes for existing users...';
    
    -- Check if there are users without referral codes
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
        new_referral_code := base_code || UPPER(LPAD(suffix::TEXT, 4, '0'));
        
        -- Update user with generated code
        UPDATE users 
        SET referral_code = new_referral_code 
        WHERE id = user_record.id;
        
        users_updated := users_updated + 1;
        
        -- Only show first 5 to avoid spam
        IF users_updated <= 5 THEN
            RAISE NOTICE '  Generated: % for user %', new_referral_code, user_record.id;
        END IF;
    END LOOP;
    
    IF users_updated > 0 THEN
        RAISE NOTICE '✅ Generated referral codes for % users', users_updated;
    ELSE
        RAISE NOTICE '✅ All users already have referral codes';
    END IF;
END $$;

-- 4. Final verification
DO $$
DECLARE
    users_without_codes INTEGER;
    total_users INTEGER;
    total_attempts INTEGER;
BEGIN
    -- Count users and codes
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_without_codes FROM users WHERE referral_code IS NULL;
    SELECT COUNT(*) INTO total_attempts FROM referral_attempts;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '👥 Total users: %', total_users;
    RAISE NOTICE '❌ Users without referral codes: %', users_without_codes;
    RAISE NOTICE '📊 Total referral attempts logged: %', total_attempts;
    
    IF users_without_codes > 0 THEN
        RAISE WARNING '⚠️  Warning: % users still missing referral codes!', users_without_codes;
    ELSE
        RAISE NOTICE '✅ SUCCESS: All users have referral codes!';
    END IF;
    RAISE NOTICE '==========================================';
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check that everything is working

-- Show sample referral codes
SELECT 
    id, 
    username, 
    referral_code,
    created_at
FROM users
WHERE referral_code IS NOT NULL
ORDER BY id
LIMIT 5;

-- Count users with/without codes
SELECT 
    CASE 
        WHEN referral_code IS NULL THEN 'Missing Code'
        ELSE 'Has Code'
    END as status,
    COUNT(*) as count
FROM users
GROUP BY (referral_code IS NULL)
ORDER BY status; 