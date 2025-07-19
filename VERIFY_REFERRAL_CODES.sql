-- =============================================
-- VERIFY REFERRAL CODES FOR ALL USERS
-- =============================================
-- This script checks that all users have referral codes

-- 1. Show all users and their referral codes
SELECT 
    '👥 ALL USERS AND THEIR REFERRAL CODES:' as info;

SELECT 
    id,
    username,
    referral_code,
    CASE 
        WHEN referral_code IS NULL THEN '❌ Missing'
        ELSE '✅ Has Code'
    END as status,
    created_at
FROM users
ORDER BY id;

-- 2. Count users by status
SELECT 
    '📊 USER STATUS SUMMARY:' as info;

SELECT 
    CASE 
        WHEN referral_code IS NULL THEN '❌ Missing Code'
        ELSE '✅ Has Code'
    END as status,
    COUNT(*) as count
FROM users
GROUP BY (referral_code IS NULL)
ORDER BY status;

-- 3. Show referral code format validation
SELECT 
    '🔍 REFERRAL CODE FORMAT CHECK:' as info;

SELECT 
    id,
    username,
    referral_code,
    CASE 
        WHEN referral_code IS NULL THEN 'No Code'
        WHEN referral_code ~ '^DIVINE\d{6}[A-Z0-9]{4}$' THEN '✅ Valid Format'
        ELSE '❌ Invalid Format'
    END as format_check
FROM users
ORDER BY id;

-- 4. Test generating referral links
SELECT 
    '🔗 SAMPLE REFERRAL LINKS:' as info;

SELECT 
    id,
    username,
    referral_code,
    'https://t.me/DivineTaps_bot/mine?startapp=' || referral_code as referral_link
FROM users
WHERE referral_code IS NOT NULL
ORDER BY id;

-- 5. Check if referral_attempts table is ready
SELECT 
    '📊 REFERRAL ATTEMPTS TABLE STATUS:' as info;

SELECT 
    COUNT(*) as total_attempts,
    COUNT(DISTINCT user_id) as users_with_attempts,
    COUNT(DISTINCT status) as different_statuses
FROM referral_attempts;

-- 6. Final summary
SELECT 
    '🎉 MIGRATION SUMMARY:' as info;

SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE referral_code IS NOT NULL) as users_with_codes,
    (SELECT COUNT(*) FROM users WHERE referral_code IS NULL) as users_without_codes,
    (SELECT COUNT(*) FROM referral_attempts) as total_referral_attempts,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE referral_code IS NULL) = 0 
        THEN '✅ All users have referral codes!'
        ELSE '❌ Some users missing codes'
    END as migration_status; 