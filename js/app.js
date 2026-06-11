// ============================================================
// App bootstrap — loads data, renders dashboard header,
// coordinates map / panel / modal.
// ============================================================

const App = (() => {
  let data = null;

  const el = (id) => document.getElementById(id);

  function renderDashboard() {
    el("stat-parcels").textContent = data.parcels.length;
    el("stat-alerts").textContent = data.parcels.filter((p) => p.status !== "stable").length;

    const dates = [
      ...data.observations.map((o) => o.date),
      ...data.flight_history.map((f) => f.flight_date),
    ].filter(Boolean).sort();
    el("stat-updated").textContent = dates.length ? dates.at(-1) : "—";

    const upcoming = data.parcels.map((p) => p.next_flight_date).filter(Boolean).sort();
    el("stat-next-flight").textContent = upcoming.length ? upcoming[0] : "—";

    const badge = el("conn-badge");
    if (DB.mode === "local") {
      badge.textContent = "demo data (local)";
      badge.title = "Supabase tables not found — run schema.sql, then reload. Entries save to this browser only.";
      badge.classList.add("local");
    } else {
      badge.textContent = "supabase: connected";
      badge.classList.remove("local");
    }
  }

  function selectParcel(parcelId) {
    const parcel = data.parcels.find((p) => p.id === parcelId);
    const flights = data.flight_history.filter((f) => f.parcel_id === parcelId);
    MapView.selectParcel(parcel, flights);
    Panel.show(parcelId, data);
  }

  function deselect() {
    MapView.selectParcel(null, []);
  }

  async function reload() {
    data = await DB.fetchAll();
    renderDashboard();
    MapView.renderSpecies(data.species_flags);
    Panel.refresh(data);
  }

  async function init() {
    await DB.init();
    data = await DB.fetchAll();

    MapView.init();
    MapView.renderParcels(data.parcels, selectParcel);
    MapView.renderSpecies(data.species_flags);
    renderDashboard();
    Panel.wire();
    Modal.wire();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { reload, deselect, get data() { return data; } };
})();
