// components/BienCard.jsx
import { fmtM, wa, photoSrc, TL, SC, AG } from "../utils.js";

export default function BienCard({ bien, onClick }) {
  const isSale = bien.type === "vente" || bien.type === "terrain";
  const mainPh = bien.photos?.find(p => p.principale) || bien.photos?.[0];
  const typeBadge = { location:"badge-dispo", meuble:"badge-meuble", vente:"badge-vente", terrain:"badge-terrain" };
  return (
    <div className="card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="img-zoom" style={{ height: "220px", position: "relative" }}>
        {mainPh
          ? <img src={photoSrc(mainPh)} alt={bien.titre} className="bien-img" style={{ width: "100%", height: "100%" }} />
          : <div style={{ width: "100%", height: "100%", background: "var(--grayL)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "var(--border)", fontSize: "48px" }}>&#9776;</span>
            </div>
        }
        <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className={`badge ${typeBadge[bien.type] || ""}`}>{TL[bien.type] || bien.type}</span>
          {bien.statut === "disponible" && <span className="badge badge-dispo">Disponible</span>}
          {bien.featured === 1 && <span className="badge" style={{ background: "var(--goldL)", color: "#7a5c00" }}>Coup de cœur</span>}
        </div>
        {(bien.photos?.length || 0) > 1 && <span style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.55)", color: "white", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>{bien.photos.length} photos</span>}
        <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.45)", color: "white", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", fontFamily: "monospace" }}>{bien.ref}</span>
      </div>
      <div style={{ padding: "20px 22px 22px" }}>
        <div style={{ fontFamily: "Playfair Display,serif", fontSize: "22px", fontWeight: 700, color: "var(--blue)", lineHeight: 1.1 }}>
          {fmtM(bien.prix)} <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--gray)" }}>FCFA{!isSale && "/mois"}</span>
        </div>
        <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--text)", marginTop: "6px", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bien.titre}</h3>
        <p style={{ fontSize: "13px", color: "var(--gray)", marginBottom: "14px" }}>&#128205; {bien.quartier}, {bien.commune}</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          {bien.chambres > 0 && <span style={{ fontSize: "12px", fontWeight: 600, background: "var(--grayL)", color: "var(--text)", padding: "4px 10px", borderRadius: "20px" }}>{bien.chambres} ch.</span>}
          {bien.sdb > 0 && <span style={{ fontSize: "12px", fontWeight: 600, background: "var(--grayL)", color: "var(--text)", padding: "4px 10px", borderRadius: "20px" }}>{bien.sdb} sdb</span>}
          {bien.surface > 0 && <span style={{ fontSize: "12px", fontWeight: 600, background: "var(--grayL)", color: "var(--text)", padding: "4px 10px", borderRadius: "20px" }}>{bien.surface} m²</span>}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", gap: "8px" }}>
          <button onClick={e => { e.stopPropagation(); onClick(); }} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Voir le bien</button>
          <a href={`${wa(bien.whatsapp || AG.waRaw)}?text=${encodeURIComponent(`Bonjour ImmobilierCI, je suis intéressé par ${bien.ref} — ${bien.titre}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm" onClick={e => e.stopPropagation()}>WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
