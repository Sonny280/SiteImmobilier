// components/AnimStat.jsx
import { useInView, useCounter } from "../animations.js";

export default function AnimStat({ value, label, suffix = "" }) {
  const [ref, visible] = useInView({ threshold: 0.3 });
  const numStr  = String(value).replace(/[^0-9.]/g, "");
  const postfix = String(value).replace(/^[^0-9]*[0-9.]+/, "") + suffix;
  const count   = useCounter(parseFloat(numStr) || 0, 1400, visible);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease" }}>
      <div style={{ fontFamily: "Playfair Display,serif", fontSize: "40px", fontWeight: 900, color: "var(--white)", lineHeight: 1 }}>
        {numStr ? count : value}{postfix}
      </div>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{label}</div>
    </div>
  );
}
