// Calculatrice.jsx — ImmobilierCI — 3 outils : budget locatif, crédit, rendement
import { useState, useCallback } from "react";
import { fmt, AG, DEMO } from "./utils.js";
import { wa } from "./utils.js";

const pct = n => (Math.round(n*10)/10).toFixed(1)+'%';
const fmtR = n => new Intl.NumberFormat("fr-CI").format(Math.round(n));

// Biens de démo — remplacés par les vrais biens en prop
const BIENS_DEMO = [
  {titre:"Studio moderne",quartier:"Plateau Dokui",type:"location",prix:180000},
  {titre:"Appartement F3",quartier:"Cocody Riviera 3",type:"location",prix:350000},
  {titre:"Appartement meublé",quartier:"Angré",type:"meuble",prix:420000},
  {titre:"Suite prestige lagune",quartier:"Plateau Centre",type:"meuble",prix:650000},
  {titre:"Villa F4 avec jardin",quartier:"Marcory Zone 4",type:"location",prix:500000},
];

// ── Barre de répartition ─────────────────────────────────────────
function BarChart({leftPct,leftLabel,leftVal,rightLabel,rightVal}){
  return(
    <div style={{marginBottom:"24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"var(--gray)",marginBottom:"6px"}}>
        <span>{leftLabel} : <strong style={{color:"var(--text)"}}>{leftVal}</strong></span>
        <span>{rightLabel} : <strong style={{color:"var(--text)"}}>{rightVal}</strong></span>
      </div>
      <div style={{height:"10px",background:"var(--grayL)",borderRadius:"100px",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100,Math.max(0,Math.round(leftPct)))}%`,background:"var(--blue)",borderRadius:"100px",transition:"width .5s ease"}}/>
      </div>
      <div style={{display:"flex",gap:"16px",marginTop:"8px",fontSize:"12px",color:"var(--gray)"}}>
        <span><span style={{display:"inline-block",width:"10px",height:"10px",borderRadius:"50%",background:"var(--blue)",marginRight:"5px"}}/>{leftLabel}</span>
        <span><span style={{display:"inline-block",width:"10px",height:"10px",borderRadius:"50%",background:"var(--gold)",marginRight:"5px"}}/>{rightLabel}</span>
      </div>
    </div>
  );
}

// ── Carte résultat ───────────────────────────────────────────────
function RCard({label,value,sub,accent}){
  return(
    <div style={{background:accent?"var(--white)":"var(--off)",border:"1px solid var(--border)",borderRadius:"12px",padding:"14px 16px"}}>
      <div style={{fontSize:"12px",color:"var(--gray)",marginBottom:"6px"}}>{label}</div>
      <div style={{fontSize:"22px",fontWeight:500,color:accent?"var(--blue2)":"var(--text)"}}>{value}</div>
      {sub&&<div style={{fontSize:"11px",color:"var(--gray)",marginTop:"3px"}}>{sub}</div>}
    </div>
  );
}

// ── CTA bas ─────────────────────────────────────────────────────
function CTA({titre,desc,waMsg}){
  return(
    <div style={{marginTop:"24px",padding:"16px 20px",background:"var(--off)",borderRadius:"14px",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:"200px"}}>
        <div style={{fontWeight:700,fontSize:"14px",marginBottom:"3px"}}>{titre}</div>
        <div style={{fontSize:"13px",color:"var(--gray)"}}>{desc}</div>
      </div>
      <div style={{display:"flex",gap:"8px",flexShrink:0}}>
        <a href={`${wa(AG.waRaw)}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer"
          className="btn btn-wa btn-sm">WhatsApp</a>
      </div>
    </div>
  );
}

// ── Tip box ──────────────────────────────────────────────────────
function Tip({children}){
  return(
    <div style={{background:"var(--blueL)",borderLeft:"3px solid var(--blue2)",borderRadius:"0 10px 10px 0",padding:"12px 16px",fontSize:"13px",color:"var(--gray)",marginTop:"20px",lineHeight:1.7}}>
      {children}
    </div>
  );
}

// ── Champ de saisie ──────────────────────────────────────────────
function Field({label,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
      <label style={{fontSize:"12px",color:"var(--gray)",fontWeight:600}}>{label}</label>
      {children}
    </div>
  );
}

function NumInput({value,onChange,step=10000,min=0,unit,id}){
  return(
    <div style={{position:"relative"}}>
      <input id={id} type="number" value={value} step={step} min={min} onChange={e=>onChange(+e.target.value)} className="inp" style={{paddingRight:"56px"}}/>
      {unit&&<span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:"var(--gray)",pointerEvents:"none"}}>{unit}</span>}
    </div>
  );
}

// ── TAB 1 : Budget locatif ───────────────────────────────────────
function TabLoyer({biens}){
  const [revenu,setRevenu]   = useState(500000);
  const [charges,setCharges] = useState(80000);
  const [taux,setTaux]       = useState(33);

  const maxLoyer = Math.max(0, revenu*(taux/100));
  const reste    = revenu - maxLoyer;
  const biensAff = (biens?.filter(b=>b.type==="location"||b.type==="meuble")||BIENS_DEMO);

  const niveau = maxLoyer<200000?"studio ou chambre":maxLoyer<400000?"F2 ou F3":maxLoyer<700000?"villa ou grand appartement":"bien haut standing";

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"16px"}}>
        <Field label="Revenus mensuels nets">
          <NumInput value={revenu} onChange={setRevenu} unit="FCFA" step={10000}/>
        </Field>
        <Field label="Autres charges mensuelles">
          <NumInput value={charges} onChange={setCharges} unit="FCFA" step={5000}/>
        </Field>
      </div>
      <Field label={`Taux d'effort : ${taux}% (recommandé : 33%)`}>
        <input type="range" min={20} max={45} value={taux} onChange={e=>setTaux(+e.target.value)} style={{width:"100%"}}/>
      </Field>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"12px",margin:"20px 0"}}>
        <RCard label="Loyer max recommandé" value={fmtR(maxLoyer)} sub="FCFA / mois" accent/>
        <RCard label="Revenus nets"        value={fmtR(revenu)}    sub="FCFA / mois"/>
        <RCard label="Reste après loyer"   value={fmtR(reste)}     sub="FCFA / mois"/>
        <RCard label="Taux d'effort"       value={`${taux}%`}       sub="de vos revenus"/>
      </div>

      <BarChart leftPct={maxLoyer/revenu*100} leftLabel="Loyer max" leftVal={fmtR(maxLoyer)+" FCFA"} rightLabel="Reste" rightVal={fmtR(reste)+" FCFA"}/>

      <div style={{fontSize:"13px",color:"var(--gray)",marginBottom:"10px",fontWeight:600}}>Biens ImmobilierCI dans votre budget</div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
        {biensAff.slice(0,5).map((b,i)=>{
          const ok    = b.prix <= maxLoyer;
          const maybe = !ok && b.prix <= maxLoyer*1.15;
          const col   = ok?"#15803d":maybe?"#c2410c":"#991b1b";
          const bg    = ok?"#dcfce7":maybe?"#fff7ed":"#fef2f2";
          const label = ok?"Dans votre budget":maybe?"Légèrement au-dessus":"Au-dessus du budget";
          return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"var(--off)",border:"1px solid var(--border)",borderRadius:"10px",fontSize:"13px",gap:"8px",flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:600}}>{b.titre}</div>
                <div style={{fontSize:"12px",color:"var(--gray)"}}>{b.quartier} — {fmtR(b.prix)} FCFA/mois</div>
              </div>
              <span style={{fontSize:"11px",fontWeight:700,padding:"4px 12px",borderRadius:"100px",background:bg,color:col,flexShrink:0}}>{label}</span>
            </div>
          );
        })}
      </div>

      <Tip>
        <strong>Conseil ImmobilierCI</strong> — Avec {fmtR(maxLoyer)} FCFA/mois, vous accédez à un <strong>{niveau}</strong> à Abidjan.
        {taux>35?" Un taux de "+taux+"% est élevé — pensez à négocier ou chercher avec un co-locataire.":" Votre budget est sain pour le marché abidjanais."}
      </Tip>
      <CTA
        titre="Trouvez votre bien avec ImmobilierCI"
        desc="Propositions adaptées à votre budget sous 24h."
        waMsg={`Bonjour ImmobilierCI, mon budget locatif est de ${fmtR(maxLoyer)} FCFA/mois. Pouvez-vous me proposer des biens ?`}
      />
    </div>
  );
}

// ── TAB 2 : Crédit immobilier ────────────────────────────────────
function TabCredit(){
  const [prix,setPrix]     = useState(45000000);
  const [apport,setApport] = useState(9000000);
  const [taux,setTaux]     = useState(7.5);
  const [duree,setDuree]   = useState(15);
  const [assur,setAssur]   = useState(0.4);

  const cap   = Math.max(0, prix-apport);
  const n     = duree*12;
  const txM   = taux/100/12;
  const assM  = (cap*(assur/100))/12;
  const mens  = txM>0&&cap>0 ? cap*txM/(1-Math.pow(1+txM,-n)) : cap/n;
  const total = (mens+assM)*n;
  const cout  = total-cap;
  const pctAp = prix>0 ? apport/prix*100 : 0;

  // Tableau amortissement
  let solde=cap, rows=[];
  for(let a=1;a<=Math.min(5,duree);a++){
    let intAn=0,capAn=0;
    for(let m=0;m<12;m++){
      const int=solde*txM; const capM=mens-int;
      intAn+=int; capAn+=capM; solde-=capM;
    }
    rows.push({a,total:mens*12,cap:capAn,int:intAn,solde:Math.max(0,solde)});
  }

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"16px"}}>
        <Field label="Prix du bien"><NumInput value={prix} onChange={setPrix} unit="FCFA" step={1000000}/></Field>
        <Field label="Apport personnel"><NumInput value={apport} onChange={setApport} unit="FCFA" step={500000}/></Field>
        <Field label="Taux d'intérêt annuel">
          <div style={{position:"relative"}}>
            <input type="number" value={taux} step={0.1} min={1} max={25} onChange={e=>setTaux(+e.target.value)} className="inp" style={{paddingRight:"28px"}}/>
            <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:"var(--gray)"}}>%</span>
          </div>
        </Field>
        <Field label="Durée">
          <select value={duree} onChange={e=>setDuree(+e.target.value)} className="inp">
            {[5,7,10,12,15,20,25].map(d=><option key={d} value={d}>{d} ans</option>)}
          </select>
        </Field>
        <Field label="Assurance emprunteur / an">
          <div style={{position:"relative"}}>
            <input type="number" value={assur} step={0.05} min={0} max={2} onChange={e=>setAssur(+e.target.value)} className="inp" style={{paddingRight:"28px"}}/>
            <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:"var(--gray)"}}>%</span>
          </div>
        </Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"12px",margin:"20px 0"}}>
        <RCard label="Mensualité (hors assur.)" value={fmtR(mens)}          sub="FCFA / mois" accent/>
        <RCard label="Avec assurance"           value={fmtR(mens+assM)}      sub="FCFA / mois"/>
        <RCard label="Capital emprunté"         value={fmtR(cap)}            sub="FCFA"/>
        <RCard label="Coût des intérêts"        value={fmtR(cout)}           sub={`sur ${duree} ans`}/>
        <RCard label="Apport"                   value={pct(pctAp)}           sub="du prix"/>
        <RCard label="Total remboursé"          value={fmtR(total)}          sub="FCFA"/>
      </div>

      <BarChart leftPct={cap/total*100} leftLabel="Capital" leftVal={fmtR(cap)+" FCFA"} rightLabel="Intérêts + assur." rightVal={fmtR(cout+assM*n)+" FCFA"}/>

      <div style={{fontSize:"13px",color:"var(--gray)",marginBottom:"8px",fontWeight:600}}>Amortissement — 5 premières années</div>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:"480px"}}>
          <thead>
            <tr style={{background:"var(--off)"}}>
              {["Année","Mensual. ×12","Capital remb.","Intérêts","Capital restant"].map(h=>(
                <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,fontSize:"11px",color:"var(--gray)",borderBottom:"1px solid var(--border)"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.a}>
                <td style={{padding:"7px 10px",borderBottom:"1px solid var(--border)",fontWeight:600}}>Année {r.a}</td>
                <td style={{padding:"7px 10px",borderBottom:"1px solid var(--border)"}}>{fmtR(r.total)}</td>
                <td style={{padding:"7px 10px",borderBottom:"1px solid var(--border)"}}>{fmtR(r.cap)}</td>
                <td style={{padding:"7px 10px",borderBottom:"1px solid var(--border)",color:"var(--gray)"}}>{fmtR(r.int)}</td>
                <td style={{padding:"7px 10px",borderBottom:"1px solid var(--border)",fontWeight:600,color:"var(--blue)"}}>{fmtR(r.solde)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Tip>
        <strong>Conseil ImmobilierCI</strong> — {pctAp>=20?`Votre apport de ${pct(pctAp)} est solide. Les banques ivoiriennes exigent généralement 20 à 30%.`:`Votre apport (${pct(pctAp)}) est inférieur aux 20% généralement requis — prévoir un refus ou un taux plus élevé.`}
        {" "}Sur {duree} ans à {taux}%, chaque million FCFA d'apport supplémentaire réduit la mensualité de <strong>{fmtR(1000000*txM/(1-Math.pow(1+txM,-n)))} FCFA</strong>.
      </Tip>
      <CTA
        titre="Achetez avec ImmobilierCI"
        desc="Estimation gratuite et accompagnement jusqu'à la signature."
        waMsg="Bonjour ImmobilierCI, je souhaite acheter un bien immobilier. Pouvez-vous m'accompagner ?"
      />
    </div>
  );
}

// ── TAB 3 : Rendement locatif ────────────────────────────────────
function TabInvest(){
  const [prix,setPrix]   = useState(45000000);
  const [loyer,setLoyer] = useState(350000);
  const [chg,setChg]     = useState(600000);
  const [vac,setVac]     = useState(0.083);
  const [gest,setGest]   = useState(8);

  const loyerEff  = loyer*12*(1-vac);
  const fraisGest = loyerEff*(gest/100);
  const revNetAn  = loyerEff-chg-fraisGest;
  const rendBrut  = prix>0?(loyer*12/prix)*100:0;
  const rendNet   = prix>0?(revNetAn/prix)*100:0;
  const cashFlow  = revNetAn/12;
  const retour    = rendNet>0?Math.round(100/rendNet):0;
  const niveau    = rendNet>=8?"excellent":rendNet>=5?"bon":rendNet>=3?"correct":"faible";

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"16px"}}>
        <Field label="Prix d'achat du bien"><NumInput value={prix} onChange={setPrix} unit="FCFA" step={1000000}/></Field>
        <Field label="Loyer mensuel perçu"><NumInput value={loyer} onChange={setLoyer} unit="FCFA" step={10000}/></Field>
        <Field label="Charges annuelles"><NumInput value={chg} onChange={setChg} unit="FCFA" step={50000}/></Field>
        <Field label="Vacance locative">
          <select value={vac} onChange={e=>setVac(+e.target.value)} className="inp">
            <option value={0}>Aucune (100% occupé)</option>
            <option value={0.083}>1 mois / an</option>
            <option value={0.167}>2 mois / an</option>
            <option value={0.25}>3 mois / an</option>
          </select>
        </Field>
        <Field label="Frais de gestion ImmobilierCI">
          <div style={{position:"relative"}}>
            <input type="number" value={gest} step={0.5} min={0} max={15} onChange={e=>setGest(+e.target.value)} className="inp" style={{paddingRight:"28px"}}/>
            <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:"var(--gray)"}}>%</span>
          </div>
        </Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"12px",margin:"20px 0"}}>
        <RCard label="Rendement brut"        value={pct(rendBrut)}   sub="par an" accent/>
        <RCard label="Rendement net"         value={pct(rendNet)}    sub="après charges"/>
        <RCard label="Cash-flow mensuel net" value={fmtR(cashFlow)}  sub="FCFA / mois"/>
        <RCard label="Revenus nets / an"     value={fmtR(revNetAn)}  sub="FCFA"/>
        <RCard label="Retour investissement" value={`${retour} ans`} sub="pour récupérer"/>
        <RCard label="Frais gestion LENSA"   value={fmtR(fraisGest)} sub="FCFA / an"/>
      </div>

      <BarChart leftPct={loyerEff>0?Math.max(0,revNetAn/loyerEff*100):0} leftLabel="Revenu net" leftVal={fmtR(revNetAn)+" FCFA/an"} rightLabel="Charges totales" rightVal={fmtR(Math.max(0,loyerEff-revNetAn))+" FCFA/an"}/>

      <Tip>
        <strong>Analyse ImmobilierCI</strong> — Un rendement net de <strong>{pct(rendNet)}</strong> est <strong>{niveau}</strong> pour le marché abidjanais (fourchette 3–8% net selon le quartier).
        {rendNet>=5?" Cet investissement est rentable — la gestion par ImmobilierCI optimise le taux d'occupation et garantit les loyers.":" Pour améliorer la rentabilité : négociez le prix d'achat, augmentez le loyer au marché, ou réduisez les charges."}
      </Tip>
      <CTA
        titre="Confiez votre bien à ImmobilierCI"
        desc="Gestion locative professionnelle, loyers garantis sous 3 jours."
        waMsg="Bonjour ImmobilierCI, je souhaite confier mon bien en gestion locative. Pouvez-vous me contacter ?"
      />
    </div>
  );
}

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export default function Calculatrice({biens,onClose}){
  const [tab,setTab] = useState("loyer");
  const TABS = [
    {id:"loyer",  label:"Budget locatif"},
    {id:"credit", label:"Crédit immobilier"},
    {id:"invest", label:"Rendement locatif"},
  ];
  return(
    <div style={{background:"var(--white)",borderRadius:"20px",border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 24px 64px rgba(92,26,43,0.12)"}}>
      {/* Header */}
      <div style={{background:"var(--blue)",padding:"20px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{fontFamily:"Playfair Display,serif",fontSize:"20px",fontWeight:700,color:"white",marginBottom:"2px"}}>Calculatrice immobilière</h2>
          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.65)"}}>ImmobilierCI · Côte d'Ivoire</p>
        </div>
        {onClose&&<button onClick={onClose} style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(255,255,255,0.15)",color:"white",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>&#x2715;</button>}
      </div>
      {/* Tabs */}
      <div style={{display:"flex",gap:"4px",background:"var(--off)",padding:"6px",margin:"0"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 8px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:700,transition:"all .18s",background:tab===t.id?"white":"transparent",color:tab===t.id?"var(--blue)":"var(--gray)",boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{padding:"clamp(16px,4vw,28px)"}}>
        {tab==="loyer"  && <TabLoyer  biens={biens}/>}
        {tab==="credit" && <TabCredit/>}
        {tab==="invest" && <TabInvest/>}
      </div>
    </div>
  );
}
