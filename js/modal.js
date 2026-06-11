// ============================================================
// Data entry modal — observation (date/type/notes/file upload)
// and species flag with click-to-place pin.
// ============================================================

const Modal = (() => {
  let parcel = null;
  let pinLatLng = null;

  const el = (id) => document.getElementById(id);

  function open(p) {
    parcel = p;
    pinLatLng = null;
    el("modal-parcel-name").textContent = p.name;
    el("obs-form").reset();
    el("species-fields").classList.add("hidden");
    el("pin-status").textContent = "";
    el("obs-date").value = new Date().toISOString().slice(0, 10);
    el("modal").classList.remove("hidden");
  }

  function close() {
    el("modal").classList.add("hidden");
  }

  function wire() {
    el("modal-close").addEventListener("click", close);
    el("modal").addEventListener("click", (e) => { if (e.target === el("modal")) close(); });

    el("obs-species-toggle").addEventListener("change", (e) => {
      el("species-fields").classList.toggle("hidden", !e.target.checked);
    });

    el("btn-place-pin").addEventListener("click", async (e) => {
      e.preventDefault();
      el("pin-status").textContent = "click the map to place the pin…";
      el("modal").classList.add("minimized");
      const ll = await MapView.pickPoint();
      pinLatLng = ll;
      el("modal").classList.remove("minimized");
      el("pin-status").textContent = `pin: ${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
    });

    el("obs-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = el("obs-submit");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const obs = await DB.insert("observations", {
          parcel_id: parcel.id,
          date: el("obs-date").value,
          type: el("obs-type").value,
          notes: el("obs-notes").value,
          created_by: el("obs-author").value || "field demo",
        });

        const file = el("obs-file").files[0];
        if (file) {
          const path = `${parcel.name.toLowerCase().replace(/\s+/g, "_")}/${Date.now()}_${file.name}`;
          const url = await DB.uploadMedia(file, path);
          await DB.insert("media", {
            observation_id: obs.id,
            parcel_id: parcel.id,
            storage_path: url,
            thumbnail_path: url,
            media_type: el("obs-media-type").value,
            capture_date: el("obs-date").value,
          });
        }

        if (el("obs-species-toggle").checked && el("species-name").value) {
          await DB.insert("species_flags", {
            parcel_id: parcel.id,
            species_name: el("species-name").value,
            status: el("species-status").value,
            lat: pinLatLng ? pinLatLng.lat : null,
            lng: pinLatLng ? pinLatLng.lng : null,
            flagged_date: el("obs-date").value,
            notes: el("obs-notes").value,
          });
        }

        close();
        await App.reload();
      } catch (err) {
        alert(`Save failed: ${err.message}`);
      } finally {
        btn.disabled = false;
        btn.textContent = "Save observation";
      }
    });
  }

  return { open, wire };
})();
