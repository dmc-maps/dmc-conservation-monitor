-- ============================================================
-- DMC Conservation Monitor — Supabase schema + seed data
-- Project: MCCC (vilffekbihdbudjctrnx)
-- Run this whole file in the Supabase SQL Editor.
--
-- NOTE: this project already contains a one-row prototype
-- `parcels` table from the April webmap experiment (different
-- columns: parcel_code/parcel_name/geom). It is renamed to
-- parcels_legacy_backup rather than dropped. Delete it whenever
-- you're sure you don't need it.
--
-- RLS is intentionally left OFF for the demo. Before any client
-- production use, enable RLS and add policies (see README.md).
-- ============================================================

-- ---- preserve legacy prototype table --------------------------------------
do $$
begin
  if exists (select from information_schema.tables
             where table_schema = 'public' and table_name = 'parcels')
     and not exists (select from information_schema.columns
                     where table_schema = 'public' and table_name = 'parcels'
                       and column_name = 'status')
  then
    alter table public.parcels rename to parcels_legacy_backup;
  end if;
end $$;

-- ---- tables ----------------------------------------------------------------

create table if not exists public.parcels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  acreage numeric,
  status text not null default 'stable'
    check (status in ('stable', 'watch', 'action_required')),
  geometry jsonb,                       -- GeoJSON geometry, EPSG:4326
  next_flight_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels (id) on delete cascade,
  date date not null,
  type text not null
    check (type in ('drone_flight', 'gps_survey', 'field_note', 'thermal', 'multispectral', 'data_layer')),
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid references public.observations (id) on delete set null,
  parcel_id uuid references public.parcels (id) on delete cascade,
  storage_path text not null,
  media_type text
    check (media_type in ('rgb', 'thermal', 'multispectral', 'orthomosaic')),
  capture_date date,
  thumbnail_path text
);

create table if not exists public.species_flags (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels (id) on delete cascade,
  species_name text not null,
  status text not null default 'present'
    check (status in ('present', 'treated', 'monitoring')),
  lat numeric,
  lng numeric,
  flagged_date date,
  notes text
);

create table if not exists public.flight_history (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels (id) on delete cascade,
  flight_date date not null,
  footprint_geojson jsonb,              -- GeoJSON geometry, EPSG:4326
  orthomosaic_url text,                 -- XYZ tile template ({z}/{x}/{y})
  notes text
);

create index if not exists observations_parcel_idx on public.observations (parcel_id, date desc);
create index if not exists media_parcel_idx on public.media (parcel_id);
create index if not exists species_parcel_idx on public.species_flags (parcel_id);
create index if not exists flights_parcel_idx on public.flight_history (parcel_id, flight_date);

-- ---- seed: parcels ----------------------------------------------------------
-- Montview / Terrace Trails / County Jail Farm geometries are real
-- MassGIS L3 assessor boundaries. Sheldon Field is an approximate
-- placeholder (see IMAGERY_SWAP.md).

insert into public.parcels (id, name, acreage, status, next_flight_date, geometry) values
('11111111-1111-4111-8111-111111111111', 'Montview', 3.246, 'stable', '2026-10-15',
 '{"type":"Polygon","coordinates":[[[-72.6221776,42.3166427],[-72.621439,42.31633],[-72.6201798,42.3157598],[-72.6207932,42.3150363],[-72.62137,42.3152857],[-72.6208787,42.3159117],[-72.6214058,42.3161396],[-72.6218972,42.3155137],[-72.6221861,42.3156386],[-72.6224043,42.3156351],[-72.6223854,42.3158033],[-72.6224208,42.3159477],[-72.6223951,42.3161374],[-72.6223244,42.3163183],[-72.6222259,42.3165108],[-72.6221776,42.3166427]]]}'::jsonb),
('22222222-2222-4222-8222-222222222222', 'Terrace Trails', 8.794, 'stable', '2026-10-15',
 '{"type":"Polygon","coordinates":[[[-72.6218421,42.3194483],[-72.620934,42.3205148],[-72.6208643,42.3205035],[-72.620445,42.3204355],[-72.6199817,42.3210503],[-72.6199097,42.3210379],[-72.6200264,42.3208744],[-72.61949,42.3206992],[-72.6200698,42.3198846],[-72.6202838,42.319584],[-72.6204544,42.3193442],[-72.6205541,42.3192042],[-72.620679,42.3190287],[-72.6212144,42.3182765],[-72.6215415,42.3184479],[-72.6221915,42.319038],[-72.6218421,42.3194483]]]}'::jsonb),
('33333333-3333-4333-8333-333333333333', 'County Jail Farm', 3.0, 'stable', '2026-10-15',
 '{"type":"Polygon","coordinates":[[[-72.6168693,42.3186578],[-72.6171415,42.3183107],[-72.6202838,42.319584],[-72.6200698,42.3198846],[-72.6168693,42.3186578]]]}'::jsonb),
('44444444-4444-4444-8444-444444444444', 'Sheldon Field', null, 'stable', '2026-07-08',
 '{"type":"Polygon","coordinates":[[[-72.6157,42.3296],[-72.6131,42.329],[-72.6126,42.3273],[-72.6149,42.3268],[-72.6162,42.3281],[-72.6157,42.3296]]]}'::jsonb)
on conflict (id) do nothing;

-- ---- seed: flight history ----------------------------------------------------
-- orthomosaic_url values are relative XYZ paths served from the GitHub
-- Pages deploy. Swap to Supabase Storage URLs per IMAGERY_SWAP.md.

insert into public.flight_history (id, parcel_id, flight_date, orthomosaic_url, notes, footprint_geojson) values
('f1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '2026-04-14',
 'tiles/montview/2026-04-14/{z}/{x}/{y}.webp',
 'Spring baseline flight. 5 cm GSD, WebODM orthomosaic clipped to parcel.',
 '{"type":"Polygon","coordinates":[[[-72.622394,42.315025],[-72.620208,42.315025],[-72.620208,42.316647],[-72.622394,42.316647],[-72.622394,42.315025]]]}'::jsonb),
('f1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', '2025-10-02',
 null,
 'Fall reference flight — imagery archived offline, not yet tiled.',
 '{"type":"Polygon","coordinates":[[[-72.622394,42.315025],[-72.620208,42.315025],[-72.620208,42.316647],[-72.622394,42.316647],[-72.622394,42.315025]]]}'::jsonb),
('f2222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', '2026-04-14',
 'tiles/terrace_trails/2026-04-14/{z}/{x}/{y}.webp',
 'Spring baseline flight. 5 cm GSD, WebODM orthomosaic clipped to parcel.',
 '{"type":"Polygon","coordinates":[[[-72.622114,42.318242],[-72.619583,42.318242],[-72.619583,42.321094],[-72.622114,42.321094],[-72.622114,42.318242]]]}'::jsonb),
('f3333333-3333-4333-8333-333333333331', '33333333-3333-4333-8333-333333333333', '2026-04-14',
 'tiles/county_jail_farm/2026-04-14/{z}/{x}/{y}.webp',
 'Spring baseline flight. 5 cm GSD, WebODM orthomosaic clipped to parcel.',
 '{"type":"Polygon","coordinates":[[[-72.620628,42.318028],[-72.616528,42.318028],[-72.616528,42.320167],[-72.620628,42.320167],[-72.620628,42.318028]]]}'::jsonb)
on conflict (id) do nothing;

-- ---- seed: observations -------------------------------------------------------

insert into public.observations (id, parcel_id, date, type, notes, created_by) values
('a1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2026-04-14', 'drone_flight',
 'Spring baseline orthomosaic flight. Full parcel coverage at 5 cm GSD.', 'Devin Clark'),
('a1111111-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '2026-04-14', 'field_note',
 'Bittersweet observed climbing canopy edge along the eastern boundary. Flagged for fall comparison.', 'Devin Clark'),
('a2222222-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '2026-04-14', 'drone_flight',
 'Spring baseline orthomosaic flight covering trail network and meadow.', 'Devin Clark'),
('a2222222-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '2026-04-16', 'gps_survey',
 'Trail network GPS survey — centerlines collected for print layout revision.', 'Devin Clark'),
('a3333333-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', '2026-04-14', 'drone_flight',
 'Spring baseline orthomosaic flight along Venturers Field Rd frontage.', 'Devin Clark'),
('a4444444-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', '2026-06-02', 'field_note',
 'Site walk ahead of July baseline flight. Boundary GeoJSON pending from MCCC GIS.', 'Devin Clark')
on conflict (id) do nothing;

-- ---- seed: media ----------------------------------------------------------------
-- storage_path values are relative to the GitHub Pages deploy for the
-- demo. Swap to Supabase Storage public URLs per IMAGERY_SWAP.md.

insert into public.media (id, observation_id, parcel_id, storage_path, thumbnail_path, media_type, capture_date) values
('b1111111-0000-4000-8000-000000000001', 'a1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
 'media/montview/ortho_preview.jpg', 'media/montview/ortho_preview_thumb.jpg', 'orthomosaic', '2026-04-14'),
('b1111111-0000-4000-8000-000000000002', 'a1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
 'media/montview/DJI_0444.jpg', 'media/montview/DJI_0444_thumb.jpg', 'rgb', '2026-04-14'),
('b1111111-0000-4000-8000-000000000003', 'a1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
 'media/montview/DJI_0445.jpg', 'media/montview/DJI_0445_thumb.jpg', 'rgb', '2026-04-14'),
('b1111111-0000-4000-8000-000000000004', 'a1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
 'media/montview/DJI_0446.jpg', 'media/montview/DJI_0446_thumb.jpg', 'rgb', '2026-04-14'),
('b2222222-0000-4000-8000-000000000001', 'a2222222-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
 'media/terrace_trails/ortho_preview.jpg', 'media/terrace_trails/ortho_preview_thumb.jpg', 'orthomosaic', '2026-04-14'),
('b3333333-0000-4000-8000-000000000001', 'a3333333-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
 'media/county_jail_farm/ortho_preview.jpg', 'media/county_jail_farm/ortho_preview_thumb.jpg', 'orthomosaic', '2026-04-14'),
('b3333333-0000-4000-8000-000000000002', 'a3333333-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
 'media/county_jail_farm/DJI_0005.jpg', 'media/county_jail_farm/DJI_0005_thumb.jpg', 'rgb', '2026-04-14'),
('b3333333-0000-4000-8000-000000000003', 'a3333333-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
 'media/county_jail_farm/DJI_0006.jpg', 'media/county_jail_farm/DJI_0006_thumb.jpg', 'rgb', '2026-04-14'),
('b3333333-0000-4000-8000-000000000004', 'a3333333-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
 'media/county_jail_farm/DJI_0007.jpg', 'media/county_jail_farm/DJI_0007_thumb.jpg', 'rgb', '2026-04-14')
on conflict (id) do nothing;

-- ---- seed: species flags ----------------------------------------------------------

insert into public.species_flags (id, parcel_id, species_name, status, lat, lng, flagged_date, notes) values
('c1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
 'Oriental bittersweet', 'monitoring', 42.31585, -72.62055, '2026-04-14',
 'Canopy climb along eastern edge — compare against fall imagery.'),
('c2222222-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
 'Japanese knotweed', 'present', 42.31995, -72.62075, '2026-04-16',
 'Stand near trail junction, roughly 20 ft diameter.')
on conflict (id) do nothing;

-- ---- storage buckets ---------------------------------------------------------------
-- Buckets cannot be created from SQL reliably across Supabase versions;
-- create them in Dashboard → Storage if these inserts error:
--   media  (public)  — field photos uploaded from the app
--   orthos (public)  — clipped orthomosaic tiles per flight

insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('orthos', 'orthos', true)
on conflict (id) do nothing;

-- Allow anonymous uploads to the media bucket (DEMO ONLY — tighten for
-- production with authenticated roles).
drop policy if exists "demo anon upload media" on storage.objects;
create policy "demo anon upload media" on storage.objects
  for insert to anon with check (bucket_id = 'media');
drop policy if exists "demo public read" on storage.objects;
create policy "demo public read" on storage.objects
  for select to anon using (bucket_id in ('media', 'orthos'));
