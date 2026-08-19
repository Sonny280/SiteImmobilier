// context.jsx v6 — JWT dans sessionStorage (cross-domain Vercel/Railway)
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API } from "./utils.js";

const Ctx = createContext(null);
export const useCtx = () => useContext(Ctx);

const ROUTE_TO_PAGE = {
  "/":"accueil", "/qui-sommes-nous":"qui-sommes-nous",
  "/services":"services", "/services/location":"services-location",
  "/services/meuble":"services-meuble", "/services/vente":"services-vente",
  "/services/terrain":"services-terrain", "/services/gestion":"services-gestion",
  "/realisations":"realisations", "/temoignages":"temoignages",
  "/blog":"blog", "/contact":"contact", "/login":"login", "/admin":"admin",
};
const PAGE_TO_ROUTE = Object.fromEntries(Object.entries(ROUTE_TO_PAGE).map(([k,v])=>[v,k]));

function pathnameToPage(pathname) {
  if (ROUTE_TO_PAGE[pathname]) return ROUTE_TO_PAGE[pathname];
  const bienMatch = pathname.match(/^\/bien\/(\d+)$/);
  if (bienMatch) return `bien-${bienMatch[1]}`;
  const blogMatch = pathname.match(/^\/blog\/(\d+)$/);
  if (blogMatch) return `blog-${blogMatch[1]}`;
  return "accueil";
}
function pageToPathname(page) {
  if (PAGE_TO_ROUTE[page]) return PAGE_TO_ROUTE[page];
  if (page.startsWith("bien-"))     return `/bien/${page.split("-")[1]}`;
  if (page.startsWith("blog-"))     return `/blog/${page.split("-")[1]}`;
  if (page.startsWith("services-")) return `/services/${page.split("-")[1]}`;
  return "/";
}

const MODULE_ACCESS = {
  biens:["commercial"], clients:["commercial"], demandes:["commercial"],
  visites:["commercial"], contrats:["commercial","comptable"],
  loyers:["comptable"], ventes:["comptable"], documents:["commercial","comptable"],
};
function canWrite(role, moduleName) {
  if (!role) return false;
  if (role==="superadmin"||role==="admin") return true;
  if (role==="lecture") return false;
  return (MODULE_ACCESS[moduleName]||[]).includes(role);
}

// Token stocké en mémoire (sessionStorage pour persistance onglet)
// Plus sécurisé que localStorage, fonctionne cross-domain contrairement aux cookies
let _memToken = sessionStorage.getItem("_ici_tok") || "";

export function Provider({ children }) {
  const [page,setPage]     = useState(()=>pathnameToPage(window.location.pathname));
  const [bienId,setBienId] = useState(()=>{ const m=window.location.pathname.match(/^\/bien\/(\d+)$/); return m?+m[1]:null; });
  const [user,setUser]     = useState(null);
  const [biens,setBiens]   = useState([]);
  const [clients,setClients]   = useState([]);
  const [loyers,setLoyers]     = useState([]);
  const [ventes,setVentes]     = useState([]);
  const [demandes,setDemandes] = useState([]);
  const [contrats,setContrats] = useState([]);
  const [visites,setVisites]   = useState([]);
  const [online,setOnline] = useState(false);
  const [authLoading,setAuthLoading] = useState(true);
  const [toast,setToast]   = useState(null);

  const showToast = useCallback((msg,type="ok")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4500); },[]);

  const goTo = (p,id=null)=>{
    const newPath = pageToPathname(p);
    if (window.location.pathname!==newPath) window.history.pushState({page:p},"",newPath);
    setPage(p);
    if(id!==null) setBienId(id);
    window.scrollTo(0,0);
  };

  const api = useCallback(async(method,path,body)=>{
    const headers = {"Content-Type":"application/json"};
    if (_memToken) headers.Authorization = `Bearer ${_memToken}`;
    const r = await fetch(`${API}${path}`,{
      method, headers,
      body: body?JSON.stringify(body):undefined
    });
    const d = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||"Erreur serveur");
    return d;
  },[]);

  const guard = useCallback((moduleName)=>{
    if (!canWrite(user?.role, moduleName)) {
      showToast(`Votre rôle (${user?.role||"inconnu"}) n'a pas accès à "${moduleName}".`,"warn");
      return false;
    }
    return true;
  },[user,showToast]);

  useEffect(()=>{
    const onPopState = ()=>{
      const p = pathnameToPage(window.location.pathname);
      const m = window.location.pathname.match(/^\/bien\/(\d+)$/);
      setPage(p); if(m) setBienId(+m[1]);
    };
    window.addEventListener("popstate",onPopState);
    return ()=>window.removeEventListener("popstate",onPopState);
  },[]);

  useEffect(()=>{
    fetch(`${API}/health`).then(r=>{ if(r.ok){ setOnline(true); fetch(`${API}/biens`).then(r=>r.json()).then(d=>{if(d.biens)setBiens(d.biens);}).catch(()=>{}); } }).catch(()=>setOnline(false));
  },[]);

  // Restaurer session depuis token stocké
  useEffect(()=>{
    if (!_memToken) { setAuthLoading(false); return; }
    if (user) { setAuthLoading(false); return; }
    fetch(`${API}/auth/me`,{headers:{Authorization:`Bearer ${_memToken}`}})
    .then(r=>r.ok?r.json():null)
    .then(u=>{ if(u&&u.id){ setUser(u); setOnline(true); } else { sessionStorage.removeItem("_ici_tok"); _memToken=""; } })
    .catch(()=>{ sessionStorage.removeItem("_ici_tok"); _memToken=""; })
    .finally(()=>setAuthLoading(false));
  },[]);

  // Déconnexion automatique après 1 heure d'inactivité
  useEffect(()=>{
    if (!user) return;
    const TIMEOUT = 60 * 60 * 1000;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(()=>{
        sessionStorage.removeItem("_ici_tok"); _memToken="";
        setUser(null); setPage("accueil");
        alert("Session expirée — déconnecté après 1 heure d\'inactivité.");
      }, TIMEOUT);
    };
    reset();
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);
    return ()=>{
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("click", reset);
    };
  },[user]);

  const loadAdmin = useCallback(async()=>{
    if(!online) return;
    try {
      const [c,l,v,d,ct,vi] = await Promise.all([
        api("GET","/clients"),api("GET","/loyers"),api("GET","/ventes"),
        api("GET","/demandes"),api("GET","/contrats"),api("GET","/visites"),
      ]);
      if(c)setClients(c); if(l)setLoyers(l); if(v)setVentes(v);
      if(d)setDemandes(d); if(ct)setContrats(ct); if(vi)setVisites(vi);
    } catch(e){ showToast(e.message,"warn"); }
  },[api,online,showToast]);

  useEffect(()=>{ if(page==="admin") loadAdmin(); },[page]);

  const login = async(email,pwd)=>{
    const headers = {"Content-Type":"application/json"};
    const r = await fetch(`${API}/auth/login`,{method:"POST",headers,body:JSON.stringify({email,password:pwd})});
    const d = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||"Identifiants incorrects");
    _memToken = d.token;
    sessionStorage.setItem("_ici_tok", d.token);
    setUser(d.user);
    // Charger les données admin immédiatement avec le nouveau token
    try {
      const [c,l,v,dem,ct,vi] = await Promise.all([
        fetch(`${API}/clients`,{headers:{Authorization:`Bearer ${d.token}`}}).then(r=>r.json()),
        fetch(`${API}/loyers`,{headers:{Authorization:`Bearer ${d.token}`}}).then(r=>r.json()),
        fetch(`${API}/ventes`,{headers:{Authorization:`Bearer ${d.token}`}}).then(r=>r.json()),
        fetch(`${API}/demandes`,{headers:{Authorization:`Bearer ${d.token}`}}).then(r=>r.json()),
        fetch(`${API}/contrats`,{headers:{Authorization:`Bearer ${d.token}`}}).then(r=>r.json()),
        fetch(`${API}/visites`,{headers:{Authorization:`Bearer ${d.token}`}}).then(r=>r.json()),
      ]);
      if(Array.isArray(c))   setClients(c);
      if(Array.isArray(l))   setLoyers(l);
      if(Array.isArray(v))   setVentes(v);
      if(Array.isArray(dem)) setDemandes(dem);
      if(Array.isArray(ct))  setContrats(ct);
      if(Array.isArray(vi))  setVisites(vi);
    } catch(e) { console.warn("Chargement admin:", e.message); }
    goTo("admin"); showToast("Connexion réussie");
  };

  const logout = async()=>{
    _memToken = "";
    sessionStorage.removeItem("_ici_tok");
    setUser(null);
    goTo("accueil");
  };

  const uploadPhotos = async(bId,files)=>{
    if(!guard("biens")) return;
    const images = await Promise.all(Array.from(files).map(f=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res({name:f.name,type:f.type,data:e.target.result}); r.onerror=rej; r.readAsDataURL(f); })));
    const result = await api("POST",`/biens/${bId}/photos/base64`,{images});
    setBiens(p=>p.map(b=>b.id===bId?{...b,photos:[...(b.photos||[]),...result.photos]}:b));
    showToast(`${result.photos.length} photo(s) ajoutée(s)`);
  };
  const deletePhoto = async(bId,photoId)=>{ if(!guard("biens")) return; await api("DELETE",`/biens/${bId}/photos/${photoId}`); setBiens(p=>p.map(b=>b.id===bId?{...b,photos:(b.photos||[]).filter(ph=>ph.id!==photoId)}:b)); showToast("Photo supprimée","warn"); };
  const addBien = async d=>{ if(!guard("biens")) return; const b=await api("POST","/biens",d); setBiens(p=>[b,...p]); showToast("Bien publié"); };
  const updateBien = async(id,d)=>{ if(!guard("biens")) return; const b=await api("PUT",`/biens/${id}`,d); setBiens(p=>p.map(x=>x.id===id?{...x,...b}:x)); showToast("Mis à jour"); };
  const deleteBien = async id=>{ if(!guard("biens")) return; await api("DELETE",`/biens/${id}`); setBiens(p=>p.filter(x=>x.id!==id)); showToast("Supprimé","warn"); };
  const addClient = async d=>{ if(!guard("clients")) return; const c=await api("POST","/clients",d); setClients(p=>[c,...p]); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Client ajouté"); };
  const updateClient = async(id,d)=>{ if(!guard("clients")) return; const c=await api("PUT",`/clients/${id}`,d); setClients(p=>p.map(x=>x.id===id?c:x)); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Mis à jour"); };
  const deleteClient = async id=>{ if(!guard("clients")) return; await api("DELETE",`/clients/${id}`); setClients(p=>p.filter(x=>x.id!==id)); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Supprimé","warn"); };
  const addLoyer = async d=>{ if(!guard("loyers")) return; const l=await api("POST","/loyers",d); setLoyers(p=>[l,...p]); showToast("Loyer enregistré"); };
  const payerLoyer = async(id,modePaiement,montantRecu)=>{ if(!guard("loyers")) return; const l=await api("PUT",`/loyers/${id}/payer`,{modePaiement,montantRecu}); setLoyers(p=>p.map(x=>x.id===id?{...x,...l}:x)); showToast("Loyer marqué payé"); };
  const relancerLoyer = async(id,canal)=>{ if(!guard("loyers")) return; return await api("POST",`/loyers/${id}/relancer`,{canal}); };
  const genererMoisLoyers = async mois=>{ if(!guard("loyers")) return; const r=await api("POST","/loyers/generer-mois",{mois}); await loadAdmin(); showToast(`${r.crees} loyer(s) créé(s)`); };
  const deleteLoyer = async id=>{ if(!guard("loyers")) return; await api("DELETE",`/loyers/${id}`); setLoyers(p=>p.filter(x=>x.id!==id)); showToast("Loyer supprimé","warn"); };
  const addVente = async d=>{ if(!guard("ventes")) return; const v=await api("POST","/ventes",d); setVentes(p=>[v,...p]); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Vente créée"); };
  const updateVente = async(id,d)=>{ if(!guard("ventes")) return; const v=await api("PUT",`/ventes/${id}`,d); setVentes(p=>p.map(x=>x.id===id?v:x)); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Vente mise à jour"); };
  const addPaiementVente = async(venteId,d)=>{ if(!guard("ventes")) return; const v=await api("POST",`/ventes/${venteId}/paiements`,d); setVentes(p=>p.map(x=>x.id===venteId?v:x)); showToast("Paiement enregistré"); };
  const deleteVente = async id=>{ if(!guard("ventes")) return; await api("DELETE",`/ventes/${id}`); setVentes(p=>p.filter(x=>x.id!==id)); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Supprimé","warn"); };
  const submitDemande = async d=>{ const nd=await api("POST","/demandes",d); setDemandes(p=>[nd,...p]); showToast("Demande envoyée — réponse sous 24h"); };
  const updateDemande = async(id,d)=>{ if(!guard("demandes")) return; const nd=await api("PUT",`/demandes/${id}/statut`,{statut:d.statut}); setDemandes(p=>p.map(x=>x.id===id?nd:x)); showToast("Mis à jour"); };
  const archiveDemande = async id=>{ if(!guard("demandes")) return; await api("DELETE",`/demandes/${id}`); setDemandes(p=>p.filter(x=>x.id!==id)); showToast("Demande archivée","warn"); };
  const addContrat = async d=>{ if(!guard("contrats")) return; const c=await api("POST","/contrats",d); setContrats(p=>[c,...p]); fetch(`${API}/biens`).then(r=>r.json()).then(r=>{if(r.biens)setBiens(r.biens);}).catch(()=>{}); showToast("Contrat créé"); };
  const updateContrat = async(id,d)=>{ if(!guard("contrats")) return; const c=await api("PUT",`/contrats/${id}`,d); setContrats(p=>p.map(x=>x.id===id?{...x,...c}:x)); showToast("Mis à jour"); };
  const addVisite = async d=>{ if(!guard("visites")) return; const v=await api("POST","/visites",d); setVisites(p=>[v,...p]); showToast("Visite planifiée"); };
  const updateVisite = async(id,d)=>{ if(!guard("visites")) return; const v=await api("PUT",`/visites/${id}`,d); setVisites(p=>p.map(x=>x.id===id?{...x,...v}:x)); showToast("Mis à jour"); };
  const deleteVisite = async id=>{ if(!guard("visites")) return; await api("DELETE",`/visites/${id}`); setVisites(p=>p.filter(x=>x.id!==id)); showToast("Visite annulée","warn"); };

  const value = {
    page,goTo,bienId,user,login,logout,online,
    canWrite:(moduleName)=>canWrite(user?.role,moduleName),
    biens,clients,loyers,ventes,demandes,contrats,visites,showToast,authLoading,
    addBien,updateBien,deleteBien,uploadPhotos,deletePhoto,
    addClient,updateClient,deleteClient,
    addLoyer,payerLoyer,relancerLoyer,genererMoisLoyers,deleteLoyer,
    addVente,updateVente,addPaiementVente,deleteVente,
    submitDemande,updateDemande,archiveDemande,
    addContrat,updateContrat,addVisite,updateVisite,deleteVisite,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast&&(
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border transition-all ${toast.type==="warn"?"bg-amber-50 border-amber-200 text-amber-900":"bg-white border-rose-100 text-rose-900"}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type==="warn"?"bg-amber-400":"bg-rose-500"}`}/>
          {toast.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
