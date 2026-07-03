# The Nailaa Studio - Deployment & Maintenance Documentation

This document provides a comprehensive overview of the architecture, database schema, deployment process, admin panel usage, and backup checklists for The Nailaa Studio web application.

---

## 1. Project Structure

The project is built on Next.js 15 (App Router) and structured logically to isolate public pages, admin dashboards, shared UI modules, and database query utilities.

```text
├── app/
│   ├── (admin)/                    # Admin Dashboard Portal Group
│   │   └── admin/                  # /admin layout & core pages
│   │       ├── (dashboard)/        # Main sidebar dashboard panel layouts
│   │       │   ├── analytics/      # Analytics & dashboard logs viewer
│   │       │   ├── leads/          # Leads CRM & triage board
│   │       │   ├── media/          # Global media library manager
│   │       │   ├── portfolio/      # Portfolio projects & categories CRUD
│   │       │   └── services/       # Services & treatment specifications CRUD
│   │       └── login/              # Admin auth screen
│   ├── (public)/                   # Public Client Website
│   │   ├── portfolio/              # Project detail page viewports
│   │   └── services/               # Services detail page viewports
│   ├── globals.css                 # Vanilla CSS design tokens & animations
│   ├── layout.tsx                  # Base HTML layout wrapping providers
│   ├── robots.ts                   # Search indexing guidelines
│   ├── sitemap.ts                  # Weekly search index generators
│   └── template.tsx                # Page transition animations config
├── components/
│   ├── admin/                      # Admin-only dashboard tab panels & CRM lists
│   ├── public/                     # Public components (Hero, About, Process, Philosophy)
│   └── ui/                         # Accessible shared components (Modal, Drawer, Card, Button)
├── hooks/                          # Shared react hooks (useReducedMotion, etc.)
├── lib/
│   └── supabase/                   # Supabase clients & Server Actions
│       ├── actions.ts              # Authenticated user actions
│       ├── client.ts               # Browser client initiator
│       ├── queries.ts              # Server-side data fetching routines
│       └── server.ts               # Server client initiator
└── providers/                      # Global theme and context providers
```

---

## 2. Environment Variables

Lock the following values in your hosting dashboard or local `.env.local` file:

```bash
# ------------------------------------------------------------------------------
# SUPABASE PARAMETERS (Found under Project Settings -> API)
# ------------------------------------------------------------------------------
# Public Anon Key for clients
NEXT_PUBLIC_SUPABASE_URL=https://znednuexxtwcoesygzlo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__62E71hfpY3fXzPJOYD3EQ_4JeklGwM

# Server Service Role Key (Keep Private - Required for migrations / seed routines)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# ------------------------------------------------------------------------------
# PRODUCTION ENVIRONMENT METRICS
# ------------------------------------------------------------------------------
# Public canonical address used in robots.ts and sitemap.xml generators
NEXT_PUBLIC_SITE_URL=https://thenailaastudio.com
```

---

## 3. Database Setup

The database is built on PostgreSQL in Supabase. The migration files are stored inside `supabase/migrations/`.

### Schema Map

The schema is configured with the following main tables:
- **`admin_profiles`**: Tracks admin details, access rules, and logins.
- **`admin_login_logs`**: Tracks authentication events (IP addresses, user agents) for audit checks.
- **`media_library`**: Assets catalog. Integrates client-side SHA256 checksum deduplication to reuse images.
- **`services`**: Contains specifications for nail treatments and wellness approaches.
- **`service_features`** & **`service_images`**: Stores treatment bullet points and image galleries.
- **`portfolio_projects`** & **`portfolio_categories`**: Houses client work collections and category filters.
- **`inquiries`**: Stores consultations details (budgets, choices, and contact info).
- **`analytics_events`**: Tracks page visits, inquiries, and consultation popup actions.

### Running SQL Migrations

1. Ensure the Supabase CLI is authenticated.
2. Link the project:
   ```bash
   npx supabase link --project-ref znednuexxtwcoesygzlo
   ```
3. Run migrations against the remote production database:
   ```bash
   npx supabase db push
   ```

---

## 4. Deployment Process (Vercel)

Next.js is fully optimized for Vercel. To deploy:

1. Create a new project in the **Vercel Dashboard** linking to the project repository.
2. In **Environment Variables**, copy the parameters listed in Section 2.
3. Configure the Build Command:
   * **Framework Preset**: `Next.js`
   * **Build Command**: `npm run build`
   * **Install Command**: `npm install`
4. Click **Deploy**. Vercel will automatically build static assets, cache pages, and host Server Actions on edge runtimes.

---

## 5. Backup Procedure

To prevent data loss, execute this recovery checklist periodically:

### Database Backups (Supabase Console)
- Navigate to **Project Settings -> Database -> Backups**.
- Schedule daily automated physical backups (available on Supabase pro/enterprise tiers).
- For manual logical dumps, run the PG export utility via CLI:
  ```bash
  npx supabase db dump --project-ref znednuexxtwcoesygzlo -f backup_dump.sql
  ```

### Asset Backups (Supabase Storage)
- Media is hosted under the `services`, `portfolio`, and `media` buckets.
- To sync local copies, run the storage pull command or export media references directly from the `media_library` tables.

---

## 6. Admin Usage Guide

The administrative panel is located at `/admin` (redirects to `/admin/login` if not authenticated).

### Authentication & Authorization
- Log in using your registered admin email address.
- Active login sessions are protected by server-side middleware checking active sessions.

### Leads CRM & Triaging
- Navigate to **Leads** in the dashboard.
- Search leads by client name, email, or message. Filter inquiries by project type, status, or assignee.
- Click a lead to view full message details, update the triaging status (New, Contacted, In Progress, Closed), assign team members, or record comments.

### Content & Media Management
- **Services Catalog**: Create or update treatments. Click "Generate from Title" to generate URL-safe slugs. You can also reorder features or upload galleries.
- **Media Library**: Search, filter, and upload images. The library automatically flags duplicate files.
- **Website Content**: Update sitemaps, headers, and footer details.

---

## 7. Maintenance Checklist

Perform these routine checks to ensure long-term stability:

- [ ] **TypeScript Code Check**: Run `npm run build` before pushing to production to verify there are no compilation failures.
- [ ] **Audit Logs Inspection**: Regularly review the `admin_login_logs` table to flag suspicious authentication attempts.
- [ ] **Cache Version Rotation**: When launching major UI layouts, update the site cache version inside the `site_cache_version` table to force client clients to fetch fresh assets.
- [ ] **Dependency Auditing**: Audit package vulnerabilities monthly:
  ```bash
  npm audit
  ```
- [ ] **SSL & Domain Validation**: Confirm domain certificates are renewed automatically on Vercel's dashboards.
