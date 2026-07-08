// AdminTemoignages.jsx — Modération des témoignages
import { useState, useEffect } from "react";
import { useCtx } from "./context.jsx";
import { API } from "./utils.js";

export function AdminTemoignages() {
  const {} = useCtx();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("all");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API}/temoignages/admin`, { credentials:"include" });
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { if (token) load(); }, [token]);

  const setStatut = async (id, statut) => {
    const r = await fetch(`${API}/temoignages/${id}/statut`, {
      method: "PUT", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify({ statut }),
    });
    const updated = await r.json();
    if (!r.ok) { alert(updated.error || "Erreur lors de la mise à jour"); return; }
    setItems(p => p.map(x => x.id === updated.id ? updated : x));
  };

  const del = async (id) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    const r = await fetch(`${API}/temoignages/${id}`, { method: "DELETE", credentials:"include" });
    if (!r.ok) {
      const d = await r.json().catch(()=>({}));
      alert(d.error || "Erreur lors de la suppression");
      return;
    }
    setItems(p => p.filter(x => x.id !== id));
  };

  const stats = { total: items.length, publie: items.filter(x=>x.statut==="publie").length, attente: items.filter(x=>x.statut==="en_attente").length };
  const affiches = filtre === "all" ? items : items.filter(x => x.statut === filtre);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[{l:"Total",v:stats.total,bg:"var(--blueL)",c:"var(--blue2)"},{l:"Publiés",v:stats.publie,bg:"#dcfce7",c:"#15803d"},{l:"En attente",v:stats.attente,bg:"#fff7ed",c:"#c2410c"}].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:"12px",padding:"14px 16px"}}>
            <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:s.c,marginBottom:"6px"}}>{s.l}</div>
            <div style={{fontSize:"26px",fontWeight:700,color:s.c,fontFamily:"Playfair Display,serif"}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[["all","Tous"],["en_attente","En attente"],["publie","Publiés"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFiltre(k)} style={{padding:"8px 16px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif",background:filtre===k?"var(--blue)":"var(--grayL)",color:filtre===k?"white":"var(--gray)"}}>
            {l}{k==="en_attente"&&stats.attente>0&&` (${stats.attente})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? <div style={{textAlign:"center",padding:"40px",color:"var(--gray)"}}>Chargement...</div>
      : affiches.length === 0 ? <div style={{textAlign:"center",padding:"48px",background:"var(--off)",borderRadius:"16px",border:"1px solid var(--border)"}}>Aucun témoignage</div>
      : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {affiches.map(t => (
            <div key={t.id} style={{background:"white",border:"1px solid var(--border)",borderRadius:"14px",padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginBottom:"10px"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"var(--blueL)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Playfair Display,serif",fontSize:"13px",fontWeight:700,color:"var(--blue2)",flexShrink:0}}>{t.nom.slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px",flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:"14px"}}>{t.nom}</span>
                    {t.profession&&<span style={{fontSize:"12px",color:"var(--gray)"}}>{t.profession}</span>}
                    <span style={{fontSize:"12px",color:"var(--gold)"}}>{("★").repeat(t.note)}</span>
                    <span style={{fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"100px",background:t.statut==="publie"?"#dcfce7":"#fff7ed",color:t.statut==="publie"?"#15803d":"#c2410c",marginLeft:"auto"}}>{t.statut==="publie"?"Publié":"En attente"}</span>
                  </div>
                  <p style={{fontSize:"13px",lineHeight:1.7,color:"var(--gray)",fontStyle:"italic"}}>"{t.texte}"</p>
                  <div style={{fontSize:"11px",color:"var(--gray)",marginTop:"6px"}}>{new Date(t.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:"8px",borderTop:"1px solid var(--border)",paddingTop:"12px"}}>
                {t.statut !== "publie"
                  ? <button onClick={()=>setStatut(t.id,"publie")} style={{padding:"7px 16px",background:"#dcfce7",color:"#15803d",border:"1px solid #bbf7d0",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>Publier</button>
                  : <button onClick={()=>setStatut(t.id,"en_attente")} style={{padding:"7px 16px",background:"#fff7ed",color:"#c2410c",border:"1px solid #fed7aa",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>Dépublier</button>
                }
                <button onClick={()=>del(t.id)} style={{padding:"7px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
