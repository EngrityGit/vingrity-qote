# Vingrity Quote

A quote generation and management system for **Vingrity NDT & Technical Inc.** Paste a client's request and let
AI draft the whole quote — hours, shifts, travel, meals, LOA — pulled straight from your real rate sheet. Then
edit it by hand or just tell the AI what to change. Track quotes from Draft → Sent → Won/Lost, get automatic
3-day follow-up reminders, invite your team, and export a client-ready PDF or Word document in one click.

---

## What's included

- **Ask Anything / Generate a Quote (AI)** — paste an RFQ, email, or verbal request on the Dashboard, attach
  drawings or photos, and get a full quote draft back: line items pulled from your actual rate sheet, an hours
  and shift estimate, and travel/meals/LOA reasoning based on distance from your Edmonton or Langley hub.
  Choose **Claude (Anthropic)**, **ChatGPT (OpenAI)**, or **Gemini (Google)** as the model.
- **AI Assistant chat** — once a draft (or any quote) is open, keep talking to it: "reduce technician hours to
  12", "add 2 more consumable cans", "this is a 2-day job now" — the AI edits the line items directly.
- **Smart Quote Builder** — client dropdown (with inline "add new client"), auto-generated Reference ID
  (`MMDDYY` + your initials + a daily sequence, e.g. `070926PJ01`), a dynamic line-item table, call-out minimum
  logic (4 hrs + 1 hr reporting), editable Terms & Conditions, and a signature area (typed script-font name or a
  drawn signature).
- **Quick reference search** — jump straight to any quote from the top bar by typing its Reference ID.
- **Clients** — a simple CRM: company, address, contact, email, phone, PO number.
- **Jobs** — every quote marked "Sent" automatically creates a Job with a 3-day follow-up reminder and a
  Won / Lost / N/A / No Reply status you can update.
- **Rate Sheet (Settings)** — fully dynamic categories (Technician Labour, Travel, Meals, LOA, Consumables,
  Other, or anything else you name) — rename or add categories any time, and add/edit/remove rates within them.
  These rates pre-load into every new quote (manual or AI-generated) and can still be overridden per-project.
- **Team (Settings > Team)** — invite teammates by email, assign Admin/Member roles, and disable access —
  backed by a secure server-side Edge Function so the Supabase service role key never touches the browser.
- **Notifications & Toasts** — an in-app notification bell for follow-up reminders, and toast messages for
  every save/create/delete action.
- **Exports** — one-click **PDF** (via `@react-pdf/renderer`) and **Word** (via the `docx` package) exports
  that mirror your existing proposal template with the new blue-accented branding.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project (pick a region close to Edmonton,
   e.g. `us-west` or `ca-central` if available).
2. Once it's provisioned, open **Project Settings → API**. You'll need two values in a moment:
   - **Project URL**
   - **anon public** key

## 2. Run the database schema

1. In the Supabase dashboard, open **SQL Editor → New Query**.
2. Open `supabase/schema.sql` from this project, copy the entire contents, paste it into the SQL editor,
   and click **Run**.
3. This creates every table (`profiles`, `hub_locations`, `clients`, `rate_categories`, `rate_items`,
   `ai_settings`, `quotes`, `quote_attachments`, `jobs`, `notifications`, `quote_counters`), seeds your default
   rate sheet (Technician Labour: VT $116/MT-PT $128/UT $135, Travel: Service Vehicle $78 + Mileage $0.65/km,
   Meals $50/day, LOA $175/night, Consumables $38/can), seeds your two hub locations (Edmonton + Langley), and
   turns on Row Level Security with open policies (since this starter ships without a login screen — see
   "Troubleshooting" below and "Adding your team" further down for how to tighten this once you add real logins).

Safe to re-run any time — it uses `if not exists` / `on conflict do nothing` everywhere.

### Create the attachments storage bucket

In the Supabase dashboard, go to **Storage → New bucket**, name it exactly `quote-attachments`, and leave
**Public** off. (Or uncomment the SQL block at the bottom of `schema.sql` to create it via SQL instead.)

## 3. Configure the app to use your project

```bash
cp .env.example .env
```

Open `.env` and paste in your Project URL and anon key:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 4. Set up the AI integration (Edge Functions)

The AI features run through three Supabase Edge Functions in `supabase/functions/`, so your AI provider API
keys stay on the server and never ship in the browser bundle:

- `ai-quote-generate` — turns a pasted request + attachments into a full quote draft
- `ai-quote-chat` — applies follow-up chat instructions to a quote
- `invite-user` — securely invites teammates (uses the service role key)

**Install the Supabase CLI** (if you don't have it): see
[supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli).

**Log in and link your project:**
```bash
supabase login
supabase link --project-ref your-project-ref
```

**Deploy the functions:**
```bash
supabase functions deploy ai-quote-generate --no-verify-jwt
supabase functions deploy ai-quote-chat --no-verify-jwt
supabase functions deploy invite-user
```

`--no-verify-jwt` matters here: Supabase's platform-level JWT check only accepts an actual signed JWT in the
`Authorization` header. If your project uses the newer API key format (`sb_publishable_...` instead of a
legacy `eyJ...` anon key), that key isn't a JWT, so the platform rejects the request — including the
browser's CORS preflight — before your function code ever runs, which surfaces as a confusing CORS error
rather than an auth error. `ai-quote-generate` and `ai-quote-chat` don't need to know who's calling, so it's
safe to turn verification off for them. `invite-user` is kept **with** verification on, since it checks that
the caller is a logged-in admin before inviting anyone.

**Set the API key secret(s) for whichever AI provider(s) you want to use** — you only need to set the ones
you'll actually use; Settings > AI (or the provider dropdown on the generator) lets you pick per-request:

```bash
# Claude (Anthropic) — https://console.anthropic.com
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# ChatGPT (OpenAI) — https://platform.openai.com
supabase secrets set OPENAI_API_KEY=sk-...

# Gemini (Google) — https://aistudio.google.com/app/apikey
supabase secrets set GOOGLE_API_KEY=AI...
```

`invite-user` needs no extra secrets — Supabase automatically provides `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to every Edge Function in your project.

**Model names drift over time.** The functions default to a recent model per provider
(`ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GOOGLE_MODEL` — see `supabase/functions/_shared/ai.ts`). If a request
fails with a "model not found" style error, check that provider's current model list and override it:
```bash
supabase secrets set ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

## 5. Install and run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build   # production bundle, output in dist/
```

---

## Adding your team (multi-user access)

Go to **Team** in the sidebar and click **Invite Teammate** — enter their name, initials (used in their
Reference IDs), email, and role, then **Send Invite**. This calls the `invite-user` Edge Function, which:

1. Sends them a Supabase Auth invite email
2. Creates their `profiles` row with `status: invited`

This starter ships with Supabase **Auth disabled in the UI itself** for the fastest possible first run — there's
a single mock "current user" (`src/store/useAppStore.ts`) so you can try every feature immediately. To fully
switch over to real logins for your team:

1. In Supabase, go to **Authentication → Providers** and enable **Email**.
2. Add a simple login screen (email/password or magic link, via
   `supabase.auth.signInWithPassword` / `supabase.auth.signInWithOtp`) that gates the app when there's no
   session.
3. Replace `MOCK_USER` in `src/store/useAppStore.ts` with the real signed-in profile — look the row up in
   `profiles` by `auth_user_id` after `supabase.auth.getUser()`.

Everyone with an authenticated Supabase session can read/write all quotes, clients, jobs, and rate sheet
entries by default — intentional, so the whole team works off the same pipeline. Only **admins** can invite
new teammates (enforced inside the `invite-user` function itself).

---

## How "Ask Anything / Generate a Quote" works

1. On the **Dashboard**, paste the client's request into the text box (or just attach a drawing/photo — text
   is optional if you attach something).
2. Optionally attach images (drawings, nameplates, reference photos). PDFs can be attached too but aren't read
   automatically yet — summarize key details in the text box for best results with those.
3. Pick a provider (Claude, ChatGPT, or Gemini) and click **Generate Quote**.
4. The AI reads your live rate sheet and hub locations, and returns: a project name/location guess, a client
   name guess (matched against your existing clients where possible), a full set of line items using your real
   rates, an hours/shifts estimate, and travel/meals/LOA reasoning if the job is away from a hub.
5. You land on the new Quote Builder with everything pre-filled, plus an **AI Estimate Summary** card showing
   the assumptions the AI made — review these before sending.
6. Keep refining with the **AI Assistant** panel (top-right toggle): type instructions like "reduce technician
   hours to 12" and the line items update live. Or just edit any field by hand — nothing is locked.

## How the Reference ID generator works

Format: **MMDDYY + Initials + Daily Sequence**, e.g. `070926PJ01`. Every new quote calls the
`next_quote_sequence(date_key)` Postgres function, which atomically increments a per-day counter — two people
creating quotes at once never collide. It's generated the moment you open a new quote, but only permanently
saved once you click **Create Quote**.

## How the dynamic rate sheet works

**Settings → Rate Sheet** is your source of truth. Categories (Technician Labour, Travel, Meals, LOA,
Consumables, Other, or anything you name) can be renamed inline or added fresh with **New Category** — nothing
is hardcoded. Add, edit, or remove individual rates within each category any time; nothing on existing quotes
changes retroactively. On a quote, **Add from Rate Sheet** pulls a rate at its current default, grouped by
category — edit the quantity or rate on that one line to offer a discount without touching the global default.
Each line item can also have its category reassigned from a dropdown right in the quote builder.

Toggling **Call-out** on a line item enforces a 4-hour minimum plus 1 hour of reporting time — if the entered
quantity would bill for less than that, the line total is bumped up automatically.

---

## Project structure

```
vingrity-quote/
├── supabase/
│   ├── schema.sql                    # Run this once in the Supabase SQL editor
│   └── functions/
│       ├── _shared/                  # cors.ts, ai.ts (provider-agnostic AI calling helper)
│       ├── ai-quote-generate/        # request + attachments -> full quote draft
│       ├── ai-quote-chat/            # conversational edits to a quote
│       └── invite-user/              # secure team invites (service role key)
├── src/
│   ├── components/
│   │   ├── Layout/                   # Sidebar, Topbar (incl. reference search), AppShell
│   │   ├── Dashboard/                # StatCard, StatusBadge
│   │   ├── Quotes/                   # ClientSelect, LineItemsTable, SignaturePad,
│   │   │                             # AIQuoteGenerator, AIChatPanel
│   │   ├── Clients/                  # ClientFormModal
│   │   ├── Notifications/            # NotificationBell
│   │   ├── Toast/                    # Toaster
│   │   ├── PDF/                      # QuotePDF (react-pdf template)
│   │   └── Export/                   # exportPdf.tsx, exportWord.ts
│   ├── hooks/                        # React Query hooks per table (incl. AI settings, hubs, team)
│   ├── lib/                          # supabase client, utils, aiClient.ts (Edge Function calls)
│   ├── pages/                        # Dashboard, Quotes, QuoteBuilder, Clients, Jobs, Settings, Team
│   ├── store/                        # Zustand: toasts, app/user state, AI draft handoff
│   └── types/                        # Shared TypeScript types (incl. ai.ts)
└── .env.example
```

---

## Tech stack

- React 18 + Vite + TypeScript
- Tailwind CSS (brand blue `#0071fe`, `rounded-md` inputs/buttons, Inter font)
- Supabase (Postgres + Auth-ready + Row Level Security + Edge Functions + Storage)
- TanStack React Query for data fetching/caching
- Zustand for lightweight UI state (toasts, sidebar, current user, AI draft handoff)
- `@react-pdf/renderer` for PDF export · `docx` + `file-saver` for Word export
- `lucide-react` for icons
- Anthropic / OpenAI / Google Gemini APIs, called server-side from Deno Edge Functions

---

## Troubleshooting

**"new row violates row-level security policy for table ..."**
You ran an older copy of `schema.sql` with `auth.role() = 'authenticated'` policies, but this starter has no
login screen yet, so requests hit Supabase as the anon key. Re-run the current `supabase/schema.sql` (its
policies use `using (true)` instead), or run this once in the SQL Editor to patch an existing project:
```sql
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles','hub_locations','clients','rate_categories','rate_items',
      'ai_settings','quotes','quote_attachments','jobs','notifications','quote_counters'
    ])
  loop
    execute format('drop policy if exists "Authenticated read/write %s" on %I', t, t);
    execute format('create policy "Open read/write %s" on %I for all using (true) with check (true)', t, t);
  end loop;
end $$;
```

**Picking a provider in the AI dropdown doesn't seem to do anything / it keeps using Claude**
Make sure you're on the latest copy of the app — earlier versions had a bug where the dropdown selection was
silently overridden by the Settings > AI default. That's fixed now: the dropdown you pick from wins, and
Settings > AI only sets the *initial* default.

**GET .../ai_settings?...&id=eq.1 → 406 (Not Acceptable)**
This means the query for the single `ai_settings` config row came back with zero rows — either the seeded row
is missing, or (more likely) RLS is still blocking anon reads on that one table. Run:
```sql
insert into ai_settings (id, default_provider) values (1, 'anthropic') on conflict (id) do nothing;

drop policy if exists "Authenticated read/write ai_settings" on ai_settings;
drop policy if exists "Open read/write ai_settings" on ai_settings;
create policy "Open read/write ai_settings" on ai_settings for all using (true) with check (true);
```
The app also no longer hard-fails on this — it falls back to Claude as the default if the row is ever missing.

**"...has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It
does not have HTTP ok status"**
This looks like a CORS error but is almost always the platform-level JWT check rejecting the request before
your function code (and its CORS headers) ever runs — most commonly because your project uses the newer
`sb_publishable_...` API key format instead of a legacy JWT-style anon key. Redeploy the two AI functions
with verification off:
```bash
supabase functions deploy ai-quote-generate --no-verify-jwt
supabase functions deploy ai-quote-chat --no-verify-jwt
```
If it still fails, confirm the function actually deployed (`supabase functions list`) and check the real
error in `supabase functions logs ai-quote-generate`.

**"AI request failed" / provider errors**
The API key goes in a Supabase secret, never in `.env` — `.env` is bundled into the browser and can only hold
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Set the real key with:
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy ai-quote-generate --no-verify-jwt
supabase functions deploy ai-quote-chat --no-verify-jwt
```
Then in Settings > AI, set **Default AI Provider** to match the key you actually configured (or pick it
directly from the dropdown on the generator each time).

---

## Notes & next steps

- **Auth**: ships without a login screen for a fast first run (see "Adding your team" above for wiring up real
  accounts).
- **PDF/drawing reading**: image attachments are analyzed directly by the AI (vision). PDF attachments are
  stored with the quote for reference but not OCR'd automatically — for best AI accuracy on drawings, prefer
  image files (PNG/JPG) or paste key measurements into the text box.
- **Signature images**: drawn signatures are stored as PNG data URLs directly in the `quotes` row. For high
  volumes, move these to Supabase Storage instead.
- **Model names**: AI model identifiers change over time — see the "Set up the AI integration" section above
  for how to override them via secrets if a request starts failing.
- **Chunk size warning**: the production build prints a "chunk larger than 500kB" notice — expected given
  `@react-pdf/renderer` and `docx` are both sizeable libraries; doesn't affect functionality.
