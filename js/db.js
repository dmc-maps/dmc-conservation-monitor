// ============================================================
// Data access layer — Supabase PostgREST with local fallback.
// If the Supabase tables are missing (schema.sql not yet run)
// the app transparently switches to the bundled SEED data and
// keeps demo writes in localStorage, so the hosted demo always
// works.
// ============================================================

const DB = (() => {
  const SB = DMC_CONFIG.supabase;
  const REST = `${SB.url}/rest/v1`;
  const HEADERS = {
    apikey: SB.anonKey,
    Authorization: `Bearer ${SB.anonKey}`,
    "Content-Type": "application/json",
  };
  const LS_KEY = "dmc_demo_writes_v1";

  let mode = "supabase"; // or "local"
  const local = { parcels: [], observations: [], media: [], species_flags: [], flight_history: [] };

  function loadLocal() {
    for (const t of Object.keys(local)) local[t] = JSON.parse(JSON.stringify(SEED[t] || []));
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      for (const t of Object.keys(local)) if (saved[t]) local[t] = local[t].concat(saved[t]);
      const deleted = new Set(saved._deleted || []);
      if (deleted.size) for (const t of Object.keys(local)) local[t] = local[t].filter((r) => !deleted.has(r.id));
    } catch (e) { /* corrupt localStorage — ignore */ }
  }

  function persistLocal(table, row) {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      (saved[table] = saved[table] || []).push(row);
      localStorage.setItem(LS_KEY, JSON.stringify(saved));
    } catch (e) { /* quota — non-fatal for a demo */ }
  }

  async function rest(path, options = {}) {
    const res = await fetch(`${REST}/${path}`, { ...options, headers: { ...HEADERS, ...(options.headers || {}) } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }

  // Probe with explicit columns so a legacy/mismatched table 400s
  // instead of returning unusable rows.
  async function init() {
    try {
      await rest("parcels?select=id,name,acreage,status,geometry,next_flight_date&limit=1");
      mode = "supabase";
    } catch (e) {
      mode = "local";
      loadLocal();
      console.warn("[DMC] Supabase schema unavailable — running on bundled demo data.", e.message);
    }
    return mode;
  }

  async function fetchAll() {
    if (mode === "local") {
      return JSON.parse(JSON.stringify(local));
    }
    const [parcels, observations, media, species_flags, flight_history] = await Promise.all([
      rest("parcels?select=*&order=name"),
      rest("observations?select=*&order=date.desc"),
      rest("media?select=*&order=capture_date.desc"),
      rest("species_flags?select=*&order=flagged_date.desc"),
      rest("flight_history?select=*&order=flight_date"),
    ]);
    return { parcels, observations, media, species_flags, flight_history };
  }

  async function insert(table, row) {
    if (mode === "local") {
      row.id = row.id || crypto.randomUUID();
      row.created_at = new Date().toISOString();
      local[table].push(row);
      persistLocal(table, row);
      return row;
    }
    const rows = await rest(table, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    return rows[0];
  }

  // Delete an observation and any media rows attached to it.
  async function deleteObservation(id) {
    if (mode === "local") {
      const removedIds = [id, ...local.media.filter((m) => m.observation_id === id).map((m) => m.id)];
      local.observations = local.observations.filter((o) => o.id !== id);
      local.media = local.media.filter((m) => m.observation_id !== id);
      try {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        for (const t of ["observations", "media"]) if (saved[t]) saved[t] = saved[t].filter((r) => !removedIds.includes(r.id));
        saved._deleted = [...new Set([...(saved._deleted || []), ...removedIds])];
        localStorage.setItem(LS_KEY, JSON.stringify(saved));
      } catch (e) { /* non-fatal for a demo */ }
      return;
    }
    await rest(`media?observation_id=eq.${id}`, { method: "DELETE" });
    await rest(`observations?id=eq.${id}`, { method: "DELETE" });
  }

  // Upload to Supabase Storage; returns a public URL. In local mode
  // (or if storage policies reject the write) returns a data URL so
  // the demo flow still completes.
  async function uploadMedia(file, path) {
    if (mode === "supabase") {
      try {
        const res = await fetch(`${SB.url}/storage/v1/object/${SB.storageBucket}/${path}`, {
          method: "POST",
          headers: { apikey: SB.anonKey, Authorization: `Bearer ${SB.anonKey}`, "Content-Type": file.type },
          body: file,
        });
        if (res.ok) return `${SB.url}/storage/v1/object/public/${SB.storageBucket}/${path}`;
        console.warn("[DMC] Storage upload rejected, falling back to inline preview.");
      } catch (e) { /* network — fall through */ }
    }
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
  }

  return { init, fetchAll, insert, deleteObservation, uploadMedia, get mode() { return mode; } };
})();
