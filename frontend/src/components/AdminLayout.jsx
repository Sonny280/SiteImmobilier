// components/AdminLayout.jsx — sidebar responsive sans Tailwind (window.innerWidth)
import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { AG } from "../utils.js";
import { AdminDashboard, AdminBiens, AdminClients, AdminLoyers, AdminVentes, AdminDemandes, AdminContrats, AdminVisites, AdminParams } from "../admin.jsx";
import { AdminBlog } from "../AdminBlog.jsx";
import { AdminTemoignages } from "../AdminTemoignages.jsx";
import { AdminRealisations } from "../AdminRealisations.jsx";
import { AdminUsers, AdminMonProfil } from "../AdminUsers.jsx";

const DESKTOP = 768;

// ── Onglets regroupés en sections ────────────────────────────────
// Réduction de 14 → 10 onglets visibles en condensant "Site vitrine"
// (Blog + Témoignages + Réalisations) sous un seul groupe visuel.
const ADMIN_TABS = [
  // Section principale
  { id:"dashboard",    l:"Tableau de bord",  icon:"📊", section:"main" },
  { id:"biens",        l:"Biens",            icon:"🏠", section:"main" },
  { id:"clients",      l:"Clients",          icon:"👥", section:"main" },
  // Section financière
  // { id:"loyers",       l:"Loyers",           icon:"💰", section:"finance" },
  { id:"ventes",       l:"Ventes",           icon:"🤝", section:"finance" },
  { id:"contrats",     l:"Contrats",         icon:"📄", section:"finance" },
  // Section commercial
  { id:"demandes",     l:"Demandes",         icon:"📩", section:"commercial" },
  { id:"visites",      l:"Agenda visites",   icon:"📅", section:"commercial" },
  // Section vitrine
  // { id:"blog",         l:"Blog",             icon:"✏️",  section:"vitrine" },
  // { id:"temoignages",  l:"Témoignages",      icon:"⭐",  section:"vitrine" },
  { id:"realisations", l:"Réalisations",     icon:"🏆", section:"vitrine" },
  // Section compte
  { id:"utilisateurs", l:"Utilisateurs",     icon:"🔐", section:"compte" },
  { id:"monprofil",    l:"Mon profil",       icon:"👤", section:"compte" },
  { id:"params",       l:"Paramètres",       icon:"⚙️",  section:"compte" },
];

const SECTIONS = [
  { key:"main",       label:"Gestion"     },
  { key:"finance",    label:"Finance"     },
  { key:"commercial", label:"Commercial"  },
  { key:"vitrine",    label:"Site vitrine"},
  { key:"compte",     label:"Compte"      },
];

const TAB_ROLES = {
  dashboard:    ["superadmin","admin","commercial","comptable","lecture"],
  biens:        ["superadmin","admin","commercial","lecture"],
  clients:      ["superadmin","admin","commercial","lecture"],
  // loyers:       ["superadmin","admin","comptable","lecture"],
  ventes:       ["superadmin","admin","comptable","lecture"],
  demandes:     ["superadmin","admin","commercial","lecture"],
  contrats:     ["superadmin","admin","commercial","comptable","lecture"],
  visites:      ["superadmin","admin","commercial","lecture"],
  // blog:         ["superadmin","admin"],
  // temoignages:  ["superadmin","admin"],
  realisations: ["superadmin","admin"],
  utilisateurs: ["superadmin"],
  monprofil:    ["superadmin","admin","commercial","comptable","lecture"],
  params:       ["superadmin","admin","commercial","comptable","lecture"],
};

function SidebarContent({ showLabels, onNav }) {
  const { goTo, user, logout } = useCtx();
  const role = user?.role;
  const [tab, setTab] = useState("dashboard");

  // Exposer setTab au parent
  if (onNav) onNav.current = setTab;

  const visibleTabs = ADMIN_TABS.filter(t => (TAB_ROLES[t.id]||[]).includes(role));

  const CONTENT = {
    dashboard:<AdminDashboard/>, biens:<AdminBiens/>, clients:<AdminClients/>,
    // loyers:<AdminLoyers/>, ventes:<AdminVentes/>, demandes:<AdminDemandes/>,
    contrats:<AdminContrats/>, visites:<AdminVisites/>, blog:<AdminBlog/>,
    temoignages:<AdminTemoignages/>, realisations:<AdminRealisations/>,
    utilisateurs:<AdminUsers/>, monprofil:<AdminMonProfil/>, params:<AdminParams/>,
  };

  return { tab, setTab, visibleTabs, CONTENT, role };
}

function AdminLayout(){
  const { goTo, user, logout } = useCtx();
  const role = user?.role;
  const userReady = user !== null && user !== undefined;

  const [tab,     setTab]     = useState("dashboard");
  const [mob,     setMob]     = useState(false);
  const [isMobile,setIsMobile]= useState(window.innerWidth < DESKTOP);

  useEffect(()=>{
    const onResize = () => {
      const mobile = window.innerWidth < DESKTOP;
      setIsMobile(mobile);
      if(!mobile) setMob(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  },[]);

  // Fermer tiroir si clic dehors
  useEffect(()=>{
    if(!mob) return;
    const onClick = (e) => {
      if(!e.target.closest("aside") && !e.target.closest("button[data-menu]"))
        setMob(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  },[mob]);

  // Si rôle change et onglet actuel non autorisé → basculer sur dashboard
  useEffect(()=>{
    if(!role) return;
    const visible = ADMIN_TABS.filter(t=>(TAB_ROLES[t.id]||[]).includes(role));
    if(!visible.find(t=>t.id===tab)) setTab(visible[0]?.id||"dashboard");
  },[role]);

  const visibleTabs = ADMIN_TABS.filter(t=>(TAB_ROLES[t.id]||[]).includes(role));
  const cur = ADMIN_TABS.find(t=>t.id===tab);

  const CONTENT = {
    dashboard:<AdminDashboard/>, biens:<AdminBiens/>, clients:<AdminClients/>,
    // loyers:<AdminLoyers/>, ventes:<AdminVentes/>, demandes:<AdminDemandes/>,
    contrats:<AdminContrats/>, visites:<AdminVisites/>, blog:<AdminBlog/>,
    temoignages:<AdminTemoignages/>, realisations:<AdminRealisations/>,
    utilisateurs:<AdminUsers/>, monprofil:<AdminMonProfil/>, params:<AdminParams/>,
  };

  const goTab = (id) => { setTab(id); setMob(false); };

  // ── Contenu de la sidebar ──────────────────────────────────────
  const renderSidebar = (collapsed=false) => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "14px 0" : "16px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap:"10px",
        justifyContent: collapsed ? "center" : "flex-start",
        flexShrink: 0,
      }}>
        <img src="/logo-icon.svg" alt="ImmobilierCI"
          style={{ width:"34px", height:"34px", borderRadius:"8px", flexShrink:0 }}/>
        {!collapsed && (
          <div>
            <div style={{ fontWeight:800, fontSize:"13px", color:"var(--blue)", whiteSpace:"nowrap" }}>ImmobilierCI</div>
            <div style={{ fontSize:"10px", color:"var(--gray)" }}>Administration</div>
          </div>
        )}
      </div>

      {/* Navigation par sections */}
      <nav style={{ flex:1, overflowY:"auto", padding: collapsed ? "8px 0" : "8px 0", overflowX:"hidden" }}>
        {SECTIONS.map(section => {
          const sectionTabs = visibleTabs.filter(t=>t.section===section.key);
          if(!sectionTabs.length) return null;
          return (
            <div key={section.key}>
              {!collapsed && (
                <div style={{
                  fontSize:"9px", fontWeight:700, textTransform:"uppercase",
                  letterSpacing:"0.12em", color:"var(--gray)", opacity:0.6,
                  padding:"12px 14px 4px",
                }}>
                  {section.label}
                </div>
              )}
              {collapsed && <div style={{ height:"8px" }}/>}
              {sectionTabs.map(t => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={()=>goTab(t.id)} title={collapsed ? t.l : ""}
                    style={{
                      width:"100%", display:"flex", alignItems:"center",
                      gap: collapsed ? 0 : "10px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      padding: collapsed ? "10px 0" : "9px 14px",
                      border:"none", cursor:"pointer",
                      background: active ? "var(--blueL)" : "transparent",
                      borderRight: active ? "3px solid var(--blue)" : "3px solid transparent",
                      color: active ? "var(--blue)" : "var(--text)",
                      fontWeight: active ? 700 : 500,
                      fontSize:"13px",
                      fontFamily:"Plus Jakarta Sans,sans-serif",
                      transition:"all 0.15s",
                    }}>
                    <span style={{ fontSize:"15px", flexShrink:0, minWidth: collapsed ? "auto" : "20px" }}>
                      {t.icon}
                    </span>
                    {!collapsed && <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.l}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Pied sidebar — utilisateur */}
      <div style={{
        borderTop:"1px solid var(--border)",
        padding: collapsed ? "10px 0" : "12px 14px",
        flexShrink:0,
        display:"flex", alignItems:"center",
        gap:"8px",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width:"32px", height:"32px", borderRadius:"50%",
          background:"var(--gold)", display:"flex", alignItems:"center",
          justifyContent:"center", flexShrink:0,
          fontFamily:"Playfair Display,serif", fontSize:"12px",
          fontWeight:700, color:"var(--blue)",
        }}>
          {(user?.nom||"··").slice(0,2).toUpperCase()}
        </div>
        {!collapsed && (
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontWeight:700, fontSize:"12px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.nom||""}</div>
            <div style={{ fontSize:"10px", color:"var(--gray)", whiteSpace:"nowrap" }}>{user?.role||""}</div>
          </div>
        )}
        {!collapsed && (
          <button onClick={logout} title="Déconnexion"
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:"16px", flexShrink:0, padding:"2px" }}>
            🚪
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--off)" }}>

      {/* ── Sidebar desktop (jamais affichée sur mobile) ── */}
      {!isMobile && (
        <aside style={{
          width: "220px", background:"white",
          borderRight:"1px solid var(--border)",
          display:"flex", flexDirection:"column",
          flexShrink:0, position:"sticky", top:0, height:"100vh",
        }}>
          {renderSidebar(false)}
        </aside>
      )}

      {/* ── Tiroir mobile ── */}
      {isMobile && mob && (
        <>
          <div onClick={()=>setMob(false)} style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:98,
          }}/>
          <aside style={{
            position:"fixed", top:0, left:0, bottom:0, width:"240px",
            background:"white", zIndex:99,
            boxShadow:"4px 0 24px rgba(0,0,0,0.15)",
            display:"flex", flexDirection:"column",
            animation:"slideRight 0.22s ease",
          }}>
            <style>{`@keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            {renderSidebar(false)}
          </aside>
        </>
      )}

      {/* ── Zone principale ── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

        {/* Header */}
        <header style={{
          background:"white", borderBottom:"1px solid var(--border)",
          padding:"0 clamp(12px,3vw,24px)", height:"58px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0, gap:"8px",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            {isMobile && (
              <button data-menu="1" onClick={()=>setMob(p=>!p)}
                style={{
                  width:"36px", height:"36px", borderRadius:"8px",
                  border:"1px solid var(--border)", background: mob ? "var(--blueL)" : "white",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"16px", color:"var(--blue)", cursor:"pointer", flexShrink:0,
                }}>
                {mob ? "✕" : "☰"}
              </button>
            )}
            <h1 style={{
              fontSize:"clamp(13px,3.5vw,15px)", fontWeight:800,
              color:"var(--text)", whiteSpace:"nowrap",
              overflow:"hidden", textOverflow:"ellipsis",
            }}>
              {cur?.icon} {cur?.l}
            </h1>
            {role==="lecture" && (
              <span style={{
                fontSize:"10px", fontWeight:700, padding:"3px 10px",
                borderRadius:"100px", background:"#f1f5f9", color:"#64748b",
                flexShrink:0, whiteSpace:"nowrap",
              }}>👁 Lecture seule</span>
            )}
          </div>
          <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
            {!isMobile && (
              <button onClick={()=>goTo("accueil")} className="btn btn-outline btn-sm">
                🌐 Site public
              </button>
            )}
            {role!=="lecture" && visibleTabs.find(t=>t.id==="biens") && (
              <button onClick={()=>setTab("biens")} className="btn btn-primary btn-sm">
                + Bien
              </button>
            )}
          </div>
        </header>

        {/* Contenu */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"clamp(12px,3vw,24px)" }}>
          {CONTENT[tab] || null}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;

// ── PAGE CALCULATRICE (proxy) ────────────────────────────────────
export function AdminCalculatrice({ biens, setPage }) {
  const { Calculatrice } = require("../Calculatrice.jsx");
  return <Calculatrice biens={biens} setPage={setPage}/>;
}
