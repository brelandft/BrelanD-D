# CLAUDE.md

## 1. Project Overview

A custom **D&D 5e companion web app** built for in-person family game sessions. Finn is the DM; family members are players. The app supports live tabletop play — it does **not** replace dice rolling or handle online multiplayer. Combat (initiative, rolls) stays on paper.

**Status:** Live, deployed, actively iterated on. Core systems (characters, DM screen, monsters, maps, homebrew) are built and functional. Development continues based on real play feedback rather than a fixed roadmap. Most recent commits have been SRD data-completeness fixes rather than new features.

**Core purpose:** Character management, HP/resource tracking, and combat maps for in-person sessions — a lightweight digital layer under a traditional tabletop game.

---

## 2. Tech Stack

- **Frontend:** React 18 + Vite 5 + Tailwind, in `frontend/` (no router — `App.jsx` is a single state machine over `view`/`tab` state)
- **Backend/DB:** Supabase (free tier) — shared database across all players/DM, "trusted-link" RLS model (anon key has full read/write on gameplay tables; reference tables are public-read, service-role-write only)
- **Hosting/Deploy:** GitHub Pages, deployed via GitHub Actions (`.github/workflows/deploy.yml`, triggers on push to `main`)
- **SRD data pipeline:** Python transform scripts + Node.js upsert loader in `db/import/`, sourced from `5e-bits/5e-database` (CC-BY-4.0); SRD 5.1 and 5.2 (2024 rules) merged for expanded content
- **Sprite art:** PNGs generated via ChatGPT, background removed for true alpha transparency. **Note:** the cleanup script (`remove_bg.py`, referenced in a comment in `frontend/src/lib/sprites.jsx`) was never committed to the repo — it was run locally and thrown away. If sprite work comes up again, recreate it rather than searching for it.
- **Fonts:** Cormorant Garamond (display), IBM Plex Mono (mono/UI), Inter (body) — defined as JS constants in `frontend/src/lib/gameData.js` and injected at runtime as a Google Fonts `<link>` via `useFonts()` (called once in `App.jsx`). Not wired via `index.html` or `styles.css` — applied as inline styles + Tailwind utility classes throughout components.

---

## 3. File / Folder Structure

Verified against the actual repo (`C:\Users\brela\OneDrive\Desktop\dnd-party-app-repo`):

```
dnd-party-app-repo/
├── .github/workflows/deploy.yml   — GitHub Pages deploy (build frontend/, push to Pages)
├── README.md                       — setup/architecture doc, kept current
├── db/
│   ├── schema.sql                  — full Postgres schema + RLS policies
│   ├── migrations/                 — 001–004, all additive (campaigns, sprites, finalization, upsert constraints)
│   ├── seed/srd/*.json             — races, classes, subclasses, feats, backgrounds, items, spells, monsters
│   └── import/
│       ├── transform_srd.py                        — SRD 5.1 JSON → app schema shape
│       ├── add_2024_srd_backgrounds_subclasses.py   — merges 2024 SRD backgrounds/subclasses
│       ├── add_2024_srd_species.py                  — merges 2024 SRD species/subraces (Goliath, Orc, expanded subraces)
│       └── load_to_supabase.mjs                     — Node upsert loader, service-role key, upsert-on-(name, source)
├── frontend/                       — the actual app (React + Vite)
│   ├── index.html, vite.config.js, tailwind.config.js
│   └── src/
│       ├── App.jsx                 — root state machine (view/tab routing, no router lib)
│       ├── styles.css              — LEGACY/UNUSED: an older parchment/ink CSS theme; nothing in current components references these classes. Don't build on it; don't assume it's live.
│       ├── assets/sprites/{classes,monsters}/*.png
│       ├── components/             — 19 files: Landing, PinGate, CampaignPicker/Settings, Roster, DmRosterPanel, CharacterSheet, CombatMap, MapTabs, MonsterPanel, AddMonsterForm, ItemsPanel, AddItemForm, HomebrewPanel + per-type Add forms, ImportCharacterPanel, PartyReference, DmReference, atoms
│       └── lib/                    — api.js (all Supabase queries), gameData.js (theme/fonts/constants), sprites.jsx (token sprite mapping), supabaseClient.js
└── supabase/config.toml            — just a project_id stub; no Edge Functions directory exists
```

- **Landing page** — role picker (Party Member vs. DM), DM PIN gate (PIN stored in Supabase `app_settings` table, not a dedicated table)
- **Campaign management** — campaigns scope characters and maps; reference content (bestiary, items, spells, homebrew) is shared across all campaigns
- **Character sheet module** — SRD race/class/subclass dropdowns, HP tracking (temp HP, death saves), skill proficiencies, inventory, spell slots; draft → finalized creation flow
- **DM screen** — full roster view, stat editing, delete w/ confirmation, reference/cheat-sheet tab
- **Monster panel** — SRD bestiary, homebrew monster entry form, token deployment to maps
- **Map system** — multi-map per campaign, tab switching, rename, delete; images in Supabase Storage (`maps` bucket)
- **Homebrew panel** — subclasses, backgrounds, feats, spells (no homebrew race form — races are the most structurally involved and least commonly homebrewed; intentional gap per README)
- **Token/sprite system** — colored circular backdrops (player-chosen for PCs, red for monsters), DM-only drag + inline HP edit, read-only for players

**Removed but not fully cleaned up:** Claude API-powered on-the-fly monster generator (see Key Decisions and Section 5).

---

## 4. Key Decisions

- **No dice rolling in-app** — deliberate scope boundary; app supports the table, doesn't replace it.
- **Monster generator removed** — an early feature used the Claude API to generate monsters on-the-fly (commit `9b5b645`). Finn concluded this didn't fit his actual workflow (he pre-plans encounters rather than improvising them) and replaced it with in-app homebrew forms. Don't re-add without confirming this has changed. **The removal left dead weight behind — see Section 5.**
- **DM PIN is casual deterrence, not security** — explicitly accepted tradeoff, stored in `app_settings`, checked client-side. Don't "fix" this by hardening auth unless asked.
- **Upsert-on-(name, source) over delete-then-reinsert** for SRD data loading — chosen after delete-then-reinsert caused foreign key violations against live gameplay data (migration 004 added the constraint). Always upsert when touching seeded content tables.
- **Draft/finalized character flow** — players build level-1 characters freely, then core stats lock to DM-only editing once finalized (migration 003). This was a deliberate control point, not an oversight.
- **Visual quality bar is high** — flat/blocky pixel art was explicitly rejected. Don't default to placeholder-quality visuals.
- **SRD 5.1 + 5.2 merged** — expanded 2024-rules content intentionally combined rather than picking one version.
- **Campaign separation is organizational, not a security boundary** — everyone shares the same `anon` key with full read/write; campaigns filter the UI, they don't enforce access control. Documented and accepted in README.

---

## 5. Known Issues / Cleanup Candidates

**Fixed:**
- **Sprite transparency:** PNGs could *look* transparent in preview while still having opaque white backgrounds underneath. Fixed via a (now-uncommitted, see Section 2) flood-fill script — **always verify transparency at the binary/pixel level**, not just visually, when touching sprite generation or import.
- **Foreign key violations on SRD reload:** caused by delete-then-reinsert against tables with live gameplay references. Fixed by switching to upsert-on-(name, source) in migration 004. Don't revert to delete/reinsert patterns for seeded data.

**Cleaned up (2026-08-04):** the `generated_by_claude` column/write, the dead `generation_log` table, and the unused `VITE_APP_SHARED_SECRET` build secret were all removed from `db/schema.sql`, `frontend/src/lib/api.js`, and `.github/workflows/deploy.yml`. These only affect **fresh installs** — the live production Supabase instance still has the old column/table sitting unused; harmless to leave, drop them manually later if it ever matters. If you also want `VITE_APP_SHARED_SECRET` removed from the actual GitHub Actions secrets (Settings → Secrets and variables → Actions), that's a manual step outside this repo.

**Suspected live bug, unconfirmed as of this writing — check before assuming it's fine:** `db/schema.sql`'s RLS policies only grant `select` on `backgrounds`, `feats`, `subclasses`, `items`, and `spells` to the anon key (lines ~358-377). No migration adds a write policy for them either. But `frontend/src/lib/api.js`'s `createItem`, `createSpell`, `createBackground`, `createFeat`, and `createSubclass` all insert into those exact tables using the anon client — the homebrew forms for everything **except monsters** (which does have an "anon full access" policy) may be silently failing with a Postgres RLS permission error on the deployed site. If confirmed, the fix is adding `for insert to anon using (true) with check (true)` (or `for all`, matching the pattern already used for `characters`/`monsters`/etc.) policies for those five tables — see the NOTE left in `schema.sql` near the RLS section.

**Documentation gaps (README.md):**
- The "run migrations in order" section (README §2a) lists only 001–003; migration `004_stable_reimports.sql` exists and is required by `load_to_supabase.mjs` but isn't mentioned.
- `db/import/add_2024_srd_species.py` (merges 2024 subraces) isn't documented anywhere in the README, unlike its sibling `add_2024_srd_backgrounds_subclasses.py`.

---

## 6. Open Items / Next Steps

No fixed roadmap — development follows actual play sessions. When picking up new work, ask Finn what came up in the most recent game night before assuming priorities. The Section 5 cleanup items are reasonable to mention if relevant work happens nearby, but aren't queued on their own.

---

## 7. Working Preferences

- **Iterative, visual feedback loop:** ship something viewable, Finn reacts to how it looks/feels, refine from there — don't over-plan up front.
- **Concrete, step-by-step guidance preferred:** Finn came into this project without prior git/Supabase/React-deployment experience. Don't assume familiarity with tooling internals — explain steps plainly when introducing new workflows.
- **Honest pushback over validation:** flag workflow mismatches (like the monster generator) rather than building what's asked if it seems like it won't fit how Finn actually plays/works.
- **Visual quality matters:** don't ship placeholder-tier art or flat aesthetics as "good enough" — Finn will push back on it anyway.
- **Data safety with live gameplay data:** treat any existing campaign/character/map data in Supabase as real and precious — prefer non-destructive migrations (upsert, additive columns) over destructive ones.
