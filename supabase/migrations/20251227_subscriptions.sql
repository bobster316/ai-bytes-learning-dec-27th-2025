-- Subscription System Database Schema
-- Migration: 20251227_subscriptions.sql

-- ============================================
-- TABLE: user_subscriptions
-- Stores user subscription information
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Plan Information
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'byte_pass', 'unlimited', 'professional', 'enterprise')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual', NULL)),
    
    -- Subscription Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    
    -- Stripe Integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one subscription per user
    UNIQUE(user_id)
);

-- ============================================
-- TABLE: user_usage
-- Tracks monthly usage for bytes and AI queries
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Usage Period (YYYY-MM format)
    usage_period TEXT NOT NULL,
    
    -- Usage Counts
    bytes_accessed INTEGER DEFAULT 0,
    ai_queries_used INTEGER DEFAULT 0,
    
    -- Track which bytes were accessed (for free tier)
    accessed_byte_ids UUID[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one record per user per period
    UNIQUE(user_id, usage_period)
);

-- ============================================
-- TABLE: team_members (for Professional tier)
-- Manages team memberships
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Team owner (person with Professional subscription)
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Team member
    member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_email TEXT NOT NULL,
    
    -- Invitation status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invite_code TEXT UNIQUE,
    
    -- Timestamps
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    -- Unique constraint - one invite per email per owner
    UNIQUE(owner_user_id, member_email)
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_period ON public.user_usage(user_id, usage_period);
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON public.team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON public.team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_invite_code ON public.team_members(invite_code);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- user_subscriptions: Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
    ON public.user_subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- user_usage: Users can only see their own usage
CREATE POLICY "Users can view own usage"
    ON public.user_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
    ON public.user_usage FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
    ON public.user_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
    ON public.user_usage FOR ALL
    USING (auth.role() = 'service_role');

-- team_members: Owners can manage, members can view
CREATE POLICY "Owners can view team members"
    ON public.team_members FOR SELECT
    USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

CREATE POLICY "Owners can insert team members"
    ON public.team_members FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update team members"
    ON public.team_members FOR UPDATE
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete team members"
    ON public.team_members FOR DELETE
    USING (auth.uid() = owner_user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get current usage period (YYYY-MM format)
CREATE OR REPLACE FUNCTION get_current_usage_period()
RETURNS TEXT AS $$
BEGIN
    RETURN TO_CHAR(NOW(), 'YYYY-MM');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get or create user usage record for current period
CREATE OR REPLACE FUNCTION get_or_create_usage(p_user_id UUID)
RETURNS public.user_usage AS $$
DECLARE
    v_period TEXT;
    v_usage public.user_usage;
BEGIN
    v_period := get_current_usage_period();
    
    -- Try to get existing record
    SELECT * INTO v_usage 
    FROM public.user_usage 
    WHERE user_id = p_user_id AND usage_period = v_period;
    
    -- Create if not exists
    IF NOT FOUND THEN
        INSERT INTO public.user_usage (user_id, usage_period)
        VALUES (p_user_id, v_period)
        RETURNING * INTO v_usage;
    END IF;
    
    RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment byte access count
CREATE OR REPLACE FUNCTION increment_byte_access(p_user_id UUID, p_byte_id UUID)
RETURNS public.user_usage AS $$
DECLARE
    v_period TEXT;
    v_usage public.user_usage;
BEGIN
    v_period := get_current_usage_period();
    
    -- Upsert usage record and increment
    INSERT INTO public.user_usage (user_id, usage_period, bytes_accessed, accessed_byte_ids)
    VALUES (p_user_id, v_period, 1, ARRAY[p_byte_id])
    ON CONFLICT (user_id, usage_period)
    DO UPDATE SET 
        bytes_accessed = user_usage.bytes_accessed + 1,
        accessed_byte_ids = CASE 
            WHEN p_byte_id = ANY(user_usage.accessed_byte_ids) THEN user_usage.accessed_byte_ids
            ELSE array_append(user_usage.accessed_byte_ids, p_byte_id)
        END,
        updated_at = NOW()
    RETURNING * INTO v_usage;
    
    RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment AI query count
CREATE OR REPLACE FUNCTION increment_ai_query(p_user_id UUID)
RETURNS public.user_usage AS $$
DECLARE
    v_period TEXT;
    v_usage public.user_usage;
BEGIN
    v_period := get_current_usage_period();
    
    -- Upsert usage record and increment
    INSERT INTO public.user_usage (user_id, usage_period, ai_queries_used)
    VALUES (p_user_id, v_period, 1)
    ON CONFLICT (user_id, usage_period)
    DO UPDATE SET 
        ai_queries_used = user_usage.ai_queries_used + 1,
        updated_at = NOW()
    RETURNING * INTO v_usage;
    
    RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create subscription for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- ============================================
-- PLAN LIMITS REFERENCE (for application code)
-- ============================================
COMMENT ON TABLE public.user_subscriptions IS 'Plan limits:
- free: 3 bytes (lifetime), 5 AI queries/month
- byte_pass: 5 bytes/month, 50 AI queries/month
- unlimited: unlimited bytes, unlimited AI queries
- professional: unlimited + team (3-5 members)
- enterprise: unlimited + unlimited team';
