-- Divine Mining Game Database Schema
-- This schema supports the complete Divine Mining game experience

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE USER TABLES
-- =============================================

-- Users table (extends existing user system)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10),
    wallet_address VARCHAR(255),
    referral_code VARCHAR(255) UNIQUE, -- Static referral code for this user
    balance DECIMAL(18, 6) DEFAULT 0,
    total_deposit DECIMAL(18, 6) DEFAULT 0,
    total_withdrawn DECIMAL(18, 6) DEFAULT 0,
    total_earned DECIMAL(18, 6) DEFAULT 0,
    total_sbt DECIMAL(18, 6) DEFAULT 0,
    team_volume DECIMAL(18, 6) DEFAULT 0,
    direct_referrals INTEGER DEFAULT 0,
    rank VARCHAR(50) DEFAULT 'Novice',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    login_streak INTEGER DEFAULT 0,
    last_login_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    last_deposit_time TIMESTAMP WITH TIME ZONE,
    last_deposit_date DATE,
    last_daily_reward DATE,
    mining_power DECIMAL(18, 6) DEFAULT 0,
    referrer_id INTEGER REFERENCES users(id),
    whitelisted_wallet VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DIVINE MINING GAME TABLES
-- =============================================

-- User game data - stores the main game state
CREATE TABLE user_game_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_data JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Extract key metrics for indexing and querying
    divine_points DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'divine_points' AS DECIMAL(18, 6))) STORED,
    total_points_earned DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'total_points_earned' AS DECIMAL(18, 6))) STORED,
    points_per_second DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'points_per_second' AS DECIMAL(18, 6))) STORED,
    high_score DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'high_score' AS DECIMAL(18, 6))) STORED,
    all_time_high_score DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'all_time_high_score' AS DECIMAL(18, 6))) STORED,
    upgrades_purchased INTEGER GENERATED ALWAYS AS (CAST(game_data->>'upgrades_purchased' AS INTEGER)) STORED,
    mining_level INTEGER GENERATED ALWAYS AS (CAST(game_data->>'mining_level' AS INTEGER)) STORED,
    is_mining BOOLEAN GENERATED ALWAYS AS (CAST(game_data->>'is_mining' AS BOOLEAN)) STORED,
    current_energy DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'current_energy' AS DECIMAL(18, 6))) STORED,
    max_energy DECIMAL(18, 6) GENERATED ALWAYS AS (CAST(game_data->>'max_energy' AS DECIMAL(18, 6))) STORED,
    
    UNIQUE(user_id)
);

-- User upgrades - tracks individual upgrade purchases
CREATE TABLE user_upgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upgrade_id VARCHAR(100) NOT NULL,
    upgrade_name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(18, 6) NOT NULL DEFAULT 0,
    effect_value DECIMAL(18, 6) NOT NULL DEFAULT 0,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_upgraded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, upgrade_id)
);

-- User achievements - tracks achievement progress
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Tutorial progress - tracks user tutorial completion
CREATE TABLE user_tutorial_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_data JSONB NOT NULL DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    current_step INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Mining sessions - tracks individual mining sessions
CREATE TABLE mining_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    points_earned DECIMAL(18, 6) DEFAULT 0,
    energy_consumed DECIMAL(18, 6) DEFAULT 0,
    average_rate DECIMAL(18, 6) DEFAULT 0,
    upgrades_used JSONB DEFAULT '[]',
    boosts_active JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline rewards - tracks offline earnings
CREATE TABLE offline_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offline_duration_seconds INTEGER NOT NULL,
    base_earnings DECIMAL(18, 6) NOT NULL,
    efficiency_bonus DECIMAL(18, 6) DEFAULT 0,
    total_earnings DECIMAL(18, 6) NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily rewards - tracks daily login rewards
CREATE TABLE daily_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_date DATE NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'login', 'mining', 'achievement', etc.
    reward_amount DECIMAL(18, 6) NOT NULL,
    reward_data JSONB DEFAULT '{}',
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, reward_date, reward_type)
);

-- =============================================
-- LEADERBOARD AND RANKING TABLES
-- =============================================

-- Divine points leaderboard (materialized view for performance)
CREATE MATERIALIZED VIEW divine_points_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY ugd.divine_points DESC) as rank,
    u.id as user_id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    ugd.divine_points,
    ugd.total_points_earned,
    ugd.points_per_second,
    ugd.high_score,
    ugd.all_time_high_score,
    ugd.upgrades_purchased,
    ugd.mining_level,
    u.last_active,
    u.created_at as joined_at,
    ugd.last_updated
FROM users u
JOIN user_game_data ugd ON u.id = ugd.user_id
WHERE ugd.divine_points > 0
ORDER BY ugd.divine_points DESC;

-- Weekly leaderboard
CREATE TABLE weekly_leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    points_earned DECIMAL(18, 6) NOT NULL,
    rank_position INTEGER,
    reward_earned DECIMAL(18, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, week_start)
);

-- Monthly leaderboard
CREATE TABLE monthly_leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    month_end DATE NOT NULL,
    points_earned DECIMAL(18, 6) NOT NULL,
    rank_position INTEGER,
    reward_earned DECIMAL(18, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, month_start)
);

-- =============================================
-- GAME STATISTICS AND ANALYTICS
-- =============================================

-- Game statistics - overall game metrics
CREATE TABLE game_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE NOT NULL,
    total_players INTEGER DEFAULT 0,
    active_players INTEGER DEFAULT 0,
    total_divine_points DECIMAL(18, 6) DEFAULT 0,
    total_points_earned DECIMAL(18, 6) DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0,
    total_upgrades_purchased INTEGER DEFAULT 0,
    total_achievements_unlocked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(stat_date)
);

-- User activity log
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'login', 'mining_start', 'mining_stop', 'upgrade_purchase', etc.
    activity_data JSONB DEFAULT '{}',
    points_involved DECIMAL(18, 6) DEFAULT 0,
    energy_involved DECIMAL(18, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOST AND SPECIAL EVENTS
-- =============================================

-- User boosts - active boosts for users
CREATE TABLE user_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boost_type VARCHAR(100) NOT NULL, -- 'mining', 'energy', 'offline', etc.
    boost_multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    boost_duration_seconds INTEGER NOT NULL,
    remaining_duration_seconds INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Special events
CREATE TABLE special_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(100) NOT NULL, -- 'double_points', 'reduced_energy', 'bonus_upgrades', etc.
    event_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User game data indexes
CREATE INDEX idx_user_game_data_user_id ON user_game_data(user_id);
CREATE INDEX idx_user_game_data_divine_points ON user_game_data(divine_points DESC);
CREATE INDEX idx_user_game_data_total_points ON user_game_data(total_points_earned DESC);
CREATE INDEX idx_user_game_data_last_updated ON user_game_data(last_updated DESC);

-- User upgrades indexes
CREATE INDEX idx_user_upgrades_user_id ON user_upgrades(user_id);
CREATE INDEX idx_user_upgrades_upgrade_id ON user_upgrades(upgrade_id);

-- User achievements indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked);

-- Mining sessions indexes
CREATE INDEX idx_mining_sessions_user_id ON mining_sessions(user_id);
CREATE INDEX idx_mining_sessions_start ON mining_sessions(session_start DESC);
CREATE INDEX idx_mining_sessions_active ON mining_sessions(is_active);

-- Activity logs indexes
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX idx_user_activity_logs_created ON user_activity_logs(created_at DESC);

-- Leaderboard indexes
CREATE INDEX idx_weekly_leaderboards_week ON weekly_leaderboards(week_start, week_end);
CREATE INDEX idx_monthly_leaderboards_month ON monthly_leaderboards(month_start, month_end);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update user_game_data last_updated timestamp
CREATE OR REPLACE FUNCTION update_user_game_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_game_data timestamp
CREATE TRIGGER trigger_update_user_game_data_timestamp
    BEFORE UPDATE ON user_game_data
    FOR EACH ROW
    EXECUTE FUNCTION update_user_game_data_timestamp();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_activity_type VARCHAR(100),
    p_activity_data JSONB DEFAULT '{}',
    p_points_involved DECIMAL(18, 6) DEFAULT 0,
    p_energy_involved DECIMAL(18, 6) DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_logs (
        user_id, 
        activity_type, 
        activity_data, 
        points_involved, 
        energy_involved
    )
    VALUES (
        p_user_id, 
        p_activity_type, 
        p_activity_data, 
        p_points_involved, 
        p_energy_involved
    );
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_divine_points_leaderboard()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW divine_points_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's divine points rank
CREATE OR REPLACE FUNCTION get_user_divine_points_rank(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank INTO user_rank
    FROM divine_points_leaderboard
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to process offline rewards
CREATE OR REPLACE FUNCTION process_offline_rewards(
    p_user_id INTEGER,
    p_offline_duration_seconds INTEGER,
    p_base_earnings DECIMAL(18, 6),
    p_efficiency_bonus DECIMAL(18, 6) DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    reward_id UUID;
    total_earnings DECIMAL(18, 6);
BEGIN
    total_earnings := p_base_earnings * (1 + p_efficiency_bonus);
    
    INSERT INTO offline_rewards (
        user_id,
        offline_duration_seconds,
        base_earnings,
        efficiency_bonus,
        total_earnings
    )
    VALUES (
        p_user_id,
        p_offline_duration_seconds,
        p_base_earnings,
        p_efficiency_bonus,
        total_earnings
    )
    RETURNING id INTO reward_id;
    
    RETURN reward_id;
END;
$$ LANGUAGE plpgsql;

-- Function to claim offline rewards
CREATE OR REPLACE FUNCTION claim_offline_rewards(p_user_id INTEGER)
RETURNS DECIMAL(18, 6) AS $$
DECLARE
    total_rewards DECIMAL(18, 6);
BEGIN
    SELECT COALESCE(SUM(total_earnings), 0) INTO total_rewards
    FROM offline_rewards
    WHERE user_id = p_user_id AND claimed = FALSE;
    
    UPDATE offline_rewards
    SET claimed = TRUE, claimed_at = NOW()
    WHERE user_id = p_user_id AND claimed = FALSE;
    
    RETURN total_rewards;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Create indexes for the materialized view
CREATE UNIQUE INDEX idx_divine_points_leaderboard_rank ON divine_points_leaderboard(rank);
CREATE INDEX idx_divine_points_leaderboard_user_id ON divine_points_leaderboard(user_id);
CREATE INDEX idx_divine_points_leaderboard_divine_points ON divine_points_leaderboard(divine_points DESC);

-- Initial refresh of materialized view
SELECT refresh_divine_points_leaderboard();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE user_game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust based on your auth system)
-- Note: These are basic policies - adjust based on your specific security requirements

-- User can only access their own game data
CREATE POLICY user_game_data_policy ON user_game_data
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY user_upgrades_policy ON user_upgrades
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY user_achievements_policy ON user_achievements
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY user_tutorial_progress_policy ON user_tutorial_progress
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY mining_sessions_policy ON mining_sessions
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY offline_rewards_policy ON offline_rewards
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY daily_rewards_policy ON daily_rewards
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY user_boosts_policy ON user_boosts
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

CREATE POLICY user_activity_logs_policy ON user_activity_logs
    FOR ALL USING (user_id = current_setting('app.current_user_id')::integer);

-- =============================================
-- SCHEDULED TASKS (CRON JOBS)
-- =============================================

-- Note: These would typically be set up in your application or using pg_cron extension

-- Example cron job to refresh leaderboard every 5 minutes:
-- SELECT cron.schedule('refresh-leaderboard', '*/5 * * * *', 'SELECT refresh_divine_points_leaderboard();');

-- Example cron job to clean up old activity logs (keep last 30 days):
-- SELECT cron.schedule('cleanup-activity-logs', '0 2 * * *', 'DELETE FROM user_activity_logs WHERE created_at < NOW() - INTERVAL ''30 days'';');

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active miners view
CREATE VIEW active_miners AS
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    ugd.divine_points,
    ugd.points_per_second,
    ugd.is_mining,
    ugd.current_energy,
    ugd.max_energy,
    ugd.last_updated
FROM users u
JOIN user_game_data ugd ON u.id = ugd.user_id
WHERE ugd.is_mining = TRUE
ORDER BY ugd.points_per_second DESC;

-- Top players view
CREATE VIEW top_players AS
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    ugd.divine_points,
    ugd.total_points_earned,
    ugd.upgrades_purchased,
    ugd.mining_level,
    u.created_at,
    ugd.last_updated
FROM users u
JOIN user_game_data ugd ON u.id = ugd.user_id
WHERE ugd.divine_points > 0
ORDER BY ugd.divine_points DESC
LIMIT 100;

-- User progress summary view
CREATE VIEW user_progress_summary AS
SELECT 
    u.id,
    u.username,
    ugd.divine_points,
    ugd.total_points_earned,
    ugd.upgrades_purchased,
    ugd.mining_level,
    COUNT(ua.id) as achievements_unlocked,
    COUNT(CASE WHEN ua.unlocked = TRUE THEN 1 END) as achievements_completed,
    AVG(ms.points_earned) as avg_session_earnings,
    MAX(ms.points_earned) as best_session_earnings
FROM users u
LEFT JOIN user_game_data ugd ON u.id = ugd.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN mining_sessions ms ON u.id = ms.user_id
GROUP BY u.id, u.username, ugd.divine_points, ugd.total_points_earned, ugd.upgrades_purchased, ugd.mining_level;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE user_game_data IS 'Stores the main game state for each user including divine points, mining status, and energy levels';
COMMENT ON TABLE user_upgrades IS 'Tracks individual upgrade purchases and levels for each user';
COMMENT ON TABLE user_achievements IS 'Manages achievement progress and unlocks for users';
COMMENT ON TABLE mining_sessions IS 'Logs individual mining sessions with earnings and duration';
COMMENT ON TABLE offline_rewards IS 'Tracks offline earnings that users can claim when they return';
COMMENT ON TABLE daily_rewards IS 'Manages daily login rewards and bonuses';
COMMENT ON TABLE user_boosts IS 'Tracks active boosts and their remaining duration';
COMMENT ON TABLE special_events IS 'Manages special game events and bonuses';
COMMENT ON MATERIALIZED VIEW divine_points_leaderboard IS 'Optimized leaderboard view for divine points rankings';

-- Schema version for migration tracking
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_version (version, description) VALUES (1, 'Initial Divine Mining Game schema'); 

-- Referral attempts (for enhanced referral tracking)
CREATE TABLE IF NOT EXISTS referral_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'invalid', 'duplicate', 'self_referral')),
    reason TEXT,
    referrer_username TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for referral attempts
CREATE INDEX IF NOT EXISTS idx_referral_attempts_user_id ON referral_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_status ON referral_attempts(status);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_timestamp ON referral_attempts(timestamp);

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Create referral functions
CREATE OR REPLACE FUNCTION increment_direct_referrals(user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users 
  SET direct_referrals = COALESCE(direct_referrals, 0) + 1
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if stored procedure exists
CREATE OR REPLACE FUNCTION create_increment_referrals_function()
RETURNS BOOLEAN AS $$
BEGIN
  -- Function is already created above, just return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 