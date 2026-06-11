// ============================================================
// Local seed data — mirrors schema.sql seed inserts.
// Used as a fallback when the Supabase tables are not yet
// created, so the GitHub Pages demo is never blank.
// Parcel geometries are real MassGIS L3 assessor boundaries
// (EPSG:4326). Sheldon Field is an approximate placeholder —
// see IMAGERY_SWAP.md.
// ============================================================

const SEED = {
  parcels: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Montview",
      acreage: 3.246,
      status: "stable",
      next_flight_date: "2026-10-15",
      geometry: {
        type: "Polygon",
        coordinates: [[[-72.6221776, 42.3166427], [-72.621439, 42.31633], [-72.6201798, 42.3157598], [-72.6207932, 42.3150363], [-72.62137, 42.3152857], [-72.6208787, 42.3159117], [-72.6214058, 42.3161396], [-72.6218972, 42.3155137], [-72.6221861, 42.3156386], [-72.6224043, 42.3156351], [-72.6223854, 42.3158033], [-72.6224208, 42.3159477], [-72.6223951, 42.3161374], [-72.6223244, 42.3163183], [-72.6222259, 42.3165108], [-72.6221776, 42.3166427]]],
      },
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Terrace Trails",
      acreage: 8.794,
      status: "stable",
      next_flight_date: "2026-10-15",
      geometry: {
        type: "Polygon",
        coordinates: [[[-72.6218421, 42.3194483], [-72.620934, 42.3205148], [-72.6208643, 42.3205035], [-72.620445, 42.3204355], [-72.6199817, 42.3210503], [-72.6199097, 42.3210379], [-72.6200264, 42.3208744], [-72.61949, 42.3206992], [-72.6200698, 42.3198846], [-72.6202838, 42.319584], [-72.6204544, 42.3193442], [-72.6205541, 42.3192042], [-72.620679, 42.3190287], [-72.6212144, 42.3182765], [-72.6215415, 42.3184479], [-72.6221915, 42.319038], [-72.6218421, 42.3194483]]],
      },
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "County Jail Farm",
      acreage: 3.0,
      status: "stable",
      next_flight_date: "2026-10-15",
      geometry: {
        type: "Polygon",
        coordinates: [[[-72.6168693, 42.3186578], [-72.6171415, 42.3183107], [-72.6202838, 42.319584], [-72.6200698, 42.3198846], [-72.6168693, 42.3186578]]],
      },
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Sheldon Field",
      acreage: null,
      status: "stable",
      next_flight_date: null,
      // PLACEHOLDER geometry — real boundary and prior flight data are
      // archived offline and not yet loaded. See IMAGERY_SWAP.md.
      geometry: {
        type: "Polygon",
        coordinates: [[[-72.6157, 42.3296], [-72.6131, 42.3290], [-72.6126, 42.3273], [-72.6149, 42.3268], [-72.6162, 42.3281], [-72.6157, 42.3296]]],
      },
    },
  ],

  flight_history: [
    {
      id: "f1111111-1111-4111-8111-111111111111",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      flight_date: "2026-04-14",
      orthomosaic_url: "tiles/montview/2026-04-14/{z}/{x}/{y}.webp",
      notes: "Spring baseline flight. 5 cm GSD, WebODM orthomosaic clipped to parcel.",
      footprint_geojson: {
        type: "Polygon",
        coordinates: [[[-72.622394, 42.315025], [-72.620208, 42.315025], [-72.620208, 42.316647], [-72.622394, 42.316647], [-72.622394, 42.315025]]],
      },
    },
    {
      id: "f1111111-1111-4111-8111-111111111112",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      flight_date: "2025-10-02",
      orthomosaic_url: null,
      notes: "Fall reference flight — imagery archived offline, not yet tiled.",
      footprint_geojson: {
        type: "Polygon",
        coordinates: [[[-72.622394, 42.315025], [-72.620208, 42.315025], [-72.620208, 42.316647], [-72.622394, 42.316647], [-72.622394, 42.315025]]],
      },
    },
    {
      id: "f2222222-2222-4222-8222-222222222221",
      parcel_id: "22222222-2222-4222-8222-222222222222",
      flight_date: "2026-04-14",
      orthomosaic_url: "tiles/terrace_trails/2026-04-14/{z}/{x}/{y}.webp",
      notes: "Spring baseline flight. 5 cm GSD, WebODM orthomosaic clipped to parcel.",
      footprint_geojson: {
        type: "Polygon",
        coordinates: [[[-72.622114, 42.318242], [-72.619583, 42.318242], [-72.619583, 42.321094], [-72.622114, 42.321094], [-72.622114, 42.318242]]],
      },
    },
    {
      id: "f3333333-3333-4333-8333-333333333331",
      parcel_id: "33333333-3333-4333-8333-333333333333",
      flight_date: "2026-04-14",
      orthomosaic_url: "tiles/county_jail_farm/2026-04-14/{z}/{x}/{y}.webp",
      notes: "Spring baseline flight. 5 cm GSD, WebODM orthomosaic clipped to parcel.",
      footprint_geojson: {
        type: "Polygon",
        coordinates: [[[-72.620628, 42.318028], [-72.616528, 42.318028], [-72.616528, 42.320167], [-72.620628, 42.320167], [-72.620628, 42.318028]]],
      },
    },
  ],

  observations: [
    {
      id: "a1111111-0000-4000-8000-000000000001",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      date: "2026-04-14",
      type: "drone_flight",
      notes: "Spring baseline orthomosaic flight. Full parcel coverage at 5 cm GSD.",
      created_by: "Devin Clark",
    },
    {
      id: "a1111111-0000-4000-8000-000000000002",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      date: "2026-04-14",
      type: "field_note",
      notes: "Bittersweet observed climbing canopy edge along the eastern boundary. Flagged for fall comparison.",
      created_by: "Devin Clark",
    },
    {
      id: "a2222222-0000-4000-8000-000000000001",
      parcel_id: "22222222-2222-4222-8222-222222222222",
      date: "2026-04-14",
      type: "drone_flight",
      notes: "Spring baseline orthomosaic flight covering trail network and meadow.",
      created_by: "Devin Clark",
    },
    {
      id: "a2222222-0000-4000-8000-000000000002",
      parcel_id: "22222222-2222-4222-8222-222222222222",
      date: "2026-04-16",
      type: "gps_survey",
      notes: "Trail network GPS survey — centerlines collected for print layout revision.",
      created_by: "Devin Clark",
    },
    {
      id: "a3333333-0000-4000-8000-000000000001",
      parcel_id: "33333333-3333-4333-8333-333333333333",
      date: "2026-04-14",
      type: "drone_flight",
      notes: "Spring baseline orthomosaic flight along Venturers Field Rd frontage.",
      created_by: "Devin Clark",
    },
    {
      id: "a4444444-0000-4000-8000-000000000001",
      parcel_id: "44444444-4444-4444-8444-444444444444",
      date: "2026-06-02",
      type: "field_note",
      notes: "Placeholder parcel — boundary and prior flight data archived offline, not yet loaded into this platform.",
      created_by: "Devin Clark",
    },
  ],

  media: [
    {
      id: "b1111111-0000-4000-8000-000000000001",
      observation_id: "a1111111-0000-4000-8000-000000000001",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      storage_path: "media/montview/ortho_preview.jpg",
      thumbnail_path: "media/montview/ortho_preview_thumb.jpg",
      media_type: "orthomosaic",
      capture_date: "2026-04-14",
    },
    {
      id: "b1111111-0000-4000-8000-000000000002",
      observation_id: "a1111111-0000-4000-8000-000000000001",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      storage_path: "media/montview/DJI_0444.jpg",
      thumbnail_path: "media/montview/DJI_0444_thumb.jpg",
      media_type: "rgb",
      capture_date: "2026-04-14",
    },
    {
      id: "b1111111-0000-4000-8000-000000000003",
      observation_id: "a1111111-0000-4000-8000-000000000001",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      storage_path: "media/montview/DJI_0445.jpg",
      thumbnail_path: "media/montview/DJI_0445_thumb.jpg",
      media_type: "rgb",
      capture_date: "2026-04-14",
    },
    {
      id: "b1111111-0000-4000-8000-000000000004",
      observation_id: "a1111111-0000-4000-8000-000000000001",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      storage_path: "media/montview/DJI_0446.jpg",
      thumbnail_path: "media/montview/DJI_0446_thumb.jpg",
      media_type: "rgb",
      capture_date: "2026-04-14",
    },
    {
      id: "b2222222-0000-4000-8000-000000000001",
      observation_id: "a2222222-0000-4000-8000-000000000001",
      parcel_id: "22222222-2222-4222-8222-222222222222",
      storage_path: "media/terrace_trails/ortho_preview.jpg",
      thumbnail_path: "media/terrace_trails/ortho_preview_thumb.jpg",
      media_type: "orthomosaic",
      capture_date: "2026-04-14",
    },
    {
      id: "b3333333-0000-4000-8000-000000000001",
      observation_id: "a3333333-0000-4000-8000-000000000001",
      parcel_id: "33333333-3333-4333-8333-333333333333",
      storage_path: "media/county_jail_farm/ortho_preview.jpg",
      thumbnail_path: "media/county_jail_farm/ortho_preview_thumb.jpg",
      media_type: "orthomosaic",
      capture_date: "2026-04-14",
    },
    {
      id: "b3333333-0000-4000-8000-000000000002",
      observation_id: "a3333333-0000-4000-8000-000000000001",
      parcel_id: "33333333-3333-4333-8333-333333333333",
      storage_path: "media/county_jail_farm/DJI_0005.jpg",
      thumbnail_path: "media/county_jail_farm/DJI_0005_thumb.jpg",
      media_type: "rgb",
      capture_date: "2026-04-14",
    },
    {
      id: "b3333333-0000-4000-8000-000000000003",
      observation_id: "a3333333-0000-4000-8000-000000000001",
      parcel_id: "33333333-3333-4333-8333-333333333333",
      storage_path: "media/county_jail_farm/DJI_0006.jpg",
      thumbnail_path: "media/county_jail_farm/DJI_0006_thumb.jpg",
      media_type: "rgb",
      capture_date: "2026-04-14",
    },
    {
      id: "b3333333-0000-4000-8000-000000000004",
      observation_id: "a3333333-0000-4000-8000-000000000001",
      parcel_id: "33333333-3333-4333-8333-333333333333",
      storage_path: "media/county_jail_farm/DJI_0007.jpg",
      thumbnail_path: "media/county_jail_farm/DJI_0007_thumb.jpg",
      media_type: "rgb",
      capture_date: "2026-04-14",
    },
  ],

  species_flags: [
    {
      id: "c1111111-0000-4000-8000-000000000001",
      parcel_id: "11111111-1111-4111-8111-111111111111",
      species_name: "Oriental bittersweet",
      status: "monitoring",
      lat: 42.31585,
      lng: -72.62055,
      flagged_date: "2026-04-14",
      notes: "Canopy climb along eastern edge — compare against fall imagery.",
    },
    {
      id: "c2222222-0000-4000-8000-000000000001",
      parcel_id: "22222222-2222-4222-8222-222222222222",
      species_name: "Japanese knotweed",
      status: "present",
      lat: 42.31995,
      lng: -72.62075,
      flagged_date: "2026-04-16",
      notes: "Stand near trail junction, roughly 20 ft diameter.",
    },
  ],
};
