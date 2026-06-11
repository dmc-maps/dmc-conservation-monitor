# Session handoff — DMC Conservation Monitor (MCCC MVP)

> Written 2026-06-10 as a handoff for a future AI/dev session. Read alongside README.md and IMAGERY_SWAP.md.

## What this is

Live MVP demo of a conservation land monitoring platform for **Meadow City Conservation Coalition** (board contacts: Fred Zimnock — flights; Jane Potter — web mapping interest). DMC intends to resell this as a repeatable product to other land trusts/conservation clients; everything client-specific is isolated in `config.js` + the database.

- **Repo:** `dmc-maps/dmc-conservation-monitor` · **Live:** https://dmc-maps.github.io/dmc-conservation-monitor/
- **Stack:** Leaflet 1.9.4 + vanilla JS (no build step), Supabase (PostgREST + Storage), GitHub Pages.
- **Supabase project:** `vilffekbihdbudjctrnx` (MCCC). Publishable anon key shipped in `config.js` (safe by design; RLS is the gate — currently OFF, demo only).

## State at handoff

| Item | State |
|---|---|
| Frontend | Complete, verified in browser preview |
| Real parcel boundaries | Montview (3.246 ac), Terrace Trails (8.794 ac), County Jail Farm (3.0 ac) — MassGIS L3 via ogr2ogr from `Desktop\MCCC\Orthos\4.14.26\...\QGIS Exports` |
| Sheldon Field | Placeholder polygon + null acreage; real boundary and prior flight data archived offline (intentionally deferred) |
| Ortho tiles | 4/14/2026 flights tiled to WebP XYZ z16–21 (~5.6 MB total), committed under `/tiles`, served from Pages |
| Supabase tables | **NOT yet created** — `schema.sql` must be run in the SQL Editor. A legacy prototype `parcels` table (April experiment, different columns) exists; schema.sql renames it to `parcels_legacy_backup` |
| Fallback mode | App auto-detects missing tables and runs on `js/seed-data.js` + localStorage, so the demo works regardless |
| Storage buckets | Created by schema.sql (`media`, `orthos`) with demo policies; demo assets are repo-served instead |

## Key design decisions

1. **Dual-mode data layer** (`js/db.js`): probes `parcels` with explicit columns so the legacy table 400s → falls back to seed data. Header badge shows the active mode.
2. **Tiles in the repo**, not Storage: WebP tiles for 3 small parcels are only 5.6 MB; zero backend dependency for the sales demo. `flight_history.orthomosaic_url` is a Leaflet tile template, so swapping to Storage URLs later is a row update, not a code change (IMAGERY_SWAP.md).
3. **Seeds duplicated** in `schema.sql` and `js/seed-data.js` with fixed UUIDs — keep them in sync when editing.
4. **Layer groups** (`config.js → layerGroups`): national layers are defined but hidden for MCCC (`show: false` — flip per client); Massachusetts group (MassGIS REST: DEP Wetlands, Protected Open Space, NHESP Priority Habitat) and Michigan group are bbox-gated to the map center's region. Legacy MassGIS GeoServer WMS is dead; use arcgisserver.digital.mass.gov.
5. A synthetic Montview 2025-10-02 flight row (no tiles) exists purely so the date slider demonstrates scrubbing between flights.

## Immediate next steps

1. Run `schema.sql` in the Supabase SQL Editor (~1 min) → badge flips to `supabase: connected`.
2. Sheldon Field: leave as placeholder — real boundary + flight data are archived offline; load per IMAGERY_SWAP.md when retrieved.
3. Before showing Jane Potter: consider setting one parcel to `watch` temporarily to demonstrate status colors (spec seeds everything `stable`).
4. Before any production/client login use: enable RLS + policies, regenerate the anon key if desired.

## Business context (from DMC memory files)

- Demo audience: MCCC board (Jane Potter = web mapping champion; there's an unnamed in-house GIS person — potential ally/gatekeeper).
- Pricing/positioning: recurring monitoring contracts > one-off builds; this platform is the "storytelling + monitoring visualization" Jane asked about, kept separate from Fred's $800 orthomosaic quote.
- Tooling constraints honored: Leaflet (not Esri), WebODM/QGIS pipeline, no SaaS dependencies beyond Supabase free tier + GitHub Pages.
