import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { fmt, fmtM, wa, photoSrc, TL, SC, SL, AG, DEMO, API } from "../utils.js";
import { useSeo } from "../seo.js";
import { Inp, Sel, Txta, Gallery, Stars } from "../ui.jsx";
import BienCard from "../components/BienCard.jsx";
import AnimStat from "../components/AnimStat.jsx";
import PageHero from "../components/PageHero.jsx";

function PageServices({sub,setPage}){
  const {biens} = useCtx();
  useSeo(sub ? `services-${sub}` : "services");
  const [filtre,setFiltre] = useState(sub||"all");
  const [form,setForm]     = useState({nom:"",tel:"",email:"",interet:sub||"location",budget:"",message:""});
  const [sent,setSent]     = useState(false);
  const {submitDemande}    = useCtx();
  const services = [
    {slug:"gestion",titre:"Gestion Locative",desc:"Confiez la gestion de votre bien à des professionnels. Recherche de locataires, rédaction du bail, état des lieux d'entrée et de sortie, suivi des loyers, gestion des incidents techniques et renouvellements. Taux de recouvrement mensuel entre 98 et 100%.",avantages:["Locataires sérieux et solvables","Loyers versés à temps","Suivi administratif complet","Rapport mensuel détaillé"]},
    {slug:"location",titre:"Location Non Meublée",desc:"Appartements F2 à F6, villas et maisons en location mensuelle longue durée à Abidjan et dans les principales villes de Côte d'Ivoire. Contrats conformes à la loi, états des lieux professionnels.",avantages:["Baux conformes à la législation CI","États des lieux photographiques","Gestion des cautions","Renouvellements simplifiés"]},
    {slug:"meuble",titre:"Location Meublée",desc:"Appartements et villas entièrement équipés pour expatriés, cadres en mission temporaire, familles en transition ou séjours professionnels. WiFi, électroménager, linge de maison — tout est prévu.",avantages:["Disponible à la semaine ou au mois","Tout équipé (vaisselle, électro, linge)","WiFi fibre inclus","Service de ménage optionnel"]},
    {slug:"vente",titre:"Vente Immobilière",desc:"Vous souhaitez acheter ou vendre un appartement, une villa ou un immeuble à Abidjan ? Nous réalisons une estimation gratuite, publions votre annonce, négocions et vous accompagnons jusqu'à la signature chez le notaire.",avantages:["Estimation gratuite en 48h","Diffusion sur tous nos canaux","Négociation professionnelle","Accompagnement notarial complet"]},
    {slug:"terrain",titre:"Vente de Terrains",desc:"Terrains résidentiels, commerciaux et agricoles à Abidjan et à l'intérieur du pays — Bingerville, Bassam, Songon, Aboisso et bien d'autres. Vérification systématique des titres fonciers avant transaction.",avantages:["Titre foncier vérifié et authentifié","Zones résidentielles et commerciales","Abidjan et intérieur du pays","Sécurisation juridique complète"]},
  ];
  const typesMap = {gestion:"location",location:"location",meuble:"meuble",vente:"vente",terrain:"terrain"};
  const biensAffiches = filtre==="all"?biens.filter(b=>b.statut==="disponible"):biens.filter(b=>b.statut==="disponible"&&{
    if(filtre==="gestion") return b.type==="location";
    return b.type===typesMap[filtre]||b.type===filtre;
  });

  const send = async()=>{ if(!form.nom||!form.tel)return; try{await submitDemande(form);setSent(true);}catch{} };

  return(
    <div style={{paddingTop:"88px"}}>
      <PageHero
        pill="Nos expertises"
        title="Services &amp; Catalogue"
        subtitle="Sélectionnez un service ou parcourez l'ensemble de notre catalogue"
        image="/banners/services.jpg"
      />

      <section className="section" style={{background:"var(--white)"}}>
        <div className="container">
          {/* Onglets services */}
          <div style={{display:"flex",gap:"8px",marginBottom:"48px",overflowX:"auto",paddingBottom:"4px"}} className="no-scrollbar">
            {[{s:"all",l:"Tous nos biens"},...services.map(s=>({s:s.slug,l:s.titre}))].map(({s,l})=>(
              <button key={s} onClick={()=>setFiltre(s)} className="tab-btn" style={{flex:"0 0 auto",minWidth:"auto",whiteSpace:"nowrap",padding:"11px 22px",borderRadius:"10px",background:filtre===s?"var(--blue)":"var(--grayL)",color:filtre===s?"white":"var(--gray)",fontWeight:700,fontSize:"13px",border:"none",cursor:"pointer",transition:"all 0.18s"}}>
                {l}
              </button>
            ))}
          </div>

          {/* Description du service sélectionné */}
          {filtre!=="all"&&(()=>{
            const s = services.find(x=>x.slug===filtre);
            return s?(<div className="r-grid-service-desc" style={{background:"var(--blueL)",border:"1px solid var(--blueL2)",borderRadius:"18px",padding:"clamp(20px,4vw,32px)",marginBottom:"40px"}}>
              <div>
                <h2 style={{fontSize:"clamp(17px,3.5vw,24px)",fontWeight:700,color:"var(--blue)",marginBottom:"14px"}}>{s.titre}</h2>
                <p style={{fontSize:"14px",lineHeight:1.9,color:"var(--gray)"}}>{s.desc}</p>
              </div>
              <div>
                <p style={{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--blue2)",marginBottom:"14px"}}>Nos avantages</p>
                <ul style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {s.avantages.map(a=><li key={a} style={{display:"flex",alignItems:"flex-start",gap:"10px",fontSize:"14px",color:"var(--text)"}}>
                    <span style={{color:"var(--blue2)",fontWeight:700,flexShrink:0}}>&#10003;</span>{a}
                  </li>)}
                </ul>
              </div>
            </div>):null;
          })()}

          {/* Grille biens */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:"24px"}}>
            {biensAffiches.map(b=><BienCard key={b.id} bien={b} onClick={()=>setPage(`bien-${b.id}`)}/>)}
            {biensAffiches.length===0&&(
              <div style={{gridColumn:"1/-1",padding:"60px",textAlign:"center",background:"var(--off)",borderRadius:"18px",border:"1px solid var(--border)"}}>
                <p style={{fontWeight:700,fontSize:"16px",marginBottom:"8px"}}>Aucun bien disponible pour ce filtre</p>
                <p style={{fontSize:"13px",color:"var(--gray)"}}>Contactez-nous pour connaître nos prochaines disponibilités.</p>
                <button onClick={()=>setFiltre("all")} className="btn btn-primary btn-sm" style={{marginTop:"20px"}}>Voir tout le catalogue</button>
              </div>
            )}
          </div>

          {/* Demande rapide */}
          <div style={{marginTop:"64px",background:"var(--off)",border:"1px solid var(--border)",borderRadius:"20px",padding:"48px"}}>
            <div className="r-grid-2" style={{gap:"clamp(20px,5vw,48px)"}}>
              <div>
                <div className="pill">Demande rapide</div>
                <h2 style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:700,marginBottom:"14px"}}>Décrivez votre projet</h2>
                <p style={{fontSize:"14px",color:"var(--gray)",lineHeight:1.8}}>Notre équipe vous répond sous 24h avec des propositions adaptées à votre budget et vos critères.</p>
                <div style={{marginTop:"28px",display:"flex",flexDirection:"column",gap:"14px"}}>
                  {[...new Set([AG.tel1,AG.tel2,AG.email].filter(Boolean))].map((c,i)=><p key={i} style={{fontSize:"14px",fontWeight:600,color:"var(--text)"}}>{c}</p>)}
                </div>
              </div>
              {!sent?<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <Inp label="Nom *" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))}/>
                  <Inp label="Téléphone *" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))}/>
                </div>
                <Inp label="Email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
                <Sel label="Intérêt" value={form.interet} onChange={e=>setForm(p=>({...p,interet:e.target.value}))}>
                  <option value="location">Location mensuelle</option>
                  <option value="meuble">Meublé / court séjour</option>
                  <option value="vente">Achat d'un bien</option>
                  <option value="terrain">Terrain</option>
                  <option value="gestion">Confier en gestion locative</option>
                </Sel>
                <Inp label="Budget" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} placeholder="Ex: 350 000 FCFA/mois"/>
                <Txta label="Votre projet" rows={3} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} placeholder="Localisation souhaitée, nombre de pièces, délai..."/>
                <button onClick={send} className="btn btn-primary" style={{justifyContent:"center"}}>Envoyer ma demande</button>
              </div>:<div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:"48px",marginBottom:"12px"}}>&#10003;</div>
                <p style={{fontWeight:700,fontSize:"18px",color:"#15803d"}}>Demande envoyée !</p>
                <p style={{fontSize:"13px",color:"var(--gray)",marginTop:"6px"}}>Nous vous répondons sous 24h.</p>
              </div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── PAGE REALISATIONS ──────────────────────────────────────────

export default PageServices;

