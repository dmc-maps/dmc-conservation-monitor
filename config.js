// ============================================================
// DMC Conservation Monitor — client configuration
// Per-client deploys swap this file only. See README.md
// ("New client onboarding") for the full checklist.
// ============================================================

const DMC_CONFIG = {
  client: {
    name: "Meadow City Conservation Coalition",
    shortName: "MCCC",
    region: "Northampton / Florence, MA",
  },

  supabase: {
    url: "https://vilffekbihdbudjctrnx.supabase.co",
    // Publishable anon key — safe to ship client-side. RLS policies
    // govern access (off for this demo; enable before production).
    anonKey: "sb_publishable_txRepQ3hEEx43YjbYmkRwg_9VuF_sYq",
    storageBucket: "media",
    orthoBucket: "orthos",
  },

  map: {
    center: [42.3185, -72.6195],
    zoom: 15,
    maxZoom: 22,
  },

  status: {
    stable: { color: "#2d6a4f", label: "Stable" },
    watch: { color: "#f4a261", label: "Watch" },
    action_required: { color: "#e63946", label: "Action Required" },
  },

  // Layer panel groups. The national group ships with every deploy but
  // is hidden for MCCC (show: false) — flip to true for clients that
  // want nationwide layers; the definitions below stay intact either
  // way. Groups with a bbox only appear while the map center is inside
  // that region.
  layerGroups: {
    national: { label: "National", show: false },
    massachusetts: { label: "Massachusetts", show: true, bbox: { west: -73.6, east: -69.9, south: 41.2, north: 42.9 } },
    michigan: { label: "Michigan", show: true, bbox: { west: -90.4, east: -82.4, south: 41.7, north: 48.3 } },
  },

  baseLayers: {
    osm: {
      label: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: { maxZoom: 22, maxNativeZoom: 19, attribution: "&copy; OpenStreetMap contributors" },
    },
    satellite: {
      label: "Esri World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: { maxZoom: 22, maxNativeZoom: 19, attribution: "Esri, Maxar, Earthstar Geographics" },
    },
  },

  // External reference layers, grouped for the layer panel.
  externalLayers: [
    {
      id: "nwi_wetlands",
      group: "national",
      label: "NWI Wetlands",
      type: "wms",
      url: "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer",
      params: { layers: "1", format: "image/png", transparent: true },
    },
    {
      id: "usgs_hillshade",
      group: "national",
      label: "USGS 3DEP Hillshade",
      type: "wms",
      url: "https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer",
      params: { layers: "3DEPElevation:Hillshade Gray", format: "image/png", transparent: true },
      opacity: 0.55,
    },
    {
      id: "usgs_hydro",
      group: "national",
      label: "USGS Hydrography",
      type: "wms",
      url: "https://hydro.nationalmap.gov/arcgis/services/NHDPlus/MapServer/WMSServer",
      params: { layers: "1", format: "image/png", transparent: true },
    },
    {
      id: "fema_flood",
      group: "national",
      label: "FEMA Flood Zones",
      type: "wms",
      url: "https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WMSServer",
      params: { layers: "28", format: "image/png", transparent: true },
      opacity: 0.6,
    },
    {
      id: "ma_dep_wetlands",
      group: "massachusetts",
      label: "MA: DEP Wetlands",
      type: "arcgis-geojson",
      url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/DEP_Wetlands_FieldMaps/MapServer/1",
      style: { color: "#4a90a4", weight: 1, fillOpacity: 0.3 },
    },
    {
      id: "ma_open_space",
      group: "massachusetts",
      label: "MA: Protected Open Space",
      type: "arcgis-geojson",
      url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/openspace/MapServer/0",
      style: { color: "#74c69d", weight: 1, fillOpacity: 0.2 },
    },
    {
      id: "ma_nhesp_habitat",
      group: "massachusetts",
      label: "MA: NHESP Priority Habitat",
      type: "arcgis-geojson",
      url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/NHESP_Priority_Habitats/MapServer/0",
      style: { color: "#b07aa1", weight: 1, fillOpacity: 0.25 },
    },
    {
      id: "mi_egle_nwi",
      group: "michigan",
      label: "MI: EGLE Wetlands (NWI)",
      type: "arcgis-geojson",
      url: "https://gisagoegle.state.mi.us/arcgis/rest/services/EGLE/WrdOpenData/MapServer/9",
      style: { color: "#4a90a4", weight: 1, fillOpacity: 0.25 },
    },
    {
      id: "mi_dnr_lands",
      group: "michigan",
      label: "MI: DNR Protected Lands",
      type: "arcgis-geojson",
      // Best-known REST endpoint from the MI DNR open data hub; if the
      // request fails the panel shows "unavailable". Fallback documented
      // in README.md ("Michigan layers").
      url: "https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/DNR_Managed_Lands/FeatureServer/0",
      style: { color: "#2d6a4f", weight: 1, fillOpacity: 0.2 },
    },
  ],
};
