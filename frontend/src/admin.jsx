// admin.jsx v3.1 — sans pénalités, avec alertes contrats, stats temps réel
import { useState, useRef, useEffect } from "react";
import { useCtx } from "./context.jsx";
import { Badge, Inp, Sel, Txta, Modal, KpiCard, Gallery, PhotoUpload } from "./ui.jsx";
import { fmt, fmtM, wa, photoSrc, TL, SL, SC, ETAPES_VENTE, API, AG } from "./utils.js";
import { genererQuittanceLoyer, genererRecuVente } from "./components/Recu.jsx";
import { genererContratBail, genererContratVente } from "./utils/genContrats.js";
import { DocumentsPanel } from "./components/Documents.jsx";

// Btn mini inline pour admin
const Btn=({children,variant="primary",size="md",className="",...p})=>{
  const V={primary:"btn btn-primary",outline:"btn btn-outline",danger:"",ghost:"",amber:"",wa:"btn btn-wa",call:"btn btn-primary",orange:"btn btn-primary"};
  const S={xs:"btn-sm",sm:"btn-sm",md:"",lg:"btn-lg",xl:"btn-lg"};
  return <button className={`${V[variant]||"btn btn-primary"} ${S[size]||""} ${className}`} {...p}>{children}</button>;
};

// ── DASHBOARD ─────────────────────────────────────────────────
export function AdminDashboard() {
  const {biens,clients,loyers,ventes,demandes,contrats,online} = useCtx();
  const [stats,setStats] = useState(null);

  useEffect(() => {
    if (!online) return;
    const tok = sessionStorage.getItem("_ici_tok");
    if (!tok) return;
    fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r=>r.json()).then(setStats).catch(()=>{});
  }, [online]);

  // Fallback calculs locaux si backend pas dispo
  const mois  = new Date().toISOString().slice(0,7);
  const today = new Date().toISOString().split("T")[0];
  const lm    = loyers.filter(l=>l.mois===mois);
  const paye  = stats?.loyersMois  ?? lm.reduce((s,l)=>s+(l.statut==="paye"?l.montant:0),0);
  const att   = stats?.loyersAttend?? lm.reduce((s,l)=>s+l.montant,0);
  const retards = stats?.retards   ?? loyers.filter(l=>l.statut!=="paye"&&(l.joursRetard||0)>0);
  const nbRetards = stats?.nbRetards ?? retards.length;
  const montRetards = stats?.montRetards ?? retards.reduce((s,l)=>s+l.montant,0);
  const ventesAct = stats?.ventesEncours ?? ventes.filter(v=>!["finalisee","annulee"].includes(v.statut)).length;
  const caVentes  = stats?.caVentes  ?? ventes.filter(v=>v.statut==="finalisee").reduce((s,v)=>s+(v.prixFinal||0),0);
  const commissions = stats?.commissions ?? ventes.filter(v=>v.statut==="finalisee").reduce((s,v)=>s+(v.commission||0),0);
  const tauxOcc   = stats?.tauxOccup ?? (biens.length>0?Math.round((biens.filter(b=>b.statut==="loue").length/biens.length)*100):0);
  const dNew      = stats?.demandesNouv ?? demandes.filter(d=>d.statut==="nouveau").length;
  const contratsExpir = stats?.contratsExpir ?? 0;
  const contratsAlerte = stats?.contratsAlerte ?? [];

  // Graphique loyers
  const loyers12 = stats?.loyers12 ?? [];
  const chartData = loyers12.length>0 ? loyers12 : [
    {mois:"2024-10",total:530000},{mois:"2024-11",total:530000},{mois:"2024-12",total:530000},
    {mois:"2025-01",total:530000},{mois:"2025-02",total:530000},{mois:"2025-03",total:530000},
    {mois:"2025-04",total:530000},{mois:"2025-05",total:530000},
  ];
  const maxL = Math.max(...chartData.map(l=>l.total),1);

  // Pipeline ventes
  const pipeline = stats?.pipeline ?? ETAPES_VENTE.map(e=>({ statut:e, nb:ventes.filter(v=>v.statut===e).length }));

  const retardsDisplay = Array.isArray(retards) ? retards : [];

  return <div className="space-y-6">
    {/* KPI */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Biens gérés"       value={biens.length}            sub={`${biens.filter(b=>b.statut==="disponible").length} disponibles`} pos icon="🏢" accent="emerald"/>
      <KpiCard label={`Loyers ${mois}`}  value={`${fmtM(paye)} F`}       sub={`/ ${fmtM(att)} attendus`} pos={paye>=att}    icon="💰" accent="amber"/>
      <KpiCard label="Loyers en retard"  value={nbRetards}               sub={nbRetards>0?`${fmtM(montRetards)} F en attente`:"✓ Tous à jour"} pos={nbRetards===0} icon="⏰" accent={nbRetards>0?"red":"emerald"}/>
      <KpiCard label="Ventes actives"    value={ventesAct}               sub={`CA finalisé : ${fmtM(caVentes)} F`} pos icon="🏡" accent="orange"/>
      <KpiCard label="Taux occupation"   value={`${tauxOcc}%`}           sub={tauxOcc>=80?"Excellent":"À améliorer"} pos={tauxOcc>=80} icon="📊" accent="blue"/>
      <KpiCard label="Clients"           value={clients.length}          sub={`${clients.filter(c=>c.type==="locataire").length} locataires`} pos icon="👥" accent="purple"/>
      <KpiCard label="Demandes"          value={dNew}                    sub={dNew>0?"À traiter":"✓ À jour"} pos={dNew===0} icon="📬" accent={dNew>0?"blue":"emerald"}/>
      <KpiCard label="Commissions"       value={`${fmtM(commissions)} F`} sub="Ventes finalisées" pos icon="💎" accent="emerald"/>
    </div>

    {/* Alerte retards */}
    {retardsDisplay.length>0&&<div className="bg-red-50 border border-red-200 rounded-2xl p-5">
      <h3 className="font-bold text-red-800 mb-3">⏰ Loyers en retard — {retardsDisplay.length} locataire{retardsDisplay.length>1?"s":""}</h3>
      <div className="space-y-2">{retardsDisplay.map((l,i)=>(
        <div key={l.id||i} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3 border border-red-100">
          <div><span className="font-semibold text-gray-900">{l.clientNom}</span><span className="text-gray-400 mx-2">·</span><span className="text-sm text-gray-500">{l.bienTitre}</span><span className="text-gray-400 mx-2">·</span><span className="text-sm font-bold text-gray-800">{l.mois}</span></div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-red-600 text-sm">{fmt(l.montant)} FCFA</span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{l.joursRetard}j de retard</span>
            {(l.whatsapp||l.clientTel)&&<a href={`${wa(l.whatsapp||l.clientTel)}?text=${encodeURIComponent(`Bonjour ${l.clientNom}, votre loyer de ${fmt(l.montant)} FCFA (${l.mois}) est en attente. Merci de régulariser. — ImmobilierCI`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#25D366] text-white">💬 Relancer</a>}
          </div>
        </div>
      ))}</div>
    </div>}

    {/* Alerte contrats expirant */}
    {contratsAlerte.length>0&&<div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <h3 className="font-bold text-amber-800 mb-3">📄 Contrats expirant dans 60 jours ({contratsAlerte.length})</h3>
      <div className="space-y-2">{contratsAlerte.map((c,i)=>(
        <div key={c.id||i} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3 border border-amber-100">
          <div><span className="font-semibold text-gray-900">{c.clientNom}</span><span className="text-gray-400 mx-2">·</span><span className="text-sm text-gray-500">{c.bienTitre}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Expire le {c.dateFin}</span>
            <span className="text-sm font-bold text-gray-700">{fmt(c.loyer)} F/mois</span>
          </div>
        </div>
      ))}</div>
    </div>}

    <div className="grid lg:grid-cols-3 gap-6">
      {/* Tableau biens */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-sm text-gray-900">Biens récents</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[440px]">
          <thead><tr className="bg-gray-50 border-b border-gray-100">{["Bien","Type","Prix","Statut"].map(h=><th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>)}</tr></thead>
          <tbody>{biens.slice(0,6).map(b=>(
            <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="text-lg">{b.emoji}</span><span className="text-sm font-medium text-gray-900 max-w-[150px] truncate">{b.titre}</span></div></td>
              <td className="px-5 py-3"><Badge label={TL[b.type]} color="bg-blue-50 text-blue-700 border-blue-200"/></td>
              <td className="px-5 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{fmtM(b.prix)} F</td>
              <td className="px-5 py-3"><Badge label={SL[b.statut]||b.statut} color={SC[b.statut]||""}/></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Graphique */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Loyers encaissés</h3>
          <div className="flex items-end gap-1 h-20 mb-2">
            {chartData.map((l,i)=>(
              <div key={i} className="flex-1 flex flex-col items-stretch">
                <div className="w-full rounded-t" title={`${l.mois}: ${fmt(l.total)} F`} style={{height:`${Math.max((l.total/maxL)*100,2)}%`,background:i===chartData.length-1?"#059669":"#d1fae5",minHeight:l.total>0?4:2,transition:"height .3s"}}/>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">{chartData.map(l=><span key={l.mois}>{l.mois.slice(5)}</span>)}</div>
        </div>

        {/* Pipeline ventes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline ventes</h3>
          {ETAPES_VENTE.map(e=>{
            const n = (pipeline||[]).find(p=>p.statut===e)?.nb ?? ventes.filter(v=>v.statut===e).length;
            return <div key={e} className="flex items-center gap-3 mb-2">
              <div className="text-xs text-gray-500 w-24 truncate">{SL[e]||e}</div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${ventes.length>0?(n/Math.max(ventes.length,1))*100:0}%`}}/></div>
              <div className="text-xs font-bold text-gray-700 w-3">{n}</div>
            </div>;
          })}
        </div>
      </div>
    </div>

    {/* Demandes récentes */}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Demandes récentes</h3>
        {dNew>0&&<Badge label={`${dNew} nouveau${dNew>1?"x":""}`} color="bg-blue-100 text-blue-700 border-blue-200"/>}
      </div>
      <div className="divide-y divide-gray-50">{demandes.slice(0,5).map(d=>(
        <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">{(d.nom||"?").slice(0,2)}</div>
            <div><div className="text-sm font-medium text-gray-900">{d.nom}</div><div className="text-xs text-gray-500 truncate max-w-[250px]">{d.interet} · {(d.message||"").slice(0,60)}</div></div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge label={SL[d.statut]||d.statut} color={SC[d.statut]||""}/>
            <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
          </div>
        </div>
      ))}</div>
    </div>
  </div>;
}

// ── BIENS ─────────────────────────────────────────────────────
export function AdminBiens() {
  const {biens,addBien,updateBien,deleteBien,uploadPhotos,deletePhoto,canWrite} = useCtx();
  const peutEcrire = canWrite("biens");
  const [search,setSearch] = useState("");
  const [ft,setFt]         = useState("all");
  const [modal,setModal]   = useState(null);
  const [photoModal,setPhotoModal] = useState(null);
  const [uploading,setUploading]   = useState(false);
  const fileRef = useRef();

  const empty = {titre:"",type:"location",prix:"",surface:"",chambres:"",sdb:"",etage:"",parking:"",quartier:"",commune:"",ville:"Abidjan",adresse:"",statut:"disponible",description:"",equipements:"",whatsapp:"",telephone:"",featured:false,meta_title:"",meta_desc:""};
  const [form,setForm] = useState(empty);
  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));

  const filtered = biens.filter(b=>(ft==="all"||b.type===ft)&&(!search||`${b.titre} ${b.quartier} ${b.commune}`.toLowerCase().includes(search.toLowerCase())));

  const save = async () => {
    if(!form.titre||!form.prix) return;
    const d = {...form,prix:+form.prix,surface:+form.surface||0,chambres:+form.chambres||0,sdb:+form.sdb||0,etage:form.etage?+form.etage:null,parking:+form.parking||0,featured:form.featured?1:0};
    modal==="add" ? await addBien(d) : await updateBien(modal.id,d);
    setModal(null);
  };

  const handleUpload = async e => {
    if(!photoModal||!e.target.files?.length) return;
    setUploading(true);
    try { await uploadPhotos(photoModal.id, e.target.files); }
    finally { setUploading(false); e.target.value=""; }
  };

  const currentBien    = photoModal ? biens.find(b=>b.id===photoModal.id) : null;
  const currentPhotos  = currentBien?.photos||[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input placeholder="🔍 Titre, quartier..." className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="flex gap-2 flex-wrap">
          {[["all","Tous"],["location","Location"],["meuble","Meublé"],["vente","Vente"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFt(k)} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${ft===k?"bg-emerald-600 text-white border-emerald-600":"bg-white text-gray-600 border-gray-300"}`}>{l}</button>
          ))}
        </div>
        {peutEcrire&&<Btn variant="primary" onClick={()=>{setForm(empty);setModal("add");}}>+ Ajouter</Btn>}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {["Réf.","Bien","Type","Prix","Photos","Contact","Statut",...(peutEcrire?["Actions"]:[])].map(h=><th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">{filtered.map(b=>(
            <tr key={b.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-xs text-gray-400 font-mono">{b.ref}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="text-xl flex-shrink-0">{b.emoji}</span><div><div className="text-sm font-medium text-gray-900 max-w-[150px] truncate">{b.titre}</div><div className="text-xs text-gray-400">📍 {b.quartier}</div></div></div></td>
              <td className="px-4 py-3"><Badge label={TL[b.type]} color="bg-blue-50 text-blue-700 border-blue-200"/></td>
              <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm font-bold text-gray-900">{fmtM(b.prix)}</div><div className="text-xs text-gray-400">FCFA{b.type!=="vente"?"/mois":""}</div></td>
              <td className="px-4 py-3">
                <button onClick={()=>setPhotoModal(b)} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${(b.photos?.length||0)>0?"bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100":"bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300"}`}>
                  📷 {b.photos?.length||0}
                </button>
              </td>
              <td className="px-4 py-3"><div className="flex gap-1.5 flex-wrap"><a href={`https://wa.me/${(b.whatsapp||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1.5 rounded-lg font-semibold text-white" style={{background:"#25D366"}}>WA</a>{b.telephone&&<a href={`tel:${b.telephone}`} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold text-white bg-blue-700">TEL</a>}</div></td>
              <td className="px-4 py-3"><Badge label={SL[b.statut]||b.statut} color={SC[b.statut]||""}/></td>
              {peutEcrire&&<td className="px-4 py-3"><div className="flex gap-1.5">
                <Btn variant="outline" size="xs" onClick={()=>{setForm({...b,prix:String(b.prix),surface:String(b.surface||""),chambres:String(b.chambres||""),sdb:String(b.sdb||""),etage:String(b.etage||""),parking:String(b.parking||""),featured:b.featured===1});setModal(b);}}>✏️</Btn>
                <Btn variant="danger" size="xs" onClick={()=>{
                  if(b.statut==="loue") return alert("❌ Impossible de supprimer : ce bien est actuellement loué.\n\nPour libérer le bien :\n1. Allez dans Clients\n2. Ouvrez la fiche du locataire\n3. Cliquez « 🔑 Libérer le bien »");
                  if(b.statut==="en_cours") return alert("❌ Impossible : une vente est en cours sur ce bien.\nAnnulez la vente avant de supprimer le bien.");
                  if(b.statut==="vendu") return alert("❌ Impossible : ce bien a été vendu.\nArchivez-le plutôt (statut = Archivé).");
                  if(!confirm(`Supprimer "${b.titre}" définitivement ?\nToutes les photos et données associées seront perdues.`)) return;
                  deleteBien(b.id);
                }}>🗑️</Btn>
              </div></td>}
            </tr>
          ))}
          {filtered.length===0&&<tr><td colSpan={8} className="text-center py-16 text-gray-400">Aucun bien trouvé</td></tr>}
          </tbody>
        </table></div>
      </div>

      {/* Modal Bien */}
      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal==="add"?"Ajouter un bien":`Modifier — ${modal?.titre||""}`} wide>
        {modal&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2"><Inp label="Titre *" placeholder="Appartement F3 climatisé — Cocody" value={form.titre} onChange={e=>sf("titre",e.target.value)}/></div>
          <Sel label="Type *" value={form.type} onChange={e=>sf("type",e.target.value)}><option value="location">Location mensuelle</option><option value="meuble">Appartement meublé</option><option value="vente">Bien à vendre</option></Sel>
          <div>
            <Inp label="Prix (FCFA) *" type="number" value={form.prix} onChange={e=>{
              if(+e.target.value<0) return;
              sf("prix",e.target.value);
            }}/>
            {+form.prix<=0&&form.prix!==""&&<p style={{fontSize:"11px",color:"#dc2626",marginTop:"3px"}}>Le prix doit être supérieur à 0</p>}
          </div>
          <Inp label="Surface (m²)" type="number" value={form.surface} onChange={e=>sf("surface",e.target.value)}/>
          <Inp label="Chambres" type="number" value={form.chambres} onChange={e=>sf("chambres",e.target.value)}/>
          <Inp label="Salles de bain" type="number" value={form.sdb} onChange={e=>sf("sdb",e.target.value)}/>
          <Inp label="Étage" type="number" value={form.etage} onChange={e=>sf("etage",e.target.value)}/>
          <Inp label="Parking" type="number" value={form.parking} onChange={e=>sf("parking",e.target.value)}/>
          <Inp label="Quartier" value={form.quartier} onChange={e=>sf("quartier",e.target.value)} placeholder="Cocody Riviera 3"/>
          <Inp label="Commune" value={form.commune} onChange={e=>sf("commune",e.target.value)} placeholder="Cocody"/>
          <Inp label="WhatsApp (+225...)" value={form.whatsapp} onChange={e=>sf("whatsapp",e.target.value)} placeholder="+2250700000000"/>
          <Inp label="Téléphone" value={form.telephone} onChange={e=>sf("telephone",e.target.value)} placeholder="+2250700000000"/>
          <div>
            <Sel label="Statut" value={form.statut} onChange={e=>sf("statut",e.target.value)} disabled={["loue","vendu"].includes(form.statut)}>
              <option value="disponible">Disponible</option>
              <option value="loue" disabled>Loué (géré automatiquement)</option>
              <option value="en_cours" disabled>En cours de vente (géré automatiquement)</option>
              <option value="vendu" disabled>Vendu (géré automatiquement)</option>
            </Sel>
            {["loue","en_cours","vendu"].includes(form.statut) && (
              <p style={{fontSize:"11px",color:"var(--gray)",marginTop:"4px"}}>
                Ce statut est défini automatiquement par un contrat de bail ou une vente. Pour le libérer, retirez le locataire (onglet Clients) ou annulez la vente (onglet Ventes).
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="feat" checked={form.featured} onChange={e=>sf("featured",e.target.checked)} className="rounded w-4 h-4"/><label htmlFor="feat" className="text-sm font-medium text-gray-700">⭐ Coup de cœur</label></div>
          <div className="col-span-2"><Inp label="Équipements (séparés par virgule)" placeholder="Climatisation,Parking,WiFi,Piscine" value={form.equipements} onChange={e=>sf("equipements",e.target.value)}/></div>
          <div className="col-span-2"><Txta label="Description" rows={3} value={form.description} onChange={e=>sf("description",e.target.value)}/></div>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Btn variant="outline" onClick={()=>setModal(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={save}>{modal==="add"?"Publier le bien":"Enregistrer"}</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Photos */}
      <Modal open={!!photoModal} onClose={()=>setPhotoModal(null)} title={`📷 Photos — ${photoModal?.titre||""}`}>
        {photoModal&&<div>
          <DocumentsPanel entite="bien" entiteId={photoModal.id} titre={photoModal.titre}/>
          <div style={{height:"16px"}}/>
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <span className="text-blue-500 flex-shrink-0">ℹ️</span>
            <p className="text-xs text-blue-700">Les photos sont lues dans le navigateur (base64) et envoyées au serveur. JPG, PNG, WebP · Max 8 Mo · 10 photos max.</p>
          </div>
          {currentPhotos.length===0
            ?<div className="text-center py-8 text-gray-400"><div className="text-5xl mb-3">📷</div><p className="text-sm">Aucune photo. Cliquez ci-dessous pour en ajouter.</p></div>
            :<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">{currentPhotos.map(ph=>(
              <div key={ph.id} className="relative group aspect-video">
                <img src={photoSrc(ph)} alt="" className="w-full h-full object-cover rounded-xl border-2 border-gray-200"/>
                {ph.principale===1&&<div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">✓ Principale</div>}
                <button onClick={()=>deletePhoto(photoModal.id,ph.id)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
              </div>
            ))}</div>
          }
          <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${uploading?"border-emerald-400 bg-emerald-50 cursor-wait":"border-gray-200 hover:border-emerald-400 hover:bg-gray-50"}`} onClick={()=>!uploading&&fileRef.current?.click()}>
            {uploading
              ?<><div className="text-3xl mb-2">⏳</div><div className="text-sm font-medium text-emerald-700">Upload en cours...</div></>
              :<><div className="text-3xl mb-2">📤</div><div className="text-sm font-semibold text-gray-700">Cliquer pour ajouter des photos</div><div className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Max 8 Mo · 10 photos</div></>
            }
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading}/>
          </div>
        </div>}
      </Modal>
    </div>
  );
}

// ── CLIENTS ───────────────────────────────────────────────────
// AdminClients — 3 onglets : Locataires | Acheteurs | Prospects
// Intégré dans admin.jsx comme fonction export

const TYPE_CONFIG = {
  locataire: { label:"Locataire", icon:"🏠", color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
  acheteur:  { label:"Acheteur",  icon:"💰", color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0" },
  prospect:  { label:"Prospect",  icon:"👤", color:"#92400e", bg:"#fffbeb", border:"#fde68a" },
};

function BadgeType({type}) {
  const c = TYPE_CONFIG[type] || TYPE_CONFIG.prospect;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"4px",
      padding:"3px 10px", borderRadius:"20px", fontSize:"11px",
      fontWeight:700, background:c.bg, color:c.color, border:`1px solid ${c.border}`
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// AdminClients v3 — multi-rôles (locataire + acheteur + prospect)

const TYPE_CONFIG = {
  locataire: { label:"Locataire", icon:"🏠", color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
  acheteur:  { label:"Acheteur",  icon:"💰", color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0" },
  prospect:  { label:"Prospect",  icon:"👤", color:"#92400e", bg:"#fffbeb", border:"#fde68a" },
};

function BadgeType({role}) {
  const c = TYPE_CONFIG[role] || TYPE_CONFIG.prospect;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:"4px",
      padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:700,
      background:c.bg,color:c.color,border:`1px solid ${c.border}`
    }}>{c.icon} {c.label}</span>
  );
}

function getRoles(c) {
  if (!c.roles) return [c.type || "prospect"];
  return c.roles.split(",").map(r=>r.trim()).filter(Boolean);
}

export function AdminClients() {
  const {biens,clients,addClient,updateClient,deleteClient,canWrite,showToast} = useCtx();
  const [onglet,  setOnglet]  = useState("locataire");
  const [modal,   setModal]   = useState(null);
  const [detailC, setDetailC] = useState(null);
  const [etatLieuxModal, setEtatLieuxModal] = useState(null);
  const [etatLieux, setEtatLieux] = useState({dateSortie:"",caution_rendue:false,observations:"",pieces:{salon:"",cuisine:"",chambre1:"",chambre2:"",sdb:"",wc:"",autres:""}});
  const [search, setSearch] = useState("");

  const emptyF = {
    nom:"", email:"", tel:"", whatsapp:"",
    roles:"locataire",
    bienId:"", loyer:"", caution:"", dateEntree:"", dateSortie:"",
    profession:"", employeur:"", revenus:"", piece_identite:"",
    budget:"", modeFinancement:"cash", banque:"", typeRecherche:"",
    notes:""
  };
  const [f, setF] = useState({...emptyF});
  const sf = (k,v) => setF(p=>({...p,[k]:v}));

  const toggleRole = (role) => {
    const current = f.roles.split(",").map(r=>r.trim()).filter(Boolean);
    let next;
    if (current.includes(role)) {
      next = current.filter(r=>r!==role);
      if (next.length === 0) next = ["prospect"];
    } else {
      next = [...current.filter(r=>r!=="prospect"), role];
    }
    sf("roles", next.join(","));
    // type principal = premier rôle
    sf("type", next[0]);
  };

  const hasRole = (role) => f.roles.split(",").map(r=>r.trim()).includes(role);

  // Filtrer clients par onglet (apparaît si le client a ce rôle)
  const liste = clients
    .filter(c => {
      const roles = getRoles(c);
      return roles.includes(onglet);
    })
    .filter(c => !search || c.nom?.toLowerCase().includes(search.toLowerCase()) || c.tel?.includes(search));

  const openNew = () => {
    setF({...emptyF, roles:onglet, type:onglet});
    setModal("new");
  };
  const openEdit = (c) => {
    setF({
      ...emptyF, ...c,
      roles: c.roles || c.type || "prospect",
      bienId: c.bienId || c.bien_id || "",
      dateEntree: c.dateEntree || c.date_entree || "",
      dateSortie: c.dateSortie || c.date_sortie || "",
      piece_identite: c.pieceIdentite || c.piece_identite || "",
    });
    setModal(c);
  };

  const save = async () => {
    if (!f.nom.trim()) return showToast("Le nom est requis","warn");
    const data = {...f, type: f.roles.split(",")[0]};
    if (modal==="new") await addClient(data);
    else await updateClient(modal.id, data);
    setModal(null);
  };

  const libererBien = async (client, el) => {
    const roles = getRoles(client);
    await updateClient(client.id, {
      ...client,
      bienId: null,
      bien_id: null,
      dateSortie: el.dateSortie || new Date().toISOString().split("T")[0],
      notes: (client.notes||"") + (el.observations ? `\n[ÉTAT DES LIEUX SORTIE ${new Date().toLocaleDateString("fr-FR")}] ${el.observations}` : ""),
    });
    setEtatLieuxModal(null);
    setDetailC(null);
  };

  const BIENS_DISPO = biens.filter(b => b.statut==="disponible" || (f.bienId && b.id===+f.bienId));
  const fmt = n => n ? new Intl.NumberFormat("fr-CI").format(n) + " FCFA" : "—";

  return (
    <div>
      {/* Onglets */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap",alignItems:"center"}}>
        {["locataire","acheteur","prospect"].map(t => {
          const cfg = TYPE_CONFIG[t];
          const nb = clients.filter(c=>getRoles(c).includes(t)).length;
          return (
            <button key={t} onClick={()=>setOnglet(t)} style={{
              padding:"8px 20px",borderRadius:"20px",cursor:"pointer",
              fontWeight:onglet===t?700:500,fontSize:"13px",
              fontFamily:"Plus Jakarta Sans,sans-serif",
              background:onglet===t?cfg.color:"white",
              color:onglet===t?"white":cfg.color,
              border:`2px solid ${onglet===t?cfg.color:cfg.border}`,
            }}>
              {cfg.icon} {cfg.label}s ({nb})
            </button>
          );
        })}
        <div style={{flex:1}}/>
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{padding:"8px 14px",border:"1.5px solid var(--border)",borderRadius:"20px",fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif",outline:"none",width:"180px"}}/>
        {canWrite("clients") && (
          <button onClick={openNew} style={{padding:"9px 20px",background:TYPE_CONFIG[onglet].color,color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            + {TYPE_CONFIG[onglet].icon} {TYPE_CONFIG[onglet].label}
          </button>
        )}
      </div>

      {/* Liste */}
      {liste.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px",background:"var(--off)",borderRadius:"18px",border:"1px solid var(--border)"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>{TYPE_CONFIG[onglet].icon}</div>
          <p style={{fontWeight:700,marginBottom:"8px"}}>Aucun {TYPE_CONFIG[onglet].label.toLowerCase()}</p>
          {canWrite("clients") && <button onClick={openNew} style={{padding:"10px 22px",background:TYPE_CONFIG[onglet].color,color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>+ Ajouter</button>}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {liste.map(c => {
            const roles = getRoles(c);
            const bien = biens.find(b=>b.id===(c.bienId||c.bien_id));
            return (
              <div key={c.id} style={{
                background:"white",
                border:`1px solid ${TYPE_CONFIG[roles[0]]?.border||"var(--border)"}`,
                borderLeft:`4px solid ${TYPE_CONFIG[roles[0]]?.color||"var(--blue)"}`,
                borderRadius:"14px",padding:"14px 18px",
                display:"grid",gridTemplateColumns:"1fr auto",gap:"12px",alignItems:"center"
              }}>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px",flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:"15px",color:"var(--text)"}}>{c.nom}</span>
                    {roles.map(r=><BadgeType key={r} role={r}/>)}
                    {bien && <span style={{fontSize:"11px",color:"var(--gray)"}}>📍 {bien.titre}</span>}
                  </div>
                  <div style={{fontSize:"12px",color:"var(--gray)",display:"flex",gap:"16px",flexWrap:"wrap"}}>
                    {c.tel && <span>📞 {c.tel}</span>}
                    {c.loyer > 0 && <span>💰 {new Intl.NumberFormat("fr-CI").format(c.loyer)} FCFA/mois</span>}
                    {(c.dateEntree||c.date_entree) && <span>📅 {c.dateEntree||c.date_entree}</span>}
                    {c.profession && <span>💼 {c.profession}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                  <button onClick={()=>setDetailC(c)} style={{padding:"6px 12px",border:"1px solid var(--border)",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:700,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>👁 Fiche</button>
                  {canWrite("clients") && <button onClick={()=>openEdit(c)} style={{padding:"6px 12px",border:"1px solid var(--border)",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:700,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>✏️</button>}
                  {canWrite("clients") && <button onClick={()=>{
                    if(c.bienId||c.bien_id) return alert("❌ Libérez d'abord le bien avant de supprimer ce client.");
                    if(!confirm(`Supprimer ${c.nom} ?`)) return;
                    deleteClient(c.id);
                  }} style={{padding:"6px 10px",border:"1px solid #fecaca",borderRadius:"7px",cursor:"pointer",fontSize:"11px",color:"#dc2626",background:"#fef2f2",fontFamily:"Plus Jakarta Sans,sans-serif"}}>🗑</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulaire */}
      {modal && (
        <Modal open title={modal==="new"?`+ Nouveau client`:`Modifier — ${f.nom}`} onClose={()=>setModal(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

            {/* Sélection des rôles */}
            <div>
              <div style={{fontSize:"12px",fontWeight:700,color:"var(--gray)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>Rôles du client (plusieurs possibles)</div>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                {["locataire","acheteur","prospect"].map(role => {
                  const cfg = TYPE_CONFIG[role];
                  const active = hasRole(role);
                  return (
                    <button key={role} onClick={()=>toggleRole(role)} style={{
                      padding:"8px 16px",border:`2px solid ${active?cfg.color:cfg.border}`,
                      borderRadius:"10px",cursor:"pointer",
                      background:active?cfg.bg:"white",
                      fontWeight:active?700:500,fontSize:"13px",
                      color:active?cfg.color:"var(--gray)",
                      fontFamily:"Plus Jakarta Sans,sans-serif",
                    }}>
                      {active?"✓ ":""}{cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
              {f.roles && f.roles.includes(",") && (
                <div style={{marginTop:"6px",fontSize:"11px",color:"var(--gray)",fontStyle:"italic"}}>
                  Ce client apparaîtra dans plusieurs onglets.
                </div>
              )}
            </div>

            {/* Infos communes */}
            <div style={{borderTop:"1px solid var(--border)",paddingTop:"12px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"var(--gray)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>Informations personnelles</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <Inp label="Nom complet *" value={f.nom} onChange={e=>sf("nom",e.target.value)} placeholder="Kouamé Aya"/>
                <Inp label="Téléphone" value={f.tel||""} onChange={e=>sf("tel",e.target.value)} placeholder="+225 07..."/>
                <Inp label="WhatsApp" value={f.whatsapp||""} onChange={e=>sf("whatsapp",e.target.value)}/>
                <Inp label="Email" value={f.email||""} onChange={e=>sf("email",e.target.value)}/>
                <Inp label="Pièce d'identité (CNI)" value={f.piece_identite||""} onChange={e=>sf("piece_identite",e.target.value)} placeholder="CI-2024-..."/>
                <Inp label="Profession" value={f.profession||""} onChange={e=>sf("profession",e.target.value)}/>
                <Inp label="Employeur" value={f.employeur||""} onChange={e=>sf("employeur",e.target.value)}/>
                <Inp label="Revenus mensuels (FCFA)" type="number" value={f.revenus||""} onChange={e=>sf("revenus",+e.target.value)}/>
              </div>
            </div>

            {/* Section Locataire */}
            {hasRole("locataire") && (
              <div style={{borderTop:"1px solid #bfdbfe",paddingTop:"12px",background:"#f8fbff",borderRadius:"10px",padding:"14px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:"#1d4ed8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px"}}>🏠 Informations de location</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <Sel label="Bien loué" value={f.bienId||""} onChange={e=>sf("bienId",+e.target.value||"")}>
                    <option value="">— Aucun —</option>
                    {BIENS_DISPO.map(b=><option key={b.id} value={b.id}>{b.titre} — {b.commune}</option>)}
                  </Sel>
                  <Inp label="Loyer mensuel (FCFA)" type="number" value={f.loyer||""} onChange={e=>sf("loyer",+e.target.value)}/>
                  <Inp label="Caution (FCFA)" type="number" value={f.caution||""} onChange={e=>sf("caution",+e.target.value)}/>
                  <Inp label="Date d'entrée" type="date" value={f.dateEntree||""} onChange={e=>sf("dateEntree",e.target.value)}/>
                  <Inp label="Date de sortie" type="date" value={f.dateSortie||""} onChange={e=>sf("dateSortie",e.target.value)}/>
                </div>
                {f.loyer > 0 && f.revenus > 0 && (
                  <div style={{marginTop:"10px",padding:"8px 12px",borderRadius:"8px",fontSize:"12px",background:f.revenus>=f.loyer*3?"#f0fdf4":"#fef2f2",color:f.revenus>=f.loyer*3?"#15803d":"#dc2626",border:`1px solid ${f.revenus>=f.loyer*3?"#bbf7d0":"#fecaca"}`}}>
                    {f.revenus>=f.loyer*3?"✅ Solvable — revenus ≥ 3× loyer":"⚠️ Revenus insuffisants — doivent être ≥ 3× loyer"}
                  </div>
                )}
              </div>
            )}

            {/* Section Acheteur */}
            {hasRole("acheteur") && (
              <div style={{borderTop:"1px solid #bbf7d0",paddingTop:"12px",background:"#f8fdf8",borderRadius:"10px",padding:"14px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:"#15803d",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px"}}>💰 Informations d'achat</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <Inp label="Budget maximum (FCFA)" type="number" value={f.budget||""} onChange={e=>sf("budget",+e.target.value)}/>
                  <Sel label="Mode de financement" value={f.modeFinancement||"cash"} onChange={e=>sf("modeFinancement",e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="credit">Crédit bancaire</option>
                    <option value="mixte">Mixte</option>
                  </Sel>
                  {(f.modeFinancement==="credit"||f.modeFinancement==="mixte") && (
                    <Inp label="Banque" value={f.banque||""} onChange={e=>sf("banque",e.target.value)} placeholder="SGCI, Banque Atlantique..."/>
                  )}
                  <Inp label="Type de bien recherché" value={f.typeRecherche||""} onChange={e=>sf("typeRecherche",e.target.value)} placeholder="Villa 4 ch., terrain..."/>
                </div>
              </div>
            )}

            {/* Notes */}
            <Txta label="Notes" rows={2} value={f.notes||""} onChange={e=>sf("notes",e.target.value)} placeholder="Informations complémentaires..."/>

            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",borderTop:"1px solid var(--border)",paddingTop:"14px"}}>
              <button onClick={()=>setModal(null)} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
              <button onClick={save} style={{padding:"10px 20px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"var(--blue)",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                {modal==="new"?"+ Ajouter le client":"Enregistrer"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Fiche détail */}
      {detailC && (
        <Modal open title={`Fiche — ${detailC.nom}`} onClose={()=>setDetailC(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {getRoles(detailC).map(r=><BadgeType key={r} role={r}/>)}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              {[
                ["Nom", detailC.nom],
                ["Téléphone", detailC.tel||"—"],
                ["WhatsApp", detailC.whatsapp||"—"],
                ["Email", detailC.email||"—"],
                ["CNI / Pièce d'identité", detailC.pieceIdentite||detailC.piece_identite||"—"],
                ["Profession", detailC.profession||"—"],
                ["Employeur", detailC.employeur||"—"],
                ["Revenus", detailC.revenus ? fmt(detailC.revenus)+"/mois" : "—"],
              ].map(([l,v])=>(
                <div key={l} style={{background:"var(--off)",borderRadius:"8px",padding:"10px 14px"}}>
                  <div style={{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginBottom:"3px"}}>{l}</div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"var(--text)"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Infos locataire */}
            {getRoles(detailC).includes("locataire") && (
              <div style={{background:"#f8fbff",border:"1px solid #bfdbfe",borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:"#1d4ed8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px"}}>🏠 Location</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {[
                    ["Bien loué", biens.find(b=>b.id===(detailC.bienId||detailC.bien_id))?.titre||"—"],
                    ["Loyer", detailC.loyer?fmt(detailC.loyer)+"/mois":"—"],
                    ["Caution", detailC.caution?fmt(detailC.caution):"—"],
                    ["Date d'entrée", detailC.dateEntree||detailC.date_entree||"—"],
                    ["Date de sortie", detailC.dateSortie||detailC.date_sortie||"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{background:"white",borderRadius:"8px",padding:"8px 12px"}}>
                      <div style={{fontSize:"10px",fontWeight:700,textTransform:"uppercase",color:"#1d4ed8",marginBottom:"2px"}}>{l}</div>
                      <div style={{fontSize:"13px",fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
                {detailC.loyer > 0 && detailC.revenus > 0 && (
                  <div style={{marginTop:"10px",padding:"8px 12px",borderRadius:"8px",fontSize:"12px",background:detailC.revenus>=detailC.loyer*3?"#f0fdf4":"#fef2f2",color:detailC.revenus>=detailC.loyer*3?"#15803d":"#dc2626"}}>
                    {detailC.revenus>=detailC.loyer*3?"✅ Solvable":"⚠️ Revenus insuffisants"}
                  </div>
                )}
              </div>
            )}

            {/* Infos acheteur */}
            {getRoles(detailC).includes("acheteur") && (
              <div style={{background:"#f8fdf8",border:"1px solid #bbf7d0",borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:"#15803d",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px"}}>💰 Achat</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {[
                    ["Budget max", detailC.budget?fmt(detailC.budget):"—"],
                    ["Financement", detailC.modeFinancement||"—"],
                    ["Banque", detailC.banque||"—"],
                    ["Recherche", detailC.typeRecherche||"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{background:"white",borderRadius:"8px",padding:"8px 12px"}}>
                      <div style={{fontSize:"10px",fontWeight:700,textTransform:"uppercase",color:"#15803d",marginBottom:"2px"}}>{l}</div>
                      <div style={{fontSize:"13px",fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailC.notes && <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"8px",padding:"12px",fontSize:"13px",color:"#92400e"}}>{detailC.notes}</div>}

            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",borderTop:"1px solid var(--border)",paddingTop:"14px"}}>
              <a href={`https://wa.me/${(detailC.whatsapp||detailC.tel||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="btn-wa">WhatsApp</a>
              <a href={`tel:${detailC.tel}`} className="btn-primary">Appeler</a>
              {getRoles(detailC).includes("locataire") && (detailC.bienId||detailC.bien_id) && (
                <button onClick={()=>{
                  setEtatLieuxModal(detailC);
                  setEtatLieux({dateSortie:new Date().toISOString().split("T")[0],caution_rendue:false,observations:"",pieces:{salon:"",cuisine:"",chambre1:"",chambre2:"",sdb:"",wc:"",autres:""}});
                }} style={{padding:"8px 16px",border:"1px solid #f59e0b",borderRadius:"8px",background:"#fffbeb",color:"#92400e",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                  🔑 Libérer le bien
                </button>
              )}
              {getRoles(detailC).includes("locataire") && (
                <button onClick={()=>genererContratBail({
                  client:detailC,
                  bien:biens.find(b=>b.id===(detailC.bienId||detailC.bien_id)),
                  contrat:null,
                })} style={{padding:"8px 16px",border:"1px solid #5c1a2b",borderRadius:"8px",background:"#fdf8f5",color:"#5c1a2b",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                  📄 Contrat de bail
                </button>
              )}
              {canWrite("clients") && (
                <button onClick={()=>{openEdit(detailC);setDetailC(null);}} style={{padding:"8px 16px",border:"1px solid var(--border)",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>✏️ Modifier</button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal État des lieux */}
      {etatLieuxModal && (
        <Modal open title={`🔑 Libération du bien — ${etatLieuxModal.nom}`} onClose={()=>setEtatLieuxModal(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"10px",padding:"12px",fontSize:"13px",color:"#92400e"}}>
              <strong>Bien :</strong> {biens.find(b=>b.id===(etatLieuxModal.bienId||etatLieuxModal.bien_id))?.titre||"—"} · <strong>Locataire :</strong> {etatLieuxModal.nom}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <Inp label="Date de sortie *" type="date" value={etatLieux.dateSortie} onChange={e=>setEtatLieux(p=>({...p,dateSortie:e.target.value}))}/>
              <div style={{display:"flex",alignItems:"center",gap:"8px",paddingTop:"24px"}}>
                <input type="checkbox" id="caution_r" checked={etatLieux.caution_rendue} onChange={e=>setEtatLieux(p=>({...p,caution_rendue:e.target.checked}))}/>
                <label htmlFor="caution_r" style={{fontSize:"13px",fontWeight:600}}>✅ Caution remboursée</label>
              </div>
            </div>
            <div>
              <div style={{fontSize:"12px",fontWeight:700,color:"var(--gray)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>État des pièces</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {[["salon","Salon"],["cuisine","Cuisine"],["chambre1","Chambre 1"],["chambre2","Chambre 2"],["sdb","Salle de bain"],["wc","WC"]].map(([k,l])=>(
                  <Sel key={k} label={l} value={etatLieux.pieces[k]} onChange={e=>setEtatLieux(p=>({...p,pieces:{...p.pieces,[k]:e.target.value}}))}>
                    <option value="">— État —</option>
                    <option value="Bon état">✅ Bon état</option>
                    <option value="État correct">🟡 État correct</option>
                    <option value="À rénover">🔴 À rénover</option>
                    <option value="N/A">N/A</option>
                  </Sel>
                ))}
              </div>
            </div>
            <Txta label="Observations" rows={2} value={etatLieux.observations} onChange={e=>setEtatLieux(p=>({...p,observations:e.target.value}))} placeholder="Dégradations, retenue sur caution..."/>
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",borderTop:"1px solid var(--border)",paddingTop:"14px"}}>
              <button onClick={()=>setEtatLieuxModal(null)} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
              <button onClick={()=>libererBien(etatLieuxModal,etatLieux)} style={{padding:"10px 20px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"#f59e0b",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>🔑 Confirmer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


export function AdminLoyers() {
  const {loyers,clients,biens,payerLoyer,addLoyer,deleteLoyer,relancerLoyer,genererMoisLoyers,canWrite} = useCtx();
  const peutEcrire = canWrite("loyers");
  const [mois,   setMois]   = useState(new Date().toISOString().slice(0,7));
  const [tab,    setTab]    = useState("all");
  const [modal,  setModal]  = useState(false);
  const [relanceM,setRelanceM] = useState(null);
  const [detailL, setDetailL] = useState(null); // vue par locataire
  const [payModes,setPayModes] = useState({}); // mode paiement par ligne

  const empty = {clientId:"",bienId:"",montant:"",mois:"",echeance:"",statut:"en_attente",modePaiement:"virement",notes:""};
  const [f,setF] = useState(empty);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  // Quand on sélectionne un locataire, pré-remplir montant + bien
  const handleClientChange = (clientId) => {
    sf("clientId", clientId);
    const c = clients.find(x=>x.id===+clientId);
    if(c) {
      if(c.loyer)  sf("montant", String(c.loyer));
      if(c.bienId) sf("bienId",  String(c.bienId));
    }
  };

  const filtered = loyers.filter(l=>{
    if(mois && l.mois!==mois) return false;
    if(tab==="retard") return l.statut!=="paye"&&(l.joursRetard||0)>0;
    if(tab!=="all"&&l.statut!==tab) return false;
    return true;
  });
  const total    = filtered.reduce((s,l)=>s+l.montant,0);
  const payeAmt  = filtered.filter(l=>l.statut==="paye").reduce((s,l)=>s+l.montant,0);
  const retards  = loyers.filter(l=>l.statut!=="paye"&&(l.joursRetard||0)>0);

  // Vue par locataire — agréger les loyers
  const parLocataire = clients
    .filter(c=>c.type==="locataire")
    .map(c=>({
      client: c,
      bien:   biens.find(b=>b.id===c.bienId),
      loyers: loyers.filter(l=>l.clientId===c.id).sort((a,b)=>b.mois.localeCompare(a.mois)),
    }));

  const handleSave = () => {
    if(!f.clientId) return alert("Sélectionnez un locataire.");
    if(!f.bienId)   return alert("Sélectionnez un bien.");
    if(!f.montant||+f.montant<=0) return alert("Montant invalide.");
    if(!f.mois)     return alert("Sélectionnez le mois.");
    // Vérifier doublon
    const exist = loyers.find(l=>l.clientId===+f.clientId&&l.bienId===+f.bienId&&l.mois===f.mois);
    if(exist) return alert(`⚠️ Un loyer existe déjà pour ce locataire sur ce bien pour ${f.mois}. Vérifiez la liste.`);
    addLoyer({...f, clientId:+f.clientId, bienId:+f.bienId, montant:+f.montant});
    setModal(false);
    setF(empty);
  };

  const handleRelance = async (loyer, canal) => {
    const r = await relancerLoyer(loyer.id, canal);
    if(canal==="whatsapp"&&r.waUrl) window.open(r.waUrl,"_blank");
    setRelanceM(null);
  };

  const getPayMode = (id) => payModes[id] || "virement";
  const setPayMode = (id, v) => setPayModes(p=>({...p,[id]:v}));

  return <div>
    {/* Barre de filtres */}
    <div className="flex flex-wrap items-end gap-3 mb-5">
      <div><Inp label="Mois" type="month" value={mois} onChange={e=>setMois(e.target.value)}/></div>
      <div className="flex gap-2 flex-wrap">
        {[["all","Tous"],["paye","Payés"],["impaye","Impayés"],["en_attente","En attente"],["retard",`⏰ Retards${retards.length>0?` (${retards.length})`:""}`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${tab===k?"bg-emerald-600 text-white border-emerald-600":k==="retard"&&retards.length>0?"bg-red-50 text-red-600 border-red-200":"bg-white text-gray-600 border-gray-300"}`}>{l}</button>
        ))}
      </div>
      <div className="flex gap-2 ml-auto flex-wrap">
        <Btn variant="ghost" size="sm" onClick={()=>setDetailL("all")}>👥 Par locataire</Btn>
        {peutEcrire&&<Btn variant="outline" size="sm" onClick={()=>{
          if(!confirm(`Générer les loyers de ${mois} pour tous les locataires actifs ?\nCette action ne crée pas de doublons si les loyers existent déjà.`)) return;
          genererMoisLoyers(mois);
        }}>⚙️ Générer {mois}</Btn>}
        {peutEcrire&&<Btn variant="primary" size="sm" onClick={()=>{setF(empty);setModal(true);}}>+ Enregistrer</Btn>}
      </div>
    </div>

    {/* KPIs loyers */}
    <div className="flex gap-3 mb-5 flex-wrap">
      {[["Attendu",total,"gray"],["Encaissé",payeAmt,"emerald"],["Restant",total-payeAmt,"red"]].map(([l,v,c])=>(
        <div key={l} className={`bg-white border ${c==="emerald"?"border-emerald-200":c==="red"&&v>0?"border-red-200":"border-gray-200"} rounded-xl px-4 py-2 text-center shadow-sm min-w-[120px]`}>
          <div className="text-xs text-gray-500 mb-0.5">{l}</div>
          <div className={`font-bold text-lg ${c==="emerald"?"text-emerald-600":c==="red"&&v>0?"text-red-500":"text-gray-900"}`}>{fmtM(v)} FCFA</div>
        </div>
      ))}
      {retards.length>0&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center shadow-sm">
        <div className="text-xs text-red-600 mb-0.5">En retard</div>
        <div className="font-bold text-red-700 text-lg">{retards.length} loyer{retards.length>1?"s":""}</div>
      </div>}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
        <div className="text-xs text-gray-500 mb-0.5">Taux encaissement</div>
        <div className="font-bold text-lg text-blue-600">{total>0?Math.round(payeAmt/total*100):0}%</div>
      </div>
    </div>

    {/* Tableau loyers */}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full min-w-[720px]">
        <thead><tr className="border-b border-gray-100 bg-gray-50">
          {["Locataire","Bien","Loyer dû","Mois","Échéance","Retard","Mode paiement","Statut","Actions"].map(h=>(
            <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
          ))}
        </tr></thead>
        <tbody className="divide-y divide-gray-50">{filtered.map(l=>(
          <tr key={l.id} className={`hover:bg-gray-50 transition-colors ${(l.joursRetard||0)>0&&l.statut!=="paye"?"bg-red-50/40":""}`}>
            <td className="px-4 py-3">
              <div className="text-sm font-semibold text-gray-900">{l.clientNom}</div>
              {(l.clientTel||l.clientWa)&&<div className="text-xs text-gray-400">{l.clientTel||l.clientWa}</div>}
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 max-w-[130px] truncate">{l.bienTitre}</td>
            <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{fmt(l.montant)} FCFA</td>
            <td className="px-4 py-3 text-xs font-medium text-gray-700">{l.mois}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{l.echeance||"—"}</td>
            <td className="px-4 py-3">
              {(l.joursRetard||0)>0&&l.statut!=="paye"
                ?<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">{l.joursRetard}j</span>
                :<span className="text-xs text-gray-300">—</span>}
            </td>
            <td className="px-4 py-3">
              {l.statut!=="paye"
                ?<select value={getPayMode(l.id)} onChange={e=>setPayMode(l.id,e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                    <option value="virement">Virement</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                :<span className="text-xs text-gray-500 capitalize">{(l.modePaiement||"").replace("_"," ")}</span>}
            </td>
            <td className="px-4 py-3"><Badge label={l.statut==="paye"?"Payé":l.statut==="impaye"?"Impayé":"En attente"} color={l.statut==="paye"?"bg-emerald-100 text-emerald-700 border-emerald-200":l.statut==="impaye"?"bg-red-100 text-red-700 border-red-200":"bg-amber-100 text-amber-700 border-amber-200"}/></td>
            <td className="px-4 py-3">
              {l.statut!=="paye"
                ?<div className="flex items-center gap-1.5 flex-wrap">
                    {peutEcrire?<>
                    <Btn variant="primary" size="xs" onClick={()=>{
                      if(!confirm(`Confirmer le paiement de ${fmt(l.montant)} FCFA par ${l.clientNom} (${l.mois}) ?`)) return;
                      payerLoyer(l.id, getPayMode(l.id), l.montant);
                    }}>✓ Payer</Btn>
                    <button onClick={()=>setRelanceM(l)} className="w-7 h-7 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg flex items-center justify-center hover:bg-amber-100 text-sm" title="Relancer">💬</button>
                    {deleteLoyer&&<button onClick={()=>{
                      if(!confirm(`Supprimer ce loyer (${l.clientNom} · ${l.mois}) ?`)) return;
                      deleteLoyer(l.id);
                    }} className="w-7 h-7 bg-red-50 border border-red-200 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 text-xs" title="Supprimer">🗑</button>}
                    </>:<span className="text-xs text-gray-400">—</span>}
                  </div>
                :<div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-semibold">✓ {l.datePaiement}</span>
                    <span className="text-xs text-gray-400 capitalize">{(l.modePaiement||"").replace("_"," ")}</span>
                    <button onClick={()=>genererQuittanceLoyer({
                      loyer:l,
                      client:clients.find(c=>c.id===l.clientId),
                      bien:biens.find(b=>b.id===l.bienId),
                    })} style={{padding:"3px 9px",background:"var(--blueL)",color:"var(--blue2)",border:"1px solid var(--blueL2)",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontWeight:700}}>
                      🖨️ Reçu
                    </button>
                  </div>}
            </td>
          </tr>
        ))}
        {filtered.length===0&&<tr><td colSpan={9} className="text-center py-16 text-gray-400">Aucun loyer pour ce filtre</td></tr>}
        </tbody>
      </table></div>
    </div>

    {/* Modal vue par locataire */}
    <Modal open={!!detailL} onClose={()=>setDetailL(null)} title="Vue par locataire" wide>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {parLocataire.map(({client:c,bien,loyers:ls})=>{
          const totalPaye   = ls.filter(l=>l.statut==="paye").reduce((s,l)=>s+l.montant,0);
          const totalImpaye = ls.filter(l=>l.statut!=="paye").reduce((s,l)=>s+l.montant,0);
          const retard      = ls.filter(l=>l.statut!=="paye"&&(l.joursRetard||0)>0);
          return <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div>
                <div className="font-bold text-gray-900">{c.nom}</div>
                <div className="text-xs text-gray-500">{c.tel} · {bien?.titre||"Bien non associé"}</div>
                <div className="text-xs text-gray-400">{bien?.quartier}, {bien?.commune}</div>
              </div>
              <div className="flex gap-3 text-center">
                <div><div className="text-xs text-gray-400">Loyer/mois</div><div className="font-bold text-blue-600">{fmt(c.loyer||0)} F</div></div>
                <div><div className="text-xs text-gray-400">Encaissé</div><div className="font-bold text-emerald-600">{fmt(totalPaye)} F</div></div>
                {totalImpaye>0&&<div><div className="text-xs text-gray-400">Impayé</div><div className="font-bold text-red-600">{fmt(totalImpaye)} F</div></div>}
                {retard.length>0&&<div><div className="text-xs text-red-500">En retard</div><div className="font-bold text-red-700">{retard.length}</div></div>}
              </div>
            </div>
            <div className="space-y-1">
              {ls.slice(0,6).map(l=>(
                <div key={l.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${l.statut==="paye"?"bg-emerald-50 border border-emerald-100":l.joursRetard>0?"bg-red-50 border border-red-100":"bg-white border border-gray-100"}`}>
                  <span className="font-medium">{l.mois}</span>
                  <span className="font-bold">{fmt(l.montant)} FCFA</span>
                  <Badge label={l.statut==="paye"?"Payé":l.statut==="impaye"?"Impayé":"En attente"} color={l.statut==="paye"?"bg-emerald-100 text-emerald-700 border-emerald-200":l.statut==="impaye"?"bg-red-100 text-red-700 border-red-200":"bg-amber-100 text-amber-700 border-amber-200"}/>
                  {l.statut==="paye"&&<span className="text-gray-400">{l.datePaiement}</span>}
                  {l.statut!=="paye"&&(l.joursRetard||0)>0&&<span className="text-red-600 font-bold">{l.joursRetard}j retard</span>}
                </div>
              ))}
              {ls.length>6&&<div className="text-xs text-gray-400 text-center pt-1">+{ls.length-6} loyers plus anciens</div>}
            </div>
            <div className="flex gap-2 mt-3">
              {c.tel&&<a href={`tel:${c.tel}`} className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold">📞 Appeler</a>}
              {(c.whatsapp||c.tel)&&<a href={`https://wa.me/${(c.whatsapp||c.tel).replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{background:"#25D366"}}>💬 WhatsApp</a>}
            </div>
            <DocumentsPanel entite="client" entiteId={c.id} titre={c.nom}/>
          </div>;
        })}
      </div>
    </Modal>

    {/* Modal Enregistrer loyer */}
    <Modal open={modal} onClose={()=>setModal(false)} title="Enregistrer un loyer">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Sel label="Locataire *" value={f.clientId} onChange={e=>handleClientChange(e.target.value)}>
            <option value="">— Choisir —</option>
            {clients.filter(c=>c.type==="locataire").map(c=><option key={c.id} value={c.id}>{c.nom} — {fmt(c.loyer||0)} F/mois</option>)}
          </Sel>
        </div>
        <Sel label="Bien *" value={f.bienId} onChange={e=>sf("bienId",e.target.value)}>
          <option value="">— Choisir —</option>
          {biens.filter(b=>b.statut==="loue"||b.statut==="disponible").map(b=><option key={b.id} value={b.id}>{b.titre}</option>)}
        </Sel>
        <div>
          <Inp label="Montant (FCFA) *" type="number" value={f.montant} onChange={e=>{if(+e.target.value>=0)sf("montant",e.target.value);}}/>
          {f.clientId&&<p style={{fontSize:"11px",color:"var(--blue2)",marginTop:"3px"}}>
            Loyer contractuel : {fmt(clients.find(c=>c.id===+f.clientId)?.loyer||0)} FCFA
          </p>}
        </div>
        <div>
          <Inp label="Mois *" type="month" value={f.mois} onChange={e=>{
            sf("mois",e.target.value);
            // Vérifier doublon immédiatement
            if(f.clientId&&f.bienId) {
              const exist = loyers.find(l=>l.clientId===+f.clientId&&l.bienId===+f.bienId&&l.mois===e.target.value);
              if(exist) alert(`⚠️ Attention : un loyer existe déjà pour ce locataire en ${e.target.value}.`);
            }
          }}/>
        </div>
        <Inp label="Échéance" type="date" value={f.echeance} onChange={e=>sf("echeance",e.target.value)}/>
        <Sel label="Statut" value={f.statut} onChange={e=>sf("statut",e.target.value)}>
          <option value="en_attente">En attente</option>
          <option value="paye">Payé</option>
          <option value="impaye">Impayé</option>
        </Sel>
        <div className="col-span-2"><Txta label="Notes (optionnel)" rows={2} value={f.notes||""} onChange={e=>sf("notes",e.target.value)} placeholder="Référence virement, numéro chèque..."/></div>
        <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn variant="primary" onClick={handleSave}>Enregistrer</Btn>
        </div>
      </div>
    </Modal>

    {/* Modal Relance */}
    <Modal open={!!relanceM} onClose={()=>setRelanceM(null)} title={`Relancer — ${relanceM?.clientNom}`}>
      {relanceM&&<div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="font-semibold text-amber-900 mb-1">{relanceM.clientNom}</div>
          <div className="text-sm text-amber-800">Loyer : <strong>{fmt(relanceM.montant)} FCFA</strong> · Mois : <strong>{relanceM.mois}</strong></div>
          {(relanceM.joursRetard||0)>0&&<div className="text-sm text-red-600 mt-1 font-medium">⏰ {relanceM.joursRetard} jour{relanceM.joursRetard>1?"s":""} de retard</div>}
        </div>
        <div className="flex flex-col gap-3">
          <Btn variant="wa" size="lg" className="w-full justify-center" onClick={()=>handleRelance(relanceM,"whatsapp")}>💬 WhatsApp — message pré-rempli</Btn>
          <Btn variant="outline" size="lg" className="w-full justify-center" onClick={()=>handleRelance(relanceM,"email")}>📧 Email de relance</Btn>
        </div>
        <p className="text-xs text-gray-400 text-center">La relance est enregistrée dans l'historique.</p>
      </div>}
    </Modal>
  </div>;
}

// ── VENTES ────────────────────────────────────────────────────
export function AdminVentes() {
  const {ventes,biens,clients,addVente,updateVente,addPaiementVente,deleteVente,canWrite} = useCtx();
  const peutEcrire = canWrite("ventes");
  const [tab,     setTab]    = useState("all");
  const [modal,   setModal]  = useState(null);
  const [detailV, setDetailV]= useState(null);
  const [editV,   setEditV]  = useState(null);  // modification
  const [paiM,    setPaiM]   = useState(null);

  const emptyF = {
    bienId:"",
    acheteurId:null,acheteurNom:"",acheteurTel:"",acheteurEmail:"",
    vendeurNom:"",vendeurTel:"",
    prixAffiche:"",prixNegociation:"",prixFinal:"",
    tauxCommission:"5",
    modeFinancement:"cash",banque:"",
    notaire:"",titreVerifie:false,diagnosticFait:false,
    notes:""
  };
  const [f,setF] = useState(emptyF);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  // Commission calculée automatiquement
  const commissionAuto = f.prixFinal&&f.tauxCommission
    ? Math.round(+f.prixFinal * +f.tauxCommission / 100)
    : f.prixAffiche&&f.tauxCommission
    ? Math.round(+f.prixAffiche * +f.tauxCommission / 100)
    : 0;

  const [pf,setPf] = useState({montant:"",type:"acompte",date:new Date().toISOString().split("T")[0],modePaiement:"virement",reference:"",notes:""});
  const spf=(k,v)=>setPf(p=>({...p,[k]:v}));

  const filtered = tab==="all" ? ventes : ventes.filter(v=>v.statut===tab);

  const ECOL = {prospect:"bg-gray-100 text-gray-600",offre:"bg-blue-100 text-blue-700",compromis:"bg-amber-100 text-amber-700",financement:"bg-purple-100 text-purple-700",acte:"bg-orange-100 text-orange-700",finalisee:"bg-emerald-100 text-emerald-700",annulee:"bg-red-100 text-red-600"};
  const ProgressBar = ({statut}) => {
    const idx=ETAPES_VENTE.indexOf(statut);
    const labels={"prospect":"Prospect","offre":"Offre","compromis":"Compromis","financement":"Financement","acte":"Acte","finalisee":"Finalisée"};
    return <div className="mt-2">
      <div className="flex gap-0.5">{ETAPES_VENTE.map((e,i)=>(
        <div key={e} title={labels[e]||e} className={`h-2 flex-1 rounded-full transition-all ${i<=idx?"bg-emerald-500":"bg-gray-200"}`}/>
      ))}</div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{labels[ETAPES_VENTE[0]]}</span>
        <span className="text-xs text-gray-400">{labels[ETAPES_VENTE[ETAPES_VENTE.length-1]]}</span>
      </div>
    </div>;
  };

  const handleSave = (isEdit=false) => {
    if(!f.bienId)       return alert("Sélectionnez le bien concerné.");
    if(!f.acheteurNom)  return alert("Le nom de l'acheteur est obligatoire.");
    if(!f.acheteurTel&&!f.acheteurEmail) return alert("Indiquez au moins un contact acheteur (tél ou email).");
    if(!f.prixAffiche||+f.prixAffiche<=0) return alert("Le prix affiché est obligatoire et doit être > 0.");
    if(f.prixNegociation&&+f.prixNegociation>+f.prixAffiche) return alert("⚠️ Le prix négocié ne peut pas dépasser le prix affiché.");
    if(f.prixFinal&&+f.prixFinal>+f.prixAffiche) return alert("⚠️ Le prix final ne peut pas dépasser le prix affiché.");
    if(+f.tauxCommission<0||+f.tauxCommission>20) return alert("Le taux de commission doit être entre 0% et 20%.");
    const data = {
      ...f,
      bienId:+f.bienId,
      prixAffiche:+f.prixAffiche,
      prixNegociation:+f.prixNegociation||null,
      prixFinal:+f.prixFinal||null,
      tauxCommission:+f.tauxCommission||5,
      titreVerifie:f.titreVerifie?1:0,
      diagnosticFait:f.diagnosticFait?1:0,
      commission: commissionAuto,
    };
    if(isEdit) { updateVente(editV.id, data); setEditV(null); }
    else       { addVente(data); setModal(null); }
    setF(emptyF);
  };

  const avancer = (v, fromDetail=false) => {
    const nextIdx = ETAPES_VENTE.indexOf(v.statut)+1;
    if(nextIdx>=ETAPES_VENTE.length) return;
    const ns = ETAPES_VENTE[nextIdx];
    // Bloquer finalisation si reste à payer
    if(ns==="finalisee"&&v.prixFinal&&(v.resteAPayer||0)>0)
      return alert(`❌ Impossible de finaliser : il reste ${fmt(v.resteAPayer)} FCFA à encaisser.`);
    // Confirmer passage à compromis (important)
    if(ns==="compromis"&&!confirm(`Passer en COMPROMIS signé ?\nCela indique qu'un avant-contrat a été signé par les deux parties.`)) return;
    // Confirmer acte notarié
    if(ns==="acte"&&!confirm(`Passer à l'ACTE NOTARIÉ ?\nVérifiez que le notaire et le titre foncier sont prêts.`)) return;
    updateVente(v.id,{statut:ns});
    if(fromDetail) setDetailV(p=>({...p,statut:ns}));
  };

  return <div>
    {/* Filtres */}
    <div className="flex flex-wrap gap-2 mb-5 items-center">
      {[["all","Toutes"],["prospect","Prospects"],["offre","Offres"],["compromis","Compromis"],["financement","Financement"],["acte","Acte notarié"],["finalisee","✓ Finalisées"],["annulee","Annulées"]].map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${tab===k?"bg-emerald-600 text-white border-emerald-600":"bg-white text-gray-600 border-gray-300"}`}>{l}</button>
      ))}
      {peutEcrire&&<Btn variant="primary" className="ml-auto" onClick={()=>{setF(emptyF);setModal("add");}}>+ Nouvelle vente</Btn>}
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        {l:"Ventes actives",   v:ventes.filter(v=>!["finalisee","annulee"].includes(v.statut)).length, c:"emerald", u:""},
        {l:"CA finalisé",      v:fmtM(ventes.filter(v=>v.statut==="finalisee").reduce((s,v)=>s+(v.prixFinal||0),0)), c:"emerald", u:" FCFA"},
        {l:"Commissions LENSA",v:fmtM(ventes.filter(v=>v.statut==="finalisee").reduce((s,v)=>s+(v.commission||0),0)), c:"amber",   u:" FCFA"},
        {l:"Acomptes encaissés",v:fmtM(ventes.reduce((s,v)=>s+(v.totalPaye||0),0)), c:"blue", u:" FCFA"},
      ].map(k=>(
        <div key={k.l} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">{k.l}</div>
          <div className={`font-bold text-lg ${k.c==="emerald"?"text-emerald-600":k.c==="amber"?"text-amber-600":"text-blue-600"}`}>{k.v}{k.u}</div>
        </div>
      ))}
    </div>

    {/* Explication commission */}
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800 flex items-start gap-2">
      <span className="text-lg flex-shrink-0">💡</span>
      <div><strong>Commission ImmobilierCI :</strong> C'est la rémunération de l'agence sur chaque vente finalisée. Calculée automatiquement sur le prix final (ex : 5% × 80 000 000 FCFA = 4 000 000 FCFA). Elle n'est due qu'à la finalisation de la vente.</div>
    </div>

    {/* Grille de ventes */}
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map(v=>(
        <div key={v.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0">
              <div className="text-xs font-mono text-gray-400 mb-0.5">{v.ref}</div>
              <div className="font-bold text-gray-900 text-sm truncate">{biens.find(b=>b.id===v.bienId)?.titre||"Bien"}</div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${ECOL[v.statut]||"bg-gray-100 text-gray-600"}`}>{SL[v.statut]||v.statut}</span>
          </div>
          <ProgressBar statut={v.statut}/>
          <div className="mt-4 space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between"><span className="text-gray-400">Acheteur</span><span className="font-semibold">{v.acheteurNom||"—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Prix affiché</span><span className="font-semibold">{fmtM(v.prixAffiche)} FCFA</span></div>
            {v.prixFinal&&<div className="flex justify-between"><span className="text-gray-400">Prix final</span><span className="font-bold text-emerald-600">{fmtM(v.prixFinal)} FCFA</span></div>}
            <div className="flex justify-between">
              <span className="text-gray-400">Commission LENSA ({v.tauxCommission||5}%)</span>
              <span className="font-semibold text-amber-600">{fmtM(v.commission||0)} FCFA</span>
            </div>
            {v.prixFinal&&<div className="mt-2">
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Encaissé</span>
                <span className="font-semibold text-blue-600">{fmtM(v.totalPaye||0)} / {fmtM(v.prixFinal)} F</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{width:`${v.prixFinal>0?Math.min(100,((v.totalPaye||0)/v.prixFinal)*100):0}%`}}/>
              </div>
              <div className="text-right text-gray-400 mt-0.5 text-xs">Reste : {fmtM(v.resteAPayer||0)} F</div>
            </div>}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 flex-wrap">
            <Btn variant="outline" size="xs" onClick={()=>setDetailV(v)}>👁 Détail</Btn>
            {peutEcrire&&<>
            <Btn variant="primary" size="xs" onClick={()=>{setPf({montant:"",type:"acompte",date:new Date().toISOString().split("T")[0],modePaiement:"virement",reference:"",notes:""});setPaiM(v);}}>💰 Paiement</Btn>
            {!["finalisee","annulee"].includes(v.statut)&&ETAPES_VENTE.indexOf(v.statut)<ETAPES_VENTE.length-1&&(
              <Btn variant="amber" size="xs" onClick={()=>avancer(v)}>→ Avancer</Btn>
            )}
            {!["finalisee","annulee"].includes(v.statut)&&(
              <Btn variant="outline" size="xs" onClick={()=>{
                if(!confirm(`Annuler la vente ${v.ref} ?${(v.totalPaye||0)>0?" Des acomptes ont été versés !":""}`)) return;
                updateVente(v.id,{statut:"annulee"});
              }}>✕ Annuler</Btn>
            )}
            <Btn variant="danger" size="xs" onClick={()=>{
              if((v.totalPaye||0)>0) {
                if(!confirm(`⚠️ ${v.ref} a ${fmt(v.totalPaye)} FCFA versés. Supprimer définitivement ?`)) return;
              } else if(!confirm(`Supprimer la vente ${v.ref} ?`)) return;
              deleteVente(v.id);
            }}>🗑️</Btn>
            </>}
          </div>
        </div>
      ))}
      {filtered.length===0&&<div className="col-span-3 text-center py-20 text-gray-400"><div className="text-5xl mb-3">🏡</div><p>Aucune vente pour ce filtre.</p></div>}
    </div>

    {/* Modal Nouvelle vente */}
    <Modal open={modal==="add"} onClose={()=>setModal(null)} title="Nouvelle vente" wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2">
          <Sel label="Bien concerné *" value={f.bienId} onChange={e=>{
            sf("bienId",e.target.value);
            const b=biens.find(x=>x.id===+e.target.value);
            if(b) sf("prixAffiche",String(b.prix));
          }}>
            <option value="">— Choisir —</option>
            {biens.filter(b=>["disponible","en_cours"].includes(b.statut)&&b.type!=="location"&&b.type!=="meuble").map(b=>(
              <option key={b.id} value={b.id}>{b.titre} — {fmtM(b.prix)} FCFA</option>
            ))}
          </Sel>
        </div>

        {/* Acheteur */}
        <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-t pt-3">Acheteur</div>
        <div className="col-span-2">
          <Sel label="Choisir un client existant (optionnel)" value={f.acheteurId||""} onChange={e=>{
            const id = +e.target.value;
            sf("acheteurId", id||null);
            if(id) {
              const c = clients.find(x=>x.id===id);
              if(c) {
                sf("acheteurNom", c.nom);
                sf("acheteurTel", c.tel||c.whatsapp||"");
                sf("acheteurEmail", c.email||"");
              }
            }
          }}>
            <option value="">— Saisie libre (nouveau contact) —</option>
            {clients.filter(c=>["acheteur","prospect"].includes(c.type)).map(c=>(
              <option key={c.id} value={c.id}>{c.nom} — {c.tel||c.email||"—"}</option>
            ))}
          </Sel>
          <p style={{fontSize:"11px",color:"var(--gray)",marginTop:"4px"}}>Sélectionnez un client existant pour remplir automatiquement ses informations, ou laissez vide pour saisir manuellement.</p>
        </div>
        <Inp label="Nom complet *" value={f.acheteurNom} onChange={e=>sf("acheteurNom",e.target.value)} placeholder="Kouamé Aya"/>
        <Inp label="Téléphone *" value={f.acheteurTel} onChange={e=>sf("acheteurTel",e.target.value)} placeholder="+225 07..."/>
        <Inp label="Email" value={f.acheteurEmail} onChange={e=>sf("acheteurEmail",e.target.value)}/>
        <Inp label="Vendeur (si différent)" value={f.vendeurNom} onChange={e=>sf("vendeurNom",e.target.value)}/>

        {/* Prix */}
        <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-t pt-3">Prix & Commission</div>
        <div>
          <Inp label="Prix affiché (FCFA) *" type="number" value={f.prixAffiche} onChange={e=>{if(+e.target.value>=0)sf("prixAffiche",e.target.value);}}/>
        </div>
        <div>
          <Inp label="Prix négocié (FCFA)" type="number" value={f.prixNegociation} onChange={e=>{
            if(f.prixAffiche&&+e.target.value>+f.prixAffiche) return alert("Le prix négocié ne peut pas dépasser le prix affiché.");
            if(+e.target.value>=0) sf("prixNegociation",e.target.value);
          }}/>
        </div>
        <div>
          <Inp label="Prix final signé (FCFA)" type="number" value={f.prixFinal} onChange={e=>{
            if(f.prixAffiche&&+e.target.value>+f.prixAffiche) return alert("Le prix final ne peut pas dépasser le prix affiché.");
            if(+e.target.value>=0) sf("prixFinal",e.target.value);
          }}/>
        </div>
        <div>
          <Inp label="Commission LENSA (%)" type="number" value={f.tauxCommission} onChange={e=>{
            if(+e.target.value<0||+e.target.value>20) return;
            sf("tauxCommission",e.target.value);
          }}/>
          {commissionAuto>0&&<p style={{fontSize:"11px",color:"var(--gold)",marginTop:"3px",fontWeight:600}}>
            Commission calculée : {fmt(commissionAuto)} FCFA
          </p>}
        </div>

        {/* Financement */}
        <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-t pt-3">Financement & Légal</div>
        <Sel label="Mode de financement" value={f.modeFinancement} onChange={e=>sf("modeFinancement",e.target.value)}>
          <option value="cash">Cash / Fonds propres</option>
          <option value="credit">Crédit bancaire</option>
          <option value="mixte">Mixte (cash + crédit)</option>
        </Sel>
        {f.modeFinancement!=="cash"&&<Inp label="Banque" value={f.banque} onChange={e=>sf("banque",e.target.value)} placeholder="SGBCI, BNI, SIB, BACI..."/>}
        <Inp label="Notaire" value={f.notaire} onChange={e=>sf("notaire",e.target.value)} placeholder="Maître ..."/>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2"><input type="checkbox" id="titre" checked={f.titreVerifie} onChange={e=>sf("titreVerifie",e.target.checked)} className="w-4 h-4 rounded"/><label htmlFor="titre" className="text-sm">✅ Titre foncier vérifié</label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="diag" checked={f.diagnosticFait} onChange={e=>sf("diagnosticFait",e.target.checked)} className="w-4 h-4 rounded"/><label htmlFor="diag" className="text-sm">🔍 Diagnostic fait</label></div>
        </div>
        <div className="col-span-2"><Txta label="Notes" rows={2} value={f.notes} onChange={e=>sf("notes",e.target.value)}/></div>
        <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={()=>setModal(null)}>Annuler</Btn>
          <Btn variant="primary" onClick={()=>handleSave(false)}>Créer la vente</Btn>
        </div>
      </div>
    </Modal>

    {/* Modal Modifier vente */}
    <Modal open={!!editV} onClose={()=>setEditV(null)} title={`Modifier — ${editV?.ref}`} wide>
      {editV&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Nom acheteur" value={f.acheteurNom} onChange={e=>sf("acheteurNom",e.target.value)}/>
        <Inp label="Tél. acheteur" value={f.acheteurTel} onChange={e=>sf("acheteurTel",e.target.value)}/>
        <div>
          <Inp label="Prix affiché (FCFA)" type="number" value={f.prixAffiche} onChange={e=>{if(+e.target.value>=0)sf("prixAffiche",e.target.value);}}/>
        </div>
        <div>
          <Inp label="Prix final (FCFA)" type="number" value={f.prixFinal} onChange={e=>{
            if(f.prixAffiche&&+e.target.value>+f.prixAffiche) return alert("Prix final > prix affiché.");
            if(+e.target.value>=0) sf("prixFinal",e.target.value);
          }}/>
          {commissionAuto>0&&<p style={{fontSize:"11px",color:"var(--gold)",marginTop:"3px",fontWeight:600}}>Commission : {fmt(commissionAuto)} FCFA</p>}
        </div>
        <Inp label="Commission (%)" type="number" value={f.tauxCommission} onChange={e=>sf("tauxCommission",e.target.value)}/>
        <Sel label="Financement" value={f.modeFinancement} onChange={e=>sf("modeFinancement",e.target.value)}>
          <option value="cash">Cash</option><option value="credit">Crédit</option><option value="mixte">Mixte</option>
        </Sel>
        {f.modeFinancement!=="cash"&&<Inp label="Banque" value={f.banque} onChange={e=>sf("banque",e.target.value)}/>}
        <Inp label="Notaire" value={f.notaire} onChange={e=>sf("notaire",e.target.value)}/>
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2"><input type="checkbox" checked={f.titreVerifie} onChange={e=>sf("titreVerifie",e.target.checked)} className="w-4 h-4 rounded"/><label className="text-sm">Titre foncier vérifié</label></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={f.diagnosticFait} onChange={e=>sf("diagnosticFait",e.target.checked)} className="w-4 h-4 rounded"/><label className="text-sm">Diagnostic fait</label></div>
        </div>
        <div className="col-span-2"><Txta label="Notes" rows={2} value={f.notes} onChange={e=>sf("notes",e.target.value)}/></div>
        <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={()=>setEditV(null)}>Annuler</Btn>
          <Btn variant="primary" onClick={()=>handleSave(true)}>Enregistrer</Btn>
        </div>
      </div>}
    </Modal>

    {/* Modal Détail vente */}
    <Modal open={!!detailV} onClose={()=>setDetailV(null)} title={`Dossier vente — ${detailV?.ref}`} wide>
      {detailV&&(()=>{
        const bien = biens.find(b=>b.id===detailV.bienId);
        return <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bien */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">🏠 Bien</div>
              {[
                ["Titre",      bien?.titre||"—"],
                ["Référence",  bien?.ref||"—"],
                ["Quartier",   bien?.quartier||"—"],
                ["Surface",    bien?.surface?`${bien.surface} m²`:"—"],
                ["Titre foncier", detailV.titreVerifie?"✅ Vérifié":"⚠️ À vérifier"],
                ["Diagnostic", detailV.diagnosticFait?"✅ Fait":"—"],
              ].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm py-1 border-b border-emerald-100 last:border-0">
                  <span className="text-gray-400">{l}</span><span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            {/* Acheteur */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">👤 Acheteur</div>
              {[
                ["Nom",    detailV.acheteurNom||"—"],
                ["Tél.",   detailV.acheteurTel||"—"],
                ["Email",  detailV.acheteurEmail||"—"],
                ["Vendeur",detailV.vendeurNom||"—"],
                ["Financement", (detailV.modeFinancement||"—")+(detailV.banque?` · ${detailV.banque}`:"")],
                ["Notaire",detailV.notaire||"—"],
              ].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm py-1 border-b border-blue-100 last:border-0">
                  <span className="text-gray-400">{l}</span><span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                {detailV.acheteurTel&&<a href={`tel:${detailV.acheteurTel}`} className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold">📞 Appeler</a>}
                {detailV.acheteurTel&&<a href={`https://wa.me/${detailV.acheteurTel.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{background:"#25D366"}}>💬 WA</a>}
              </div>
            </div>
          </div>

          {/* Prix & Commission */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">💰 Prix & Commission ImmobilierCI</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div><div className="text-xs text-gray-400">Prix affiché</div><div className="font-bold text-gray-900">{fmt(detailV.prixAffiche)} FCFA</div></div>
              <div><div className="text-xs text-gray-400">Prix négocié</div><div className="font-bold text-gray-900">{detailV.prixNegociation?fmt(detailV.prixNegociation)+" FCFA":"—"}</div></div>
              <div><div className="text-xs text-gray-400">Prix final</div><div className="font-bold text-emerald-600">{detailV.prixFinal?fmt(detailV.prixFinal)+" FCFA":"—"}</div></div>
              <div><div className="text-xs text-gray-400">Commission ({detailV.tauxCommission||5}%)</div><div className="font-bold text-amber-700">{fmt(detailV.commission||0)} FCFA</div></div>
            </div>
            {detailV.prixFinal&&<div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Progression encaissement</span>
                <span className="font-bold text-blue-600">{fmt(detailV.totalPaye||0)} / {fmt(detailV.prixFinal)} FCFA</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{width:`${detailV.prixFinal>0?Math.min(100,Math.round((detailV.totalPaye||0)/detailV.prixFinal*100)):0}%`}}/>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-emerald-600 font-semibold">{Math.round((detailV.totalPaye||0)/(detailV.prixFinal||1)*100)}% encaissé</span>
                <span className="text-red-500 font-semibold">Reste : {fmt(detailV.resteAPayer||0)} FCFA</span>
              </div>
            </div>}
          </div>

          {/* Paiements reçus */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Historique des paiements</h4>
            {(detailV.paiements||[]).length===0
              ?<p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">Aucun paiement enregistré.</p>
              :<div className="space-y-2">{(detailV.paiements||[]).map(p=>(
                <div key={p.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-emerald-700">{fmt(p.montant)} FCFA</div>
                    <div className="text-xs text-gray-500">{p.type} · {p.date} · {(p.modePaiement||"").replace("_"," ")}{p.reference?` · Réf: ${p.reference}`:""}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span className="text-emerald-600 font-bold">✓</span>
                    <button onClick={()=>genererRecuVente({
                      vente: detailV,
                      paiement: p,
                      bien: biens.find(b=>b.id===detailV.bienId),
                    })} style={{padding:"3px 9px",background:"var(--blueL)",color:"var(--blue2)",border:"1px solid var(--blueL2)",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontWeight:700}}>
                      🖨️ Reçu
                    </button>
                  </div>
                </div>
              ))}</div>
            }
          </div>

          {/* Actions */}
          {peutEcrire&&<div className="flex gap-3 flex-wrap pt-2 border-t border-gray-100">
            {!["finalisee","annulee"].includes(detailV.statut)&&ETAPES_VENTE.indexOf(detailV.statut)<ETAPES_VENTE.length-1&&(
              <Btn variant="primary" size="sm" onClick={()=>avancer(detailV,true)}>
                → Avancer : {SL[ETAPES_VENTE[ETAPES_VENTE.indexOf(detailV.statut)+1]]||""}
              </Btn>
            )}
            <Btn variant="outline" size="sm" onClick={()=>{
              setF({...detailV,
                prixAffiche:String(detailV.prixAffiche),
                prixNegociation:String(detailV.prixNegociation||""),
                prixFinal:String(detailV.prixFinal||""),
                tauxCommission:String(detailV.tauxCommission||5),
                titreVerifie:detailV.titreVerifie===1,
                diagnosticFait:detailV.diagnosticFait===1,
              });
              setEditV(detailV);
              setDetailV(null);
            }}>✏️ Modifier</Btn>
            {!["finalisee","annulee"].includes(detailV.statut)&&(
              <Btn variant="outline" size="sm" onClick={()=>{
                if(!confirm(`Annuler définitivement la vente ${detailV.ref} ?`)) return;
                updateVente(detailV.id,{statut:"annulee"});
                setDetailV(p=>({...p,statut:"annulee"}));
              }}>✕ Annuler la vente</Btn>
            )}
            <Btn variant="primary" size="sm" onClick={()=>{
              setPf({montant:"",type:"acompte",date:new Date().toISOString().split("T")[0],modePaiement:"virement",reference:"",notes:""});
              setPaiM(detailV);
              setDetailV(null);
            }}>💰 Enregistrer paiement</Btn>
          </div>}
          {detailV.notes&&<div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600"><strong>Notes :</strong> {detailV.notes}</div>}
          <DocumentsPanel entite="vente" entiteId={detailV.id} titre={`Vente ${detailV.ref}`}/>
        </div>;
      })()}
    </Modal>

    {/* Modal Paiement */}
    <Modal open={!!paiM} onClose={()=>setPaiM(null)} title={`Paiement — ${paiM?.ref}`}>
      {paiM&&<div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div><div className="text-xs text-gray-400">Prix final</div><div className="font-bold">{fmt(paiM.prixFinal||paiM.prixAffiche)} FCFA</div></div>
            <div><div className="text-xs text-gray-400">Déjà reçu</div><div className="font-bold text-emerald-600">{fmt(paiM.totalPaye||0)} FCFA</div></div>
            <div><div className="text-xs text-gray-400">Reste à payer</div><div className="font-bold text-red-600">{fmt(paiM.resteAPayer||0)} FCFA</div></div>
          </div>
          {paiM.resteAPayer<=0&&<div className="mt-2 text-center text-xs text-emerald-600 font-semibold">✅ Bien entièrement payé</div>}
        </div>
        {paiM.resteAPayer>0&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Inp label="Montant *" type="number" value={pf.montant} onChange={e=>{
              const max = paiM.resteAPayer||0;
              if(+e.target.value>max) return alert(`Maximum : ${fmt(max)} FCFA (reste à payer).`);
              if(+e.target.value>=0) spf("montant",e.target.value);
            }}/>
            <p style={{fontSize:"11px",color:"var(--gray)",marginTop:"3px"}}>Maximum : {fmt(paiM.resteAPayer)} FCFA</p>
          </div>
          <Sel label="Type" value={pf.type} onChange={e=>spf("type",e.target.value)}>
            <option value="acompte">Acompte</option>
            <option value="solde">Solde final</option>
            <option value="frais">Frais d'agence</option>
            <option value="autre">Autre</option>
          </Sel>
          <Inp label="Date *" type="date" value={pf.date} onChange={e=>spf("date",e.target.value)}/>
          <Sel label="Mode de paiement" value={pf.modePaiement} onChange={e=>spf("modePaiement",e.target.value)}>
            <option value="virement">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="especes">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
          </Sel>
          <div className="col-span-2">
            <Inp label="Référence (N° virement, chèque...)" value={pf.reference} onChange={e=>spf("reference",e.target.value)} placeholder="TRF-20250515-BNI"/>
          </div>
        </div>}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={()=>setPaiM(null)}>Annuler</Btn>
          {paiM.resteAPayer>0&&<Btn variant="primary" onClick={()=>{
            if(!pf.montant||+pf.montant<=0) return alert("Montant invalide.");
            addPaiementVente(paiM.id,{...pf,montant:+pf.montant});
            setPaiM(null);
          }}>Enregistrer le paiement</Btn>}
        </div>
      </div>}
    </Modal>
  </div>;
}


// ── DEMANDES ─────────────────────────────────────────────────
export function AdminDemandes() {
  const {demandes,updateDemande,archiveDemande,canWrite} = useCtx();
  const peutEcrire = canWrite("demandes");
  const [tab,setTab] = useState("all");
  const filtered = tab==="all" ? demandes : demandes.filter(d=>d.statut===tab);
  return <div>
    <div className="flex gap-2 mb-6 flex-wrap">
      {[["all","Toutes"],["nouveau","Nouveaux"],["en_cours","En cours"],["traite","Traités"]].map(([k,l])=>{
        const c=k==="all"?demandes.length:demandes.filter(d=>d.statut===k).length;
        return <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-all ${tab===k?"bg-emerald-600 text-white border-emerald-600":"bg-white text-gray-600 border-gray-300"}`}>{l}<span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab===k?"bg-white/25":k==="nouveau"&&c>0?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-600"}`}>{c}</span></button>;
      })}
    </div>
    <div className="space-y-4">{filtered.map(d=>(
      <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">{(d.nom||"?").slice(0,2)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-gray-900">{d.nom}</span>
              {d.interet&&<Badge label={TL[d.interet]||d.interet} color="bg-blue-50 text-blue-700 border-blue-200"/>}
              <Badge label={SL[d.statut]||d.statut} color={SC[d.statut]||""}/>
              <span className="text-xs text-gray-400 ml-auto">{new Date(d.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{d.tel}{d.email&&` · ${d.email}`}{d.budget&&<span className="ml-2 font-medium text-gray-700">Budget : {d.budget}</span>}</div>
            <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">{d.message}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 flex-wrap">
          {peutEcrire&&d.statut==="nouveau"&&<Btn variant="primary" size="sm" onClick={()=>updateDemande(d.id,{statut:"en_cours"})}>📂 Prendre en charge</Btn>}
          {peutEcrire&&d.statut==="en_cours"&&<Btn variant="primary" size="sm" onClick={()=>updateDemande(d.id,{statut:"traite"})}>✓ Marquer traité</Btn>}
          {d.tel&&<a href={`${wa(d.tel)}?text=${encodeURIComponent(`Bonjour ${d.nom}, suite à votre demande (${d.interet}, budget : ${d.budget||"—"}), nous avons des biens disponibles. Cordialement, ImmobilierCI`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#25D366] text-white">💬 WhatsApp</a>}
          {d.tel&&<a href={`tel:${d.tel}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white">📞 Appeler</a>}
          {peutEcrire&&<Btn variant="danger" size="sm" onClick={()=>{ if(confirm(`Archiver définitivement la demande de ${d.nom} ?`)) archiveDemande(d.id); }}>🗑️ Archiver</Btn>}
        </div>
      </div>
    ))}
    {filtered.length===0&&<div className="text-center py-20 text-gray-400"><div className="text-4xl mb-2">📬</div><p>Aucune demande.</p></div>}
    </div>
  </div>;
}

// ── CONTRATS ─────────────────────────────────────────────────
export function AdminContrats() {
  const {contrats,clients,biens,addContrat,updateContrat,canWrite} = useCtx();
  const peutEcrire = canWrite("contrats");
  const [modal,setModal]   = useState(false);
  const [detail,setDetail] = useState(null);
  const [typeContrat,setTypeContrat] = useState("bail"); // bail | vente
  const today = new Date().toISOString().split("T")[0];

  const empty = {
    type:"bail",
    clientId:"",bienId:"",
    // Bail
    dateDebut:"",dateFin:"",loyer:"",caution:"",garantie:"",indexation:"",
    // Vente
    dateSignature:"",prixVente:"",notaire:"",titreVerifie:false,
    notes:""
  };
  const [f,setF] = useState(empty);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const alertes = contrats.filter(c=>c.type!=="vente"&&(c.expirationProche||c.expire||(c.statut==="renouveler")));

  const save = () => {
    if(!f.clientId) return alert("Sélectionnez un client.");
    if(!f.bienId)   return alert("Sélectionnez un bien.");
    if(f.type==="bail") {
      if(!f.dateDebut)       return alert("Date de début obligatoire.");
      if(!f.loyer||+f.loyer<=0) return alert("Le loyer doit être supérieur à 0.");
    }
    if(f.type==="vente") {
      if(!f.dateSignature)   return alert("Date de signature obligatoire.");
      if(!f.prixVente||+f.prixVente<=0) return alert("Le prix de vente doit être supérieur à 0.");
    }
    addContrat({...f,
      clientId:+f.clientId, bienId:+f.bienId,
      loyer:+f.loyer||0, caution:+f.caution||0,
      prixVente:+f.prixVente||0,
      titreVerifie:f.titreVerifie?1:0,
    });
    setModal(false);
  };

  // Client + bien info pour detail
  const getClient = (id) => clients.find(c=>c.id===id);
  const getBien   = (id) => biens.find(b=>b.id===id);

  return <div>
    {/* Alertes expiration */}
    {alertes.length>0&&<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
      <h3 className="font-bold text-amber-800 mb-2">📄 Baux nécessitant attention ({alertes.length})</h3>
      <div className="space-y-2">{alertes.map(c=>(
        <div key={c.id} className="bg-white border border-amber-100 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div><span className="font-semibold text-gray-900">{c.clientNom}</span><span className="text-gray-400 mx-2">·</span><span className="text-sm text-gray-600">{c.bienTitre}</span></div>
          <div className="flex items-center gap-2">
            {c.jRestants<=0
              ?<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">⚠️ Expiré</span>
              :<span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">⏳ {c.jRestants}j restants</span>}
            <span className="text-xs text-gray-500">Expire {c.dateFin}</span>
            {peutEcrire&&<Btn variant="amber" size="xs" onClick={()=>{
              if(!confirm(`Renouveler le bail de ${c.clientNom} pour 1 an ?`)) return;
              const d=new Date(c.dateFin); d.setFullYear(d.getFullYear()+1);
              updateContrat(c.id,{statut:"actif",dateFin:d.toISOString().split("T")[0]});
            }}>🔄 Renouveler 1 an</Btn>}
          </div>
        </div>
      ))}</div>
    </div>}

    {peutEcrire&&<div className="flex justify-end mb-5 gap-3">
      <Btn variant="outline" onClick={()=>{setF({...empty,type:"vente"});setTypeContrat("vente");setModal(true);}}>+ Contrat de vente</Btn>
      <Btn variant="primary" onClick={()=>{setF({...empty,type:"bail"});setTypeContrat("bail");setModal(true);}}>+ Contrat de bail</Btn>
    </div>}

    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
        <thead><tr className="border-b border-gray-100 bg-gray-50">
          {["Réf.","Client","Bien","Type","Détails financiers","Période / Date","Statut","Actions"].map(h=>(
            <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
          ))}
        </tr></thead>
        <tbody className="divide-y divide-gray-50">{contrats.map(c=>{
          const cli = getClient(c.clientId);
          const bien = getBien(c.bienId);
          const isBail = c.type!=="vente";
          return <tr key={c.id} className={`hover:bg-gray-50 ${(c.expirationProche||c.expire)?"bg-amber-50/30":""}`}>
            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{c.ref}</td>
            <td className="px-4 py-3">
              <div className="text-sm font-semibold text-gray-900">{c.clientNom||cli?.nom||"—"}</div>
              <div className="text-xs text-gray-400">{cli?.tel||"—"}</div>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 max-w-[130px] truncate">{c.bienTitre||bien?.titre||"—"}</td>
            <td className="px-4 py-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBail?"bg-blue-50 text-blue-700":"bg-purple-50 text-purple-700"}`}>
                {isBail?"🏠 Bail":"🤝 Vente"}
              </span>
            </td>
            <td className="px-4 py-3">
              {isBail
                ?<div><div className="text-sm font-bold text-gray-900">{fmt(c.loyer)} <span className="text-xs font-normal text-gray-400">FCFA/mois</span></div>
                  <div className="text-xs text-gray-400">Caution : {fmt(c.caution)} F</div></div>
                :<div><div className="text-sm font-bold text-gray-900">{fmt(c.prixVente||0)} <span className="text-xs font-normal text-gray-400">FCFA</span></div>
                  <div className="text-xs text-gray-400">{c.titreVerifie?"✅ Titre vérifié":"⚠️ Titre non vérifié"}</div></div>}
            </td>
            <td className="px-4 py-3 text-xs text-gray-500">
              {isBail
                ?<>{c.dateDebut}<br/>→ {c.dateFin||<span className="text-amber-600">Pas de fin définie</span>}</>
                :<>Signé le {c.dateSignature||"—"}<br/>{c.notaire?"Notaire : "+c.notaire:""}</>}
            </td>
            <td className="px-4 py-3"><Badge label={c.statut==="actif"?"Actif":c.statut==="renouveler"?"À renouveler":c.statut==="termine"?"Terminé":c.statut} color={c.statut==="actif"?"bg-emerald-100 text-emerald-700 border-emerald-200":c.statut==="renouveler"?"bg-amber-100 text-amber-700 border-amber-200":"bg-gray-100 text-gray-600 border-gray-200"}/></td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5">
                <Btn variant="ghost" size="xs" onClick={()=>setDetail(c)}>👁</Btn>
                {peutEcrire&&isBail&&(c.expirationProche||c.expire||c.statut==="renouveler")&&(
                  <Btn variant="amber" size="xs" onClick={()=>{
                    if(!c.dateFin) return alert("Pas de date de fin définie.");
                    if(!confirm(`Renouveler pour 1 an ?`)) return;
                    const d=new Date(c.dateFin); d.setFullYear(d.getFullYear()+1);
                    updateContrat(c.id,{statut:"actif",dateFin:d.toISOString().split("T")[0]});
                  }}>🔄</Btn>
                )}
              </div>
            </td>
          </tr>;
        })}</tbody>
      </table></div>
    </div>

    {/* Modal détail contrat */}
    <Modal open={!!detail} onClose={()=>setDetail(null)} title={`Contrat — ${detail?.ref}`} wide>
      {detail&&(()=>{
        const cli  = getClient(detail.clientId);
        const bien = getBien(detail.bienId);
        const isBail = detail.type!=="vente";
        return <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Colonne client */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">👤 Client</div>
              {[
                ["Nom",          detail.clientNom||cli?.nom||"—"],
                ["Téléphone",    cli?.tel||"—"],
                ["WhatsApp",     cli?.whatsapp||"—"],
                ["Email",        cli?.email||"—"],
                ["Profession",   cli?.profession||"—"],
                ["Employeur",    cli?.employeur||"—"],
                ["Revenus",      cli?.revenus?`${fmt(cli.revenus)} FCFA/mois`:"—"],
              ].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm py-1 border-b border-blue-100 last:border-0">
                  <span className="text-gray-400">{l}</span><span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                {cli?.tel&&<a href={`tel:${cli.tel}`} className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold">📞 Appeler</a>}
                {(cli?.whatsapp||cli?.tel)&&<a href={`https://wa.me/${(cli.whatsapp||cli.tel).replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{background:"#25D366"}}>💬 WA</a>}
              </div>
            </div>
            {/* Colonne bien */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">🏠 Bien</div>
              {[
                ["Titre",      bien?.titre||detail.bienTitre||"—"],
                ["Référence",  bien?.ref||"—"],
                ["Quartier",   bien?.quartier||"—"],
                ["Commune",    bien?.commune||"—"],
                ["Surface",    bien?.surface?`${bien.surface} m²`:"—"],
                ["Chambres",   bien?.chambres||"—"],
                ["Statut",     bien?.statut||"—"],
              ].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm py-1 border-b border-emerald-100 last:border-0">
                  <span className="text-gray-400">{l}</span><span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Détails contrat */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              {isBail?"📋 Détails du bail":"🤝 Détails de la vente"}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {isBail
                ?[
                    ["Loyer mensuel",  `${fmt(detail.loyer)} FCFA`],
                    ["Caution",        `${fmt(detail.caution)} FCFA`],
                    ["Date début",     detail.dateDebut||"—"],
                    ["Date fin",       detail.dateFin||"Indéterminée"],
                    ["Indexation",     detail.indexation||"Aucune"],
                    ["Garant",         detail.garantie||"—"],
                  ].map(([l,v])=>(<div key={l}><div className="text-xs text-gray-400">{l}</div><div className="font-semibold text-gray-900 mt-0.5">{v}</div></div>))
                :[
                    ["Prix de vente",  `${fmt(detail.prixVente||0)} FCFA`],
                    ["Date signature", detail.dateSignature||"—"],
                    ["Notaire",        detail.notaire||"—"],
                    ["Titre foncier",  detail.titreVerifie?"✅ Vérifié":"⚠️ Non vérifié"],
                  ].map(([l,v])=>(<div key={l}><div className="text-xs text-gray-400">{l}</div><div className="font-semibold text-gray-900 mt-0.5">{v}</div></div>))
              }
            </div>
            {detail.notes&&<div className="mt-3 text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100"><strong>Notes :</strong> {detail.notes}</div>}
          </div>
        </div>;
      })()}
    </Modal>

    {/* Modal création */}
    <Modal open={modal} onClose={()=>setModal(false)} title={typeContrat==="bail"?"Nouveau contrat de bail":"Nouveau contrat de vente"} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="Client *" value={f.clientId} onChange={e=>sf("clientId",e.target.value)}>
          <option value="">— Choisir —</option>
          {clients.filter(c=>typeContrat==="bail"?c.type==="locataire":["acheteur","prospect"].includes(c.type)).map(c=>(
            <option key={c.id} value={c.id}>{c.nom} — {c.tel}</option>
          ))}
        </Sel>
        <Sel label="Bien *" value={f.bienId} onChange={e=>sf("bienId",e.target.value)}>
          <option value="">— Choisir —</option>
          {biens.filter(b=>typeContrat==="bail"?["disponible","loue"].includes(b.statut):["disponible","en_cours"].includes(b.statut)).map(b=>(
            <option key={b.id} value={b.id}>{b.titre} — {fmt(b.prix)} FCFA{b.type!=="vente"?"/mois":""}</option>
          ))}
        </Sel>

        {typeContrat==="bail"?<>
          <Inp label="Date de début *" type="date" value={f.dateDebut} onChange={e=>sf("dateDebut",e.target.value)}/>
          <div>
            <Inp label="Date de fin (laisser vide si reconductible)" type="date" value={f.dateFin} onChange={e=>sf("dateFin",e.target.value)}/>
            <p style={{fontSize:"11px",color:"var(--gray)",marginTop:"3px"}}>Vide = contrat à durée indéterminée reconductible</p>
          </div>
          <div>
            <Inp label="Loyer mensuel (FCFA) *" type="number" value={f.loyer} onChange={e=>{if(+e.target.value>=0)sf("loyer",e.target.value);}}/>
            {f.bienId&&<p style={{fontSize:"11px",color:"var(--blue2)",marginTop:"3px"}}>Prix du bien : {fmt(biens.find(b=>b.id===+f.bienId)?.prix||0)} FCFA/mois</p>}
          </div>
          <div>
            <Inp label="Caution (FCFA)" type="number" value={f.caution} onChange={e=>{if(+e.target.value>=0)sf("caution",e.target.value);}}/>
            <p style={{fontSize:"11px",color:"var(--gray)",marginTop:"3px"}}>Généralement 1 à 2 mois de loyer</p>
          </div>
          <Inp label="Indexation annuelle" value={f.indexation} onChange={e=>sf("indexation",e.target.value)} placeholder="Ex: 5% / an ou ILAT"/>
          <Inp label="Garant / Garantie" value={f.garantie} onChange={e=>sf("garantie",e.target.value)} placeholder="Nom garant, assurance loyers..."/>
        </>:<>
          <Inp label="Date de signature *" type="date" value={f.dateSignature} onChange={e=>sf("dateSignature",e.target.value)}/>
          <div>
            <Inp label="Prix de vente (FCFA) *" type="number" value={f.prixVente} onChange={e=>{if(+e.target.value>=0)sf("prixVente",e.target.value);}}/>
            {f.bienId&&<p style={{fontSize:"11px",color:"var(--blue2)",marginTop:"3px"}}>Prix affiché : {fmt(biens.find(b=>b.id===+f.bienId)?.prix||0)} FCFA</p>}
          </div>
          <Inp label="Notaire" value={f.notaire} onChange={e=>sf("notaire",e.target.value)} placeholder="Maître..."/>
          <div className="flex items-center gap-3 pt-4">
            <input type="checkbox" id="titre" checked={f.titreVerifie} onChange={e=>sf("titreVerifie",e.target.checked)} className="w-4 h-4 rounded"/>
            <label htmlFor="titre" className="text-sm font-medium text-gray-700">✅ Titre foncier vérifié</label>
          </div>
        </>}

        <div className="col-span-2"><Txta label="Notes" rows={2} value={f.notes} onChange={e=>sf("notes",e.target.value)}/></div>
        <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn variant="primary" onClick={save}>Créer le contrat</Btn>
        </div>
      </div>
    </Modal>
  </div>;
}


// ── VISITES ────────────────────────────────────────────────────
export function AdminVisites() {
  const {visites,biens,addVisite,updateVisite,deleteVisite,canWrite} = useCtx();
  const peutEcrire = canWrite("visites");
  const [modal,setModal] = useState(false);
  const [f,setF] = useState({bienId:"",nom:"",tel:"",date:"",heure:"",notes:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const today  = new Date().toISOString().split("T")[0];
  const sorted = [...visites].sort((a,b)=>a.date.localeCompare(b.date));
  const aVenir = sorted.filter(v=>v.date>=today&&v.statut==="planifie");
  const passees= sorted.filter(v=>v.date<today||v.statut!=="planifie");
  return <div>
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center"><div className="text-xs text-blue-500">À venir</div><div className="font-bold text-blue-700">{aVenir.length}</div></div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center"><div className="text-xs text-gray-500">Passées</div><div className="font-bold text-gray-700">{passees.length}</div></div>
      </div>
      {peutEcrire&&<Btn variant="primary" onClick={()=>{setF({bienId:"",nom:"",tel:"",date:"",heure:"",notes:""});setModal(true);}}>+ Planifier</Btn>}
    </div>
    {aVenir.length>0&&<>
      <h3 className="font-semibold text-emerald-600 mb-3 text-sm uppercase tracking-wider">📅 À venir</h3>
      <div className="space-y-3 mb-6">{aVenir.map(v=>(
        <div key={v.id} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center flex-shrink-0"><div className="text-xs text-emerald-600 font-semibold">{new Date(v.date).toLocaleDateString("fr-FR",{weekday:"short"})}</div><div className="font-bold text-emerald-800 text-lg leading-tight">{new Date(v.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>{v.heure&&<div className="text-xs text-emerald-600">{v.heure}</div>}</div>
            <div><div className="font-semibold text-gray-900">{v.nom}</div><div className="text-xs text-gray-500">{v.tel||"—"}</div><div className="text-xs text-emerald-600 mt-0.5">{v.bienTitre||biens.find(b=>b.id===v.bienId)?.titre}</div>{v.notes&&<div className="text-xs text-gray-400 mt-0.5">{v.notes}</div>}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {v.tel&&<a href={`${wa(v.tel)}?text=${encodeURIComponent(`Bonjour ${v.nom}, nous confirmons votre visite le ${new Date(v.date).toLocaleDateString("fr-FR")}${v.heure?` à ${v.heure}`:""} pour ${v.bienTitre||"le bien"}. Cordialement, ImmobilierCI`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#25D366] text-white">💬 Confirmer</a>}
            {peutEcrire&&<Btn variant="primary" size="xs" onClick={()=>updateVisite(v.id,{statut:"effectue"})}>✓ Effectuée</Btn>}
            {peutEcrire&&<Btn variant="danger" size="xs" onClick={()=>{ if(confirm(`Annuler la visite de ${v.nom} ?`)) deleteVisite(v.id); }}>Annuler</Btn>}
          </div>
        </div>
      ))}</div>
    </>}
    {passees.length>0&&<>
      <h3 className="font-semibold text-gray-500 mb-3 text-sm uppercase tracking-wider mt-4">Passées</h3>
      <div className="space-y-2">{passees.slice(0,8).map(v=>(
        <div key={v.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm"><span className="text-gray-400">{new Date(v.date).toLocaleDateString("fr-FR")}{v.heure?` ${v.heure}`:""}</span><span className="mx-2 text-gray-300">·</span><span className="font-medium text-gray-700">{v.nom}</span><span className="mx-2 text-gray-300">·</span><span className="text-xs text-gray-500">{v.bienTitre||biens.find(b=>b.id===v.bienId)?.titre}</span></div>
          <Badge label={SL[v.statut]||v.statut} color={SC[v.statut]||""}/>
        </div>
      ))}</div>
    </>}
    {visites.length===0&&<div className="text-center py-20 text-gray-400"><div className="text-4xl mb-2">📅</div><p>Aucune visite.</p></div>}
    <Modal open={modal} onClose={()=>setModal(false)} title="Planifier une visite">
      <div className="space-y-4">
        <Sel label="Bien *" value={f.bienId} onChange={e=>sf("bienId",e.target.value)}><option value="">— Choisir —</option>{biens.filter(b=>b.statut==="disponible").map(b=><option key={b.id} value={b.id}>{b.titre} ({b.commune})</option>)}</Sel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Inp label="Nom visiteur *" value={f.nom} onChange={e=>sf("nom",e.target.value)}/><Inp label="Téléphone" value={f.tel} onChange={e=>sf("tel",e.target.value)}/>
          <div>
            <Inp label="Date *" type="date" value={f.date} onChange={e=>{
              if(e.target.value<new Date().toISOString().split("T")[0]) return alert("❌ Vous ne pouvez pas planifier une visite dans le passé.");
              sf("date",e.target.value);
            }}/>
          </div>
          <Inp label="Heure" type="time" value={f.heure} onChange={e=>sf("heure",e.target.value)}/>
        </div>
        <Txta label="Notes" rows={2} value={f.notes} onChange={e=>sf("notes",e.target.value)}/>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn variant="primary" onClick={()=>{addVisite({...f,bienId:+f.bienId});setModal(false);}}>Planifier</Btn>
        </div>
      </div>
    </Modal>
  </div>;
}

// ── PARAMÈTRES ────────────────────────────────────────────────
export function AdminParams() {
  const {online} = useCtx();
  const [logo, setLogo] = useState(localStorage.getItem("ag_logo")||"");
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert("Logo trop lourd (max 2 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setLogo(url);
      localStorage.setItem("ag_logo", url);
      alert("Logo enregistré — il apparaîtra sur tous vos reçus.");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo("");
    localStorage.removeItem("ag_logo");
  };

  return <div className="max-w-2xl space-y-5">
    {/* Logo agence */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Logo de l'agence</h3>
      <p className="text-xs text-gray-500 mb-4">Ce logo apparaîtra sur tous vos reçus et documents imprimés. Format recommandé : PNG transparent, max 2 Mo.</p>
      {logo ? (
        <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"12px"}}>
          <img src={logo} alt="Logo" style={{height:"60px",maxWidth:"200px",objectFit:"contain",border:"1px solid var(--border)",borderRadius:"8px",padding:"8px",background:"white"}}/>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            <label style={{padding:"8px 16px",background:"var(--blue)",color:"white",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Changer le logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{display:"none"}}/>
            </label>
            <button onClick={removeLogo} style={{padding:"8px 16px",border:"1px solid #fecaca",borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:700,color:"#dc2626",background:"#fef2f2",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Supprimer</button>
          </div>
        </div>
      ) : (
        <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",padding:"24px",border:"2px dashed var(--border)",borderRadius:"10px",cursor:"pointer",background:"var(--off)"}}>
          <span style={{fontSize:"32px"}}>🖼️</span>
          <span style={{fontSize:"14px",fontWeight:600,color:"var(--blue)"}}>Cliquer pour ajouter votre logo</span>
          <span style={{fontSize:"11px",color:"var(--gray)"}}>PNG, JPG, SVG · Max 2 Mo</span>
          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{display:"none"}}/>
        </label>
      )}
    </div>

    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Statut du système</h3>
      <div className="flex items-center gap-3 mb-3"><div className={`w-3 h-3 rounded-full flex-shrink-0 ${online?"bg-emerald-500 animate-pulse":"bg-red-500"}`}/><span className="text-sm font-medium">{online?"Backend connecté — données en temps réel":"Backend hors-ligne — aucune action possible"}</span></div>
      <p className="text-xs text-gray-500">{online?"Le serveur Node.js est actif. Toutes les modifications sont persistées en base SQLite.":"Lancez node server.js dans le dossier backend pour activer le mode réel."}</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Démarrage rapide</h3>
      <div className="space-y-3">{[["1","Installer les dépendances","cd backend && npm install"],["2","Créer le compte administrateur","node seed.js  (ne crée que le compte admin, aucune fausse donnée)"],["3","Démarrer le backend","node server.js  →  http://localhost:3001"],["4","Démarrer le frontend","cd frontend && npm run dev  →  http://localhost:5173"],["5","Configurer les emails","Modifier backend/.env (SMTP_USER, SMTP_PASS Gmail)"]].map(([n,l,v])=>(
        <div key={n} className="flex items-start gap-3"><div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{n}</div><div><div className="text-sm font-medium text-gray-900">{l}</div><code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mt-0.5 block">{v}</code></div></div>
      ))}</div>
    </div>
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 space-y-2">
      <p><strong>📷 Upload photos</strong> : Images converties en base64 dans le navigateur → envoyées au serveur. Compatible Windows/Mac/Linux.</p>
      <p><strong>⏰ Retards</strong> : Le calcul des retards est informatif uniquement. Aucune pénalité automatique n'est appliquée.</p>
      <p><strong>📄 Contrats</strong> : Les alertes d'expiration apparaissent 60 jours avant la date de fin.</p>
    </div>
  </div>;
}

