# DMC Conservation Monitor

Conservation land monitoring web app — live MVP demo for **Meadow City Conservation Coalition (MCCC)**, built by Digital Mapping Consultants. Static site (Leaflet + vanilla JS) backed by Supabase, deployed on GitHub Pages.

**Live demo:** https://dmc-maps.github.io/dmc-conservation-monitor/

The app runs in two modes automatically:

- **Supabase mode** — tables exist in the configured Supabase project; all reads/writes hit PostgREST.
- **Local demo mode** — tables missing (schema.sql not yet run): the app silently falls back to bundled seed data (`js/seed-data.js`), and demo entries persist to the browser's localStorage. The header badge shows which mode is active.

This means the Pages deploy is never blank, even before any backend setup.

---

## 1. Supabase setup

1. Open the MCCC Supabase project (`vilffekbihdbudjctrnx`) → **SQL Editor**.
2. Paste and run the entire contents of [`schema.sql`](schema.sql).
   - It creates `parcels`, `observations`, `media`, `species_flags`, `flight_history` with check constraints and seed rows (real MassGIS boundaries for Montview, Terrace Trails, County Jail Farm).
   - The pre-existing prototype `parcels` table from the April webmap experiment is **renamed to `parcels_legacy_backup`**, not dropped. Delete it when you no longer need it.
   - It also creates `media` and `orthos` storage buckets with public read and demo anon-upload policies.
3. Reload the live site — the header badge should switch to `supabase: connected`.

**RLS is off for the demo.** Before any production client use: enable RLS on all five tables, add public `SELECT` policies, and restrict `INSERT`/`UPDATE` to authenticated roles. Replace the demo storage policies the same way.

## 2. Storage buckets

| Bucket | Purpose | Demo state |
|---|---|---|
| `media` | Field photos uploaded through the Add Observation modal | anon upload allowed (demo only) |
| `orthos` | Clipped orthomosaic XYZ tiles per flight | public read |

For the demo, orthomosaic tiles and seeded media images are served **from this repo via GitHub Pages** (`/tiles`, `/media`) — no storage setup required to show the product. To move imagery into Supabase Storage, follow [IMAGERY_SWAP.md](IMAGERY_SWAP.md).

## 3. Parcel GeoJSON swap

Parcel boundaries live in `parcels.geometry` (GeoJSON, EPSG:4326) and in the local fallback `js/seed-data.js`.

- Montview, Terrace Trails, County Jail Farm: real MassGIS L3 assessor boundaries (converted from the QGIS Exports shapefiles, source copies in `/data`).
- To add a parcel (e.g. Sheldon Field later, with real geometry):
  1. Convert the boundary to EPSG:4326 GeoJSON (`ogr2ogr -f GeoJSON -t_srs EPSG:4326 out.geojson in.shp`).
  2. `insert into public.parcels (name, acreage, status, geometry) values ('<name>', <ac>, 'stable', '<geojson geometry>'::jsonb);`
  3. Mirror the row in `js/seed-data.js` so local demo mode matches.

## 4. New client onboarding (resale checklist)

Everything client-specific is in `config.js` + the database. To stand up a new client:

1. **Fork/copy this repo** → `dmc-<client>-monitor`.
2. **New Supabase project** for the client; run `schema.sql`; replace the seed inserts with the client's parcels.
3. **Edit `config.js`:** client name/region, Supabase URL + publishable anon key, map center/zoom.
4. **Replace `js/seed-data.js`** parcels/flights with the client's data (or empty arrays — local mode then shows an empty map but the UI still works).
5. **Fly, process, tile:** WebODM ortho → clip in QGIS → `gdal2tiles --xyz --tiledriver=WEBP` → commit under `/tiles/<parcel>/<date>/` (or upload to Storage per IMAGERY_SWAP.md) → insert a `flight_history` row with the tile URL template and footprint.
6. **Enable GitHub Pages** (Settings → Pages → deploy from `main` branch root).
7. Custom domain: add CNAME in repo settings + DNS at the registrar.

Per-client cost at demo scale: $0 (Supabase free tier + GitHub Pages).

## 5. Reference layers & regional groups

Layers are organized into groups in `config.js → layerGroups`, each with a `show` flag and an optional `bbox`:

- **National** (NWI Wetlands, USGS 3DEP Hillshade, USGS Hydrography, FEMA Flood Zones) — **defined but hidden for the MCCC deploy** (`show: false`). The definitions ship with every copy of the product; flip `show: true` in `config.js` for clients who want nationwide layers. No other code changes needed.
- **Massachusetts** (`show: true`, MA bbox) — MassGIS ArcGIS REST layers queried live as GeoJSON within the map extent: DEP Wetlands (`AGOL/DEP_Wetlands_FieldMaps/1`), Protected Open Space (`AGOL/openspace/0`), NHESP Priority Habitat (`AGOL/NHESP_Priority_Habitats/0`). Note: the legacy MassGIS GeoServer WMS (`giswebservices.massgis.state.ma.us`) is no longer reachable — use `arcgisserver.digital.mass.gov` REST services.
- **Michigan** (`show: true`, MI bbox) — for future MI clients.

Groups with a `bbox` appear in the panel **only while the map center is inside that region** — for MCCC you see the Massachusetts section; pan to Michigan and the MI section appears instead.

All `arcgis-geojson` layers re-query on pan/zoom, capped at 500 features per request.

- **MI: EGLE Wetlands (NWI)** — EGLE ArcGIS REST service (`WrdOpenData/MapServer/9`).
- **MI: DNR Protected Lands** — the DNR open data hub does not publish a single stable REST endpoint. The configured URL is the best-known `DNR_Managed_Lands` FeatureServer; if it returns an error the panel row shows "unavailable". **Fallback:** download the "DNR Managed Lands" layer from <https://gis-midnr.opendata.arcgis.com/> as GeoJSON and either drag-drop it onto the map (session preview) or host it in the repo and add it to `config.js` as a static layer.

## 6. Repo layout

```
index.html            app shell
config.js             ALL client-specific configuration
schema.sql            Supabase DDL + seeds (paste into SQL Editor)
css/styles.css        field-tool theme
js/seed-data.js       local fallback data (mirrors schema.sql seeds)
js/db.js              Supabase REST client + local fallback
js/layers.js          external WMS/REST layers, MI logic, drag-drop
js/map.js             Leaflet core, parcels, species pins, date slider
js/panel.js           per-parcel side panel + lightbox
js/modal.js           data entry modal
js/app.js             bootstrap + dashboard header
data/                 source parcel GeoJSON (EPSG:4326)
tiles/<parcel>/<date>/  WebP XYZ tiles from the 4/14/2026 flights
media/<parcel>/       demo field photos + ortho previews
IMAGERY_SWAP.md       moving imagery into Supabase Storage / real data
summary.md            handoff summary for future sessions
```

## 7. Local development

No build step. Serve the folder with any static server (`python -m http.server`) — opening `index.html` via `file://` won't work because of fetch/CORS.
