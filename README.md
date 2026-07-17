# The Party — D&D companion app

A shared character tracker, battle map, and bestiary for an in-person D&D
group. Static frontend on GitHub Pages, Supabase for shared data, and a
Claude-powered monster generator behind a locked-down proxy.

## Architecture

```
frontend/     React + Vite app, deployed to GitHub Pages
db/           Postgres schema + SRD data import tooling (Supabase)
supabase/     Edge Function (Claude proxy) + CLI config
.github/      GitHub Actions deploy workflow
```

Combat (initiative, rolls) stays on paper — this app is for character
reference, shared party/map state, and monster deployment, not rules
automation.

## One-time setup

### 1. Create the Supabase project
1. Create a free project at supabase.com.
2. In the SQL Editor, run `db/schema.sql` — this creates every table, the
   RLS policies, and the `generation_log` rate-limit table.
3. Grab your Project URL, `anon` public key, and `service_role` secret key
   from Project Settings → API. **Never put the service_role key in the
   frontend or in a GitHub Actions secret that reaches the browser.**

### 2. Load the SRD reference data
```bash
cd db/import
npm install @supabase/supabase-js
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node load_to_supabase.mjs
```
This loads all races, classes, subclasses, feats, backgrounds, items,
spells, and monsters from `db/seed/srd/`. Re-run any time the seed data
changes — it's safe, it only replaces rows tagged `source: 'srd'`.

### 2b. Create the Storage bucket for map images
In the Supabase dashboard: Storage → New bucket → name it `maps` → make it
**public** (battle map images aren't sensitive, and this keeps the app
simple — no signed URLs to manage).

### 3. Deploy the Claude proxy Edge Function
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set APP_SHARED_SECRET=pick-something-random-and-long
supabase functions deploy generate-monster
```
The frontend must send `APP_SHARED_SECRET` as the `x-app-secret` header on
every call to this function — that's what stops a scraped function URL
from being hit by strangers. It's rate-limited server-side to 20
generations/hour regardless.

### 4. Configure GitHub Pages
1. Push this repo to GitHub as a **public** repo (GitHub Pages on a free
   personal account requires public — see note below).
2. Repo Settings → Pages → Source: "GitHub Actions".
3. Repo Settings → Secrets and variables → Actions, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the anon key — safe to expose, see below)
   - `VITE_APP_SHARED_SECRET` (same value as the Edge Function secret — also
     safe to expose, since it only gates the function from random internet
     traffic, not from anyone with this app's link)
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds
   and deploys automatically.

Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## A note on "trusted family only" and security

Since this is only shared with people you send the link to, we've skipped
login systems, per-user permissions, and the DM PIN is a soft gate (not
real auth). Two things stay non-negotiable regardless of audience trust:

- **The Anthropic API key and Supabase service_role key never touch the
  frontend.** GitHub Pages on a free plan requires a public repo, so the
  built site's source is technically viewable by anyone who finds it —
  these keys must only exist as Supabase secrets, used by the Edge
  Function.
- **The anon key is fine to expose** — Supabase is designed this way. Row
  Level Security policies (in `db/schema.sql`) are what actually control
  access, not key secrecy.

## Local development

```bash
cd frontend
cp .env.example .env   # fill in your Supabase URL + anon key
npm install
npm run dev
```

## What's built

- **Landing + PIN gate** — hero banner, role picker, shared DM PIN (synced via Supabase, not per-device)
- **Party roster + character sheets** — race/class/subclass are real dropdowns backed by the SRD data, with HP tracking, death saves, ability scores, skills, inventory, and spell slots
- **Combat map** — image uploads to Supabase Storage, draggable tokens synced live across everyone's screen
- **DM monster panel** — browse the full SRD bestiary + any Claude-generated monsters, deploy any of them straight onto the map
- **Items browser** — searchable SRD equipment list

## Intentionally simplified for now

- **Inventory** is free-text (name + quantity), not yet linked to the items
  catalog — quick to use, but doesn't pull weight/cost/properties automatically.
- **Spell slots** are tracked as simple counters; there's no spell-picker
  pulling from the `spells` table yet.
- **One shared map at a time** (matches how the table actually plays), rather
  than a library of saved maps.

None of these are hard to add later — the schema already supports richer
versions of all three whenever it's worth the build time.
