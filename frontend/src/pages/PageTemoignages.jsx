// pages/PageTemoignages.jsx — données réelles depuis l'API
import { useState, useEffect } from "react";
import { useCtx } from "../context.jsx";
import { API, wa, AG } from "../utils.js";
import { useSeo } from "../seo.js";
import { Inp, Txta } from "../ui.jsx";
import PageHero from "../components/PageHero.jsx";

function Stars({ n = 5, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => interactive && onChange && onChange(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{ fontSize: "22px", color: (hover || n) >= i ? "var(--gold)" : "var(--grayL)", cursor: interactive ? "pointer" : "default", lineHeight: 1 }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function PageTemoignages() {
  useSeo("temoignages");
  const [temoignages, setTemoignages] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ nom: "", profession: "", note: 5, texte: "", email: "" });
  const [sent, setSent]               = useState(false);
  const [err, setErr]                 = useState("");

  useEffect(() => {
    fetch(`${API}/temoignages`)
      .then(r => r.json())
      .then(d => { setTemoignages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!form.nom.trim() || !form.texte.trim()) { setErr("Votre nom et témoignage sont requis."); return; }
    setErr("");
    try {
      const res = await fetch(`${API}/temoignages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setErr("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  return (
    <div style={{ paddingTop: "88px" }}>
      {/* Hero */}
      <PageHero
        pill="Avis clients"
        title="Témoignages"
        subtitle="Ce que disent nos clients à travers toute la Côte d'Ivoire"
        image="/banners/temoignages.jpg"
      />

      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          {/* Stats */}
          <div data-anim="fadeUp" style={{ display: "flex", justifyContent: "center", gap: "clamp(24px,6vw,64px)", marginBottom: "56px", flexWrap: "wrap" }}>
            {[{ n: "5/5", l: "Note moyenne" }, { n: `${temoignages.length || "100"}+`, l: "Avis publiés" }, { n: "98%", l: "Clients satisfaits" }].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Playfair Display,serif", fontSize: "42px", fontWeight: 900, color: "var(--blue)" }}>{s.n}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gray)", marginTop: "4px" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Grille témoignages */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--gray)" }}>Chargement...</div>
          ) : temoignages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", background: "var(--off)", borderRadius: "18px", marginBottom: "48px" }}>
              <p style={{ color: "var(--gray)" }}>Aucun témoignage pour le moment. Soyez le premier !</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "20px", marginBottom: "56px" }}>
              {temoignages.map((t, i) => (
                <div key={t.id} data-anim="fadeUp" data-delay={i * 100} className="card testi-card" style={{ padding: "28px" }}>
                  <Stars n={t.note} />
                  <blockquote style={{ fontSize: "14px", lineHeight: 1.9, color: "var(--gray)", margin: "14px 0", fontStyle: "italic" }}>"{t.texte}"</blockquote>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--blueL)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Playfair Display,serif", fontSize: "14px", fontWeight: 700, color: "var(--blue2)", flexShrink: 0 }}>
                      {t.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{t.nom}</div>
                      {t.profession && <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "2px" }}>{t.profession}</div>}
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: "11px", color: "var(--gray)" }}>
                      {new Date(t.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire dépôt */}
          <div data-anim="fadeUp" style={{ maxWidth: "600px", margin: "0 auto", background: "var(--off)", border: "1px solid var(--border)", borderRadius: "20px", padding: "clamp(20px,4vw,40px)" }}>
            <h2 style={{ fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, marginBottom: "6px", textAlign: "center" }}>Partagez votre expérience</h2>
            <p style={{ fontSize: "13px", color: "var(--gray)", textAlign: "center", marginBottom: "28px" }}>Votre avis est publié après validation par notre équipe.</p>

            {!sent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="r-form-row">
                  <Inp label="Votre nom *" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
                  <Inp label="Profession (optionnel)" value={form.profession} onChange={e => setForm(p => ({ ...p, profession: e.target.value }))} />
                </div>

                {/* Étoiles interactives */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gray)", marginBottom: "10px" }}>Votre note</label>
                  <Stars n={form.note} interactive onChange={n => setForm(p => ({ ...p, note: n }))} />
                </div>

                <Txta label="Votre témoignage *" rows={4} value={form.texte} onChange={e => setForm(p => ({ ...p, texte: e.target.value }))} placeholder="Décrivez votre expérience avec ImmobilierCI..." />
                <Inp label="Email (optionnel, non publié)" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />

                {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc2626" }}>{err}</div>}

                <button onClick={send} className="btn btn-primary" style={{ justifyContent: "center", fontSize: "15px", padding: "14px" }}>
                  Envoyer mon témoignage
                </button>
                <p style={{ fontSize: "11px", color: "var(--gray)", textAlign: "center" }}>Votre témoignage sera affiché après validation · Discrétion assurée</p>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <p style={{ fontWeight: 700, fontSize: "18px", color: "#15803d", marginBottom: "8px" }}>Merci pour votre témoignage !</p>
                <p style={{ fontSize: "14px", color: "var(--gray)" }}>Il sera publié après validation par notre équipe.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
