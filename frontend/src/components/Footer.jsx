// components/Footer.jsx
import { AG, wa } from "../utils.js";

export default function Footer({ setPage }) {
  const nav = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <footer style={{ background: "var(--blue)", color: "white", paddingTop: "64px", paddingBottom: "28px" }}>
      <div className="container">
        <div className="r-grid-footer" style={{ paddingBottom: "48px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Playfair Display,serif", fontWeight: 700, fontSize: "18px", color: "var(--blue)" }}>LI</div>
              <div>
                <div style={{ fontFamily: "Playfair Display,serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)" }}>ImmobilierCI</div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Agence Immobilière Agréée</div>
              </div>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.9, color: "rgba(255,255,255,0.55)", fontStyle: "italic", marginBottom: "24px", borderLeft: "3px solid var(--gold)", paddingLeft: "14px" }}>« {AG.slogan} »</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {[{url:AG.social.facebook,bg:"#1877F2",l:"f"},{url:AG.social.instagram,bg:"#E1306C",l:"in"},{url:AG.social.linkedin,bg:"#0A66C2",l:"Li"},{url:AG.social.youtube,bg:"#FF0000",l:"YT"}].map(s => (
                <a key={s.l} href={s.url} target="_blank" rel="noopener noreferrer" className="social-icon" style={{ background: s.bg, color: "white", fontFamily: "Playfair Display,serif", fontSize: "13px", fontWeight: 700, width: "36px", height: "36px" }}>{s.l}</a>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Navigation</p>
            {[["accueil","Accueil"],["qui-sommes-nous","Qui sommes-nous"],["services","Catalogue"],["realisations","Réalisations"],["temoignages","Témoignages"],["blog","Blog"],["calculatrice","Calculatrice"],["contact","Contact"]].map(([p, l]) => (
              <button key={p} onClick={() => nav(p)} style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "10px", textAlign: "left", transition: "color 0.18s" }}
                onMouseEnter={e => e.target.style.color = "var(--gold)"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.65)"}>{l}</button>
            ))}
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Services</p>
            {["Gestion locative","Location meublée","Location non meublée","Vente immobilière","Vente de terrains"].map(s => (
              <p key={s} style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "10px" }}>{s}</p>
            ))}
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Contacts</p>
            {[...new Set([AG.tel1, AG.tel2, AG.whatsapp, AG.email, AG.horaires, AG.adresse].filter(Boolean))].map((c,i) => (
              <p key={i} style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "10px" }}>{c}</p>
            ))}
          </div>
        </div>
        <div style={{ paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} ImmobilierCI — Kouassi Atse Charles. Tous droits réservés.</p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {["Agence immobilière Abidjan","Vente terrain CI","Location Cocody","Gestion locative CI"].map(k => (
              <span key={k} style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>{k}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
