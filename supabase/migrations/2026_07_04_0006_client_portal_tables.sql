-- SECTION 25 — CLIENT PORTAL SCHEMAS (Tracked migrations for professional CMS)

CREATE TABLE IF NOT EXISTS portal_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
    amount TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    download_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
    phase_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'in_progress', 'pending')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'admin')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portal_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_meeting_notes ENABLE ROW LEVEL SECURITY;

-- Read/Write policies for authenticated clients on their own rows
CREATE POLICY "Allow client profile access" ON portal_clients FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow client projects access" ON portal_projects FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Allow client invoices access" ON portal_invoices FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Allow client documents access" ON portal_documents FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Allow client progress access" ON portal_progress FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Allow client messages access" ON portal_messages FOR ALL TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Allow client meetings access" ON portal_meeting_notes FOR SELECT TO authenticated USING (auth.uid() = client_id);
