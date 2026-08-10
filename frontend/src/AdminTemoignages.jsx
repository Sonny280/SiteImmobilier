// AdminTemoignages.jsx
import { useState, useEffect } from "react";
import { useCtx } from "./context.jsx";
import { API } from "./utils.js";
import { Stars } from "./ui.jsx";

function getAuthHeader() {
  const tok = sessionStorage.getItem("_ici_tok");
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export function AdminTemoignages() {
  const {} = useCtx();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre,  setFiltre]  = useState("all");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API}/temoignages/admin`, { headers: getAuthHeader() });
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatut = async (id, statut) => {
    const r = await fetch(`${API}/temoignages/${id}/statut`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ statut }),
    });
    const updated = await r.json();
    if (!r.ok) { alert(updated.error || "Erreur"); return; }
    setItems(p => p.map(x => x.id === updated.id ? updated : x));
  };

  const del = async (id) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    const r = await fetch(`${API}/temoignages/${id}`, { method: "DELETE", headers: getAuthHeader() });
    if (!r.ok) { alert("Erreur lors de la suppression"); return; }
    setItems(p => p.filter(x => x.id !== id));
  };

  const filtered = filtre === "all" ? items : items.filter(x => x.statut === filtre);
  const BADGE = {
    en_attente: { bg:"#fef3c7", color:"#92400e", label:"En attente" },
    publie:     { bg:"#dcfce7", color:"#15803d", label:"Publié" },
    refuse:     { bg:"#fee2e2", color:"#dc2626", label:"Refusé" },
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
        {[["all","Tous"],["en_attente","En attente"],["publie","Publiés"],["refuse","Refusés"]].map(([v,l]) => (
          <button key={v} onClick={()=>setFiltre(v)}
            style={{ padding:"7px 16px", borderRadius:"20px", border:"1px solid var(--border)", cursor:"pointer", fontWeight: filtre===v ? 700 : 500, background: filtre===v ? "var(--blue)" : "white", color: filtre===v ? "white" : "var(--text)", fontSize:"13px", fontFamily:"Plus Jakarta Sans,sans-serif" }}>
            {l} ({v==="all" ? items.length : items.filter(x=>x.statut===v).length})
          </button>
        ))}
      </div>

      {loading ? <div style={{textAlign:"center",padding:"40px",color:"var(--gray)"}}>Chargement...</div>
      : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px",background:"var(--off)",borderRadius:"18px",border:"1px solid var(--border)"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>⭐</div>
          <p style={{fontWeight:700}}>Aucun témoignage</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {filtered.map(t => {
            const badge = BADGE[t.statut] || BADGE.en_attente;
            return (
              <div key={t.id} style={{ background:"white", border:"1px solid var(--border)", borderRadius:"14px", padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px", marginBottom:"10px" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
                      <span style={{ fontWeight:700, fontSize:"15px" }}>{t.nom}</span>
                      <Stars n={t.note||5}/>
                    </div>
                    {t.profession && <div style={{ fontSize:"12px", color:"var(--gray)" }}>{t.profession}</div>}
                    <div style={{ fontSize:"11px", color:"var(--gray)", marginTop:"2px" }}>{new Date(t.createdAt).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <span style={{ padding:"4px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:700, background:badge.bg, color:badge.color, flexShrink:0 }}>
                    {badge.label}
                  </span>
                </div>
                <p style={{ fontSize:"14px", lineHeight:1.6, marginBottom:"14px", fontStyle:"italic" }}>"{t.texte}"</p>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {t.statut !== "publie" && <button onClick={()=>setStatut(t.id,"publie")} style={{ padding:"7px 14px", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:700, fontSize:"12px", background:"#dcfce7", color:"#15803d", fontFamily:"Plus Jakarta Sans,sans-serif" }}>✅ Publier</button>}
                  {t.statut !== "refuse" && <button onClick={()=>setStatut(t.id,"refuse")} style={{ padding:"7px 14px", border:"1px solid var(--border)", borderRadius:"8px", cursor:"pointer", fontWeight:700, fontSize:"12px", background:"white", color:"var(--gray)", fontFamily:"Plus Jakarta Sans,sans-serif" }}>🚫 Refuser</button>}
                  {t.statut !== "en_attente" && <button onClick={()=>setStatut(t.id,"en_attente")} style={{ padding:"7px 14px", border:"1px solid var(--border)", borderRadius:"8px", cursor:"pointer", fontWeight:700, fontSize:"12px", background:"white", color:"var(--gray)", fontFamily:"Plus Jakarta Sans,sans-serif" }}>⏳ En attente</button>}
                  <button onClick={()=>del(t.id)} style={{ padding:"7px 14px", border:"1px solid #fecaca", borderRadius:"8px", cursor:"pointer", fontWeight:700, fontSize:"12px", background:"#fef2f2", color:"#dc2626", fontFamily:"Plus Jakarta Sans,sans-serif" }}>🗑 Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



