-- SECTION 22 — BLOG SCHEMAS (Tracked migrations for professional CMS)

CREATE TABLE IF NOT EXISTS blog_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9-]+$'),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9-]+$'),
    excerpt TEXT,
    content TEXT,
    author_id UUID REFERENCES blog_authors(id) ON DELETE SET NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cover_image_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Read policies (anonymous public read)
CREATE POLICY "Allow public read authors" ON blog_authors FOR SELECT USING (true);
CREATE POLICY "Allow public read categories" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read posts" ON blog_posts FOR SELECT USING (deleted_at IS NULL AND status = 'published' AND published_at <= NOW());

-- Write policies (admin write only)
CREATE POLICY "Allow admin write authors" ON blog_authors FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "Allow admin write categories" ON blog_categories FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "Allow admin write posts" ON blog_posts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);
