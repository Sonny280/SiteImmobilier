import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { fmt, fmtM, wa, photoSrc, TL, SC, SL, AG, DEMO, API } from "../utils.js";
import { useSeo } from "../seo.js";
import { Inp, Sel, Txta, Gallery, Stars } from "../ui.jsx";
import BienCard from "../components/BienCard.jsx";
import AnimStat from "../components/AnimStat.jsx";
import PageHero from "../components/PageHero.jsx";

function PageContact(){
  useSeo("contact");
  const {submitDemande} = useCtx();
  const [form,setForm] = useState({nom:"",tel:"",email:"",interet:"location",budget:"",message:""});
  const [sent,setSent] = useState(false); const [ld,setLd] = useState(false);
  const send = async()=>{ if(!form.nom||!form.tel)return; setLd(true); try{await submitDemande(form);setSent(true);}finally{setLd(false);} };
  const faqs = [
    ["Quel est votre délai de réponse ?","Notre équipe traite toutes les demandes sous 24h ouvrées, WhatsApp inclus."],
    ["Proposez-vous des estimations gratuites ?","Oui, l'estimation de votre bien est entièrement gratuite et sans engagement."],
    ["Intervenez-vous hors d'Abidjan ?","Oui, ImmobilierCI couvre toute la Côte d'Ivoire, des terrains à l'intérieur du pays aux appartements en ville."],
    ["Comment se déroule la prise en charge d'un bien ?","Après signature du mandat, nous photographions le bien, rédigeons l'annonce et gérons les visites. Vous recevez un rapport régulier."],
    ["Quels documents sont nécessaires pour louer ou acheter ?","Pièce d'identité, justificatifs de revenus pour la location. Titre foncier pour la vente de terrain. Notre équipe vous guide selon votre projet."],
    ["Avez-vous un service de gestion locative ?","Oui, nous proposons une gestion complète : recherche locataire, bail, état des lieux, suivi loyers, travaux. Taux de recouvrement 98-100%."],
  ];
  return(
    <div style={{paddingTop:"88px"}}>
      <PageHero
        pill="Restons en contact"
        title="Contactez-nous"
        subtitle="Notre équipe vous répond sous 24h"
        image="/banners/contact.jpg"
      />

      <section className="section" style={{background:"var(--white)"}}>
        <div className="container">
          <div className="r-grid-contact">
            {/* Coordonnées */}
            <div>
              <div className="pill">Coordonnées</div>
              <h2 style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:700,marginBottom:"28px"}} className="title-ul">Nous trouver</h2>
              <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"32px"}}>
                {[
                  ["Adresse",AG.adresse],
                  ["Téléphone 1",AG.tel1],
                  ["Téléphone 2",AG.tel2],
                  ["WhatsApp",AG.whatsapp],
                  ["Email",AG.email],
                  ["Horaires",AG.horaires],
                  ["Zone d'intervention",AG.zone],
                ].map(([l,v])=>(
                  <div key={l} style={{display:"flex",gap:"14px",alignItems:"flex-start"}}>
                    <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"var(--blueL)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                      <div style={{width:"14px",height:"2px",background:"var(--blue2)",borderRadius:"1px"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--gray)",marginBottom:"2px"}}>{l}</div>
                      <div style={{fontSize:"14px",fontWeight:600,color:"var(--text)"}}>{v}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Boutons contact direct */}
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px"}}>
                <a href={`${wa(AG.waRaw)}?text=${encodeURIComponent("Bonjour ImmobilierCI, je souhaite un renseignement.")}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{justifyContent:"center"}}>WhatsApp</a>
                <a href={`tel:${AG.tel2}`} className="btn btn-primary" style={{justifyContent:"center"}}>{AG.tel2}</a>
                <a href={`tel:${AG.tel1}`} className="btn btn-outline" style={{justifyContent:"center"}}>{AG.tel1}</a>
              </div>
              {/* Réseaux sociaux */}
              <div>
                <p style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--gray)",marginBottom:"12px"}}>Retrouvez-nous</p>
                <div style={{display:"flex",gap:"10px"}}>
                  {[
                    {url:AG.social.facebook,  bg:"#1877F2",label:"f"},
                    {url:AG.social.instagram, bg:"#E1306C",label:"in"},
                    {url:AG.social.linkedin,  bg:"#0A66C2",label:"Li"},
                    {url:AG.social.youtube,   bg:"#FF0000",label:"YT"},
                  ].map(s=>(
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="social-icon" style={{background:s.bg,color:"white",fontFamily:"Playfair Display,serif",fontSize:"14px",fontWeight:700}}>{s.label}</a>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <div>
              <div className="pill">Formulaire de contact</div>
              <h2 style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:700,marginBottom:"28px"}} className="title-ul">Décrivez votre projet</h2>
              {!sent?<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div className="r-form-row">
                  <Inp label="Prénom & Nom *" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))}/>
                  <Inp label="Téléphone / WhatsApp *" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))}/>
                </div>
                <Inp label="Email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
                <div className="r-form-row">
                  <Sel label="Objet de la demande" value={form.interet} onChange={e=>setForm(p=>({...p,interet:e.target.value}))}>
                    <option value="location">Location mensuelle</option>
                    <option value="meuble">Appartement meublé</option>
                    <option value="vente">Achat d'un bien</option>
                    <option value="terrain">Achat de terrain</option>
                    <option value="estimation">Vendre / Estimer</option>
                    <option value="gestion">Gestion locative</option>
                    <option value="autre">Autre</option>
                  </Sel>
                  <Inp label="Budget approximatif" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} placeholder="Ex: 350 000 FCFA/mois"/>
                </div>
                <Txta label="Votre message *" rows={5} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} placeholder="Localisation souhaitée, critères, délai..."/>
                {/* Documents */}
                <div style={{background:"var(--off)",border:"1px solid var(--border)",borderRadius:"12px",padding:"16px"}}>
                  <p style={{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginBottom:"10px"}}>Documents utiles à télécharger</p>
                  <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                    {[["Formulaire de mandat","PDF"],["Guide acheteur","PDF"],["Checklist locataire","PDF"]].map(([n,t])=>(
                      <button key={n} onClick={()=>alert("Disponible sur demande par email.")} style={{fontSize:"12px",fontWeight:600,padding:"7px 14px",borderRadius:"8px",background:"var(--white)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--blue2)"}}>
                        {n} · {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={send} disabled={ld} className="btn btn-primary" style={{justifyContent:"center",fontSize:"15px",padding:"16px",opacity:ld?0.65:1}}>
                  {ld?"Envoi en cours...":"Envoyer ma demande"}
                </button>
                <p style={{fontSize:"12px",color:"var(--gray)",textAlign:"center"}}>Réponse garantie sous 24h &bull; Discrétion assurée</p>
              </div>:<div style={{textAlign:"center",padding:"56px 0"}}>
                <div style={{fontSize:"52px",marginBottom:"12px"}}>&#10003;</div>
                <p style={{fontWeight:700,fontSize:"20px",color:"#15803d",marginBottom:"8px"}}>Demande envoyée !</p>
                <p style={{fontSize:"14px",color:"var(--gray)"}}>Notre équipe vous contacte sous 24h.</p>
              </div>}
            </div>
          </div>
        </div>
      </section>

      {/* Carte Google Maps */}
      <section className="section-sm" style={{background:"var(--off)"}}>
        <div className="container">
          <div style={{textAlign:"center",marginBottom:"32px"}}>
            <div className="pill">Localisation</div>
            <h2 style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:700}}>Nous trouver à Abidjan</h2>
          </div>
          <div className="map-container" style={{height:"360px",border:"1px solid var(--border)",borderRadius:"18px",overflow:"hidden"}}>
            <iframe
              src={AG.mapEmbed}
              width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" title="ImmobilierCI — Abidjan"/>
          </div>
          <p style={{textAlign:"center",fontSize:"13px",color:"var(--gray)",marginTop:"12px"}}>Abidjan, Côte d'Ivoire &bull; {AG.horaires}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{background:"var(--white)"}}>
        <div className="container" style={{maxWidth:"760px"}}>
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <div className="pill">FAQ</div>
            <h2 style={{fontSize:"clamp(22px,5vw,34px)",fontWeight:700}} className="title-ul-c">Questions fréquentes</h2>
            <div className="divider-gold" style={{margin:"18px auto 0"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {faqs.map(([q,r],i)=>(
              <details key={i} style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:"14px",overflow:"hidden"}}>
                <summary style={{padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontWeight:700,fontSize:"15px",color:"var(--text)"}}>
                  {q}<span className="faq-icon" style={{width:"24px",height:"24px",borderRadius:"50%",background:"var(--blueL)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--blue2)",fontSize:"16px",flexShrink:0,fontWeight:700}}>+</span>
                </summary>
                <div style={{padding:"0 24px 20px",fontSize:"14px",lineHeight:1.9,color:"var(--gray)",borderTop:"1px solid var(--border)"}} ><div style={{paddingTop:"16px"}}>{r}</div></div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────

export default PageContact;
