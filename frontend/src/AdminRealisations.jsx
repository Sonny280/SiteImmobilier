// AdminRealisations.jsx — Gestion du portfolio réalisations
import { useState, useEffect } from "react";
import { useCtx } from "./context.jsx";
import { API } from "./utils.js";
import { Modal, Inp, Sel, Txta } from "./ui.jsx";

const TYPES = ["Gestion locative","Vente immobilière","Location meublée","Vente terrain","Gestion copropriété","Location non meublée","Autre"];

export function AdminRealisations() {
  const {} = useCtx();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | "new" | item
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const empty = { titre:"",type:"Gestion locative",description:"",annee:String(new Date().getFullYear()),commune:"",ville:"Abidjan",image:"",ordre:0 };
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API}/realisations/admin`, { credentials:"include" });
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { if(token) load(); }, [token]);

  const openNew  = ()=>{ setForm(empty); setErr(""); setModal("new"); };
  const openEdit = (item)=>{ setForm({...item}); setErr(""); setModal(item); };

  const save = async () => {
    if (!form.titre.trim()) { setErr("Le titre est requis"); return; }
    setSaving(true); setErr("");
    try {
      const isNew = modal === "new";
      const url    = isNew ? `${API}/realisations` : `${API}/realisations/${modal.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, { method, headers:{"Content-Type":"application/json"}, credentials:"include", body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      const saved = await res.json();
      setItems(p => isNew ? [saved,...p] : p.map(x=>x.id===saved.id?saved:x));
      setModal(null);
    } catch(e){ setErr(e.message); }
    finally{ setSaving(false); }
  };

  const toggleVisible = async (item) => {
    const res = await fetch(`${API}/realisations/${item.id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify({visible:item.visible?0:1}) });
    const updated = await res.json();
    if (!res.ok) { alert(updated.error || "Erreur lors de la mise à jour"); return; }
    setItems(p=>p.map(x=>x.id===updated.id?updated:x));
  };

  const del = async (id) => {
    if (!confirm("Supprimer cette réalisation ?")) return;
    const res = await fetch(`${API}/realisations/${id}`,{method:"DELETE",credentials:"include"});
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      alert(d.error || "Erreur lors de la suppression");
      return;
    }
    setItems(p=>p.filter(x=>x.id!==id));
  };

  const sf = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",alignItems:"center"}}>
        <div style={{flex:1}}><span style={{fontSize:"13px",color:"var(--gray)"}}>{items.length} réalisation{items.length>1?"s":""} · {items.filter(x=>x.visible).length} visible{items.filter(x=>x.visible).length>1?"s":""}</span></div>
        <button onClick={openNew} style={{padding:"9px 20px",background:"var(--blue)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>+ Ajouter</button>
      </div>

      {loading ? <div style={{textAlign:"center",padding:"40px",color:"var(--gray)"}}>Chargement...</div>
      : items.length===0 ? (
        <div style={{textAlign:"center",padding:"60px",background:"var(--off)",borderRadius:"18px",border:"1px solid var(--border)"}}>
          <p style={{fontWeight:700,marginBottom:"8px"}}>Aucune réalisation</p>
          <p style={{fontSize:"13px",color:"var(--gray)",marginBottom:"20px"}}>Ajoutez vos projets réalisés pour enrichir votre portfolio.</p>
          <button onClick={openNew} style={{padding:"10px 22px",background:"var(--blue)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>+ Ajouter une réalisation</button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {items.map(r=>(
            <div key={r.id} style={{background:"white",border:"1px solid var(--border)",borderRadius:"14px",padding:"14px 18px",display:"grid",gridTemplateColumns:"1fr auto",gap:"12px",alignItems:"center",opacity:r.visible?1:0.55}}>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"var(--blue2)"}}>{r.type}</span>
                  <span style={{fontSize:"11px",color:"var(--gray)"}}>{r.annee} · {r.commune||r.ville}</span>
                  {!r.visible&&<span style={{fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"10px",background:"var(--grayL)",color:"var(--gray)"}}>Masqué</span>}
                </div>
                <div style={{fontWeight:700,fontSize:"14px",color:"var(--text)",marginBottom:"3px"}}>{r.titre}</div>
                <div style={{fontSize:"12px",color:"var(--gray)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description}</div>
                {r.image&&<div style={{fontSize:"11px",color:"var(--blue2)",marginTop:"4px"}}>Image : {r.image.slice(0,50)}...</div>}
              </div>
              <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                <button onClick={()=>toggleVisible(r)} style={{padding:"6px 12px",border:"1px solid var(--border)",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:700,background:r.visible?"#dcfce7":"var(--grayL)",color:r.visible?"#15803d":"var(--gray)",fontFamily:"Plus Jakarta Sans,sans-serif"}}>{r.visible?"Visible":"Masqué"}</button>
                <button onClick={()=>openEdit(r)} style={{padding:"6px 12px",border:"1px solid var(--border)",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:700,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Modifier</button>
                <button onClick={()=>del(r.id)} style={{padding:"6px 12px",border:"1px solid #fecaca",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:700,color:"#dc2626",background:"#fef2f2",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Suppr.</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {modal && (
        <Modal open title={modal==="new"?"Nouvelle réalisation":"Modifier la réalisation"} onClose={()=>setModal(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <Inp label="Titre *" value={form.titre} onChange={e=>sf("titre",e.target.value)} placeholder="Ex: Vente villa prestige — Riviera Golf"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <Sel label="Type de réalisation" value={form.type} onChange={e=>sf("type",e.target.value)}>
                {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </Sel>
              <Inp label="Année" value={form.annee} onChange={e=>sf("annee",e.target.value)} placeholder="2024"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <Inp label="Commune / Quartier" value={form.commune} onChange={e=>sf("commune",e.target.value)} placeholder="Cocody, Plateau..."/>
              <Inp label="Ville" value={form.ville} onChange={e=>sf("ville",e.target.value)} placeholder="Abidjan"/>
            </div>
            <Txta label="Description" rows={3} value={form.description} onChange={e=>sf("description",e.target.value)} placeholder="Détaillez le projet : surface, durée, résultat obtenu..."/>

            {/* Image URL */}
            <div>
              <label style={{display:"block",fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginBottom:"6px"}}>Image (URL optionnelle)</label>
              <input type="url" value={form.image||""} onChange={e=>sf("image",e.target.value)} placeholder="https://exemple.com/photo.jpg" className="inp"/>
              {form.image&&<div style={{marginTop:"8px",height:"100px",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"}}><img src={form.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>}
              <p style={{fontSize:"11px",color:"var(--gray)",marginTop:"4px"}}>Photo du projet, de l'immeuble ou du bien vendu. Taille recommandée : 800×500 px.</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <Inp label="Ordre d'affichage" type="number" value={form.ordre||0} onChange={e=>sf("ordre",+e.target.value)} placeholder="0 = premier"/>
              <Sel label="Visibilité" value={form.visible??1} onChange={e=>sf("visible",+e.target.value)}>
                <option value={1}>Visible sur le site</option>
                <option value={0}>Masqué</option>
              </Sel>
            </div>

            {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#dc2626"}}>{err}</div>}
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",borderTop:"1px solid var(--border)",paddingTop:"14px"}}>
              <button onClick={()=>setModal(null)} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
              <button onClick={save} disabled={saving} style={{padding:"10px 20px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"var(--blue)",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif",opacity:saving?0.6:1}}>{saving?"Enregistrement...":"Enregistrer"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
