// ============================================================
// Per-parcel side panel — identity, status, gallery, filterable
// observation log, species flag list, lightbox.
// ============================================================

const Panel = (() => {
  let data = null;
  let parcel = null;
  let typeFilter = "all";

  const el = (id) => document.getElementById(id);

  function fmtDate(d) {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${m}/${day}/${y}`;
  }

  function show(parcelId, allData) {
    data = allData;
    parcel = data.parcels.find((p) => p.id === parcelId);
    if (!parcel) return;

    el("side-panel").classList.remove("hidden");
    el("panel-name").textContent = parcel.name;
    el("panel-acreage").textContent = parcel.acreage != null ? `${parcel.acreage} ac` : "acreage TBD";

    const badge = el("panel-status");
    const st = DMC_CONFIG.status[parcel.status] || DMC_CONFIG.status.stable;
    badge.textContent = st.label;
    badge.style.background = st.color;
    badge.style.color = parcel.status === "watch" ? "#1a2e1a" : "#f2ede4";

    const flights = data.flight_history.filter((f) => f.parcel_id === parcel.id);
    const last = flights.length ? flights.map((f) => f.flight_date).sort().at(-1) : null;
    el("panel-last-flight").textContent = fmtDate(last);
    el("panel-next-flight").textContent = fmtDate(parcel.next_flight_date);

    renderGallery();
    renderObservations();
    renderSpecies();
  }

  function hide() {
    el("side-panel").classList.add("hidden");
    parcel = null;
  }

  // ---- gallery + lightbox ----

  function renderGallery() {
    const wrap = el("panel-gallery");
    wrap.innerHTML = "";
    const items = data.media.filter((m) => m.parcel_id === parcel.id);
    el("panel-gallery-empty").style.display = items.length ? "none" : "";
    for (const m of items) {
      const img = document.createElement("img");
      img.src = m.thumbnail_path || m.storage_path;
      img.alt = m.media_type;
      img.loading = "lazy";
      img.title = `${m.media_type} · ${fmtDate(m.capture_date)}`;
      img.addEventListener("click", () => openLightbox(m));
      wrap.appendChild(img);
    }
  }

  function openLightbox(m) {
    el("lightbox-img").src = m.storage_path;
    el("lightbox-caption").textContent = `${parcel.name} — ${m.media_type} · ${fmtDate(m.capture_date)}`;
    el("lightbox").classList.remove("hidden");
  }

  // ---- observations ----

  function renderObservations() {
    const list = el("panel-observations");
    list.innerHTML = "";
    let items = data.observations.filter((o) => o.parcel_id === parcel.id);
    if (typeFilter !== "all") items = items.filter((o) => o.type === typeFilter);
    items.sort((a, b) => b.date.localeCompare(a.date));
    el("panel-obs-empty").style.display = items.length ? "none" : "";
    for (const o of items) {
      const li = document.createElement("li");
      li.innerHTML = `<div class="obs-head"><span class="obs-type">${o.type.replace(/_/g, " ")}</span><span class="obs-date">${fmtDate(o.date)}</span></div><p>${o.notes || ""}</p><span class="obs-by">${o.created_by || ""}</span>`;
      list.appendChild(li);
    }
  }

  // ---- species flags ----

  function renderSpecies() {
    const list = el("panel-species");
    list.innerHTML = "";
    const items = data.species_flags.filter((s) => s.parcel_id === parcel.id);
    el("panel-species-empty").style.display = items.length ? "none" : "";
    for (const s of items) {
      const li = document.createElement("li");
      li.className = `species-${s.status}`;
      li.innerHTML = `<strong>${s.species_name}</strong> <span class="sp-status">${s.status}</span><br><span class="sp-date">${fmtDate(s.flagged_date)}</span> ${s.notes || ""}`;
      li.addEventListener("mouseenter", () => MapView.highlightSpecies(s.id, true));
      li.addEventListener("mouseleave", () => MapView.highlightSpecies(s.id, false));
      list.appendChild(li);
    }
  }

  function wire() {
    el("panel-close").addEventListener("click", () => { hide(); App.deselect(); });
    el("obs-filter").addEventListener("change", (e) => { typeFilter = e.target.value; renderObservations(); });
    el("lightbox").addEventListener("click", () => el("lightbox").classList.add("hidden"));
    el("btn-add-observation").addEventListener("click", () => Modal.open(parcel));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") el("lightbox").classList.add("hidden"); });
  }

  function refresh(allData) { if (parcel) show(parcel.id, allData); }

  return { show, hide, wire, refresh, get parcel() { return parcel; } };
})();
