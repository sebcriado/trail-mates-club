-- Create subscriptions table for Lemonsqueezy integration
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Lemonsqueezy identifiers
    lemonsqueezy_customer_id TEXT,
    lemonsqueezy_subscription_id TEXT UNIQUE,
    lemonsqueezy_order_id TEXT,
    lemonsqueezy_product_id TEXT,
    lemonsqueezy_variant_id TEXT,

    -- Subscription status
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused', 'inactive')),

    -- Billing info
    plan_name TEXT DEFAULT 'premium',
    billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Cancellation info
    cancelled_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_lemonsqueezy_subscription_id ON subscriptions(lemonsqueezy_subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update (via Edge Functions)
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION is_premium(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = check_user_id
        AND status = 'active'
        AND (ends_at IS NULL OR ends_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();
