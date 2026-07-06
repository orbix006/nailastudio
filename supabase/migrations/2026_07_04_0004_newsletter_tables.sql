-- SECTION 23 — NEWSLETTER SCHEMAS (Tracked migrations for professional CMS)

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
    sent_at TIMESTAMPTZ,
    recipients_count INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    opens INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Read policies (anonymous public read)
CREATE POLICY "Allow public subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Write policies (admin write only)
CREATE POLICY "Allow admin write subscribers" ON newsletter_subscribers FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "Allow admin write campaigns" ON newsletter_campaigns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
