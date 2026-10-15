-- ============================================================================
-- VINGRITY QUOTE — Supabase Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES (app users — one row per person who can log in and use the tool)
-- ============================================================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  initials text not null,
  email text not null unique,
  phone text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- HUB LOCATIONS (used by the AI generator to calculate travel/LOA/meals)
-- ============================================================================
create table if not exists hub_locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CLIENTS
-- ============================================================================
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  address text,
  email text,
  contact_name text,
  phone text,
  po_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_company_name on clients (lower(company_name));

-- ============================================================================
-- RATE CATEGORIES (fully dynamic — rename, add, remove as your business needs
-- change: Technician Labour, Travel, Meals, LOA, Consumables, Other, etc.)
-- ============================================================================
create table if not exists rate_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order integer not null default 0,
  is_system boolean not null default false, -- system categories power AI/call-out logic; can be renamed, not deleted
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RATE ITEMS (global default rate sheet — editable per project on the quote)
-- ============================================================================
create table if not exists rate_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  qualification text,
  unit text not null default 'hour',
  rate numeric(10, 2) not null default 0,
  category_id uuid not null references rate_categories(id) on delete restrict,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_items_category on rate_items (category_id);

-- ============================================================================
-- AI SETTINGS (which provider is used by default; API keys are NEVER stored
-- here — they live only as Supabase Edge Function secrets, set via the CLI)
-- ============================================================================
create table if not exists ai_settings (
  id integer primary key default 1,
  default_provider text not null default 'anthropic' check (default_provider in ('anthropic', 'openai', 'google')),
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into ai_settings (id, default_provider) values (1, 'anthropic') on conflict (id) do nothing;

-- ============================================================================
-- QUOTES
-- ============================================================================
create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  reference_id text not null unique,
  client_id uuid not null references clients(id) on delete restrict,
  project_name text not null,
  project_location text,
  issued_by text not null,
  issued_by_email text,
  issued_by_phone text,
  status text not null default 'Draft' check (
    status in ('Draft', 'Sent', 'Approved', 'Won', 'Lost', 'N/A', 'No Reply')
  ),
  line_items jsonb not null default '[]'::jsonb,
  terms_and_conditions text not null default '',
  subtotal numeric(10, 2) not null default 0,
  gst_rate numeric(4, 3) not null default 0.05,
  gst_amount numeric(10, 2) not null default 0,
  grand_total numeric(10, 2) not null default 0,
  signature_type text check (signature_type in ('typed', 'drawn')),
  signature_data text,
  signature_name text,
  valid_days integer not null default 90,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  ai_summary jsonb, -- stores the AI's assumptions/reasoning (hours, shifts, travel, LOA, meals logic)
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  follow_up_at timestamptz
);

create index if not exists idx_quotes_client_id on quotes (client_id);
create index if not exists idx_quotes_status on quotes (status);
create index if not exists idx_quotes_follow_up_at on quotes (follow_up_at);
create index if not exists idx_quotes_reference_id on quotes (lower(reference_id));

-- ============================================================================
-- QUOTE ATTACHMENTS (drawings, RFQ emails, reference docs — files live in the
-- `quote-attachments` Storage bucket; this table just tracks metadata)
-- ============================================================================
create table if not exists quote_attachments (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid references quotes(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_attachments_quote_id on quote_attachments (quote_id);

-- ============================================================================
-- JOBS (tracks whether a quote converted into a won/lost job)
-- ============================================================================
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references quotes(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  job_name text not null,
  status text not null default 'Pending' check (status in ('Won', 'Lost', 'N/A', 'No Reply', 'Pending')),
  won_lost_reason text,
  follow_up_date date,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_quote_id on jobs (quote_id);
create index if not exists idx_jobs_status on jobs (status);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  quote_id uuid references quotes(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'follow_up' check (type in ('follow_up', 'status_change', 'system')),
  is_read boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications (user_id);
create index if not exists idx_notifications_due_at on notifications (due_at);

-- ============================================================================
-- QUOTE COUNTER (supports the daily sequence in the Reference ID generator)
-- ============================================================================
create table if not exists quote_counters (
  date_key text primary key, -- e.g. '070926'
  last_sequence integer not null default 0
);

create or replace function next_quote_sequence(p_date_key text)
returns integer
language plpgsql
as $$
declare
  v_seq integer;
begin
  insert into quote_counters (date_key, last_sequence)
  values (p_date_key, 1)
  on conflict (date_key)
  do update set last_sequence = quote_counters.last_sequence + 1
  returning last_sequence into v_seq;

  return v_seq;
end;
$$;

-- ============================================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at before update on clients
for each row execute function set_updated_at();

drop trigger if exists trg_quotes_updated_at on quotes;
create trigger trg_quotes_updated_at before update on quotes
for each row execute function set_updated_at();

drop trigger if exists trg_jobs_updated_at on jobs;
create trigger trg_jobs_updated_at before update on jobs
for each row execute function set_updated_at();

-- ============================================================================
-- AUTO-CREATE A JOB WHEN A QUOTE IS SENT (optional convenience trigger)
-- ============================================================================
create or replace function create_job_on_quote_sent()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Sent' and (old.status is distinct from 'Sent') then
    insert into jobs (quote_id, client_id, job_name, status, follow_up_date)
    values (new.id, new.client_id, new.project_name, 'Pending', (now() + interval '3 days')::date)
    on conflict do nothing;

    insert into notifications (quote_id, title, message, type, due_at)
    values (
      new.id,
      'Follow up on ' || new.reference_id,
      'Quote for ' || new.project_name || ' was sent. Follow up in 3 days if there is no reply.',
      'follow_up',
      now() + interval '3 days'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_quote_sent on quotes;
create trigger trg_quote_sent after update on quotes
for each row execute function create_job_on_quote_sent();

-- ============================================================================
-- SEED DATA — Default rate categories + rate sheet (from Vingrity's standard
-- rates). Categories can be renamed freely later from Settings > Rate Sheet.
-- ============================================================================
insert into rate_categories (name, sort_order, is_system) values
  ('Technician Labour', 1, true),
  ('Travel', 2, true),
  ('Meals', 3, true),
  ('LOA', 4, true),
  ('Consumables', 5, true),
  ('Other', 6, true)
on conflict (name) do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'NDE Technician – VT', 'Visual Testing', 'CGSB Level 2', 'hour', 116.00, id, true
from rate_categories where name = 'Technician Labour'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'NDE Technician – MT/PT', 'Magnetic Particle / Liquid Penetrant Testing', 'CGSB Level 2/CWB Level 2', 'hour', 128.00, id, true
from rate_categories where name = 'Technician Labour'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'NDE Technician – UT', 'Ultrasonic Testing', 'CGSB Level 2', 'hour', 135.00, id, true
from rate_categories where name = 'Technician Labour'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'Service Vehicle', 'Truck/Car/SUV — within local area', null, 'visit', 78.00, id, true
from rate_categories where name = 'Travel'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'Mileage', 'Per kilometre outside local service area', null, 'km', 0.65, id, true
from rate_categories where name = 'Travel'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'Meals', 'Per diem meal allowance', null, 'day', 50.00, id, true
from rate_categories where name = 'Meals'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'Living Out Allowance (LOA)', 'Overnight accommodation + incidentals when away from hub', null, 'night', 175.00, id, true
from rate_categories where name = 'LOA'
on conflict do nothing;

insert into rate_items (name, description, qualification, unit, rate, category_id, is_default)
select 'MT/PT Consumables', 'Cleaner/Penetrant/Developer or Contrast/Wet Powder', 'Per Can', 'can', 38.00, id, true
from rate_categories where name = 'Consumables'
on conflict do nothing;

-- Default hub locations used for travel-distance reasoning by the AI generator
insert into hub_locations (name, address, latitude, longitude, is_default) values
  ('Edmonton HUB', '201, 9403 63 Ave NW, Edmonton, AB, T6E 0G2, Canada', 53.4808, -113.4235, true),
  ('Langley HUB', 'Langley, BC, Canada', 49.1044, -122.6604, false)
on conflict do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY
-- This starter ships without a login screen (a mock "current user" stands in
-- client-side — see src/store/useAppStore.ts), so every request hits
-- Supabase as the anon key, not an authenticated session. These policies are
-- intentionally open (`using (true)`) so the app works out of the box.
--
-- Once you wire up real Supabase Auth (see README "Adding your team"),
-- swap `using (true) with check (true)` below for
-- `using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated')`
-- on each policy to require a real session.
-- ============================================================================
alter table profiles enable row level security;
alter table hub_locations enable row level security;
alter table clients enable row level security;
alter table rate_categories enable row level security;
alter table rate_items enable row level security;
alter table ai_settings enable row level security;
alter table quotes enable row level security;
alter table quote_attachments enable row level security;
alter table jobs enable row level security;
alter table notifications enable row level security;
alter table quote_counters enable row level security;

drop policy if exists "Authenticated read/write profiles" on profiles;
drop policy if exists "Open read/write profiles" on profiles;
create policy "Open read/write profiles" on profiles
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write hub_locations" on hub_locations;
drop policy if exists "Open read/write hub_locations" on hub_locations;
create policy "Open read/write hub_locations" on hub_locations
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write clients" on clients;
drop policy if exists "Open read/write clients" on clients;
create policy "Open read/write clients" on clients
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write rate_categories" on rate_categories;
drop policy if exists "Open read/write rate_categories" on rate_categories;
create policy "Open read/write rate_categories" on rate_categories
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write rate_items" on rate_items;
drop policy if exists "Open read/write rate_items" on rate_items;
create policy "Open read/write rate_items" on rate_items
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write ai_settings" on ai_settings;
drop policy if exists "Open read/write ai_settings" on ai_settings;
create policy "Open read/write ai_settings" on ai_settings
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write quotes" on quotes;
drop policy if exists "Open read/write quotes" on quotes;
create policy "Open read/write quotes" on quotes
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write quote_attachments" on quote_attachments;
drop policy if exists "Open read/write quote_attachments" on quote_attachments;
create policy "Open read/write quote_attachments" on quote_attachments
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write jobs" on jobs;
drop policy if exists "Open read/write jobs" on jobs;
create policy "Open read/write jobs" on jobs
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write notifications" on notifications;
drop policy if exists "Open read/write notifications" on notifications;
create policy "Open read/write notifications" on notifications
  for all using (true) with check (true);

drop policy if exists "Authenticated read/write quote_counters" on quote_counters;
drop policy if exists "Open read/write quote_counters" on quote_counters;
create policy "Open read/write quote_counters" on quote_counters
  for all using (true) with check (true);

-- ============================================================================
-- STORAGE BUCKET for quote attachments (drawings, RFQ files)
-- Storage buckets are usually created via the dashboard (Storage > New
-- bucket, name: "quote-attachments", Public: off). To create it via SQL
-- instead, uncomment the block below.
-- ============================================================================
-- insert into storage.buckets (id, name, public) values ('quote-attachments', 'quote-attachments', false)
-- on conflict do nothing;
--
-- create policy "Authenticated access to quote-attachments"
-- on storage.objects for all
-- using (bucket_id = 'quote-attachments' and auth.role() = 'authenticated')
-- with check (bucket_id = 'quote-attachments' and auth.role() = 'authenticated');

-- ============================================================================
-- NOTE ON MULTI-USER ACCESS
-- ============================================================================
-- To add teammates, use the in-app Settings > Team page (backed by the
-- `invite-user` Edge Function), which will:
--   1. Send them a Supabase Auth invite email
--   2. Create their `profiles` row with initials (used in Reference IDs) and role
-- See README "Adding your team" for the one-time setup this requires.
-- Everyone with an authenticated Supabase session can read/write all quotes,
-- clients, and jobs by default — this is intentional so the whole team can
-- collaborate on the same pipeline. Tighten the policies above if you need
-- per-user restrictions later.
