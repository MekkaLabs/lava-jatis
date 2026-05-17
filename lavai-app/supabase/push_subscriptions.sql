-- Push subscriptions for PWA web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lava_jato_id UUID REFERENCES lava_jatos(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL, -- Full PushSubscription JSON object
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- Index for fast lookup by lava_jato_id
CREATE INDEX IF NOT EXISTS push_subscriptions_lava_jato_id_idx ON push_subscriptions(lava_jato_id);
