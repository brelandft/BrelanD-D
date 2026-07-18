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
changes — it's safe, it only replaces rows tagged `source: 'srd'`. Note
the free SRD only legally includes 1 background and 1 subclass per class
— everything else in the Player's Handbook is proprietary content, so
additional ones get added through the app's Homebrew tab instead.

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
- **Party roster + character sheets** — race/class/subclass are real dropdowns backed by the SRD data, with HP tracking, death saves, ability scores, skills, inventory, and spell slots
- **Combat map** — image uploads to Supabase Storage, draggable tokens synced live across everyone's screen
- **DM monster panel** — browse the full SRD bestiary, add your own via a form, deploy any of them straight onto the map
- **Items browser** — searchable SRD equipment list, plus a form to add homebrew items
- **Homebrew tab** — forms for subclasses, backgrounds, feats, and spells; anything added shows up immediately in character-creation dropdowns

## Intentionally simplified for now

- **Inventory** is free-text (name + quantity), not yet linked to the items
  catalog — quick to use, but doesn't pull weight/cost/properties automatically.
- **Spell slots** are tracked as simple counters; characters don't yet pick
  known spells from the `spells` table (you can add spells to the catalog,
  just not attach them to a character sheet yet).
- **One shared map at a time** (matches how the table actually plays), rather
  than a library of saved maps.
- **No homebrew race form yet** — races are the most structurally involved
  (sub-races, nested ability bonuses) and least commonly homebrewed; ask if
  you want one built.

None of these are hard to add later — the schema already supports richer
versions of all of them whenever it's worth the build time.
