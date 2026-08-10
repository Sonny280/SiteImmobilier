// hooks/useSettings.js — charge les paramètres agence depuis l'API
import { useState, useEffect } from "react";
import { API } from "../utils.js";

let _cache = null; // cache en mémoire pour éviter les appels répétés

export function useSettings() {
  const [settings, setSettings] = useState(_cache || {});
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setSettings(_cache); setLoading(false); return; }
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(d => { _cache = d; setSettings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Upload une image vers Cloudinary via le backend
  const uploadSetting = async (key, file) => {
    return new Promise((resolve, reject) => {
      if (file.size > 3 * 1024 * 1024) { reject(new Error("Image trop lourde (max 3 Mo)")); return; }
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(",")[1];
          const tok = sessionStorage.getItem("_ici_tok");
          const r = await fetch(`${API}/settings/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
            body: JSON.stringify({ key, image: base64, type: file.type }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || "Erreur upload");
          _cache = { ..._cache, [key]: d.url };
          setSettings({ ...settings, [key]: d.url });
          resolve(d.url);
        } catch(e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const deleteSetting = async (key) => {
    const tok = sessionStorage.getItem("_ici_tok");
    await fetch(`${API}/settings/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tok}` },
    });
    _cache = { ..._cache };
    delete _cache[key];
    setSettings({ ...settings, [key]: null });
  };

  return { settings, loading, uploadSetting, deleteSetting };
}



