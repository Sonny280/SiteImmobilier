import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { fmt, fmtM, wa, photoSrc, TL, SC, SL, AG, DEMO, API } from "../utils.js";
import { useSeo } from "../seo.js";
import { Inp, Sel, Txta, Gallery, Stars } from "../ui.jsx";
import BienCard from "../components/BienCard.jsx";
import AnimStat from "../components/AnimStat.jsx";
import PageHero from "../components/PageHero.jsx";

function PageBlog({setPage}){
  useSeo("blog");
  const [articles,  setArticles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [articleId, setArticleId] = useState(null);
  const [filtreCat, setFiltreCat] = useState("all");
  // Charger les articles depuis l'API
  useEffect(()=>{
    fetch(`${API}/articles`)
      .then(r=>r.json())
      .then(d=>{ setArticles(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(()=>{ setLoading(false); });
  },[]);

  const categories = ["all", ...new Set(articles.map(a=>a.categorie).filter(Boolean))];
  const affiches   = filtreCat==="all" ? articles : articles.filter(a=>a.categorie===filtreCat);

  // ── Rendu article détail ────────────────────────────────────────
  const a = articleId ? articles.find(x=>x.id===articleId) : null;
  if(a) return(
    <div style={{paddingTop:"88px"}}>
      {/* Breadcrumb */}
      <div style={{background:"var(--off)",borderBottom:"1px solid var(--border)",padding:"14px 0"}}>
        <div className="container" style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px"}}>
          <button onClick={()=>setArticleId(null)} style={{fontWeight:600,color:"var(--blue)"}}>Blog</button>
          <span style={{color:"var(--gray)"}}>/</span>
          <span style={{color:"var(--text)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.titre}</span>
        </div>
      </div>
      {/* Contenu article */}
      <div className="container" style={{maxWidth:"780px",padding:"clamp(32px,6vw,56px) clamp(16px,4vw,28px)"}}>
        <div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
          <span style={{fontSize:"11px",fontWeight:700,padding:"4px 12px",borderRadius:"100px",background:"var(--blueL)",color:"var(--blue2)"}}>{a.categorie}</span>
          {a.tags&&a.tags.split(",").slice(0,3).map(t=>(
            <span key={t} style={{fontSize:"11px",fontWeight:600,padding:"4px 10px",borderRadius:"100px",background:"var(--off)",color:"var(--gray)",border:"1px solid var(--border)"}}>{t.trim()}</span>
          ))}
        </div>
        <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(24px,5vw,36px)",fontWeight:700,marginBottom:"16px",lineHeight:1.2}}>{a.titre}</h1>
        {/* Auteur + date */}
        <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"32px",paddingBottom:"20px",borderBottom:"1px solid var(--border)"}}>
          <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"var(--blueL)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Playfair Display,serif",fontSize:"14px",fontWeight:700,color:"var(--blue2)",flexShrink:0}}>
            {(a.auteur||"LI").slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:"13px"}}>{a.auteur||"ImmobilierCI"}</div>
            <div style={{fontSize:"12px",color:"var(--gray)"}}>
              {new Date(a.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
              {a.vues>0&&<> &bull; {a.vues} lecture{a.vues>1?"s":""}</>}
            </div>
          </div>
        </div>
        {/* Résumé mis en exergue */}
        {a.resume&&<p style={{fontSize:"17px",lineHeight:1.9,color:"var(--gray)",marginBottom:"28px",fontStyle:"italic",borderLeft:"3px solid var(--blue2)",paddingLeft:"20px"}}>{a.resume}</p>}
        {/* Contenu rendu (markdown basique) */}
        <div style={{fontSize:"15px",lineHeight:2,color:"var(--gray)"}}>
          {(a.contenu||"").split("\n").map((line,i)=>{
            if(line.startsWith("## ")) return <h2 key={i} style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(18px,3.5vw,22px)",fontWeight:700,margin:"28px 0 12px",color:"var(--text)",paddingBottom:"8px",borderBottom:"1px solid var(--border)"}}>{line.replace("## ","")}</h2>;
            if(line.startsWith("### ")) return <h3 key={i} style={{fontSize:"16px",fontWeight:700,margin:"20px 0 8px",color:"var(--text)"}}>{line.replace("### ","")}</h3>;
            if(line.startsWith("- ")) return <li key={i} style={{marginLeft:"22px",marginBottom:"6px"}}>{line.replace("- ","")}</li>;
            if(!line.trim()) return <div key={i} style={{height:"12px"}}/>;
            const html = line.replace(/\*\*(.*?)\*\*/g,(m,t)=>`<strong style="color:var(--text);font-weight:700">${t}</strong>`);
            return <p key={i} style={{marginBottom:"14px"}} dangerouslySetInnerHTML={{__html:html}}/>;
          })}
        </div>
        {/* CTA bas article */}
        <div style={{marginTop:"40px",padding:"clamp(16px,3vw,28px)",background:"var(--blueL)",borderRadius:"16px",border:"1px solid var(--blueL2)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
          <div>
            <p style={{fontWeight:700,fontSize:"15px",color:"var(--blue)",marginBottom:"4px"}}>Une question sur ce sujet ?</p>
            <p style={{fontSize:"13px",color:"var(--gray)"}}>Notre équipe ImmobilierCI vous répond sous 24h.</p>
          </div>
          <a href={`${wa(AG.waRaw)}?text=${encodeURIComponent(`Bonjour ImmobilierCI, j'ai lu votre article "${a.titre}" et j'ai une question.`)}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm">WhatsApp</a>
        </div>
        {/* Articles liés */}
        {articles.length>1&&<div style={{marginTop:"40px"}}>
          <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"18px",fontWeight:700,marginBottom:"16px"}}>Autres articles</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"14px"}}>
            {articles.filter(x=>x.id!==a.id).slice(0,3).map(x=>(
              <button key={x.id} onClick={()=>setArticleId(x.id)} style={{textAlign:"left",background:"var(--off)",border:"1px solid var(--border)",borderRadius:"12px",padding:"14px",cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                <div style={{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--blue2)",marginBottom:"6px"}}>{x.categorie}</div>
                <div style={{fontSize:"13px",fontWeight:700,color:"var(--text)",lineHeight:1.4}}>{x.titre}</div>
              </button>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );

  // ── Rendu liste articles ──────────────────────────────────────
  return(
    <div style={{paddingTop:"88px"}}>
      <PageHero
        pill="Actualités"
        title="Blog &amp; Actualités"
        subtitle="Conseils immobiliers, actualité du marché ivoirien, guides pratiques"
        image="/banners/blog.jpg"
      />

      <section className="section" style={{background:"var(--white)"}}>
        <div className="container">
          {/* Filtres catégories */}
          {categories.length>2&&(
            <div style={{display:"flex",gap:"8px",marginBottom:"32px",overflowX:"auto",paddingBottom:"4px"}} className="no-scrollbar">
              {categories.map(c=>(
                <button key={c} onClick={()=>setFiltreCat(c)}
                  style={{padding:"8px 18px",borderRadius:"100px",border:"none",cursor:"pointer",fontWeight:700,fontSize:"13px",flexShrink:0,fontFamily:"Plus Jakarta Sans,sans-serif",background:filtreCat===c?"var(--blue)":"var(--grayL)",color:filtreCat===c?"white":"var(--gray)",transition:"all .18s"}}>
                  {c==="all"?"Tous les articles":c}
                </button>
              ))}
            </div>
          )}

          {loading?(
            <div style={{textAlign:"center",padding:"60px",color:"var(--gray)"}}>Chargement des articles...</div>
          ):affiches.length===0?(
            <div style={{textAlign:"center",padding:"60px",background:"var(--off)",borderRadius:"18px",border:"1px solid var(--border)"}}>
              <p style={{fontWeight:700,fontSize:"16px",marginBottom:"8px"}}>Aucun article disponible</p>
              <p style={{fontSize:"13px",color:"var(--gray)"}}>Les articles sont gérés depuis le panneau d'administration.</p>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"24px"}}>
              {affiches.map((a,i)=>(
                <div key={a.id} data-anim="scaleUp" data-delay={i*100} className="card" onClick={()=>setArticleId(a.id)} style={{cursor:"pointer"}}>
                  {/* Visuel de couverture */}
                  <div style={{height:"180px",background:"var(--blueL)",borderBottom:"1px solid var(--blueL2)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
                    {a.image
                      ?<img src={a.image} alt={a.titre} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :<div style={{fontFamily:"Playfair Display,serif",fontSize:"56px",fontWeight:700,color:"var(--blue)",opacity:0.12,userSelect:"none"}}>LI</div>
                    }
                    <div style={{position:"absolute",top:"12px",left:"12px"}}>
                      <span style={{fontSize:"11px",fontWeight:700,padding:"4px 10px",borderRadius:"100px",background:"rgba(255,255,255,0.92)",color:"var(--blue2)"}}>{a.categorie}</span>
                    </div>
                    {a.vues>0&&<div style={{position:"absolute",bottom:"10px",right:"10px",fontSize:"11px",fontWeight:600,padding:"3px 8px",borderRadius:"20px",background:"rgba(0,0,0,0.5)",color:"white"}}>{a.vues} vues</div>}
                  </div>
                  <div style={{padding:"clamp(16px,3.5vw,24px)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
                      <span style={{fontSize:"12px",fontWeight:600,color:"var(--gray)"}}>
                        {new Date(a.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}
                      </span>
                      {a.auteur&&<><span style={{color:"var(--border)"}}>•</span><span style={{fontSize:"12px",color:"var(--gray)"}}>{a.auteur}</span></>}
                    </div>
                    <h3 style={{fontSize:"16px",fontWeight:700,marginBottom:"10px",lineHeight:1.4,color:"var(--text)"}}>{a.titre}</h3>
                    <p style={{fontSize:"13px",lineHeight:1.8,color:"var(--gray)",marginBottom:"18px",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{a.resume}</p>
                    <span style={{fontSize:"13px",fontWeight:700,color:"var(--blue2)"}}>Lire l'article &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── PAGE CONTACT ───────────────────────────────────────────────


export default PageBlog;
