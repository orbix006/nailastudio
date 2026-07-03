-- ============================================================
-- SEO Metadata Table
-- Stores per-page SEO fields editable from the admin CMS.
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_metadata (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique slug identifying the page (e.g. 'home', 'portfolio', 'services', 'contact')
  page_slug       text NOT NULL UNIQUE,

  -- Core meta tags
  title           text,
  description     text,

  -- Open Graph
  og_title        text,
  og_description  text,
  og_image_url    text,           -- direct URL (optional - prefer og_image_id below)
  og_image_id     uuid REFERENCES media_library(id) ON DELETE SET NULL,

  -- Twitter Card
  twitter_title       text,
  twitter_description text,
  twitter_image_url   text,

  -- Canonical URL override (optional; auto-built from NEXT_PUBLIC_SITE_URL if null)
  canonical_url   text,

  -- Indexing control
  noindex         boolean NOT NULL DEFAULT false,

  -- Arbitrary JSON-LD structured data blob (stored as jsonb)
  structured_data jsonb,

  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_seo_metadata_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seo_metadata_updated_at ON seo_metadata;
CREATE TRIGGER seo_metadata_updated_at
  BEFORE UPDATE ON seo_metadata
  FOR EACH ROW EXECUTE FUNCTION update_seo_metadata_updated_at();

-- ============================================================
-- Default seed rows (safe to run multiple times via ON CONFLICT)
-- ============================================================

INSERT INTO seo_metadata (page_slug, title, description)
VALUES
  ('home',      'The Nailaa Studio — Luxury Nail Artistry',          'Bespoke nail styling and care by The Nailaa Studio. Book your consultation today.')
, ('portfolio', 'Portfolio — The Nailaa Studio',                     'Explore our portfolio of bespoke manicures, artistic extensions, and luxury nail treatments.')
, ('services',  'Services — The Nailaa Studio',                      'Discover our range of luxury nail services including manicures, extensions, and wellness therapies.')
, ('contact',   'Contact — The Nailaa Studio',                       'Get in touch with The Nailaa Studio to book your appointment or discuss your project.')
ON CONFLICT (page_slug) DO NOTHING;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read
CREATE POLICY "public_read_seo_metadata"
  ON seo_metadata FOR SELECT
  USING (true);

-- Authenticated admins: full write access
CREATE POLICY "admin_write_seo_metadata"
  ON seo_metadata FOR ALL
  USING (auth.role() = 'authenticated');
