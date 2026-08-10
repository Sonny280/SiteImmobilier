import { useState } from "react";
import { AG } from "../utils.js";
import { useSeo } from "../seo.js";
import PageHero from "../components/PageHero.jsx";
import { useSettings } from "../hooks/useSettings.js";
import { useCtx } from "../context.jsx";
import { API } from "../utils.js";

const EQUIPE = [
  { key:"team_dg",      nom:"Kouassi Atse Charles", poste:"Directeur Général",      initiales:"KA" },
  { key:"team_comm",    nom:"À compléter",           poste:"Responsable Commercial", initiales:"RC" },
  { key:"team_gestion", nom:"À compléter",           poste:"Gestionnaire Locatif",   initiales:"GL" },
  { key:"team_compta",  nom:"À compléter",           poste:"Comptable",              initiales:"CP" },
];

function MembreCard({ membre, url, onUpload, onDelete, isAdmin }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(membre.key, file);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div style={{
      background:"white", borderRadius:"20px", overflow:"hidden",
      border:"1px solid var(--border)", textAlign:"center",
      boxShadow:"0 4px 24px rgba(0,0,0,0.06)",
      transition:"transform 0.2s",
    }}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
    >
      <div style={{position:"relative",background:"var(--blueL)",height:"200px"}}>
        {url ? (
          <img src={url} alt={membre.nom} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
        ) : (
          <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Playfair Display,serif",fontSize:"24px",fontWeight:700,color:"white"}}>
              {membre.initiales}
            </div>
          </div>
        )}
        {isAdmin && (
          <label style={{position:"absolute",bottom:"8px",right:"8px",background:"rgba(0,0,0,0.55)",color:"white",borderRadius:"6px",padding:"4px 10px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
            {uploading ? "⏳" : "📷"} {url ? "Changer" : "Ajouter"}
            <input type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}} disabled={uploading}/>
          </label>
        )}
        {url && isAdmin && (
          <button onClick={()=>onDelete(membre.key)} style={{position:"absolute",top:"8px",right:"8px",background:"rgba(220,38,38,0.8)",color:"white",border:"none",borderRadius:"6px",padding:"4px 8px",fontSize:"11px",cursor:"pointer"}}>✕</button>
        )}
      </div>
      <div style={{padding:"20px"}}>
        <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"17px",fontWeight:700,marginBottom:"5px",color:"var(--text)"}}>{membre.nom}</h3>
        <p style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gold)"}}>{membre.poste}</p>
      </div>
    </div>
  );
}

function PageQuiSommesNous(){
  useSeo("qui-sommes-nous");
  const { settings, uploadSetting, deleteSetting } = useSettings();
  const { user } = useCtx();
  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  return(
    <div>
      <PageHero pill="Notre histoire" title="Qui sommes-nous" subtitle={AG.slogan} image="/banners/qui-sommes-nous.jpg" height="360px"/>

      <section className="section" style={{background:"var(--white)"}}>
        <div className="container">
          <div className="r-grid-2">
            <div data-anim="fadeLeft">
              <div className="pill">Notre mission</div>
              <h2 style={{fontSize:"clamp(22px,5vw,34px)",fontWeight:700,marginBottom:"20px"}} className="title-ul">Votre confiance, notre priorité</h2>
              <p style={{fontSize:"15px",lineHeight:1.9,color:"var(--gray)",marginBottom:"20px"}}>Fondée par <strong style={{color:"var(--text)"}}>Kouassi Atse Charles</strong>, ImmobilierCI est une agence immobilière agréée basée à Abidjan, intervenant sur toute la Côte d'Ivoire.</p>
              <p style={{fontSize:"15px",lineHeight:1.9,color:"var(--gray)",marginBottom:"20px"}}>Notre équipe accompagne propriétaires, locataires, acheteurs et investisseurs dans leurs projets immobiliers avec transparence, réactivité et professionnalisme.</p>
              <p style={{fontSize:"15px",lineHeight:1.9,color:"var(--gray)"}}>Nous croyons que l'immobilier est avant tout une affaire de confiance. C'est pourquoi chaque client bénéficie d'un suivi personnalisé, de l'estimation jusqu'à la signature finale.</p>
              <div className="r-grid-chips" style={{marginTop:"36px"}}>
                {[["Confiance","Zéro frais caché"],["Sécurité","Titres vérifiés"],["Réactivité","Réponse sous 24h"],["Expertise","3 ans d'expérience"]].map(([t,d],i)=>(
                  <div key={t} data-anim="scaleUp" data-delay={i*100} style={{background:"var(--blueL)",borderRadius:"14px",padding:"18px 20px",border:"1px solid var(--blueL2)"}}>
                    <div style={{fontWeight:700,fontSize:"14px",color:"var(--blue)",marginBottom:"4px"}}>{t}</div>
                    <div style={{fontSize:"12px",color:"var(--gray)"}}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div data-anim="fadeRight">
              <div style={{background:"var(--blue)",borderRadius:"20px",padding:"clamp(24px,5vw,48px)",color:"white",textAlign:"center",marginBottom:"20px"}}>
                <div style={{position:"relative",width:"100px",height:"100px",margin:"0 auto 20px"}}>
                  {settings.team_dg ? (
                    <img src={settings.team_dg} alt="DG" style={{width:"100px",height:"100px",borderRadius:"50%",objectFit:"cover",objectPosition:"top",border:"3px solid var(--gold)"}}/>
                  ) : (
                    <div style={{width:"100px",height:"100px",borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Playfair Display,serif",fontSize:"28px",fontWeight:700,color:"var(--blue)"}}>KA</div>
                  )}
                  {isAdmin && (
                  <label style={{position:"absolute",bottom:0,right:0,background:"rgba(0,0,0,0.6)",borderRadius:"50%",width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"13px"}} title="Changer la photo">
                    📷
                    <input type="file" accept="image/*" onChange={async e=>{
                      const f=e.target.files?.[0]; if(!f) return;
                      await uploadSetting("team_dg",f); e.target.value="";
                    }} style={{display:"none"}}/>
                  </label>
                  )}
                </div>
                <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"22px",fontWeight:700,marginBottom:"6px"}}>Kouassi Atse Charles</h3>
                <p style={{fontSize:"12px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.6)",marginBottom:"20px"}}>Directeur Général</p>
                <blockquote style={{fontSize:"15px",fontStyle:"italic",lineHeight:1.8,color:"rgba(255,255,255,0.82)",borderLeft:"3px solid var(--gold)",paddingLeft:"18px",textAlign:"left"}}>« {AG.slogan} »</blockquote>
              </div>
              <div className="r-grid-chips">
                {[{n:"3+",l:"Années d'activité"},{n:"100+",l:"Biens gérés"},{n:"100%",l:"Couverture CI"},{n:"98%",l:"Taux satisfaction"}].map((s,i)=>(
                  <div key={s.l} data-anim="scaleUp" data-delay={i*100} style={{background:"var(--off)",border:"1px solid var(--border)",borderRadius:"14px",padding:"20px",textAlign:"center"}}>
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:"32px",fontWeight:900,color:"var(--blue)"}}>{s.n}</div>
                    <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginTop:"4px"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="section" style={{background:"var(--off)"}}>
        <div className="container">
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <div className="pill">Notre équipe</div>
            <h2 style={{fontSize:"clamp(22px,5vw,34px)",fontWeight:700}} className="title-ul-c">Des professionnels à votre service</h2>
            <div className="divider-gold" style={{margin:"18px auto 0"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"24px"}}>
            {EQUIPE.map(m => (
              <MembreCard key={m.key} membre={m}
                url={settings[m.key]}
                onUpload={uploadSetting}
                onDelete={deleteSetting}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="section" style={{background:"var(--white)"}}>
        <div className="container">
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <div className="pill">Nos valeurs</div>
            <h2 style={{fontSize:"clamp(22px,5vw,34px)",fontWeight:700}} className="title-ul-c">Ce qui nous distingue</h2>
            <div className="divider-gold" style={{margin:"18px auto 0"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"20px"}}>
            {[
              ["Agrément officiel","Agence agréée par l'État de Côte d'Ivoire. Vos transactions sont légales et sécurisées."],
              ["Zone nationale","Abidjan et toute la Côte d'Ivoire. Terrains en intérieur du pays, villes et villages."],
              ["Transparence totale","Aucun frais caché. Nos honoraires sont communiqués clairement dès le premier contact."],
              ["Suivi personnalisé","Chaque client a un interlocuteur dédié. Nous sommes disponibles 6j/7."],
              ["Expertise juridique","Vérification des titres fonciers, rédaction de contrats, accompagnement notarial."],
              ["Réactivité 24h","Votre demande est traitée dans les 24h. Nous respectons votre temps."],
            ].map(([t,d],i)=>(
              <div key={t} data-anim="fadeUp" data-delay={i*80} className="card" style={{padding:"clamp(14px,3.5vw,28px)"}}>
                <div style={{width:"40px",height:"3px",background:"var(--gold)",borderRadius:"2px",marginBottom:"18px"}}/>
                <h3 style={{fontSize:"15px",fontWeight:700,marginBottom:"10px"}}>{t}</h3>
                <p style={{fontSize:"13px",lineHeight:1.8,color:"var(--gray)"}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="section-sm" style={{background:"var(--off)"}}>
        <div className="container" style={{maxWidth:"700px",textAlign:"center"}}>
          <div className="pill">Documents officiels</div>
          <h2 style={{fontSize:"clamp(20px,4.5vw,30px)",fontWeight:700,marginBottom:"16px"}}>Télécharger nos documents</h2>
          <p style={{fontSize:"14px",color:"var(--gray)",marginBottom:"36px"}}>Retrouvez nos documents officiels : agrément, conditions générales, formulaires de mandat.</p>
          <div style={{display:"flex",gap:"14px",justifyContent:"center",flexWrap:"wrap"}}>
            {[["Notre agrément","PDF · 156 Ko"],["Conditions générales","PDF · 240 Ko"],["Formulaire de mandat","PDF · 88 Ko"]].map(([nom,taille])=>(
              <button key={nom} onClick={()=>alert("Document disponible en agence ou sur demande WhatsApp.")} className="btn btn-outline" style={{flexDirection:"column",alignItems:"flex-start",gap:"2px",padding:"16px 22px"}}>
                <span style={{fontSize:"14px",fontWeight:700}}>{nom}</span>
                <span style={{fontSize:"11px",color:"var(--gray)",fontWeight:400}}>{taille}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PageQuiSommesNous;



