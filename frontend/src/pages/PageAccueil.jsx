import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { fmt, fmtM, wa, photoSrc, TL, SC, SL, AG, DEMO, API } from "../utils.js";
import { useSeo } from "../seo.js";
import { Inp, Sel, Txta, Gallery, Stars } from "../ui.jsx";
import BienCard from "../components/BienCard.jsx";
import AnimStat from "../components/AnimStat.jsx";

function PageAccueil({setPage}){
  const {biens} = useCtx();
  const nav = p=>{ setPage(p); window.scrollTo({top:0,behavior:"smooth"}); };
  const vedettes = biens.filter(b=>b.featured&&b.statut!=="archive").slice(0,3);
  const dispo    = biens.filter(b=>b.statut==="disponible").length;
  const [temoignages, setTemoignages] = useState([]);
  useEffect(()=>{
    fetch(`${API}/temoignages`)
      .then(r=>r.json())
      .then(d=>{ if(Array.isArray(d)) setTemoignages(d.slice(0,3)); })
      .catch(()=>{});
  },[]);
  return(
    <div>
      {/* HERO */}
      <section className="hero-section" style={{position:"relative",overflow:"hidden",paddingTop:"clamp(100px,15vw,160px)",paddingBottom:"clamp(64px,10vw,100px)"}}>

        {/* ── Photo de fond ── */}
        {/* Remplacez /hero-bg.jpg par votre propre photo dans frontend/public/ */}
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:"url('/banners/accueil.jpg'), url('/hero-bg-fallback.svg')",
          backgroundSize:"cover",
          backgroundPosition:"center 40%",
          backgroundRepeat:"no-repeat",
        }}/>

        {/* ── Overlay dégradé bleu marine (assure la lisibilité du texte) ── */}
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(120deg, rgba(92,26,43,0.94) 0%, rgba(122,37,56,0.82) 45%, rgba(184,146,63,0.50) 100%)",
        }}/>

        {/* ── Motif discret (s'affiche par-dessus l'overlay) ── */}
        <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(90deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 0,transparent 80px)",pointerEvents:"none"}}/>

        {/* ── Accent doré bas-gauche ── */}
        <div style={{position:"absolute",bottom:"-60px",left:"-60px",width:"320px",height:"320px",borderRadius:"50%",background:"rgba(184,146,63,0.16)",filter:"blur(60px)",pointerEvents:"none"}}/>

        <div className="container" style={{position:"relative",zIndex:1}}>
          <div className="r-grid-2">
            <div>
              <div className="pill anim-1" style={{background:"rgba(194,148,55,0.18)",borderColor:"rgba(194,148,55,0.35)",color:"var(--gold)"}}>Agence Immobilière Agréée · Côte d'Ivoire</div>
              <h1 className="anim-2" style={{fontSize:"clamp(36px,5vw,60px)",fontWeight:900,color:"var(--white)",marginBottom:"20px",lineHeight:1.1}}>
                Votre partenaire<br/>immobilier de<br/><em style={{color:"var(--gold)",fontStyle:"normal"}}>confiance</em>
              </h1>
              <p className="anim-3" style={{fontSize:"17px",lineHeight:1.7,color:"rgba(255,255,255,0.80)",marginBottom:"36px",maxWidth:"480px"}}>
                {AG.slogan} — Location, vente, gestion locative et terrains sur toute la Côte d'Ivoire.
              </p>
              <div className="anim-4" style={{display:"flex",gap:"clamp(10px,3vw,14px)",flexWrap:"wrap"}}>
                <button onClick={()=>nav("services")} className="btn btn-gold btn-lg">Nos services</button>
                <button onClick={()=>nav("contact")}  className="btn btn-white btn-lg">Nous contacter</button>
                <a href={`${wa(AG.waRaw)}?text=${encodeURIComponent("Bonjour ImmobilierCI, je souhaite un renseignement.")}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-lg">WhatsApp</a>
              </div>
              <div className="anim-5 hero-stats-wrap" style={{display:"flex",gap:"clamp(16px,5vw,48px)",marginTop:"clamp(32px,6vw,52px)",flexWrap:"wrap"}}>
                {[{n:`${biens.length}`,l:"Biens gérés",s:"+"},{n:`${dispo}`,l:"Disponibles",s:""},{n:"3",l:"Expérience",s:" ans+"},{n:"100",l:"Côte d'Ivoire",s:"%"}].map(s=>(
                  <AnimStat key={s.l} value={s.n} label={s.l} suffix={s.s}/>
                ))}
              </div>
            </div>

            {/* Biens vedettes */}
            <div className="hidden lg:flex flex-col gap-4 anim-3">
              {vedettes.map((b,i)=>(
                <div key={b.id} onClick={()=>nav(`bien-${b.id}`)}
                  style={{background:"rgba(255,255,255,0.10)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:"16px",padding:"18px",display:"flex",alignItems:"center",gap:"18px",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.17)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.10)"}>
                  <div style={{width:"72px",height:"56px",borderRadius:"12px",background:"rgba(255,255,255,0.12)",flexShrink:0,overflow:"hidden"}}>
                    {b.photos?.[0]
                      ?<img src={photoSrc(b.photos[0])} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"22px"}}>&#9776;</div>
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:"var(--white)",fontSize:"15px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.titre}</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",marginTop:"2px"}}>&#128205; {b.quartier}, {b.commune}</div>
                    <div style={{fontWeight:800,color:"var(--gold)",fontSize:"15px",marginTop:"4px"}}>{fmtM(b.prix)} FCFA{b.type!=="vente"&&<span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)"}}>/mois</span>}</div>
                  </div>
                  <span className="badge" style={{background:"rgba(194,148,55,0.25)",color:"var(--gold)",flexShrink:0,border:"1px solid rgba(194,148,55,0.35)"}}>{TL[b.type]}</span>
                </div>
              ))}
              {vedettes.length===0&&(
                <div style={{background:"rgba(255,255,255,0.07)",border:"1px dashed rgba(255,255,255,0.2)",borderRadius:"16px",padding:"32px",textAlign:"center",color:"rgba(255,255,255,0.45)",fontSize:"14px"}}>
                  Ajoutez des biens en vedette depuis l'admin
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vague de transition vers le blanc */}
        <div style={{position:"absolute",bottom:0,left:0,right:0}}>
          <svg viewBox="0 0 1440 48" fill="none" style={{display:"block",width:"100%"}}>
            <path d="M0,48 C480,0 960,0 1440,48 L1440,48 L0,48Z" fill="var(--white)"/>
          </svg>
        </div>
      </section>

      {/* SERVICES APERCU */}
      <section className="section" style={{background:"var(--white)"}}>
        <div className="container">
          <div data-anim="fadeUp" style={{textAlign:"center",marginBottom:"56px"}}>
            <div className="pill">Nos services</div>
            <h2 style={{fontSize:"clamp(24px,6vw,38px)",fontWeight:700}} className="title-ul-c">Une offre complète pour votre patrimoine</h2>
            <div className="divider-gold" style={{margin:"18px auto 0"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"24px"}}>
            {[
              {icon:"L",titre:"Gestion Locative",desc:"Recherche de locataires, suivi des loyers, états des lieux, renouvellements.",slug:"gestion"},
              {icon:"V",titre:"Vente Immobilière",desc:"Estimation gratuite, négociation, accompagnement jusqu'à l'acte notarié.",slug:"vente"},
              {icon:"M",titre:"Location Meublée",desc:"Appartements équipés pour expatriés, cadres en mission, familles en transit.",slug:"meuble"},
              {icon:"N",titre:"Location Non Meublée",desc:"Appartements et villas en location mensuelle longue durée.",slug:"location"},
              {icon:"T",titre:"Vente de Terrains",desc:"Terrains à Abidjan et à l'intérieur du pays. Vérification des titres fonciers.",slug:"terrain"},
            ].map((s,i)=>(
              <div key={s.slug} data-anim="scaleUp" data-delay={i*100} onClick={()=>nav(`services-${s.slug}`)} className="card" style={{padding:"clamp(18px,4vw,32px)",cursor:"pointer"}}>
                <div style={{width:"52px",height:"52px",borderRadius:"12px",background:"var(--blueL)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"}}>
                  <span style={{fontFamily:"Playfair Display,serif",fontSize:"22px",fontWeight:700,color:"var(--blue2)"}}>{s.icon}</span>
                </div>
                <h3 style={{fontSize:"17px",fontWeight:700,marginBottom:"10px",color:"var(--text)"}}>{s.titre}</h3>
                <p style={{fontSize:"13px",lineHeight:1.7,color:"var(--gray)",marginBottom:"20px"}}>{s.desc}</p>
                <span style={{fontSize:"13px",fontWeight:700,color:"var(--blue2)"}}>En savoir plus &rarr;</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BIENS RECENTS */}
      <section className="section" style={{background:"var(--off)"}}>
        <div className="container">
          <div data-anim="fadeUp" style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"40px",flexWrap:"wrap",gap:"16px"}}>
            <div><div className="pill">Disponibles</div><h2 style={{fontSize:"clamp(22px,5.5vw,36px)",fontWeight:700}} className="title-ul">Nos derniers biens</h2></div>
            <button onClick={()=>nav("services")} className="btn btn-outline btn-sm">Voir tout le catalogue</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:"24px"}}>
            {biens.filter(b=>b.statut!=="archive").slice(0,6).map((b,i)=>(
              <div key={b.id} data-anim="fadeUp" data-delay={i*100}>
                <BienCard bien={b} onClick={()=>nav(`bien-${b.id}`)}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMOIGNAGE APERCU */}
      <section className="section" style={{background:"var(--blue)"}}>
        <div className="container">
          <div data-anim="fadeUp" style={{textAlign:"center",marginBottom:"48px"}}>
            <div className="pill" style={{background:"rgba(255,255,255,0.1)",borderColor:"rgba(255,255,255,0.2)",color:"var(--goldL)"}}>Ils nous font confiance</div>
            <h2 style={{fontSize:"36px",fontWeight:700,color:"var(--white)"}}>Ce que disent nos clients</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"20px",marginBottom:"40px"}}>
            {temoignages.map((t,i)=>(
              <div key={t.id} data-anim="fadeUp" data-delay={i*150} className="testi-card" style={{background:"rgba(255,255,255,0.07)",borderLeft:"4px solid var(--gold)",borderRadius:"0 16px 16px 0",padding:"clamp(12px,3vw,24px)"}}>
                <Stars n={t.note}/>
                <p style={{fontSize:"14px",lineHeight:1.8,color:"rgba(255,255,255,0.82)",margin:"14px 0",fontStyle:"italic"}}>"{t.texte}"</p>
                <div style={{fontWeight:700,fontSize:"14px",color:"var(--white)"}}>{t.nom}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)",marginTop:"2px"}}>{t.profession}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}><button onClick={()=>nav("temoignages")} className="btn btn-white">Voir tous les témoignages</button></div>
        </div>
      </section>

      {/* CALCULATRICE CTA */}
      <section className="section-sm" style={{background:"var(--blueL)"}}>
        <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"wrap"}}>
          <div data-anim="fadeLeft">
            <div className="pill">Outil gratuit</div>
            <h2 style={{fontSize:"clamp(20px,4.5vw,28px)",fontWeight:700,marginBottom:"8px"}}>Calculatrice immobilière</h2>
            <p style={{fontSize:"14px",color:"var(--gray)",maxWidth:"440px"}}>Budget locatif, simulation de crédit, rendement d'investissement — estimez vos projets immobiliers en quelques secondes.</p>
          </div>
          <div data-anim="fadeRight" style={{display:"flex",gap:"12px",flexShrink:0,flexWrap:"wrap"}}>
            <button onClick={()=>nav("calculatrice")} className="btn btn-primary btn-lg">Calculer mon budget</button>
          </div>
        </div>
      </section>
      {/* CTA CONTACT */}
      <section className="section-sm" style={{background:"var(--white)"}}>
        <div data-anim="fadeUp" className="container" style={{textAlign:"center"}}>
          <h2 style={{fontSize:"clamp(22px,5vw,34px)",fontWeight:700,marginBottom:"16px"}}>Votre projet immobilier commence ici</h2>
          <p style={{fontSize:"16px",color:"var(--gray)",marginBottom:"36px",maxWidth:"520px",margin:"0 auto 36px"}}>Estimation gratuite, conseil personnalisé — notre équipe répond sous 24h.</p>
          <div data-anim="scaleUp" data-delay="200" style={{display:"flex",gap:"14px",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>nav("contact")} className="btn btn-primary btn-lg">Nous contacter</button>
            <a href={`${wa(AG.waRaw)}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-lg">WhatsApp direct</a>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── BIEN CARD ──────────────────────────────────────────────────

export default PageAccueil;


