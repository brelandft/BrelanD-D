# The Party — D&D companion app

A shared character tracker, battle map, and homebrew content editor for an
in-person D&D group. Static frontend on GitHub Pages, Supabase for shared
data. No API keys, no server, no billing account required — everything,
including custom monsters/items/spells/subclasses, is entered through
plain forms that write straight to the database.

## Architecture

```
frontend/     React + Vite app, deployed to GitHub Pages
db/           Postgres schema + SRD data import tooling (Supabase)
.github/      GitHub Actions deploy workflow
```

Combat (initiative, rolls) stays on paper — this app is for character
reference, shared party/map state, and monster/item/homebrew management,
not rules automation.

## One-time setup

### 1. Create the Supabase project
1. Create a free project at supabase.com.
2. In the SQL Editor, run `db/schema.sql` — this creates every table and
   the RLS policies.
3. Grab your Project URL and `anon` public key from Project Settings →
   API. The `service_role` key is only needed briefly for step 2 below —
   never put it in the frontend or a GitHub Actions secret.

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
changes — it's safe, upserting on name rather than deleting, so it never
conflicts with real gameplay data that references these rows.

The backgrounds and subclasses lists now include content from **both**
SRD 5.1 (2014 rules) and SRD 5.2 (2024 rules, released April 2025 under
the same open CC-BY license) — 4 backgrounds and up to 2 subclasses per
class, since the two eras renamed most subclasses differently (a few,
like Fighter's Champion, share the same name across both and just appear
once). To pull in the 2024 content yourself or refresh it later:
```bash
python3 add_2024_srd_backgrounds_subclasses.py <path-to-5e-database/src/2024/en> ../seed/srd
```

### 2a. If upgrading an existing project: run migrations in order
```sql
-- paste each of these into the SQL Editor and run them, in order:
-- db/migrations/001_add_campaigns.sql
-- db/migrations/002_campaign_desc_and_sprites.sql
-- db/migrations/003_character_finalization.sql
```
All additive — existing data is preserved, never deleted. Skip these
entirely on a brand-new project; `db/schema.sql` already includes
everything from the start.

**If you already ran the SRD import before migration 002/003 existed**,
re-run the import (step 2 above) once the migrations are applied — the
importer now assigns each monster a sprite matching its actual creature
type (dragons get the dragon icon, undead get the skeleton icon, etc.)
instead of everything defaulting to the same one. Safe to re-run any
time; it only touches rows tagged `source: 'srd'`. Note this only fixes
the *bestiary* — any monster already deployed onto a live map keeps
whatever sprite it had at deploy time, since tokens store their own
snapshot; redeploy it to pick up the fix.

### 2b. Create the Storage bucket for map images
In the Supabase dashboard: Storage → New bucket → name it `maps` → make it
**public**. Then, in the SQL Editor, add the policies that let the app
actually read/write to it:
```sql
create policy "anon upload to maps" on storage.objects
  for insert to anon
  with check (bucket_id = 'maps');

create policy "anon read maps" on storage.objects
  for select to anon
  using (bucket_id = 'maps');
```

### 3. Configure GitHub Pages
1. Push this repo to GitHub as a **public** repo (GitHub Pages on a free
   personal account requires public — see note below).
2. Repo Settings → Pages → Source: "GitHub Actions".
3. Repo Settings → Secrets and variables → Actions, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the anon key — safe to expose, see below)
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds
   and deploys automatically.

Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## A note on "trusted family only" and security

Since this is only shared with people you send the link to, we've skipped
login systems, per-user permissions, and the DM PIN is a soft gate (not
real auth). One thing stays non-negotiable regardless of audience trust:
the Supabase `service_role` key never touches the frontend — it's only
used once, locally, to run the SRD import script. Everything the deployed
site does uses the `anon` key, which is safe to expose by design — Row
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
- **Campaigns** — pick or create a campaign after choosing your role; characters and maps are scoped per campaign so multiple games don't collide. Reference content (bestiary, items, spells, subclasses, backgrounds, feats) is shared across all campaigns.
- **Import a character between campaigns** — clones a character's current sheet into a new campaign as an independent copy; future progress in either campaign doesn't affect the other
- **Party roster + character sheets** — race/class/subclass are real dropdowns backed by the SRD data, with HP tracking, death saves, ability scores, skills, inventory, and spell slots
- **Multiple maps per campaign** — pre-load several battle maps ahead of a session, switch between them with tabs, rename/delete as needed. Image uploads go to Supabase Storage; tokens are draggable and shared live across everyone's screen.
- **DM monster panel** — browse the full SRD bestiary, add your own via a form, deploy any of them straight onto the active map
- **Items browser** — searchable SRD equipment list, plus a form to add homebrew items
- **Homebrew tab** — forms for subclasses, backgrounds, feats, and spells; anything added shows up immediately in character-creation dropdowns

## Intentionally simplified for now

- **Inventory** is free-text (name + quantity), not yet linked to the items
  catalog — quick to use, but doesn't pull weight/cost/properties automatically.
- **Spell slots** are tracked as simple counters; characters don't yet pick
  known spells from the `spells` table (you can add spells to the catalog,
  just not attach them to a character sheet yet).
- **No live sync** — the app loads data when a screen opens, but doesn't
  push updates to other open screens in real time. If the DM moves a token,
  players need to switch tabs or refresh to see it move. Supabase supports
  realtime subscriptions for exactly this; worth adding once it's annoying
  enough in practice to be worth the build time.
- **Campaign separation is organizational, not a security boundary** —
  everyone still shares the same `anon` key with full read/write access;
  a campaign just filters what each screen shows, it doesn't lock anyone
  out of anything.
- **No homebrew race form yet** — races are the most structurally involved
  (sub-races, nested ability bonuses) and least commonly homebrewed; ask if
  you want one built.

None of these are hard to add later — the schema already supports richer
versions of all of them whenever it's worth the build time.
