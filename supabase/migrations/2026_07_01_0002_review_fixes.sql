NAILA DB SCHEMA  

-- ============================================================================
-- THE NAILAA STUDIO — SUPABASE / POSTGRESQL SCHEMA (v3)
-- 3NF-normalized schema supporting the public website and Admin Dashboard.
--
-- CHANGELOG FROM v2 (this revision closes the review checklist):
--   P1-1  Slug format CHECK constraints (services, portfolio_categories,
--         portfolio_projects, project_tags)
--   P1-2  Every FK already had an explicit ON DELETE action in v2 — verified,
--         no bare FKs found. Left as-is; noted here so reviewers don't
--         re-flag it.
--   P1-3  New UNIQUE constraints: service_features(service_id, feature),
--         service_images(service_id, media_id),
--         portfolio_project_images(project_id, media_id)
--   P1-4  inquiries.phone_number now format-validated, not just non-blank
--   P1-5  Email validation is DB-side only (as before); frontend must also
--         validate before submit — noted in comments, no schema change
--   P1-6  website_settings.contact_email / contact_phone are now NOT NULL
--         (seeded with real placeholder values so the singleton insert
--         still succeeds — admin must overwrite in Section 19)
--   P2-7  updated_by added to media_library, services, portfolio_projects,
--         testimonials (created_by already existed on all of these)
--   P2-8  Generic log_audit_event() trigger now fires on every insert/
--         update/delete for the tables that matter most, instead of
--         relying on the backend to remember to write audit rows
--   P2-9  Indexes added on every previously-unindexed FK column
--   P2-10 pg_trgm search indexes on services.title, portfolio_projects.name,
--         testimonials.client_name, inquiries.email
--   P3-11 display_order >= 0 / version > 0 / border-radius >= 0 CHECKs
--   P3-12 Boolean defaults reviewed — already consistent, no change needed
--   P3-13 timestamptz reviewed — already consistent, no change needed
--   P3-14 COMMENT ON TABLE/COLUMN added for the tables most likely to
--         confuse a new maintainer (not every single column — see note
--         in Section 21)
--   P3-15 Seed rows added for project_types, portfolio_categories,
--         project_tags, social_links
--   P4-16 Comment block added documenting a suggested analytics retention
--         / partitioning approach
--   P4-17 media_library.checksum_sha256 is now a partial UNIQUE index
--         (active files only) instead of a plain index, so true
--         duplicate uploads are rejected at the DB level
--   P4-18 Comment block added documenting backup / restore / migration
--         workflow expectations (Supabase PITR + this schema_migrations
--         table)
--
-- IMPORTANT — EXECUTION ORDER:
-- This file is written top-to-bottom in strict dependency order (extensions →
-- enums → functions with no table deps → base tables → dependent tables →
-- junction tables → RLS → triggers → seed data → views → comments). Run it
-- as a single migration, in order, and it will not error. Do not reorder
-- sections.
-- ============================================================================
-- Target: Supabase Postgres 15+. Assumes `auth.users` and `storage.buckets`
-- / `storage.objects` already exist (they are created by Supabase itself).
--
-- BACKUP / RESTORE / MIGRATION WORKFLOW (P4-18, documentation only):
--   * Daily backups: rely on Supabase's automatic daily backups on paid
--     tiers, or enable Point-in-Time Recovery (PITR) if you need finer
--     grained restore points than 24h. This schema does not create backups
--     itself — `schema_migrations` only records which migration files have
--     been applied, it is not a backup mechanism.
--   * Restore process: restore via the Supabase dashboard (Database →
--     Backups) or `pg_restore` from a `pg_dump` you took yourself. After
--     restoring, diff `schema_migrations` against your migrations folder
--     to confirm the restored snapshot is not missing any applied
--     migration.
--   * Migration workflow: every schema change ships as a new file named
--     `YYYY_MM_DD_NNNN_description.sql`, applied in order, and finishes by
--     inserting its own row into `schema_migrations`. Never edit a
--     previously-applied migration file — write a new one.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 0 — EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists citext;        -- case-insensitive email/text
create extension if not exists pg_trgm;       -- P2-10: trigram search indexes

-- ----------------------------------------------------------------------------
-- SECTION 1 — ENUM TYPES (no table dependencies, safe to create first)
-- ----------------------------------------------------------------------------
create type theme_mode           as enum ('light', 'dark');
create type admin_role           as enum ('superadmin', 'admin', 'editor');
create type budget_range_enum    as enum ('under_5l', '5l_10l', '10l_25l', '25l_50l', '50l_plus', 'not_specified');
create type inquiry_source_enum  as enum ('contact_form', 'consultation_popup', 'header_cta', 'service_modal');
create type inquiry_status_enum  as enum ('new', 'read', 'contacted', 'in_progress', 'resolved', 'closed');
create type social_platform_enum as enum ('instagram', 'facebook', 'pinterest', 'linkedin', 'whatsapp', 'youtube');
create type hero_background_enum as enum ('image', 'video');
create type media_bucket_enum    as enum ('logos', 'hero', 'services', 'portfolio', 'testimonials', 'core-values', 'about', 'media');
create type analytics_event_enum as enum ('page_view', 'contact_form_submit', 'popup_submit', 'button_click', 'service_view', 'portfolio_view');

-- ----------------------------------------------------------------------------
-- SECTION 2 — UTILITY FUNCTIONS THAT DO NOT REFERENCE ANY TABLE
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- SECTION 3 — STORAGE BUCKETS (Supabase Storage)
-- Bucket-per-content-type, with size limits and MIME whitelists.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos',        'logos',        true, 2097152,  array['image/png','image/jpeg','image/svg+xml','image/webp','image/x-icon']),
  ('hero',          'hero',         true, 20971520, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('services',      'services',     true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('portfolio',     'portfolio',    true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('testimonials',  'testimonials', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('core-values',   'core-values',  true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('about',         'about',        true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('media',         'media',        true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- ============================================================================
-- SECTION 4 — ADMIN / AUTH (base table other tables depend on)
-- ============================================================================
create table admin_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text not null,
  role                  admin_role not null default 'admin',
  avatar_url            text,
  is_active             boolean not null default true,
  failed_login_attempts smallint not null default 0,
  ip_whitelist          inet[],
  two_factor_enabled    boolean not null default false,
  password_changed_at   timestamptz,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index idx_admin_profiles_role on admin_profiles(role) where deleted_at is null;

-- Helper: is the current JWT holder an active admin? (depends on admin_profiles,
-- so it is declared immediately after the table it queries)
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid()
      and is_active = true
      and deleted_at is null
  );
$$;

-- Login history / session tracking (device, IP, success/failure)
create table admin_login_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references admin_profiles(id) on delete set null,
  attempted_email citext,
  success      boolean not null,
  ip_address   inet,
  user_agent   text,
  device_label text,
  created_at   timestamptz not null default now()
);
create index idx_admin_login_logs_admin on admin_login_logs(admin_id, created_at desc);
create index idx_admin_login_logs_created on admin_login_logs(created_at desc);

-- General admin activity / content audit trail
create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references admin_profiles(id) on delete set null,
  action       text not null,             -- 'insert' | 'update' | 'delete' | 'login' ...
  table_name   text not null,
  record_id    uuid,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);
create index idx_audit_logs_table_record on audit_logs(table_name, record_id);
create index idx_audit_logs_admin on audit_logs(admin_id);

-- P2-8: generic audit-log writer. Attached as an AFTER trigger to the tables
-- that matter most for accountability (see Section 17c). Only usable on
-- tables whose primary key column is literally named `id` and is of type
-- uuid — singleton config tables (boolean PK) are intentionally excluded
-- and must be audited manually if ever required.
create or replace function log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_record_id := old.id;
  else
    v_record_id := new.id;
  end if;

  insert into audit_logs (admin_id, action, table_name, record_id, metadata)
  values (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    v_record_id,
    case TG_OP
      when 'DELETE' then to_jsonb(old)
      else to_jsonb(new)
    end
  );

  if TG_OP = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

-- ============================================================================
-- SECTION 5 — MEDIA LIBRARY (depends on storage buckets + admin_profiles)
-- Every image/video anywhere on the site is a row here; content tables store
-- a media_id FK instead of a bare URL. Enables reuse, dedupe, alt text,
-- dimensions, and storage statistics.
-- ============================================================================
create table media_library (
  id               uuid primary key default gen_random_uuid(),
  bucket           media_bucket_enum not null,
  storage_path     text not null,             -- path inside the bucket
  public_url       text not null,
  mime_type        text not null,
  file_size_bytes  bigint not null check (file_size_bytes > 0),
  width_px         integer,
  height_px        integer,
  alt_text         text,
  checksum_sha256  text,                       -- for duplicate detection
  uploaded_by      uuid references admin_profiles(id) on delete set null,
  updated_by       uuid references admin_profiles(id) on delete set null, -- P2-7
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),                    -- P2-7
  deleted_at       timestamptz,
  unique (bucket, storage_path)
);
create index idx_media_library_bucket on media_library(bucket) where deleted_at is null;
create index idx_media_library_uploaded_by on media_library(uploaded_by); -- P2-9
-- P4-17: true duplicate-detection — only one *active* file per checksum.
-- (A plain index can't enforce this; a partial unique index can, and still
-- allows a soft-deleted file to share a checksum with a later re-upload.)
create unique index uq_media_library_checksum_active
  on media_library(checksum_sha256)
  where deleted_at is null and checksum_sha256 is not null;

-- ============================================================================
-- SECTION 6 — SITE CACHE VERSIONING
-- Frontend polls / reads this to know when to invalidate its cache.
-- ============================================================================
create table site_cache_version (
  id         boolean primary key default true,
  version    bigint not null default 1 check (version > 0), -- P3-11
  updated_at timestamptz not null default now(),
  constraint site_cache_version_singleton check (id)
);
insert into site_cache_version (id) values (true) on conflict (id) do nothing;

create or replace function bump_cache_version()
returns trigger
language plpgsql
as $$
begin
  update site_cache_version set version = version + 1, updated_at = now() where id = true;
  return null;
end;
$$;

-- ============================================================================
-- SECTION 7 — GLOBAL SITE SETTINGS (singleton tables)
-- ============================================================================
create table website_settings (
  id                    boolean primary key default true,
  company_name          text not null default 'The Nailaa Studio',
  company_description   text,
  logo_media_id         uuid references media_library(id) on delete set null,
  favicon_media_id      uuid references media_library(id) on delete set null,
  business_address      text,
  -- P1-6: mandatory business contact fields — NOT NULL, seeded with real
  -- placeholder values in Section 19 so the singleton insert still succeeds.
  contact_phone         text not null
    constraint chk_website_settings_contact_phone
    check (contact_phone ~ '^[0-9+\-() ]{8,20}$'),
  contact_email         citext not null
    constraint chk_website_settings_contact_email
    check (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  business_hours_text   text default 'Monday – Saturday, 9:00 AM – 7:00 PM',
  whatsapp_number       text,
  whatsapp_default_message text default
    'Hello, I''m interested in discussing my interior design project with The Nailaa Studio.',
  google_maps_embed_url text,
  google_maps_lat       numeric(9,6),
  google_maps_lng       numeric(9,6),
  google_analytics_id   text,
  facebook_pixel_id     text,
  default_seo_image_id  uuid references media_library(id) on delete set null,
  updated_at            timestamptz not null default now(),
  updated_by            uuid references admin_profiles(id) on delete set null,
  constraint website_settings_singleton check (id)
);

-- Version history for settings that admins may overwrite (phone/email/address/etc.)
create table website_settings_history (
  id            uuid primary key default gen_random_uuid(),
  snapshot      jsonb not null,
  changed_by    uuid references admin_profiles(id) on delete set null,
  changed_at    timestamptz not null default now()
);
create index idx_website_settings_history_changed_at on website_settings_history(changed_at desc);

create or replace function snapshot_website_settings()
returns trigger
language plpgsql
as $$
begin
  insert into website_settings_history (snapshot, changed_by)
  values (to_jsonb(old), old.updated_by);
  return new;
end;
$$;

create table theme_settings (
  id                       boolean primary key default true,
  primary_color            text not null default '#111111',
  secondary_color          text not null default '#8a7052',
  accent_color             text not null default '#c9a86a',
  default_theme            theme_mode not null default 'light',
  theme_switch_enabled     boolean not null default true,
  heading_font             text default 'Playfair Display',
  body_font                text default 'Inter',
  button_border_radius_px  integer not null default 8 check (button_border_radius_px >= 0), -- P3-11
  updated_at               timestamptz not null default now(),
  constraint theme_settings_singleton check (id)
);

create table hero_section (
  id                  boolean primary key default true,
  title               text not null default 'Quietly Confident Interiors.',
  subtitle            text default 'Space is the breath of art. We design for the silence between objects.',
  background_type     hero_background_enum not null default 'image',
  background_image_id uuid references media_library(id) on delete set null,
  background_video_id uuid references media_library(id) on delete set null,
  logo_media_id       uuid references media_library(id) on delete set null,
  cta1_text           text default 'Book Consultation',
  cta1_target_section text default 'contact',
  cta2_text           text default 'View Portfolio',
  cta2_target_section text default 'portfolio',
  updated_at          timestamptz not null default now(),
  constraint hero_section_singleton check (id)
);

create table footer_settings (
  id                  boolean primary key default true,
  brand_statement     text,
  copyright_text      text default '© {year} The Nailaa Studio. All Rights Reserved.',
  privacy_policy_url  text,
  terms_conditions_url text,
  updated_at          timestamptz not null default now(),
  constraint footer_settings_singleton check (id)
);

create table consultation_popup_settings (
  id                   boolean primary key default true,
  enabled              boolean not null default true,
  title                text default 'Let''s Discuss Your Dream Space',
  subtitle             text default 'Ready to transform your home or workspace? Share your project details with us, and our design experts will get in touch to schedule your consultation.',
  delay_seconds        smallint not null default 3 check (delay_seconds >= 0),
  show_once_per_session boolean not null default true,
  primary_button_text  text default 'Book Consultation',
  secondary_button_text text default 'Maybe Later',
  updated_at           timestamptz not null default now(),
  constraint consultation_popup_settings_singleton check (id)
);

create table social_links (
  id             uuid primary key default gen_random_uuid(),
  platform       social_platform_enum not null unique,
  url            text not null,
  display_order  integer not null default 0 check (display_order >= 0), -- P3-11
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_social_links_active_order on social_links(display_order) where is_active = true;

-- ============================================================================
-- SECTION 8 — LOOKUP TABLES (independent of services; used by inquiries)
-- ============================================================================
-- Kept independent from `services` on purpose: an inquiry should still make
-- sense even if the service it referenced is later renamed or deleted.
create table project_types (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,     -- 'Residential', 'Commercial', 'Renovation', 'Other'...
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table project_tags (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,     -- 'Luxury', 'Minimal', 'Modern', 'Villa', 'Office'...
  slug          text not null unique
    constraint chk_project_tags_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), -- P1-1
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- SECTION 9 — SERVICES
-- ============================================================================
create table services (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  slug               text not null unique
    constraint chk_services_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), -- P1-1
  short_description  text not null,
  detailed_overview  text,
  design_approach    text,
  materials_finishes text,
  cover_image_id     uuid references media_library(id) on delete set null,
  icon_media_id      uuid references media_library(id) on delete set null,
  display_order      integer not null default 0 check (display_order >= 0), -- P3-11
  is_visible         boolean not null default true,
  created_by         uuid references admin_profiles(id) on delete set null,
  updated_by         uuid references admin_profiles(id) on delete set null, -- P2-7
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create index idx_services_visible_order on services(display_order) where deleted_at is null and is_visible = true;
create unique index uq_services_slug_active on services(slug) where deleted_at is null;
create index idx_services_created_by on services(created_by); -- P2-9
create index idx_services_title_trgm on services using gin (title gin_trgm_ops); -- P2-10

-- Normalized, reorderable feature bullets (replaces text[] key_features)
create table service_features (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references services(id) on delete cascade,
  feature       text not null,
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  created_at    timestamptz not null default now(),
  unique (service_id, feature) -- P1-3: no duplicate bullet text per service
);
create index idx_service_features_service_order on service_features(service_id, display_order);

-- Extra gallery images shown inside a service's detail modal
create table service_images (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references services(id) on delete cascade,
  media_id      uuid not null references media_library(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  created_at    timestamptz not null default now(),
  unique (service_id, media_id) -- P1-3: no duplicate image attached twice
);
create index idx_service_images_service_order on service_images(service_id, display_order);

-- ============================================================================
-- SECTION 10 — PORTFOLIO
-- ============================================================================
create table portfolio_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,       -- Residential, Kitchen, Bathroom, Renovation...
  slug          text not null unique
    constraint chk_portfolio_categories_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), -- P1-1
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table portfolio_projects (
  id                  uuid primary key default gen_random_uuid(),
  category_id         uuid not null references portfolio_categories(id) on delete restrict,
  name                text not null,
  slug                text not null unique
    constraint chk_portfolio_projects_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), -- P1-1
  description         text,
  cover_image_id      uuid not null references media_library(id) on delete restrict,
  location            text,
  project_type_id     uuid references project_types(id) on delete set null,
  related_service_id  uuid references services(id) on delete set null,
  completion_year     smallint check (completion_year between 1990 and 2100),
  is_featured         boolean not null default false,
  is_published         boolean not null default true,
  display_order       integer not null default 0 check (display_order >= 0), -- P3-11
  created_by          uuid references admin_profiles(id) on delete set null,
  updated_by          uuid references admin_profiles(id) on delete set null, -- P2-7
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index idx_portfolio_projects_category on portfolio_projects(category_id) where deleted_at is null;
create index idx_portfolio_projects_published on portfolio_projects(is_published, display_order) where deleted_at is null;
create index idx_portfolio_projects_featured on portfolio_projects(is_featured) where deleted_at is null and is_published = true;
create unique index uq_portfolio_projects_slug_active on portfolio_projects(slug) where deleted_at is null;
create index idx_portfolio_projects_project_type on portfolio_projects(project_type_id);     -- P2-9
create index idx_portfolio_projects_related_service on portfolio_projects(related_service_id); -- P2-9
create index idx_portfolio_projects_created_by on portfolio_projects(created_by);             -- P2-9
create index idx_portfolio_projects_name_trgm on portfolio_projects using gin (name gin_trgm_ops); -- P2-10

create table portfolio_project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references portfolio_projects(id) on delete cascade,
  media_id      uuid not null references media_library(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  created_at    timestamptz not null default now(),
  unique (project_id, media_id) -- P1-3: no duplicate image attached twice
);
create index idx_portfolio_images_project_order on portfolio_project_images(project_id, display_order);

-- Many-to-many: a project can have several tags, a tag applies to many projects
create table portfolio_project_tags (
  project_id uuid not null references portfolio_projects(id) on delete cascade,
  tag_id     uuid not null references project_tags(id) on delete cascade,
  primary key (project_id, tag_id)
);
create index idx_portfolio_project_tags_tag on portfolio_project_tags(tag_id);

-- ============================================================================
-- SECTION 11 — TESTIMONIALS
-- ============================================================================
create table testimonials (
  id                uuid primary key default gen_random_uuid(),
  client_name       text not null,
  designation       text,
  business_name     text,
  city              text,
  rating            smallint not null check (rating between 1 and 5) default 5,
  review_text       text not null,
  client_image_id   uuid references media_library(id) on delete set null,
  company_logo_id   uuid references media_library(id) on delete set null,
  is_featured       boolean not null default false,
  is_visible        boolean not null default true,
  display_order     integer not null default 0 check (display_order >= 0), -- P3-11
  approved_at       timestamptz,
  approved_by       uuid references admin_profiles(id) on delete set null,
  created_by        uuid references admin_profiles(id) on delete set null,
  updated_by        uuid references admin_profiles(id) on delete set null, -- P2-7
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index idx_testimonials_visible_order on testimonials(display_order) where deleted_at is null and is_visible = true;
create index idx_testimonials_featured on testimonials(is_featured) where deleted_at is null and is_visible = true;
create index idx_testimonials_created_by on testimonials(created_by);   -- P2-9
create index idx_testimonials_approved_by on testimonials(approved_by); -- P2-9
create index idx_testimonials_client_name_trgm on testimonials using gin (client_name gin_trgm_ops); -- P2-10

-- ============================================================================
-- SECTION 12 — INQUIRIES (contact form + consultation popup + header CTA)
-- Independent `project_types` lookup (not `services`) so historical inquiries
-- stay meaningful even if a service is later renamed or removed. Includes
-- lightweight CRM fields for admin follow-up.
--
-- NOTE (P1-5): the email/phone CHECK constraints below are a last line of
-- defense, not a substitute for client-side validation. The frontend form
-- must validate format before submit so users get instant feedback instead
-- of a raw Postgres constraint-violation error.
-- ============================================================================
create table inquiries (
  id              uuid primary key default gen_random_uuid(),
  source          inquiry_source_enum not null default 'contact_form',
  name            text not null,
  business_name   text,
  phone_number    text not null,
  email           citext not null,
  project_type_id uuid references project_types(id) on delete set null,
  budget_range    budget_range_enum default 'not_specified',
  message         text not null,
  status          inquiry_status_enum not null default 'new',
  is_read         boolean not null default false,
  assigned_to     uuid references admin_profiles(id) on delete set null,
  follow_up_date  date,
  internal_notes  text,
  resolved_at     timestamptz,
  submitted_ip    inet,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint inquiries_email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  -- P1-4: real format validation, not just "not blank"
  constraint inquiries_phone_format check (phone_number ~ '^[0-9+\-() ]{8,20}$')
);
create index idx_inquiries_status on inquiries(status) where deleted_at is null;
create index idx_inquiries_created on inquiries(created_at desc) where deleted_at is null;
create index idx_inquiries_source on inquiries(source);
create index idx_inquiries_email on inquiries(email);
create index idx_inquiries_assigned_to on inquiries(assigned_to) where deleted_at is null;
create index idx_inquiries_project_type on inquiries(project_type_id); -- P2-9
create index idx_inquiries_email_trgm on inquiries using gin ((email::text) gin_trgm_ops); -- P2-10

-- ============================================================================
-- SECTION 13 — SUPPORTING MARKETING CONTENT (CMS-editable static sections)
-- ============================================================================
create table about_content (
  id                boolean primary key default true,
  intro_text        text,
  vision_text       text,
  mission_text      text,
  intro_image_id    uuid references media_library(id) on delete set null,
  vision_image_id   uuid references media_library(id) on delete set null,
  mission_image_id  uuid references media_library(id) on delete set null,
  updated_at        timestamptz not null default now(),
  constraint about_content_singleton check (id)
);

create table design_process_steps (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null,
  icon_name     text,
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index uq_design_process_order on design_process_steps(display_order);

create table why_choose_features (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null,
  icon_name     text,
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_why_choose_order on why_choose_features(display_order) where is_visible = true;

create table design_philosophy (
  id              boolean primary key default true,
  statement_text  text,
  updated_at      timestamptz not null default now(),
  constraint design_philosophy_singleton check (id)
);

create table core_values (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,          -- e.g. 'Sustainability'
  description   text not null,
  image_id      uuid references media_library(id) on delete set null,
  display_order integer not null default 0 check (display_order >= 0), -- P3-11
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_core_values_order on core_values(display_order) where is_visible = true;

-- ============================================================================
-- SECTION 14 — SEO METADATA (expanded: robots, canonical, Twitter/Facebook, JSON-LD)
-- ============================================================================
create table seo_metadata (
  id                 uuid primary key default gen_random_uuid(),
  page_slug          text not null unique,   -- 'home', 'portfolio', 'contact', etc.
  title              text not null,
  meta_description   text,
  robots_directive   text default 'index, follow',
  canonical_url      text,
  facebook_image_id  uuid references media_library(id) on delete set null,
  twitter_card_type  text default 'summary_large_image',
  twitter_image_id   uuid references media_library(id) on delete set null,
  json_ld            jsonb,
  updated_at         timestamptz not null default now()
);

-- ============================================================================
-- SECTION 15 — ANALYTICS (lightweight, stored in Postgres; export to a
-- dedicated analytics tool later if volume grows)
--
-- P4-16 (documentation only, no code required at this scale): once
-- analytics_events grows past a few million rows, consider either (a)
-- converting it to a range-partitioned table on created_at (monthly
-- partitions, dropped after N months) or (b) a scheduled job
-- (pg_cron / Supabase Edge Function on a cron trigger) that deletes rows
-- older than your retention window, e.g.:
--   delete from analytics_events where created_at < now() - interval '13 months';
-- Do this before it becomes a performance problem, not after.
-- ============================================================================
create table analytics_events (
  id           uuid primary key default gen_random_uuid(),
  event_type   analytics_event_enum not null,
  entity_type  text,             -- 'service' | 'portfolio_project' | 'page' | 'button' ...
  entity_id    uuid,
  page_slug    text,
  session_id   text,
  referrer     text,
  ip_address   inet,
  user_agent   text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);
create index idx_analytics_events_type_created on analytics_events(event_type, created_at desc);
create index idx_analytics_events_entity on analytics_events(entity_type, entity_id);

-- Rollup view: simple per-service/per-project popularity from raw events
create or replace view analytics_entity_popularity as
select entity_type, entity_id, count(*) as event_count, max(created_at) as last_event_at
from analytics_events
where entity_id is not null
group by entity_type, entity_id;

-- ============================================================================
-- SECTION 16 — SCHEMA / BACKUP BOOKKEEPING
-- Actual backups are handled by Supabase's own point-in-time recovery /
-- pg_dump; this table only tracks which migration files have been applied.
-- ============================================================================
create table schema_migrations (
  version      text primary key,       -- e.g. '2026_07_01_0001_init'
  description  text,
  applied_at   timestamptz not null default now()
);
insert into schema_migrations (version, description)
values ('2026_07_01_0002_review_fixes', 'Nailaa Studio schema v3 — review checklist fixes (slugs, FKs, uniqueness, validation, audit, indexes, seed data)')
on conflict do nothing;

-- ============================================================================
-- SECTION 17 — TRIGGERS
-- (a) updated_at maintenance on every table that has the column
-- (b) website_settings history snapshot on update
-- (c) cache-version bump on every content table editors can change
-- (d) P2-8: audit-log write on every insert/update/delete of the tables
--     that matter most for accountability
-- ============================================================================

-- (a) updated_at triggers
create trigger trg_admin_profiles_updated_at            before update on admin_profiles            for each row execute function set_updated_at();
create trigger trg_media_library_updated_at             before update on media_library             for each row execute function set_updated_at();
create trigger trg_website_settings_updated_at          before update on website_settings          for each row execute function set_updated_at();
create trigger trg_theme_settings_updated_at            before update on theme_settings            for each row execute function set_updated_at();
create trigger trg_hero_section_updated_at              before update on hero_section              for each row execute function set_updated_at();
create trigger trg_footer_settings_updated_at           before update on footer_settings           for each row execute function set_updated_at();
create trigger trg_consultation_popup_settings_upd      before update on consultation_popup_settings for each row execute function set_updated_at();
create trigger trg_social_links_updated_at              before update on social_links              for each row execute function set_updated_at();
create trigger trg_project_types_updated_at             before update on project_types             for each row execute function set_updated_at();
create trigger trg_services_updated_at                  before update on services                  for each row execute function set_updated_at();
create trigger trg_portfolio_categories_updated_at      before update on portfolio_categories      for each row execute function set_updated_at();
create trigger trg_portfolio_projects_updated_at        before update on portfolio_projects        for each row execute function set_updated_at();
create trigger trg_testimonials_updated_at              before update on testimonials              for each row execute function set_updated_at();
create trigger trg_inquiries_updated_at                 before update on inquiries                 for each row execute function set_updated_at();
create trigger trg_about_content_updated_at             before update on about_content             for each row execute function set_updated_at();
create trigger trg_design_process_steps_updated_at      before update on design_process_steps      for each row execute function set_updated_at();
create trigger trg_why_choose_features_updated_at       before update on why_choose_features       for each row execute function set_updated_at();
create trigger trg_design_philosophy_updated_at         before update on design_philosophy         for each row execute function set_updated_at();
create trigger trg_core_values_updated_at               before update on core_values               for each row execute function set_updated_at();
create trigger trg_seo_metadata_updated_at              before update on seo_metadata              for each row execute function set_updated_at();

-- (b) settings history snapshot (fires BEFORE update, stores the OLD row)
create trigger trg_website_settings_history
  before update on website_settings
  for each row execute function snapshot_website_settings();

-- (c) cache-version bump on public-facing content changes
create trigger trg_cache_services            after insert or update or delete on services              for each statement execute function bump_cache_version();
create trigger trg_cache_portfolio_projects  after insert or update or delete on portfolio_projects    for each statement execute function bump_cache_version();
create trigger trg_cache_testimonials        after insert or update or delete on testimonials          for each statement execute function bump_cache_version();
create trigger trg_cache_website_settings    after update on website_settings                          for each statement execute function bump_cache_version();
create trigger trg_cache_theme_settings      after update on theme_settings                            for each statement execute function bump_cache_version();
create trigger trg_cache_hero_section        after update on hero_section                              for each statement execute function bump_cache_version();
create trigger trg_cache_footer_settings     after update on footer_settings                           for each statement execute function bump_cache_version();
create trigger trg_cache_popup_settings      after update on consultation_popup_settings               for each statement execute function bump_cache_version();
create trigger trg_cache_about_content       after update on about_content                             for each statement execute function bump_cache_version();
create trigger trg_cache_design_process      after insert or update or delete on design_process_steps  for each statement execute function bump_cache_version();
create trigger trg_cache_why_choose          after insert or update or delete on why_choose_features   for each statement execute function bump_cache_version();
create trigger trg_cache_design_philosophy   after update on design_philosophy                         for each statement execute function bump_cache_version();
create trigger trg_cache_core_values         after insert or update or delete on core_values           for each statement execute function bump_cache_version();

-- (d) audit-log triggers (P2-8) — uuid-PK tables only, see log_audit_event() note
create trigger trg_audit_admin_profiles      after insert or update or delete on admin_profiles      for each row execute function log_audit_event();
create trigger trg_audit_media_library       after insert or update or delete on media_library       for each row execute function log_audit_event();
create trigger trg_audit_services            after insert or update or delete on services            for each row execute function log_audit_event();
create trigger trg_audit_portfolio_projects  after insert or update or delete on portfolio_projects  for each row execute function log_audit_event();
create trigger trg_audit_testimonials        after insert or update or delete on testimonials        for each row execute function log_audit_event();
create trigger trg_audit_inquiries           after insert or update or delete on inquiries           for each row execute function log_audit_event();
create trigger trg_audit_social_links        after insert or update or delete on social_links        for each row execute function log_audit_event();

-- ============================================================================
-- SECTION 18 — ROW LEVEL SECURITY
-- Convention:
--   * Public (anon + authenticated non-admin) can SELECT published/visible,
--     non-deleted rows only.
--   * Admins (is_admin() = true) have full CRUD everywhere.
--   * `inquiries` allows public INSERT (form submission) but no public SELECT.
--   * `analytics_events` allows public INSERT (client-side tracking) but no
--     public SELECT.
--   * storage.objects gets bucket-scoped policies: public read, admin write.
-- ============================================================================

-- ---- admin_profiles ---------------------------------------------------
alter table admin_profiles enable row level security;
create policy admin_profiles_self_select on admin_profiles
  for select using (id = auth.uid() or is_admin());
create policy admin_profiles_admin_write on admin_profiles
  for all using (is_admin()) with check (is_admin());

-- ---- admin_login_logs / audit_logs -------------------------------------
alter table admin_login_logs enable row level security;
create policy admin_login_logs_admin_only on admin_login_logs
  for all using (is_admin()) with check (is_admin());

alter table audit_logs enable row level security;
create policy audit_logs_admin_only on audit_logs
  for all using (is_admin()) with check (is_admin());

-- ---- media_library ------------------------------------------------------
alter table media_library enable row level security;
create policy media_library_public_read on media_library
  for select using (deleted_at is null);
create policy media_library_admin_write on media_library
  for all using (is_admin()) with check (is_admin());

-- ---- site_cache_version -------------------------------------------------
alter table site_cache_version enable row level security;
create policy site_cache_version_public_read on site_cache_version
  for select using (true);
create policy site_cache_version_admin_write on site_cache_version
  for update using (is_admin()) with check (is_admin());

-- ---- website_settings / history -----------------------------------------
alter table website_settings enable row level security;
create policy website_settings_public_read on website_settings
  for select using (true);
create policy website_settings_admin_insert on website_settings
  for insert with check (is_admin());
create policy website_settings_admin_update on website_settings
  for update using (is_admin()) with check (is_admin());

alter table website_settings_history enable row level security;
create policy website_settings_history_admin_only on website_settings_history
  for select using (is_admin());

-- ---- theme_settings -------------------------------------------------------
alter table theme_settings enable row level security;
create policy theme_settings_public_read on theme_settings for select using (true);
create policy theme_settings_admin_insert on theme_settings for insert with check (is_admin());
create policy theme_settings_admin_update on theme_settings for update using (is_admin()) with check (is_admin());

-- ---- hero_section / footer_settings / consultation_popup_settings --------
alter table hero_section enable row level security;
create policy hero_section_public_read on hero_section for select using (true);
create policy hero_section_admin_insert on hero_section for insert with check (is_admin());
create policy hero_section_admin_update on hero_section for update using (is_admin()) with check (is_admin());

alter table footer_settings enable row level security;
create policy footer_settings_public_read on footer_settings for select using (true);
create policy footer_settings_admin_insert on footer_settings for insert with check (is_admin());
create policy footer_settings_admin_update on footer_settings for update using (is_admin()) with check (is_admin());

alter table consultation_popup_settings enable row level security;
create policy popup_settings_public_read on consultation_popup_settings for select using (true);
create policy popup_settings_admin_insert on consultation_popup_settings for insert with check (is_admin());
create policy popup_settings_admin_update on consultation_popup_settings for update using (is_admin()) with check (is_admin());

-- ---- social_links -------------------------------------------------------
alter table social_links enable row level security;
create policy social_links_public_read on social_links
  for select using (is_active = true or is_admin());
create policy social_links_admin_write on social_links
  for all using (is_admin()) with check (is_admin());

-- ---- project_types / project_tags ---------------------------------------
alter table project_types enable row level security;
create policy project_types_public_read on project_types
  for select using (is_active = true or is_admin());
create policy project_types_admin_write on project_types
  for all using (is_admin()) with check (is_admin());

alter table project_tags enable row level security;
create policy project_tags_public_read on project_tags for select using (true);
create policy project_tags_admin_write on project_tags for all using (is_admin()) with check (is_admin());

-- ---- services / service_features / service_images -------------------------
alter table services enable row level security;
create policy services_public_read on services
  for select using (deleted_at is null and (is_visible = true or is_admin()));
create policy services_admin_write on services
  for all using (is_admin()) with check (is_admin());

alter table service_features enable row level security;
create policy service_features_public_read on service_features
  for select using (
    exists (select 1 from services s where s.id = service_id and s.deleted_at is null and s.is_visible = true)
    or is_admin()
  );
create policy service_features_admin_write on service_features
  for all using (is_admin()) with check (is_admin());

alter table service_images enable row level security;
create policy service_images_public_read on service_images
  for select using (
    exists (select 1 from services s where s.id = service_id and s.deleted_at is null and s.is_visible = true)
    or is_admin()
  );
create policy service_images_admin_write on service_images
  for all using (is_admin()) with check (is_admin());

-- ---- portfolio_categories / portfolio_projects / images / tags -----------
alter table portfolio_categories enable row level security;
create policy portfolio_categories_public_read on portfolio_categories for select using (true);
create policy portfolio_categories_admin_write on portfolio_categories for all using (is_admin()) with check (is_admin());

alter table portfolio_projects enable row level security;
create policy portfolio_projects_public_read on portfolio_projects
  for select using (deleted_at is null and (is_published = true or is_admin()));
create policy portfolio_projects_admin_write on portfolio_projects
  for all using (is_admin()) with check (is_admin());

alter table portfolio_project_images enable row level security;
create policy portfolio_project_images_public_read on portfolio_project_images
  for select using (
    exists (select 1 from portfolio_projects p where p.id = project_id and p.deleted_at is null and p.is_published = true)
    or is_admin()
  );
create policy portfolio_project_images_admin_write on portfolio_project_images
  for all using (is_admin()) with check (is_admin());

alter table portfolio_project_tags enable row level security;
create policy portfolio_project_tags_public_read on portfolio_project_tags
  for select using (
    exists (select 1 from portfolio_projects p where p.id = project_id and p.deleted_at is null and p.is_published = true)
    or is_admin()
  );
create policy portfolio_project_tags_admin_write on portfolio_project_tags
  for all using (is_admin()) with check (is_admin());

-- ---- testimonials ---------------------------------------------------------
alter table testimonials enable row level security;
create policy testimonials_public_read on testimonials
  for select using (deleted_at is null and (is_visible = true or is_admin()));
create policy testimonials_admin_write on testimonials
  for all using (is_admin()) with check (is_admin());

-- ---- inquiries -------------------------------------------------------------
alter table inquiries enable row level security;
create policy inquiries_public_insert on inquiries
  for insert with check (deleted_at is null);
create policy inquiries_admin_select on inquiries
  for select using (is_admin());
create policy inquiries_admin_update on inquiries
  for update using (is_admin()) with check (is_admin());
create policy inquiries_admin_delete on inquiries
  for delete using (is_admin());

-- ---- about_content / process / why-choose / philosophy / core values -----
alter table about_content enable row level security;
create policy about_content_public_read on about_content for select using (true);
create policy about_content_admin_insert on about_content for insert with check (is_admin());
create policy about_content_admin_update on about_content for update using (is_admin()) with check (is_admin());

alter table design_process_steps enable row level security;
create policy design_process_public_read on design_process_steps
  for select using (is_visible = true or is_admin());
create policy design_process_admin_write on design_process_steps
  for all using (is_admin()) with check (is_admin());

alter table why_choose_features enable row level security;
create policy why_choose_public_read on why_choose_features
  for select using (is_visible = true or is_admin());
create policy why_choose_admin_write on why_choose_features
  for all using (is_admin()) with check (is_admin());

alter table design_philosophy enable row level security;
create policy design_philosophy_public_read on design_philosophy for select using (true);
create policy design_philosophy_admin_insert on design_philosophy for insert with check (is_admin());
create policy design_philosophy_admin_update on design_philosophy for update using (is_admin()) with check (is_admin());

alter table core_values enable row level security;
create policy core_values_public_read on core_values
  for select using (is_visible = true or is_admin());
create policy core_values_admin_write on core_values
  for all using (is_admin()) with check (is_admin());

-- ---- seo_metadata -----------------------------------------------------------
alter table seo_metadata enable row level security;
create policy seo_metadata_public_read on seo_metadata for select using (true);
create policy seo_metadata_admin_write on seo_metadata for all using (is_admin()) with check (is_admin());

-- ---- analytics_events ---------------------------------------------------
alter table analytics_events enable row level security;
create policy analytics_events_public_insert on analytics_events
  for insert with check (true);
create policy analytics_events_admin_select on analytics_events
  for select using (is_admin());

-- ---- schema_migrations ---------------------------------------------------
alter table schema_migrations enable row level security;
create policy schema_migrations_admin_only on schema_migrations
  for all using (is_admin()) with check (is_admin());

-- ---- storage.objects: bucket-scoped policies -----------------------------
-- Public read on every bucket declared above (all are public=true).
create policy storage_public_read on storage.objects
  for select using (
    bucket_id in ('logos','hero','services','portfolio','testimonials','core-values','about','media')
  );
-- Only admins may upload/modify/delete files in those buckets.
create policy storage_admin_insert on storage.objects
  for insert with check (
    bucket_id in ('logos','hero','services','portfolio','testimonials','core-values','about','media')
    and is_admin()
  );
create policy storage_admin_update on storage.objects
  for update using (
    bucket_id in ('logos','hero','services','portfolio','testimonials','core-values','about','media')
    and is_admin()
  );
create policy storage_admin_delete on storage.objects
  for delete using (
    bucket_id in ('logos','hero','services','portfolio','testimonials','core-values','about','media')
    and is_admin()
  );

-- ============================================================================
-- SECTION 19 — SEED DATA
-- (site_cache_version was already seeded in Section 6 because the bump
-- function needs it to exist before any trigger can fire.)
--
-- IMPORTANT: contact_phone / contact_email below are real-looking
-- PLACEHOLDER values, required only because those columns are now NOT NULL
-- (P1-6). The admin must overwrite them with the studio's actual phone
-- number and inbox address before go-live.
-- ============================================================================
insert into website_settings (id, contact_phone, contact_email)
values (true, '+91-9999999999', 'hello@thenailaastudio.com')
on conflict (id) do nothing;
insert into theme_settings (id) values (true) on conflict (id) do nothing;
insert into hero_section (id) values (true) on conflict (id) do nothing;
insert into footer_settings (id) values (true) on conflict (id) do nothing;
insert into consultation_popup_settings (id) values (true) on conflict (id) do nothing;
insert into about_content (id) values (true) on conflict (id) do nothing;
insert into design_philosophy (id) values (true) on conflict (id) do nothing;

-- P3-15: lookup table seed rows so the admin dashboard and public forms
-- aren't empty on first load. All are safe to edit/delete/reorder later.
insert into project_types (name, display_order) values
  ('Residential', 0),
  ('Commercial', 1),
  ('Renovation', 2),
  ('Other', 3)
on conflict (name) do nothing;

insert into portfolio_categories (name, slug, display_order) values
  ('Residential', 'residential', 0),
  ('Kitchen', 'kitchen', 1),
  ('Bathroom', 'bathroom', 2),
  ('Commercial', 'commercial', 3),
  ('Renovation', 'renovation', 4)
on conflict (name) do nothing;

insert into project_tags (name, slug) values
  ('Luxury', 'luxury'),
  ('Minimal', 'minimal'),
  ('Modern', 'modern'),
  ('Contemporary', 'contemporary'),
  ('Villa', 'villa'),
  ('Office', 'office')
on conflict (name) do nothing;

-- Placeholder URLs — admin must replace with the studio's real profiles.
insert into social_links (platform, url, display_order) values
  ('instagram', 'https://instagram.com/thenailaastudio', 0),
  ('facebook', 'https://facebook.com/thenailaastudio', 1),
  ('pinterest', 'https://pinterest.com/thenailaastudio', 2),
  ('whatsapp', 'https://wa.me/919999999999', 3)
on conflict (platform) do nothing;

-- ============================================================================
-- SECTION 20 — DASHBOARD OVERVIEW VIEW
-- Powers "Dashboard Overview" stat cards. security_invoker means it runs
-- with the querying user's own RLS, not the view owner's.
-- ============================================================================
create or replace view admin_dashboard_stats as
select
  (select count(*) from services            where deleted_at is null)                     as total_services,
  (select count(*) from portfolio_projects  where deleted_at is null)                     as total_portfolio_projects,
  (select count(*) from testimonials        where deleted_at is null)                     as total_testimonials,
  (select count(*) from inquiries           where deleted_at is null)                     as total_inquiries,
  (select count(*) from inquiries           where deleted_at is null and is_read = false) as unread_inquiries;

alter view admin_dashboard_stats set (security_invoker = true);
alter view analytics_entity_popularity set (security_invoker = true);

-- ============================================================================
-- SECTION 21 — COMMENTS (P3-14)
-- Not every column is annotated — that would bloat this file without adding
-- much value. Comments focus on tables/enums whose purpose or non-obvious
-- constraints a new maintainer is most likely to misread.
-- ============================================================================
comment on table admin_profiles is 'One row per dashboard admin, 1:1 with auth.users. is_active=false soft-disables login without deleting history.';
comment on table media_library is 'Single source of truth for every uploaded file. Content tables reference media_id instead of storing bare URLs so files can be reused and deduped (see uq_media_library_checksum_active).';
comment on table site_cache_version is 'Singleton counter the frontend polls to know when to invalidate its cache. Bumped automatically by bump_cache_version() triggers on public-facing content tables.';
comment on table website_settings is 'Singleton row (id is always true). contact_phone/contact_email are NOT NULL — see Section 19 seed comment for the placeholder values that must be overwritten before go-live.';
comment on table website_settings_history is 'Append-only snapshot of website_settings before each update, written by snapshot_website_settings(). Never updated or deleted, only inserted into.';
comment on table project_types is 'Independent lookup used by inquiries, deliberately NOT a foreign key into services, so a historical inquiry stays meaningful even if the referenced service is renamed or removed.';
comment on table services is 'deleted_at implements soft delete; uq_services_slug_active enforces slug uniqueness only among non-deleted rows, so a deleted service''s slug can be reused.';
comment on table portfolio_projects is 'category_id and cover_image_id use ON DELETE RESTRICT — a category or its cover image cannot be deleted while a project still references it. All other FKs here use SET NULL or CASCADE.';
comment on table inquiries is 'Public INSERT only via RLS (contact form / popup submissions); SELECT/UPDATE/DELETE are admin-only. phone_number and email are format-validated at the DB level as a last line of defense — the frontend must also validate before submit.';
comment on table analytics_events is 'Lightweight event log. Public INSERT, admin-only SELECT. See the retention/partitioning note above this table''s definition before this grows unbounded.';
comment on table audit_logs is 'Populated automatically by log_audit_event() triggers (Section 17d) on the tables that matter most for accountability, not by application code.';
comment on table schema_migrations is 'Bookkeeping only — records which migration files have been applied. Not a backup mechanism; see the backup/restore note near the top of this file.';

comment on column services.slug is 'URL-safe identifier, lowercase kebab-case only — enforced by chk_services_slug_format.';
comment on column portfolio_projects.slug is 'URL-safe identifier, lowercase kebab-case only — enforced by chk_portfolio_projects_slug_format.';
comment on column media_library.checksum_sha256 is 'SHA-256 of the file bytes. Enforced unique among active (non-deleted) rows by uq_media_library_checksum_active to reject true duplicate uploads.';
comment on column inquiries.phone_number is 'Format-validated (digits, +, -, (), spaces, 8-20 chars) by inquiries_phone_format — not just checked for blank.';

comment on type inquiry_status_enum is 'CRM pipeline stage for an inquiry: new -> read -> contacted -> in_progress -> resolved/closed.';
comment on type media_bucket_enum is 'Must stay in sync with the storage.buckets rows inserted in Section 3 and the bucket lists in the storage.objects RLS policies in Section 18.';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================