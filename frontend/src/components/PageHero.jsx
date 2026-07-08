// components/PageHero.jsx — Bannière réutilisable : photo + dégradé Bordeaux/Or
// Utilisée sur toutes les pages secondaires (Qui sommes-nous, Services, Blog, etc.)
export default function PageHero({ pill, title, subtitle, image, height = "320px" }) {
  return (
    <section style={{
      position: "relative",
      minHeight: height,
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      paddingTop: "88px",
      paddingBottom: "48px",
    }}>
      {/* Photo de fond */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />

      {/* Dégradé Bordeaux → Or transparent (style moderne) */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(120deg, rgba(92,26,43,0.94) 0%, rgba(122,37,56,0.82) 45%, rgba(184,146,63,0.55) 100%)",
      }} />

      {/* Texture légère */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 14px)",
      }} />

      {/* Contenu */}
      <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        {pill && (
          <div className="pill" style={{
            background: "rgba(255,255,255,0.14)",
            borderColor: "rgba(255,255,255,0.3)",
            color: "var(--goldL)",
            backdropFilter: "blur(4px)",
          }}>{pill}</div>
        )}
        <h1 style={{
          fontSize: "clamp(26px,6.5vw,42px)",
          fontWeight: 700,
          color: "var(--white)",
          marginBottom: subtitle ? "14px" : 0,
          textShadow: "0 2px 18px rgba(0,0,0,0.25)",
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "clamp(14px,2.2vw,17px)",
            maxWidth: "560px",
            margin: "0 auto",
          }}>{subtitle}</p>
        )}
      </div>

      {/* Vague de transition vers le blanc */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1 }}>
        <svg viewBox="0 0 1440 40" fill="none" style={{ display: "block", width: "100%" }}>
          <path d="M0,40 C480,0 960,0 1440,40 L1440,40 L0,40Z" fill="var(--white)" />
        </svg>
      </div>
    </section>
  );
}
