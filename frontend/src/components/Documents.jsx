// components/Documents.jsx — Gestionnaire de pièces jointes
import { useState, useEffect, useRef } from "react";
import { useCtx } from "../context.jsx";
import { API } from "../utils.js";

const TYPES_DOC = [
  { v:"contrat",    l:"Contrat / Bail" },
  { v:"cni",        l:"Pièce d'identité (CNI/Passeport)" },
  { v:"titre",      l:"Titre foncier" },
  { v:"quittance",  l:"Quittance / Reçu" },
  { v:"compromis",  l:"Compromis de vente" },
  { v:"acte",       l:"Acte notarié" },
  { v:"etatLieux",  l:"État des lieux" },
  { v:"photo",      l:"Photo / Scan" },
  { v:"autre",      l:"Autre document" },
];

const MIME_ICONS = {
  "application/pdf":  "📄",
  "image/jpeg":       "🖼️",
  "image/png":        "🖼️",
  "image/webp":       "🖼️",
};

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} Ko`;
  return `${(bytes/1024/1024).toFixed(1)} Mo`;
}

// Helper pour récupérer le token JWT
function getAuthHeader() {
  const tok = sessionStorage.getItem("_ici_tok");
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export function DocumentsPanel({ entite, entiteId, titre }) {
  const {} = useCtx();
  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading,setUploading]= useState(false);
  const [modal,    setModal]    = useState(false);
  const [typeSel,  setTypeSel]  = useState("contrat");
  const [notes,    setNotes]    = useState("");
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/documents?entite=${entite}&entiteId=${entiteId}`, {
        headers: getAuthHeader()
      });
      const data = await r.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { if(entiteId) load(); }, [entiteId]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10*1024*1024) { alert(`${file.name} : fichier trop lourd (max 10 Mo)`); continue; }
        const base64 = await new Promise((res,rej) => {
          const r = new FileReader();
          r.onload  = () => res(r.result.split(",")[1]);
          r.onerror = () => rej(new Error("Lecture impossible"));
          r.readAsDataURL(file);
        });
        await fetch(`${API}/documents`, {
          method: "POST",
          headers: { "Content-Type":"application/json", ...getAuthHeader() },
          body: JSON.stringify({
            nom: file.name, type: typeSel,
            entite, entiteId,
            fichier: base64, taille: file.size,
            mimeType: file.type, notes,
          }),
        });
      }
      await load();
      setModal(false);
      setNotes("");
    } finally { setUploading(false); e.target.value=""; }
  };

  const download = async (doc) => {
    const r = await fetch(`${API}/documents/${doc.id}/download`, {
      headers: getAuthHeader()
    });
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = doc.nom; a.click();
    URL.revokeObjectURL(url);
  };

  const del = async (doc) => {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return;
    await fetch(`${API}/documents/${doc.id}`, {
      method:"DELETE",
      headers: getAuthHeader()
    });
    setDocs(p => p.filter(d => d.id !== doc.id));
  };

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
        <div style={{ fontSize:"13px", fontWeight:700, color:"var(--text)" }}>
          📎 Pièces jointes {docs.length>0&&<span style={{fontWeight:400,color:"var(--gray)"}}>({docs.length})</span>}
        </div>
        <button onClick={()=>setModal(true)}
          style={{ padding:"6px 14px", background:"var(--blue)", color:"white", border:"none", borderRadius:"7px", cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"Plus Jakarta Sans,sans-serif" }}>
          + Ajouter
        </button>
      </div>

      {loading ? <div style={{fontSize:"12px",color:"var(--gray)",padding:"8px"}}>Chargement...</div>
      : docs.length===0 ? (
        <div style={{ border:"1.5px dashed var(--border)", borderRadius:"10px", padding:"16px", textAlign:"center", cursor:"pointer" }}
          onClick={()=>setModal(true)}>
          <div style={{fontSize:"24px",marginBottom:"6px"}}>📎</div>
          <div style={{fontSize:"12px",color:"var(--gray)"}}>Aucun document. Cliquez pour ajouter.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {docs.map(d => {
            const icon = MIME_ICONS[d.mimeType] || "📎";
            const typeLabel = TYPES_DOC.find(t=>t.v===d.type)?.l || d.type;
            return (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:"var(--off)", border:"1px solid var(--border)", borderRadius:"10px" }}>
                <span style={{fontSize:"20px",flexShrink:0}}>{icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"13px",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nom}</div>
                  <div style={{fontSize:"11px",color:"var(--gray)",marginTop:"1px"}}>
                    {typeLabel} · {formatSize(d.taille)} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                  {d.notes&&<div style={{fontSize:"11px",color:"var(--gray)",fontStyle:"italic"}}>{d.notes}</div>}
                </div>
                <div style={{display:"flex",gap:"5px",flexShrink:0}}>
                  <button onClick={()=>download(d)}
                    style={{padding:"5px 10px",background:"var(--blueL)",color:"var(--blue2)",border:"1px solid var(--blueL2)",borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:600}}>
                    ⬇ Télécharger
                  </button>
                  {d.mimeType?.startsWith("image/")&&(
                    <button onClick={async()=>{
                      const r=await fetch(`${API}/documents/${d.id}/download`,{headers:getAuthHeader()});
                      const blob=await r.blob();
                      window.open(URL.createObjectURL(blob),"_blank");
                    }} style={{padding:"5px 10px",background:"var(--grayL)",border:"1px solid var(--border)",borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:600}}>
                      👁 Voir
                    </button>
                  )}
                  <button onClick={()=>del(d)}
                    style={{padding:"5px 8px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(92,26,43,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"24px",maxWidth:"420px",width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"18px",fontWeight:700,marginBottom:"16px"}}>Ajouter un document</h3>
            <div style={{marginBottom:"12px"}}>
              <label style={{display:"block",fontSize:"12px",fontWeight:700,color:"var(--gray)",marginBottom:"5px"}}>TYPE DE DOCUMENT</label>
              <select value={typeSel} onChange={e=>setTypeSel(e.target.value)}
                style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:"8px",padding:"10px 12px",fontSize:"14px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                {TYPES_DOC.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div style={{marginBottom:"16px"}}>
              <label style={{display:"block",fontSize:"12px",fontWeight:700,color:"var(--gray)",marginBottom:"5px"}}>NOTES (optionnel)</label>
              <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex: Bail signé le 01/01/2025"
                style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:"8px",padding:"10px 12px",fontSize:"14px",fontFamily:"Plus Jakarta Sans,sans-serif"}}/>
            </div>
            <div style={{border:"2px dashed var(--border)",borderRadius:"10px",padding:"24px",textAlign:"center",cursor:"pointer",background:"var(--off)"}}
              onClick={()=>!uploading&&fileRef.current?.click()}>
              {uploading
                ?<><div style={{fontSize:"28px",marginBottom:"6px"}}>⏳</div><div style={{fontSize:"13px",color:"var(--gray)"}}>Upload en cours...</div></>
                :<><div style={{fontSize:"28px",marginBottom:"6px"}}>📎</div>
                  <div style={{fontSize:"14px",fontWeight:600,color:"var(--blue)"}}>Cliquer pour sélectionner</div>
                  <div style={{fontSize:"11px",color:"var(--gray)",marginTop:"4px"}}>PDF, JPG, PNG · Max 10 Mo · Plusieurs fichiers acceptés</div></>
              }
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                style={{display:"none"}} onChange={handleUpload} disabled={uploading}/>
            </div>
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"16px"}}>
              <button onClick={()=>setModal(false)}
                style={{padding:"9px 18px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


