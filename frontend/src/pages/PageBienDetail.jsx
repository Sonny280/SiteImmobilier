import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { fmt, fmtM, wa, photoSrc, TL, SC, SL, AG, DEMO, API } from "../utils.js";
import { useSeo } from "../seo.js";
import { Inp, Sel, Txta, Gallery, Stars } from "../ui.jsx";
import BienCard from "../components/BienCard.jsx";
import AnimStat from "../components/AnimStat.jsx";

function PageBienDetail({bienId,setPage}){
  const {biens,submitDemande} = useCtx();
  const bien = biens.find(b=>b.id===bienId);
  const [form,setForm] = useState({nom:"",tel:"",email:"",message:""});
  const [sent,setSent] = useState(false); const [ld,setLd] = useState(false);
  useSeo(null, bien);
  if(!bien) return <div style={{padding:"160px 0",textAlign:"center"}}><p>Bien introuvable</p><button className="btn btn-primary" style={{marginTop:"20px"}} onClick={()=>setPage("services")}>Retour</button></div>;
  const isSale = bien.type==="vente"||bien.type==="terrain";
  const equips = (bien.equipements||"").split(",").filter(Boolean);
  const send = async()=>{ if(!form.nom||!form.tel) return; setLd(true); try{await submitDemande({...form,bienId:bien.id,interet:bien.type,budget:`${fmt(bien.prix)} FCFA${!isSale?"/mois":""}`});setSent(true);}finally{setLd(false);} };
  return(
    <div style={{paddingTop:"88px"}}>
      {/* Breadcrumb */}
      <div style={{background:"var(--off)",borderBottom:"1px solid var(--border)",padding:"14px 0"}}>
        <div className="container" style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"var(--gray)"}}>
          <button onClick={()=>setPage("services")} style={{fontWeight:600,color:"var(--blue)"}}>Catalogue</button>
          <span>/</span><span style={{fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bien.titre}</span>
          <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:"12px",background:"var(--blueL)",color:"var(--blue2)",padding:"3px 10px",borderRadius:"20px"}}>{bien.ref}</span>
        </div>
      </div>
      <div className="container" style={{padding:"48px 28px"}}>
        <div className="r-grid-main">
          <div>
            {/* Galerie */}
            <Gallery photos={bien.photos} title={bien.titre}/>
            {/* Infos */}
            <div style={{marginTop:"32px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:"18px",padding:"clamp(18px,4vw,32px)"}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"16px"}}>
                <span className={`badge ${SC[bien.type]||""}`}>{TL[bien.type]||bien.type}</span>
                <span className={`badge ${SC[bien.statut]||""}`}>{SL[bien.statut]||bien.statut}</span>
                {bien.featured===1&&<span className="badge" style={{background:"var(--goldL)",color:"#7a5c00"}}>Coup de coeur</span>}
              </div>
              <h1 style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:700,marginBottom:"8px"}}>{bien.titre}</h1>
              <p style={{fontSize:"14px",color:"var(--gray)",marginBottom:"24px"}}>&#128205; {bien.quartier}, {bien.commune}, {bien.ville}</p>
              <div className="prix-big">{fmt(bien.prix)} <span className="prix-unit">FCFA{!isSale&&"/mois"}</span></div>
            </div>
            {/* Caractéristiques */}
            <div style={{marginTop:"20px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:"18px",padding:"clamp(18px,4vw,32px)"}}>
              <h2 style={{fontSize:"18px",fontWeight:700,marginBottom:"24px"}} className="title-ul">Caractéristiques</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"14px"}}>
                {[
                  bien.surface>0&&["Surface",`${bien.surface} m²`],
                  bien.chambres>0&&["Chambres",bien.chambres],
                  bien.sdb>0&&["Salles de bain",bien.sdb],
                  bien.parking>0&&["Parking",bien.parking],
                  bien.etage!=null&&["Étage",`${bien.etage}e`],
                ].filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{background:"var(--off)",border:"1px solid var(--border)",borderRadius:"12px",padding:"16px",textAlign:"center"}}>
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:"22px",fontWeight:700,color:"var(--blue)"}}>{v}</div>
                    <div style={{fontSize:"12px",fontWeight:600,color:"var(--gray)",marginTop:"4px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Description */}
            {bien.description&&<div style={{marginTop:"20px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:"18px",padding:"clamp(18px,4vw,32px)"}}>
              <h2 style={{fontSize:"18px",fontWeight:700,marginBottom:"16px"}} className="title-ul">Description</h2>
              <p style={{fontSize:"14px",lineHeight:1.9,color:"var(--gray)"}}>{bien.description}</p>
            </div>}
            {/* Équipements */}
            {equips.length>0&&<div style={{marginTop:"20px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:"18px",padding:"clamp(18px,4vw,32px)"}}>
              <h2 style={{fontSize:"18px",fontWeight:700,marginBottom:"20px"}} className="title-ul">Équipements et prestations</h2>
              <div style={{display:"flex",flexWrap:"wrap",gap:"10px"}}>
                {equips.map(e=><span key={e} style={{fontSize:"13px",fontWeight:600,background:"var(--blueL)",color:"var(--blue2)",padding:"7px 16px",borderRadius:"8px",border:"1px solid var(--blueL2)"}}>{e.trim()}</span>)}
              </div>
            </div>}
          </div>

          {/* Sidebar contact */}
          <div className="bien-sidebar-mobile" style={{position:"sticky",top:"96px",display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{background:"var(--blue)",borderRadius:"18px",padding:"28px",color:"white"}}>
              <div style={{fontSize:"12px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.6)",marginBottom:"6px"}}>{TL[bien.type]||bien.type}</div>
              <div style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(22px,5vw,34px)",fontWeight:700,lineHeight:1.1}}>{fmt(bien.prix)}</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,0.6)",marginTop:"2px"}}>FCFA{!isSale&&"/mois"}</div>
            </div>
            <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"18px",padding:"clamp(12px,3vw,24px)"}}>
              <p style={{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--gray)",marginBottom:"14px"}}>Contact direct</p>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <a href={`${wa(bien.whatsapp||AG.waRaw)}?text=${encodeURIComponent(`Bonjour ImmobilierCI, je m'intéresse au bien ${bien.ref} — ${bien.titre}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{justifyContent:"center"}}>WhatsApp</a>
                <a href={`tel:${AG.tel2}`} className="btn btn-outline" style={{justifyContent:"center"}}>{AG.tel2}</a>
                <a href={`tel:${AG.tel1}`} className="btn btn-outline" style={{justifyContent:"center"}}>{AG.tel1}</a>
              </div>
            </div>
            {!sent
              ?<div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"18px",padding:"clamp(12px,3vw,24px)"}}>
                <p style={{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--gray)",marginBottom:"18px"}}>Demander une visite</p>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <Inp label="Nom complet *" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))}/>
                  <Inp label="Téléphone *" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))}/>
                  <Inp label="Email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
                  <Txta label="Message" rows={3} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/>
                  <button onClick={send} disabled={ld} className="btn btn-primary" style={{justifyContent:"center",opacity:ld?0.6:1}}>{ld?"Envoi...":"Envoyer ma demande"}</button>
                </div>
              </div>
              :<div style={{background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:"18px",padding:"28px",textAlign:"center"}}>
                <div style={{fontSize:"36px",marginBottom:"8px"}}>&#10003;</div>
                <p style={{fontWeight:700,color:"#15803d",fontSize:"16px"}}>Demande envoyée !</p>
                <p style={{fontSize:"13px",color:"#166534",marginTop:"6px"}}>Notre équipe vous contacte sous 24h.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PAGE QUI SOMMES NOUS ───────────────────────────────────────

export default PageBienDetail;
