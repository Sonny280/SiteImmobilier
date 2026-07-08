// pages/PageRealisations.jsx — données réelles depuis l'API
import { useState, useEffect } from "react";
import { API, AG } from "../utils.js";
import { useSeo } from "../seo.js";
import PageHero from "../components/PageHero.jsx";

const TYPES = ["all","Gestion locative","Vente immobilière","Location meublée","Vente terrain","Gestion copropriété","Location non meublée"];

export default function PageRealisations() {
  useSeo("realisations");
  const [realisations, setRealisations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtre, setFiltre]             = useState("all");

  useEffect(() => {
    fetch(`${API}/realisations`)
      .then(r => r.json())
      .then(d => { setRealisations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const affiches = filtre === "all" ? realisations : realisations.filter(r => r.type === filtre);

  return (
    <div style={{ paddingTop: "88px" }}>
      {/* Hero */}
      <PageHero
        pill="Portfolio"
        title="Nos réalisations"
        subtitle="Projets menés avec succès pour nos clients à Abidjan et en Côte d'Ivoire"
        image="/banners/realisations.jpg"
      />

      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          {/* Filtres */}
          <div data-anim="fadeUp" style={{ display: "flex", gap: "8px", marginBottom: "40px", overflowX: "auto", paddingBottom: "4px" }} className="no-scrollbar">
            {TYPES.map(c => (
              <button key={c} onClick={() => setFiltre(c)}
                style={{ padding: "9px 20px", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", flexShrink: 0, fontFamily: "Plus Jakarta Sans,sans-serif", background: filtre === c ? "var(--blue)" : "var(--grayL)", color: filtre === c ? "white" : "var(--gray)", transition: "all .18s" }}>
                {c === "all" ? "Toutes les réalisations" : c}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--gray)" }}>Chargement...</div>
          ) : affiches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "var(--off)", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 700, marginBottom: "8px" }}>Aucune réalisation dans cette catégorie</p>
              <button onClick={() => setFiltre("all")} className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>Tout afficher</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "24px" }}>
              {affiches.map((r, i) => (
                <div key={r.id} data-anim="fadeUp" data-delay={i * 80} className="card" style={{ padding: "28px 32px" }}>
                  {/* Image optionnelle */}
                  {r.image && (
                    <div style={{ height: "160px", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
                      <img src={r.image} alt={r.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  {/* En-tête */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--blueL)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: "20px", height: "3px", background: "var(--blue2)", borderRadius: "2px" }} />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--blue2)" }}>{r.type}</span>
                      <div style={{ fontSize: "11px", color: "var(--gray)", marginTop: "1px" }}>
                        {r.annee && <>{r.annee} · </>}{r.commune || r.ville}
                      </div>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px", color: "var(--text)", lineHeight: 1.35 }}>{r.titre}</h3>
                  <p style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--gray)" }}>{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm" style={{ background: "var(--blueL)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 700, marginBottom: "12px" }}>Votre projet sera notre prochaine réalisation</h2>
          <p style={{ fontSize: "14px", color: "var(--gray)", marginBottom: "28px" }}>Confiez votre bien à ImmobilierCI — gestion, location ou vente.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://wa.me/${AG?.waRaw || "2250757864836"}?text=${encodeURIComponent("Bonjour ImmobilierCI, je souhaite confier mon bien.")}`} target="_blank" rel="noopener noreferrer" className="btn btn-wa">WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}
