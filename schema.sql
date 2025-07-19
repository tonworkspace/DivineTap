-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    referrer_id INTEGER REFERENCES users(id),
    referral_code TEXT UNIQUE, -- Static referral code for this user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    balance NUMERIC DEFAULT 0,
    total_deposit NUMERIC DEFAULT 0,
    total_withdrawn NUMERIC DEFAULT 0,
    team_volume NUMERIC DEFAULT 0,
    direct_referrals INTEGER DEFAULT 0,
    rank TEXT DEFAULT 'None',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT,
    last_name TEXT,
    language_code TEXT,
    is_active BOOLEAN DEFAULT true,
    last_deposit_date TIMESTAMP WITH TIME ZONE,
    last_deposit_time TIMESTAMP WITH TIME ZONE,
    last_login_date TIMESTAMP WITH TIME ZONE,
    login_streak INTEGER DEFAULT 0,
    total_earned NUMERIC DEFAULT 0,
    total_sbt NUMERIC DEFAULT 0,
    last_sbt_claim TIMESTAMP WITH TIME ZONE
);

-- Stakes table
CREATE TABLE stakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    daily_rate NUMERIC NOT NULL,
    total_earned NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_payout TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    speed_boost_active BOOLEAN DEFAULT false,
    CONSTRAINT positive_amount CHECK (amount >= 1) -- Minimum 1 TON
);

-- Deposits table
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    wallet_amount NUMERIC NOT NULL,
    redeposit_amount NUMERIC NOT NULL,
    sbt_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash TEXT,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT positive_amounts CHECK (
        amount > 0 AND 
        wallet_amount > 0 AND 
        redeposit_amount > 0 AND 
        sbt_amount > 0
    )
);

-- Referral earnings table
CREATE TABLE referral_earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    referral_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    CONSTRAINT valid_level CHECK (level BETWEEN 1 AND 5)
);

-- Global pool shares table
CREATE TABLE global_pool_shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    shares INTEGER NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    distributed BOOLEAN DEFAULT false,
    CONSTRAINT positive_shares CHECK (shares > 0)
);

-- Fast start bonuses table
CREATE TABLE fast_start_bonuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Weekly rank rewards table
CREATE TABLE rank_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    rank TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processed', 'failed'))
);

-- Speed boost tracking table
CREATE TABLE speed_boosts (
    id SERIAL PRIMARY KEY,
    stake_id INTEGER REFERENCES stakes(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 2,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frog miner data table
CREATE TABLE frog_miner_data (
    id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    total_harvested INTEGER DEFAULT 0,
    caught_today INTEGER DEFAULT 0,
    last_reset_date DATE,
    frogs JSONB DEFAULT '[]'::jsonb
);

-- Earning logs (for all earning events)
CREATE TABLE earning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL, -- 'roi', 'referral', 'bonus', etc.
    amount NUMERIC NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earning history (for stake earnings)
CREATE TABLE earning_history (
    id SERIAL PRIMARY KEY,
    stake_id INTEGER REFERENCES stakes(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'daily_roi', etc.
    roi_rate NUMERIC,
    base_rate NUMERIC,
    rank_bonus NUMERIC,
    duration_multiplier NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cycle completions (when a stake completes 300%)
CREATE TABLE cycle_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    stake_id INTEGER REFERENCES stakes(id) NOT NULL,
    stake_amount NUMERIC NOT NULL,
    reinvest_amount NUMERIC NOT NULL,
    glp_amount NUMERIC NOT NULL,
    stk_amount NUMERIC NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SBT (Reputation Points) earning history
CREATE TABLE sbt_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'referral', 'stake', etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mining deposits
CREATE TABLE mining_deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- GLP distribution history
CREATE TABLE glp_distribution_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    points INTEGER,
    distribution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_pool_amount NUMERIC,
    total_participants INTEGER
);

-- User activity logs (for error tracking/monitoring)
CREATE TABLE user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_type TEXT,
    status TEXT
);

-- Earning discrepancies (for reconciliation)
CREATE TABLE earning_discrepancies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    calculated NUMERIC NOT NULL,
    recorded NUMERIC NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward history (for user reward payouts)
CREATE TABLE reward_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    stake_id INTEGER REFERENCES stakes(id),
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'roi', 'referral', 'bonus', etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global pool (for GLP rewards)
CREATE TABLE global_pool (
    id SERIAL PRIMARY KEY,
    amount NUMERIC NOT NULL DEFAULT 0
);

-- Global pool rankings (for leaderboard)
CREATE TABLE global_pool_rankings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    period TEXT NOT NULL, -- 'daily', 'weekly', etc.
    rank INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals (for referral relationships)
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id) NOT NULL,
    referred_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task System Tables
-- Task definitions table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('social', 'community', 'referral', 'daily', 'weekly', 'achievement', 'mining', 'exploration')),
    emoji TEXT NOT NULL,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    cooldown_hours INTEGER DEFAULT 0,
    submission_required BOOLEAN DEFAULT false,
    submission_type TEXT CHECK (submission_type IN ('screenshot', 'link', 'text', 'none')),
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dynamic_reward BOOLEAN DEFAULT false,
    reward_formula TEXT, -- JSON formula for dynamic rewards
    prerequisites JSONB DEFAULT '[]'::jsonb, -- Array of task IDs that must be completed first
    max_completions INTEGER DEFAULT -1, -- -1 means unlimited
    time_limit_hours INTEGER DEFAULT 0, -- 0 means no time limit
    bonus_conditions JSONB DEFAULT '{}'::jsonb -- Conditions for bonus rewards
);

-- User task progress table
CREATE TABLE user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    task_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'claimed', 'pending_review', 'failed')),
    progress INTEGER DEFAULT 0,
    goal INTEGER DEFAULT 1,
    last_completed TIMESTAMP WITH TIME ZONE,
    completion_count INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, task_id)
);

-- Task submissions table
CREATE TABLE task_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    task_id TEXT NOT NULL,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('screenshot', 'link', 'text')),
    submission_data TEXT NOT NULL,
    telegram_username TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task achievements table
CREATE TABLE task_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    achievement_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward NUMERIC NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Task streaks table
CREATE TABLE task_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    task_type TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, task_type)
);

-- Dynamic task events table
CREATE TABLE task_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reward_multiplier NUMERIC DEFAULT 1.0,
    bonus_tasks JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task analytics table
CREATE TABLE task_analytics (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    average_completion_time_minutes INTEGER,
    success_rate NUMERIC DEFAULT 0,
    total_rewards_distributed NUMERIC DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_referrer_id ON users(referrer_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_stakes_user_id ON stakes(user_id);
CREATE INDEX idx_stakes_is_active ON stakes(is_active);
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_referral_earnings_user_id ON referral_earnings(user_id);
CREATE INDEX idx_global_pool_shares_user_id ON global_pool_shares(user_id);
CREATE INDEX idx_global_pool_shares_week ON global_pool_shares(week_start, week_end);
CREATE INDEX idx_speed_boosts_stake_id ON speed_boosts(stake_id);
CREATE INDEX idx_speed_boosts_user_id ON speed_boosts(user_id);

-- Task system indexes
CREATE INDEX idx_tasks_task_id ON tasks(task_id);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_is_active ON tasks(is_active);
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_task_submissions_status ON task_submissions(status);
CREATE INDEX idx_task_achievements_user_id ON task_achievements(user_id);
CREATE INDEX idx_task_streaks_user_id ON task_streaks(user_id);
CREATE INDEX idx_task_streaks_task_type ON task_streaks(task_type);
CREATE INDEX idx_task_events_start_date ON task_events(start_date);
CREATE INDEX idx_task_events_end_date ON task_events(end_date);
CREATE INDEX idx_task_events_is_active ON task_events(is_active);
CREATE INDEX idx_task_analytics_task_id ON task_analytics(task_id);
CREATE INDEX idx_task_analytics_date ON task_analytics(date);

-- Views for common queries
CREATE VIEW active_stakes AS
SELECT s.*, u.wallet_address, u.telegram_id
FROM stakes s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true;

CREATE VIEW player_profiles AS
SELECT 
    u.id,
    u.telegram_id,
    u.wallet_address,
    u.username,
    u.balance,
    u.total_deposit,
    u.total_withdrawn,
    u.team_volume,
    u.rank,
    u.created_at as joined_at,
    u.last_active,
    COUNT(DISTINCT s.id) as total_stakes,
    COUNT(DISTINCT d.id) as total_deposits,
    COUNT(DISTINCT w.id) as total_withdrawals
FROM users u
LEFT JOIN stakes s ON u.id = s.user_id
LEFT JOIN deposits d ON u.id = d.user_id
LEFT JOIN withdrawals w ON u.id = w.user_id
GROUP BY u.id;

CREATE VIEW transaction_history AS
SELECT 
    'deposit' as type,
    d.id,
    d.user_id,
    d.amount,
    d.status,
    d.transaction_hash,
    d.created_at,
    d.processed_at
FROM deposits d
UNION ALL
SELECT 
    'withdrawal' as type,
    w.id,
    w.user_id,
    w.amount,
    w.status,
    w.transaction_hash,
    w.created_at,
    w.processed_at
FROM withdrawals w
ORDER BY created_at DESC;

CREATE VIEW referral_stats AS
SELECT 
    u.id as user_id,
    u.telegram_id,
    u.wallet_address,
    u.username,
    u.direct_referrals,
    u.team_volume,
    COUNT(DISTINCT r.id) as total_team_members,
    SUM(re.amount) as total_earnings,
    u.rank as current_rank
FROM users u
LEFT JOIN users r ON r.referrer_id = u.id
LEFT JOIN referral_earnings re ON u.id = re.user_id
GROUP BY u.id, u.wallet_address, u.username; 

-- User Game Data Table for Divine Mining Game
CREATE TABLE IF NOT EXISTS user_game_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON user_game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_last_updated ON user_game_data(last_updated);

-- Disable Row Level Security for now since we're using anon key with custom auth
-- ALTER TABLE user_game_data ENABLE ROW LEVEL SECURITY;

-- Note: RLS is disabled because we're using the anon key with our own authentication system
-- The application handles user validation through the telegram_id in the users table

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_user_game_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamp
CREATE TRIGGER update_user_game_data_timestamp
    BEFORE UPDATE ON user_game_data
    FOR EACH ROW
    EXECUTE FUNCTION update_user_game_data_timestamp();

-- Function to get user game data with validation
CREATE OR REPLACE FUNCTION get_user_game_data(p_user_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    game_data JSONB;
BEGIN
    SELECT user_game_data.game_data INTO game_data
    FROM user_game_data
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(game_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert user game data with validation
CREATE OR REPLACE FUNCTION upsert_user_game_data(
    p_user_id INTEGER,
    p_game_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_game_data (user_id, game_data)
    VALUES (p_user_id, p_game_data)
    ON CONFLICT (user_id)
    DO UPDATE SET
        game_data = p_game_data,
        last_updated = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE user_game_data IS 'Stores user game state, upgrades, and achievements for the Divine Mining Game';
COMMENT ON COLUMN user_game_data.game_data IS 'JSON object containing all game state including divine points, energy, upgrades, achievements, etc.';
COMMENT ON COLUMN user_game_data.last_updated IS 'Timestamp of last game data update'; 

-- Referral attempts (for enhanced referral tracking)
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

-- Add indexes for referral attempts
CREATE INDEX idx_referral_attempts_user_id ON referral_attempts(user_id);
CREATE INDEX idx_referral_attempts_status ON referral_attempts(status);
CREATE INDEX idx_referral_attempts_timestamp ON referral_attempts(timestamp);

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