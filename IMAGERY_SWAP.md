# IMAGERY_SWAP — replacing demo assets with production data

The demo serves orthomosaic tiles and media images straight from this repo (GitHub Pages). That keeps the MVP at zero cost and zero backend dependencies. This file documents what is placeholder vs. real, and how to move imagery into Supabase Storage when the dataset outgrows the repo.

## What's real, what's placeholder

| Asset | Status |
|---|---|
| Montview boundary + 4/14/2026 ortho tiles | **Real** (MassGIS L3 boundary; WebODM ortho, 5 cm GSD) |
| Terrace Trails boundary + 4/14/2026 ortho tiles | **Real** (Cutchins parcel boundary) |
| County Jail Farm boundary + 4/14/2026 ortho tiles | **Real** |
| Sheldon Field boundary | **PLACEHOLDER** — approximate sketch near Old Ferry Rd. Real boundary and prior flight data exist but are archived offline; load whenever convenient |
| Sheldon Field acreage | null — set with real boundary |
| Montview 2025-10-02 "fall reference flight" | **Synthetic demo row** to demonstrate the date slider; no tiles |
| Field photos in `/media` | Real 4/14/2026 drone captures, downsized |
| Species flag pins | **Demo content** — plausible but not field-verified locations |

## Tile generation pipeline (per flight)

```powershell
# QGIS 3.36 ships GDAL; run from the OSGeo4W/QGIS shell or set:
#   GDAL_DATA="C:\Program Files\QGIS 3.36.1\share\gdal"
#   PROJ_LIB="C:\Program Files\QGIS 3.36.1\share\proj"
& "C:\Program Files\QGIS 3.36.1\bin\python-qgis.bat" -m osgeo_utils.gdal2tiles `
    --xyz -z 16-21 --tiledriver=WEBP --webp-quality=80 --processes=4 `
    -r bilinear -w none CLIPPED_ORTHO.tif tiles/<parcel_slug>/<YYYY-MM-DD>
```

The 4/14/2026 flights produced ~5.6 MB of tiles for all three parcels — committing tiles to the repo is fine at this scale (rule of thumb: keep the repo under ~500 MB; beyond that, move to Storage).

Then insert the flight record:

```sql
insert into flight_history (parcel_id, flight_date, orthomosaic_url, footprint_geojson, notes)
values ('<parcel uuid>', '<date>',
        'tiles/<parcel_slug>/<date>/{z}/{x}/{y}.webp',
        '<footprint geojson>'::jsonb, '<notes>');
```

The footprint is the ortho bounding box (`gdalinfo` corner coordinates) or the buffered flight boundary polygon.

## Moving tiles to Supabase Storage

1. Create/verify the public `orthos` bucket (schema.sql does this).
2. Upload the tile tree preserving structure, e.g. with the Supabase CLI:
   ```
   supabase storage cp -r tiles/montview/2026-04-14 ss:///orthos/montview/2026-04-14 --experimental
   ```
   (or any S3-compatible uploader against the project's storage endpoint).
3. Update the flight row:
   ```sql
   update flight_history
   set orthomosaic_url = 'https://vilffekbihdbudjctrnx.supabase.co/storage/v1/object/public/orthos/montview/2026-04-14/{z}/{x}/{y}.webp'
   where parcel_id = '11111111-1111-4111-8111-111111111111' and flight_date = '2026-04-14';
   ```
   The app treats `orthomosaic_url` as a Leaflet tile template — relative repo paths and absolute Storage URLs both work, per flight, no code change.

Same pattern for media: upload to the `media` bucket and update `media.storage_path` / `thumbnail_path` to the public Storage URLs.

## Sheldon Field — real data insertion (when the archive is at hand)

Sheldon Field's boundary and prior flight data are archived offline (not on this machine). When retrieved:

1. Convert the boundary to EPSG:4326 GeoJSON: `ogr2ogr -f GeoJSON -t_srs EPSG:4326 sheldon.geojson <source>`
2. ```sql
   update parcels
   set geometry = '<geojson geometry>'::jsonb, acreage = <acres>, next_flight_date = <date or null>
   where id = '44444444-4444-4444-8444-444444444444';
   ```
3. Mirror in `js/seed-data.js` (Sheldon entry is marked PLACEHOLDER).
4. If archived imagery is worth surfacing: tile + insert `flight_history` per the pipeline above. Also delete the synthetic Montview 2025-10-02 row if a cleaner history is preferred.
