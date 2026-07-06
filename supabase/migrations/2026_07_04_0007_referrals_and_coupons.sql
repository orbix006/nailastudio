-- SECTION 26 — MARKETING AND REFERRALS CMS AND DISCOUNTS (Tracked migrations for professional CMS)

CREATE TABLE IF NOT EXISTS marketing_referral_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reward_amount INT NOT NULL DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_name TEXT NOT NULL,
    referrer_email TEXT NOT NULL,
    referral_code TEXT NOT NULL,
    referee_name TEXT NOT NULL,
    referee_email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    reward_disbursed INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
    value INT NOT NULL,
    max_uses INT NOT NULL DEFAULT 100,
    current_uses INT NOT NULL DEFAULT 0,
    expires_at DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketing_referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_coupons ENABLE ROW LEVEL SECURITY;

-- Read policies for clients, full management policies for admins
CREATE POLICY "Allow public select of referral settings" ON marketing_referral_settings FOR SELECT TO public USING (TRUE);
CREATE POLICY "Allow select of owned referrals" ON marketing_referrals FOR SELECT TO authenticated USING (auth.uid() = id OR auth.jwt() ->> 'email' = referrer_email);
CREATE POLICY "Allow insert of referrals" ON marketing_referrals FOR INSERT TO public WITH CHECK (TRUE);
CREATE POLICY "Allow public select of active coupons" ON marketing_coupons FOR SELECT TO public USING (is_active = TRUE AND expires_at >= CURRENT_DATE);
