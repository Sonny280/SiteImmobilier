// AdminBlog.jsx — Module blog & actualités pour l'admin ImmobilierCI
import { useState, useEffect } from "react";
import { useCtx } from "./context.jsx";
import { Modal, Inp, Sel, Txta } from "./ui.jsx";
import { API } from "./utils.js";

const CATEGORIES = ["Actualités","Investissement","Gestion locative","Juridique","Marché","Conseils","Événement"];

function Badge({ statut }) {
  const styles = {
    publie:    { bg:"#dcfce7", color:"#15803d" },
    brouillon: { bg:"#f1f5f9", color:"#475569" },
    archive:   { bg:"#fef2f2", color:"#dc2626" },
  };
  const s = styles[statut] || styles.brouillon;
  const label = { publie:"Publié", brouillon:"Brouillon", archive:"Archivé" }[statut] || statut;
  return <span style={{fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"100px",background:s.bg,color:s.color}}>{label}</span>;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
}

// ── Éditeur d'article ────────────────────────────────────────────
function ArticleModal({ article, onClose, onSave }) {
  const {} = useCtx();
  const isNew = !article?.id;
  const [form, setForm] = useState({
    titre:     article?.titre     || "",
    image:     article?.image     || "",
    categorie: article?.categorie || "Actualités",
    resume:    article?.resume    || "",
    contenu:   article?.contenu   || "",
    auteur:    article?.auteur    || "Kouassi Atse Charles",
    statut:    article?.statut    || "brouillon",
    tags:      article?.tags      || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const [preview, setPreview] = useState(false);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.titre.trim()) { setErr("Le titre est requis"); return; }
    setSaving(true); setErr("");
    try {
      const url    = isNew ? `${API}/articles` : `${API}/articles/${article.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method, headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur serveur");
      const saved = await res.json();
      onSave(saved);
      onClose();
    } catch(e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={isNew ? "Nouvel article" : "Modifier l'article"} onClose={onClose} xl>
      {/* Tabs Édition / Aperçu */}
      <div style={{display:"flex",gap:"6px",background:"var(--off)",padding:"5px",borderRadius:"10px",marginBottom:"20px"}}>
        <button onClick={()=>setPreview(false)} style={{flex:1,padding:"8px",borderRadius:"7px",border:"none",cursor:"pointer",fontWeight:700,fontSize:"13px",background:!preview?"white":"transparent",color:!preview?"var(--blue)":"var(--gray)",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Édition</button>
        <button onClick={()=>setPreview(true)}  style={{flex:1,padding:"8px",borderRadius:"7px",border:"none",cursor:"pointer",fontWeight:700,fontSize:"13px",background:preview?"white":"transparent",color:preview?"var(--blue)":"var(--gray)",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Aperçu</button>
      </div>

      {!preview ? (
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <Inp label="Titre de l'article *" value={form.titre} onChange={e=>sf("titre",e.target.value)} placeholder="Ex: Les meilleurs quartiers pour investir à Abidjan"/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
            <Sel label="Catégorie" value={form.categorie} onChange={e=>sf("categorie",e.target.value)}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </Sel>
            <Inp label="Auteur" value={form.auteur} onChange={e=>sf("auteur",e.target.value)}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginBottom:"6px"}}>Image de couverture (URL)</label>
                <input type="url" value={form.image} onChange={e=>sf("image",e.target.value)} placeholder="https://exemple.com/photo.jpg" className="inp"/>
                {form.image&&<div style={{marginTop:"6px",height:"80px",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"}}><img src={form.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>}
                <p style={{fontSize:"10px",color:"var(--gray)",marginTop:"4px"}}>Collez l'URL d'une image (Unsplash, votre hébergeur…). Conseil : 1200×630 px minimum.</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
          </div>

          <Txta label="Résumé (affiché sur la liste)" rows={2} value={form.resume} onChange={e=>sf("resume",e.target.value)} placeholder="2 à 3 phrases qui donnent envie de lire l'article..."/>

          <div>
            <label style={{display:"block",fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginBottom:"8px"}}>Contenu de l'article</label>
            <p style={{fontSize:"11px",color:"var(--gray)",marginBottom:"6px"}}>Vous pouvez utiliser **texte gras**, ## Titre, - liste à puces</p>
            <textarea
              value={form.contenu}
              onChange={e=>sf("contenu",e.target.value)}
              placeholder="Rédigez votre article ici...&#10;&#10;## Sous-titre&#10;&#10;Paragraphe de texte...&#10;&#10;**Texte important**&#10;&#10;- Point 1&#10;- Point 2"
              style={{width:"100%",minHeight:"280px",border:"1.5px solid var(--border)",borderRadius:"10px",padding:"14px 16px",fontSize:"14px",fontFamily:"monospace",lineHeight:1.7,resize:"vertical",outline:"none",background:"var(--white)",color:"var(--text)"}}
            />
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
            <Inp label="Tags (séparés par des virgules)" value={form.tags} onChange={e=>sf("tags",e.target.value)} placeholder="investissement, Abidjan, loyer"/>
            <Sel label="Statut" value={form.statut} onChange={e=>sf("statut",e.target.value)}>
              <option value="brouillon">Brouillon (non visible)</option>
              <option value="publie">Publié (visible sur le site)</option>
              <option value="archive">Archivé</option>
            </Sel>
          </div>

          {err && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#dc2626"}}>{err}</div>}

          <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",paddingTop:"8px",borderTop:"1px solid var(--border)"}}>
            <button onClick={onClose} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
            <button onClick={()=>{sf("statut","brouillon");setTimeout(save,50);}} disabled={saving} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif",opacity:saving?0.6:1}}>
              Enregistrer brouillon
            </button>
            <button onClick={()=>{sf("statut","publie");setTimeout(save,50);}} disabled={saving} style={{padding:"10px 20px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"var(--blue)",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif",opacity:saving?0.6:1}}>
              {saving ? "Enregistrement..." : "Publier l'article"}
            </button>
          </div>
        </div>
      ) : (
        /* Aperçu rendu */
        <div style={{maxWidth:"680px",margin:"0 auto"}}>
          <div style={{marginBottom:"20px",padding:"12px 16px",background:"var(--blueL)",borderRadius:"8px",fontSize:"12px",color:"var(--blue2)"}}>
            Aperçu de l'article tel qu'il apparaîtra sur le site
          </div>
          <div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
            <span style={{fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"100px",background:"var(--blueL)",color:"var(--blue2)"}}>{form.categorie}</span>
            <span style={{fontSize:"12px",color:"var(--gray)"}}>{new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</span>
          </div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"28px",fontWeight:700,marginBottom:"12px",lineHeight:1.25}}>{form.titre||"Titre de l'article"}</h1>
          <p style={{fontSize:"15px",color:"var(--gray)",lineHeight:1.8,marginBottom:"24px",fontStyle:"italic",borderLeft:"3px solid var(--blue2)",paddingLeft:"16px"}}>{form.resume||"Résumé..."}</p>
          <div style={{fontSize:"15px",lineHeight:2,color:"var(--gray)"}}>
            {(form.contenu||"Contenu...").split("\n").map((line,i)=>{
              if(line.startsWith("## ")) return <h2 key={i} style={{fontFamily:"Playfair Display,serif",fontSize:"20px",fontWeight:700,marginTop:"24px",marginBottom:"8px",color:"var(--text)"}}>{line.replace("## ","")}</h2>;
              if(line.startsWith("- ")) return <li key={i} style={{marginLeft:"20px",marginBottom:"4px"}}>{line.replace("- ","").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}</li>;
              if(!line.trim()) return <br key={i}/>;
              const html = line.replace(/\*\*(.*?)\*\*/g,(m,t)=>`<strong style="color:var(--text)">${t}</strong>`);
              return <p key={i} style={{marginBottom:"12px"}} dangerouslySetInnerHTML={{__html:html}}/>;
            })}
          </div>
          {form.tags&&<div style={{marginTop:"24px",display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {form.tags.split(",").map(t=><span key={t} style={{fontSize:"12px",fontWeight:600,padding:"4px 12px",borderRadius:"100px",background:"var(--blueL)",color:"var(--blue2)"}}>{t.trim()}</span>)}
          </div>}
          <div style={{marginTop:"24px",padding:"16px",background:"var(--off)",borderRadius:"10px",fontSize:"12px",color:"var(--gray)"}}>
            Par <strong style={{color:"var(--text)"}}>{form.auteur||"ImmobilierCI"}</strong>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export function AdminBlog() {
  const {} = useCtx();
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | "new" | article
  const [confirm,  setConfirm]  = useState(null); // id à supprimer
  const [filtre,   setFiltre]   = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/articles/admin`, { credentials:"include" });
      const d = await res.json();
      setArticles(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[token]);

  const togglePublish = async (a) => {
    const res = await fetch(`${API}/articles/${a.id}/publier`, {
      method:"PUT", credentials:"include"
    });
    const updated = await res.json();
    if (!res.ok) { alert(updated.error || "Erreur lors de la publication"); return; }
    setArticles(p => p.map(x => x.id===updated.id ? updated : x));
  };

  const deleteArticle = async (id) => {
    const res = await fetch(`${API}/articles/${id}`, { method:"DELETE", credentials:"include" });
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      alert(d.error || "Erreur lors de la suppression");
      setConfirm(null);
      return;
    }
    setArticles(p => p.filter(x => x.id!==id));
    setConfirm(null);
  };

  const onSave = (saved) => {
    setArticles(p => {
      const exists = p.find(x => x.id===saved.id);
      return exists ? p.map(x => x.id===saved.id ? saved : x) : [saved, ...p];
    });
  };

  const affiches = filtre==="all" ? articles : articles.filter(a=>a.statut===filtre);

  const stats = {
    total:     articles.length,
    publie:    articles.filter(a=>a.statut==="publie").length,
    brouillon: articles.filter(a=>a.statut==="brouillon").length,
    vues:      articles.reduce((s,a)=>s+(a.vues||0),0),
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"12px",marginBottom:"20px"}}>
        {[
          {l:"Total",       v:stats.total,     bg:"var(--blueL)",  c:"var(--blue2)"},
          {l:"Publiés",     v:stats.publie,    bg:"#dcfce7",       c:"#15803d"},
          {l:"Brouillons",  v:stats.brouillon, bg:"#f1f5f9",       c:"#475569"},
          {l:"Vues totales",v:stats.vues,      bg:"var(--goldL)",  c:"var(--gold)"},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:"12px",padding:"14px 16px"}}>
            <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:s.c,marginBottom:"6px"}}>{s.l}</div>
            <div style={{fontSize:"26px",fontWeight:700,color:s.c,fontFamily:"Playfair Display,serif"}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filtres + bouton */}
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}>
        {[["all","Tous"],["publie","Publiés"],["brouillon","Brouillons"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFiltre(k)}
            style={{padding:"8px 16px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif",background:filtre===k?"var(--blue)":"var(--grayL)",color:filtre===k?"white":"var(--gray)",transition:"all .18s"}}>
            {l}
          </button>
        ))}
        <button onClick={()=>setModal("new")}
          style={{marginLeft:"auto",padding:"9px 20px",background:"var(--blue)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
          + Nouvel article
        </button>
      </div>

      {/* Liste articles */}
      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:"var(--gray)"}}>Chargement...</div>
      ) : affiches.length===0 ? (
        <div style={{textAlign:"center",padding:"48px",background:"var(--off)",borderRadius:"16px",border:"1px solid var(--border)"}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>✍️</div>
          <p style={{fontWeight:700,fontSize:"16px",marginBottom:"6px"}}>Aucun article</p>
          <p style={{fontSize:"13px",color:"var(--gray)",marginBottom:"20px"}}>Créez votre premier article de blog pour attirer des visiteurs sur votre site.</p>
          <button onClick={()=>setModal("new")} style={{padding:"10px 22px",background:"var(--blue)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Créer un article</button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {affiches.map(a=>(
            <div key={a.id} style={{background:"white",border:"1px solid var(--border)",borderRadius:"14px",padding:"16px 20px",display:"grid",gridTemplateColumns:"1fr auto",gap:"16px",alignItems:"center"}}>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px",flexWrap:"wrap"}}>
                  <Badge statut={a.statut}/>
                  <span style={{fontSize:"11px",fontWeight:600,padding:"2px 8px",borderRadius:"100px",background:"var(--blueL)",color:"var(--blue2)"}}>{a.categorie}</span>
                  <span style={{fontSize:"11px",color:"var(--gray)"}}>👁 {a.vues||0} vues</span>
                  <span style={{fontSize:"11px",color:"var(--gray)"}}>{formatDate(a.updatedAt)}</span>
                </div>
                <div style={{fontWeight:700,fontSize:"15px",color:"var(--text)",marginBottom:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.titre}</div>
                <div style={{fontSize:"12px",color:"var(--gray)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.resume||"Aucun résumé"}</div>
                {a.tags&&<div style={{display:"flex",gap:"5px",marginTop:"8px",flexWrap:"wrap"}}>
                  {a.tags.split(",").slice(0,4).map(t=>(
                    <span key={t} style={{fontSize:"10px",fontWeight:600,padding:"2px 8px",borderRadius:"100px",background:"var(--off)",color:"var(--gray)",border:"1px solid var(--border)"}}>{t.trim()}</span>
                  ))}
                </div>}
              </div>
              <div style={{display:"flex",gap:"6px",flexShrink:0,alignItems:"center"}}>
                <button onClick={()=>togglePublish(a)}
                  style={{padding:"7px 14px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,background:a.statut==="publie"?"#fef9c3":"#dcfce7",color:a.statut==="publie"?"#854d0e":"#15803d",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                  {a.statut==="publie" ? "Dépublier" : "Publier"}
                </button>
                <button onClick={()=>setModal(a)}
                  style={{padding:"7px 14px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                  Modifier
                </button>
                <button onClick={()=>setConfirm(a.id)}
                  style={{padding:"7px 14px",border:"1px solid #fecaca",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,color:"#dc2626",background:"#fef2f2",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal éditeur */}
      {modal && (
        <ArticleModal
          article={modal==="new" ? null : modal}
          onClose={()=>setModal(null)}
          onSave={onSave}
        />
      )}

      {/* Confirmation suppression */}
      {confirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(92,26,43,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"28px",maxWidth:"380px",width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"18px",fontWeight:700,marginBottom:"10px"}}>Supprimer l'article ?</h3>
            <p style={{fontSize:"13px",color:"var(--gray)",marginBottom:"24px",lineHeight:1.6}}>Cette action est irréversible. L'article sera définitivement supprimé.</p>
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirm(null)} style={{padding:"9px 18px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
              <button onClick={()=>deleteArticle(confirm)} style={{padding:"9px 18px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"#dc2626",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
