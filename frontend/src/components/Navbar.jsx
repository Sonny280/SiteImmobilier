// components/Navbar.jsx — menu hamburger responsive sans dépendance Tailwind
import { useState, useEffect, useRef } from "react";
import { useCtx } from "../context.jsx";
import { wa, AG } from "../utils.js";

// Breakpoint desktop
const DESKTOP = 1024;

export default function Navbar({ page, setPage }) {
  const { goTo, user, logout } = useCtx();
  const [scroll,   setScroll]  = useState(false);
  const [isMobile, setIsMobile]= useState(window.innerWidth < DESKTOP);
  const [mob,      setMob]     = useState(false);   // menu tiroir ouvert/fermé
  const [svcOpen,  setSvcOpen] = useState(false);   // sous-menu Services mobile
  const menuRef = useRef(null);

  // Détection taille écran
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < DESKTOP;
      setIsMobile(mobile);
      if (!mobile) { setMob(false); setSvcOpen(false); }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermer si clic dehors
  useEffect(() => {
    if (!mob) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMob(false); setSvcOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [mob]);

  const nav = (p) => {
    setPage(p);
    setMob(false);
    setSvcOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const LINKS = [
    { p: "accueil",         l: "Accueil" },
    { p: "qui-sommes-nous", l: "Qui sommes-nous" },
    { p: "services",        l: "Services", sub: [
      { slug: "location",     label: "Location mensuelle" },
      { slug: "meuble",       label: "Meublé court séjour" },
      { slug: "vente",        label: "Vente immobilière" },
      { slug: "terrain",      label: "Vente de terrains" },
      { slug: "gestion",      label: "Gestion locative" },
      // { slug: "calculatrice", label: "Calculatrice" },  // masqué
    ]},
    { p: "realisations",   l: "Réalisations" },
    { p: "temoignages",    l: "Témoignages" },
    { p: "blog",           l: "Blog" },
    { p: "contact",        l: "Contact" },
  ];

  const isActive = (p) => page === p || (p === "services" && (page||"").startsWith("services"));

  return (
    <nav ref={menuRef} style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      background: "var(--white)",
      borderBottom: "1px solid var(--border)",
      boxShadow: scroll ? "0 4px 24px rgba(92,26,43,0.09)" : "none",
      transition: "box-shadow 0.2s",
    }}>

      {/* ── Barre principale ── */}
      <div className="container" style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: "68px", gap: "12px",
      }}>

        {/* Logo */}
        <button onClick={() => nav("accueil")} style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "none", border: "none", cursor: "pointer",
          flexShrink: 0,
        }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "var(--blue)", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontFamily:"Playfair Display,serif", fontWeight:700, fontSize:"15px", color:"var(--gold)" }}>LI</span>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily:"Playfair Display,serif", fontWeight:700, fontSize:"clamp(14px,4vw,18px)", color:"var(--blue)", lineHeight:1.1 }}>
              ImmobilierCI
            </div>
            {!isMobile && (
              <div style={{ fontSize:"9px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)" }}>
                Agence Immobilière
              </div>
            )}
          </div>
        </button>

        {/* ── Liens desktop (cachés sur mobile) ── */}
        {!isMobile && (
          <div style={{ display:"flex", alignItems:"center", gap:"2px", flex:1, justifyContent:"center" }}>
            {LINKS.map(({ p, l, sub }) => sub ? (
              <div key={p} className="has-dropdown" style={{ position:"relative" }}>
                <button onClick={() => nav(p)}
                  className={`nav-link${isActive(p) ? " active" : ""}`}
                  style={{ padding:"8px 10px", fontSize:"13px", display:"flex", alignItems:"center", gap:"3px", background:"none", border:"none", cursor:"pointer" }}>
                  {l} <span style={{ fontSize:"9px" }}>▼</span>
                </button>
                <div className="dropdown-menu">
                  {sub.map(s => (
                    <button key={s.slug} className="dropdown-item"
                      style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", cursor:"pointer" }}
                      onClick={() => nav(s.slug === "calculatrice" ? "calculatrice" : `services-${s.slug}`)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button key={p} onClick={() => nav(p)}
                className={`nav-link${isActive(p) ? " active" : ""}`}
                style={{ padding:"8px 10px", fontSize:"13px", background:"none", border:"none", cursor:"pointer" }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* ── Boutons droite ── */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>

          {/* WhatsApp — visible desktop seulement */}
          {!isMobile && (
            <a href={`${wa(AG.waRaw)}?text=${encodeURIComponent("Bonjour ImmobilierCI, je souhaite des informations.")}`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-wa btn-sm">
              WhatsApp
            </a>
          )}

          {/* Admin */}
          {user
            ? <button onClick={() => goTo("admin")} className="btn btn-primary btn-sm">Admin</button>
            : <button onClick={() => goTo("login")}  className="btn btn-outline btn-sm" style={{ fontSize:"13px" }}>Admin</button>
          }

          {/* ── Bouton hamburger — visible UNIQUEMENT sur mobile ── */}
          {isMobile && (
            <button
              onClick={() => { setMob(o => !o); setSvcOpen(false); }}
              aria-label={mob ? "Fermer le menu" : "Ouvrir le menu"}
              style={{
                width: "40px", height: "40px",
                borderRadius: "8px",
                border: "1.5px solid var(--border)",
                background: mob ? "var(--blue)" : "white",
                color: mob ? "white" : "var(--blue)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "20px",
                transition: "all 0.2s", flexShrink: 0,
              }}>
              {mob ? "✕" : "☰"}
            </button>
          )}
        </div>
      </div>

      {/* ── Menu tiroir mobile ── */}
      {isMobile && mob && (
        <div style={{
          background: "var(--white)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(92,26,43,0.15)",
          maxHeight: "calc(100vh - 68px)",
          overflowY: "auto",
          // Animation slide down
          animation: "slideDown 0.22s ease",
        }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Liens */}
          {LINKS.map(({ p, l, sub }) => sub ? (
            <div key={p}>
              {/* Bouton Services */}
              <button
                onClick={() => setSvcOpen(o => !o)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "15px 24px",
                  border: "none", borderBottom: "1px solid var(--border)",
                  background: svcOpen ? "var(--blueL)" : "transparent",
                  cursor: "pointer", fontFamily: "Plus Jakarta Sans,sans-serif",
                  fontSize: "15px", fontWeight: 600,
                  color: isActive(p) ? "var(--blue)" : "var(--text)",
                }}>
                <span>{l}</span>
                <span style={{
                  fontSize: "11px", color: "var(--gray)",
                  transition: "transform 0.2s",
                  transform: svcOpen ? "rotate(180deg)" : "none",
                  display: "inline-block",
                }}>▼</span>
              </button>
              {/* Sous-menu */}
              {svcOpen && (
                <div style={{ background: "var(--off)", borderBottom: "1px solid var(--border)" }}>
                  {sub.map(s => (
                    <button key={s.slug}
                      onClick={() => nav(s.slug === "calculatrice" ? "calculatrice" : `services-${s.slug}`)}
                      style={{
                        width: "100%", display: "block", textAlign: "left",
                        padding: "13px 24px 13px 40px",
                        border: "none", borderBottom: "1px solid rgba(92,26,43,0.07)",
                        background: "transparent", cursor: "pointer",
                        fontFamily: "Plus Jakarta Sans,sans-serif",
                        fontSize: "14px", fontWeight: 500, color: "var(--blue2)",
                      }}>
                      — {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button key={p} onClick={() => nav(p)}
              style={{
                width: "100%", display: "block", textAlign: "left",
                padding: "15px 24px",
                border: "none", borderBottom: "1px solid var(--border)",
                background: isActive(p) ? "var(--blueL)" : "transparent",
                cursor: "pointer", fontFamily: "Plus Jakarta Sans,sans-serif",
                fontSize: "15px", fontWeight: 600,
                color: isActive(p) ? "var(--blue)" : "var(--text)",
                borderLeft: isActive(p) ? "3px solid var(--blue)" : "3px solid transparent",
              }}>
              {l}
            </button>
          ))}

          {/* Pied du menu — contact */}
          <div style={{ padding: "16px 24px", background: "var(--off)", borderTop: "2px solid var(--blueL)" }}>
            <a href={`${wa(AG.waRaw)}?text=${encodeURIComponent("Bonjour ImmobilierCI, je souhaite des informations.")}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                width: "100%", padding: "13px",
                background: "#25D366", color: "white",
                borderRadius: "10px", border: "none",
                fontSize: "15px", fontWeight: 700, textDecoration: "none",
                marginBottom: "10px",
              }}>
              💬 WhatsApp ImmobilierCI
            </a>
            <a href={`tel:${AG.tel1}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                fontSize: "14px", fontWeight: 700, color: "var(--blue)",
                padding: "8px", textDecoration: "none",
              }}>
              📞 {AG.tel1}
            </a>
            {user && (
              <button onClick={logout}
                style={{
                  width: "100%", marginTop: "8px", padding: "11px",
                  border: "1px solid #fecaca", borderRadius: "8px",
                  color: "#dc2626", background: "#fef2f2",
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  fontFamily: "Plus Jakarta Sans,sans-serif",
                }}>
                Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
