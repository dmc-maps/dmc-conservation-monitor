// ============================================================
// External reference layers + DMC-collected layers panel.
// Builds the grouped, toggleable layer panel; handles the MI
// bbox suppression, ArcGIS REST GeoJSON queries, drone ortho
// tile layers, flight footprints, species pins, and the custom
// GeoJSON drag-and-drop slot.
// ============================================================

const Layers = (() => {
  const active = {};      // id -> Leaflet layer (external)
  let map = null;
  let dropLayers = [];    // user-dropped GeoJSON layers (not persisted)
  let orthoLayer = null;
  let footprintLayer = null;

  function centerInBbox(b) {
    const c = map.getCenter();
    return c.lng >= b.west && c.lng <= b.east && c.lat >= b.south && c.lat <= b.north;
  }

  function makeWms(def) {
    const layer = L.tileLayer.wms(def.url, {
      ...def.params,
      opacity: def.opacity ?? 1,
      maxZoom: DMC_CONFIG.map.maxZoom,
    });
    return layer;
  }

  // Query an ArcGIS REST layer for GeoJSON within the current extent.
  // Re-queries on moveend while enabled.
  function makeArcGisGeoJson(def, statusEl) {
    const group = L.layerGroup();
    let aborter = null;

    async function refresh() {
      if (!map.hasLayer(group)) return;
      const b = map.getBounds();
      const env = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
      // Generalize geometry to ~1 px at the current zoom so dense
      // polygon layers (e.g. DEP Wetlands) stay responsive.
      const offset = (b.getEast() - b.getWest()) / map.getSize().x;
      const url = `${def.url}/query?where=1%3D1&geometry=${env}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=geojson&resultRecordCount=500&geometryPrecision=6&maxAllowableOffset=${offset}`;
      if (aborter) aborter.abort();
      aborter = new AbortController();
      try {
        statusEl.textContent = "loading…";
        const res = await fetch(url, { signal: aborter.signal });
        if (!res.ok) throw new Error(res.status);
        const gj = await res.json();
        if (gj.error) throw new Error(gj.error.message || "service error");
        group.clearLayers();
        group.addLayer(L.geoJSON(gj, {
          style: def.style,
          onEachFeature: (f, l) => l.bindPopup(`<pre class="gj-props">${escapeHtml(JSON.stringify(f.properties, null, 1))}</pre>`),
        }));
        statusEl.textContent = "";
      } catch (e) {
        if (e.name === "AbortError") return;
        statusEl.textContent = "unavailable";
        console.warn(`[DMC] ${def.label} query failed:`, e.message);
      }
    }

    group.on("add", () => { refresh(); map.on("moveend", refresh); });
    group.on("remove", () => { map.off("moveend", refresh); statusEl.textContent = ""; });
    return group;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---- panel construction -------------------------------------------------

  function buildPanel(mapRef) {
    map = mapRef;
    const groupsWrap = document.getElementById("layers-groups");

    // Render one section per visible group; groups with show:false stay
    // defined in config (nationwide capability) but never display.
    for (const [gid, gdef] of Object.entries(DMC_CONFIG.layerGroups)) {
      if (!gdef.show) continue;
      const defs = DMC_CONFIG.externalLayers.filter((d) => d.group === gid);
      if (!defs.length) continue;

      const section = document.createElement("section");
      const h3 = document.createElement("h3");
      h3.textContent = gdef.label;
      section.appendChild(h3);

      for (const def of defs) {
        const row = document.createElement("label");
        row.className = "layer-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        const txt = document.createElement("span");
        txt.textContent = def.label;
        const status = document.createElement("em");
        status.className = "layer-status";
        row.append(cb, txt, status);
        section.appendChild(row);

        cb.addEventListener("change", () => {
          if (cb.checked) {
            if (!active[def.id]) {
              active[def.id] = def.type === "wms" ? makeWms(def) : makeArcGisGeoJson(def, status);
            }
            active[def.id].addTo(map);
          } else if (active[def.id]) {
            map.removeLayer(active[def.id]);
          }
        });
      }

      groupsWrap.appendChild(section);

      // Regional groups appear only while the map center is in-region.
      if (gdef.bbox) {
        const sync = () => { section.style.display = centerInBbox(gdef.bbox) ? "" : "none"; };
        map.on("moveend", sync);
        sync();
      }
    }

    setupDropSlot();
  }

  // ---- DMC-collected: drone ortho + footprint ------------------------------

  function showFlight(flight) {
    clearFlight();
    if (!flight) return;
    if (flight.footprint_geojson && document.getElementById("toggle-footprints").checked) {
      footprintLayer = L.geoJSON(flight.footprint_geojson, {
        style: { color: "#c8b89a", weight: 2, dashArray: "6 4", fill: false },
      }).addTo(map);
    }
    if (flight.orthomosaic_url && document.getElementById("toggle-orthos").checked) {
      let b = null;
      if (flight.footprint_geojson) b = L.geoJSON(flight.footprint_geojson).getBounds();
      orthoLayer = L.tileLayer(flight.orthomosaic_url, {
        minZoom: 14,
        maxNativeZoom: 21,
        maxZoom: DMC_CONFIG.map.maxZoom,
        bounds: b || undefined,
        opacity: 1,
      }).addTo(map);
    }
  }

  function clearFlight() {
    if (orthoLayer) { map.removeLayer(orthoLayer); orthoLayer = null; }
    if (footprintLayer) { map.removeLayer(footprintLayer); footprintLayer = null; }
  }

  // ---- custom GeoJSON drag-and-drop ----------------------------------------

  function setupDropSlot() {
    const mapEl = document.getElementById("map");
    const listEl = document.getElementById("layers-dropped");

    mapEl.addEventListener("dragover", (e) => { e.preventDefault(); mapEl.classList.add("dropping"); });
    mapEl.addEventListener("dragleave", () => mapEl.classList.remove("dropping"));
    mapEl.addEventListener("drop", async (e) => {
      e.preventDefault();
      mapEl.classList.remove("dropping");
      for (const file of e.dataTransfer.files) {
        if (!/\.(geo)?json$/i.test(file.name)) continue;
        try {
          const gj = JSON.parse(await file.text());
          const layer = L.geoJSON(gj, {
            style: { color: "#9ecae1", weight: 2 },
            pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 6, color: "#9ecae1", fillOpacity: 0.7 }),
            onEachFeature: (f, l) => f.properties && l.bindPopup(`<pre class="gj-props">${escapeHtml(JSON.stringify(f.properties, null, 1))}</pre>`),
          }).addTo(map);
          dropLayers.push(layer);
          map.fitBounds(layer.getBounds(), { padding: [40, 40] });

          const row = document.createElement("label");
          row.className = "layer-row";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = true;
          cb.addEventListener("change", () => cb.checked ? layer.addTo(map) : map.removeLayer(layer));
          const txt = document.createElement("span");
          txt.textContent = file.name;
          const rm = document.createElement("button");
          rm.className = "layer-remove";
          rm.textContent = "×";
          rm.title = "Remove (session only — dropped layers are never saved)";
          rm.addEventListener("click", (ev) => { ev.preventDefault(); map.removeLayer(layer); row.remove(); });
          row.append(cb, txt, rm);
          listEl.appendChild(row);
        } catch (err) {
          alert(`Could not read ${file.name}: ${err.message}`);
        }
      }
    });
  }

  return { buildPanel, showFlight, clearFlight };
})();
