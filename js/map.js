// ============================================================
// Map core — Leaflet init, base layers, parcel polygons,
// species pins, flight date slider.
// ============================================================

const MapView = (() => {
  let map = null;
  const parcelLayers = {};   // parcel_id -> L.geoJSON
  const speciesMarkers = {}; // species_flag_id -> marker
  let speciesGroup = null;
  let selectedParcelId = null;
  let parcelFlights = [];    // flights for the selected parcel, sorted

  function init() {
    map = L.map("map", { zoomControl: false, maxZoom: DMC_CONFIG.map.maxZoom })
      .setView(DMC_CONFIG.map.center, DMC_CONFIG.map.zoom);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ imperial: true, position: "bottomleft" }).addTo(map);

    const bases = {};
    for (const [key, def] of Object.entries(DMC_CONFIG.baseLayers)) {
      bases[def.label] = L.tileLayer(def.url, def.options);
    }
    bases[DMC_CONFIG.baseLayers.osm.label].addTo(map);
    L.control.layers(bases, null, { position: "bottomright" }).addTo(map);

    speciesGroup = L.layerGroup().addTo(map);
    Layers.buildPanel(map);

    document.getElementById("toggle-orthos").addEventListener("change", refreshFlightLayer);
    document.getElementById("toggle-footprints").addEventListener("change", refreshFlightLayer);
    document.getElementById("toggle-species").addEventListener("change", (e) => {
      e.target.checked ? speciesGroup.addTo(map) : map.removeLayer(speciesGroup);
    });

    const slider = document.getElementById("flight-slider");
    slider.addEventListener("input", () => {
      const f = parcelFlights[Number(slider.value)];
      document.getElementById("flight-slider-date").textContent = f ? f.flight_date : "—";
      document.getElementById("flight-slider-note").textContent =
        f ? (f.orthomosaic_url ? "orthomosaic + footprint" : "footprint only — no tiled imagery") : "";
      Layers.showFlight(f);
    });

    return map;
  }

  function statusColor(status) {
    return (DMC_CONFIG.status[status] || DMC_CONFIG.status.stable).color;
  }

  function renderParcels(parcels, onSelect) {
    for (const p of parcels) {
      if (!p.geometry) continue;
      const layer = L.geoJSON(p.geometry, {
        style: {
          color: statusColor(p.status),
          weight: 2.5,
          fillColor: statusColor(p.status),
          fillOpacity: 0.18,
        },
      }).addTo(map);
      layer.bindTooltip(p.name, { sticky: true, className: "parcel-tip" });
      layer.on("click", () => onSelect(p.id));
      layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.35 }));
      layer.on("mouseout", () => { if (selectedParcelId !== p.id) layer.setStyle({ fillOpacity: 0.18 }); });
      parcelLayers[p.id] = layer;
    }
  }

  function selectParcel(parcel, flights) {
    selectedParcelId = parcel ? parcel.id : null;
    for (const [pid, layer] of Object.entries(parcelLayers)) {
      layer.setStyle({ weight: pid === selectedParcelId ? 4 : 2.5, fillOpacity: pid === selectedParcelId ? 0.3 : 0.18 });
    }
    const bar = document.getElementById("flight-bar");
    Layers.clearFlight();
    parcelFlights = (flights || []).slice().sort((a, b) => a.flight_date.localeCompare(b.flight_date));

    if (!parcel) { bar.classList.add("hidden"); return; }

    map.fitBounds(parcelLayers[parcel.id].getBounds(), {
      padding: [40, 40],
      paddingTopLeft: [40, 40],
      paddingBottomRight: [440, 40], // keep parcel clear of the side panel
      maxZoom: 18,
    });

    if (parcelFlights.length) {
      const slider = document.getElementById("flight-slider");
      slider.max = parcelFlights.length - 1;
      slider.value = parcelFlights.length - 1;
      slider.dispatchEvent(new Event("input"));
      document.getElementById("flight-bar-parcel").textContent = parcel.name;
      bar.classList.remove("hidden");
    } else {
      bar.classList.add("hidden");
    }
  }

  function refreshFlightLayer() {
    const slider = document.getElementById("flight-slider");
    Layers.showFlight(parcelFlights[Number(slider.value)]);
  }

  function renderSpecies(flags) {
    speciesGroup.clearLayers();
    for (const k of Object.keys(speciesMarkers)) delete speciesMarkers[k];
    for (const f of flags) {
      if (f.lat == null || f.lng == null) continue;
      const m = L.circleMarker([f.lat, f.lng], {
        radius: 7,
        color: "#1a2e1a",
        weight: 1.5,
        fillColor: f.status === "treated" ? "#74c69d" : f.status === "monitoring" ? "#f4a261" : "#e63946",
        fillOpacity: 0.9,
      }).bindPopup(
        `<strong>${f.species_name}</strong><br>${f.status} · ${f.flagged_date || ""}<br>${f.notes || ""}`
      );
      m.addTo(speciesGroup);
      speciesMarkers[f.id] = m;
    }
  }

  function highlightSpecies(id, on) {
    const m = speciesMarkers[id];
    if (!m) return;
    m.setStyle({ radius: on ? 11 : 7, weight: on ? 3 : 1.5, color: on ? "#f2ede4" : "#1a2e1a" });
    if (on) m.bringToFront();
  }

  // Click-to-place mode for new species pins: resolves with latlng.
  function pickPoint() {
    return new Promise((resolve) => {
      const mapEl = document.getElementById("map");
      mapEl.classList.add("picking");
      map.once("click", (e) => {
        mapEl.classList.remove("picking");
        resolve(e.latlng);
      });
    });
  }

  return { init, renderParcels, selectParcel, renderSpecies, highlightSpecies, pickPoint, get map() { return map; } };
})();
