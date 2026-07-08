// animations.js — Hook + composants pour les animations au scroll
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useInView — détecte quand un élément entre dans le viewport
 * @param {object} options - threshold, rootMargin, once
 * @returns {[ref, boolean]} - ref à attacher + boolean isVisible
 */
export function useInView(options = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -60px 0px", once = true } = options;
  const ref      = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback si IntersectionObserver non supporté
    if (!window.IntersectionObserver) { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}

/**
 * useCounter — anime un nombre de 0 à target quand visible
 */
export function useCounter(target, duration = 1500, visible = false) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const start     = performance.now();
    const startVal  = 0;
    const endVal    = parseFloat(target) || 0;
    const isFloat   = String(target).includes(".");

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease     = 1 - Math.pow(1 - progress, 3);
      const current  = startVal + (endVal - startVal) * ease;
      setCount(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [visible, target, duration]);

  return count;
}

// ── Classes CSS d'animation ─────────────────────────────────────
// Utilisées avec useInView pour déclencher au bon moment

export const ANIMS = {
  fadeUp:    (delay = 0) => ({
    opacity: 0, transform: "translateY(32px)",
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  }),
  fadeUpVis: {
    opacity: 1, transform: "translateY(0)",
  },
  fadeLeft:  (delay = 0) => ({
    opacity: 0, transform: "translateX(-32px)",
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  }),
  fadeRight: (delay = 0) => ({
    opacity: 0, transform: "translateX(32px)",
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  }),
  fadeVis:   { opacity: 1, transform: "translateX(0)" },
  fadeIn:    (delay = 0) => ({
    opacity: 0,
    transition: `opacity 0.7s ease ${delay}ms`,
  }),
  fadeInVis: { opacity: 1 },
  scaleUp:   (delay = 0) => ({
    opacity: 0, transform: "scale(0.92)",
    transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
  }),
  scaleVis:  { opacity: 1, transform: "scale(1)" },
};

/**
 * Compose style initial + visible selon type d'animation
 */
export function animStyle(type, visible, delay = 0) {
  switch(type) {
    case "fadeUp":    return visible ? {...ANIMS.fadeUp(delay), ...ANIMS.fadeUpVis}    : ANIMS.fadeUp(delay);
    case "fadeLeft":  return visible ? {...ANIMS.fadeLeft(delay), ...ANIMS.fadeVis}    : ANIMS.fadeLeft(delay);
    case "fadeRight": return visible ? {...ANIMS.fadeRight(delay), ...ANIMS.fadeVis}   : ANIMS.fadeRight(delay);
    case "fadeIn":    return visible ? {...ANIMS.fadeIn(delay), ...ANIMS.fadeInVis}    : ANIMS.fadeIn(delay);
    case "scaleUp":   return visible ? {...ANIMS.scaleUp(delay), ...ANIMS.scaleVis}   : ANIMS.scaleUp(delay);
    default:          return visible ? {...ANIMS.fadeUp(delay), ...ANIMS.fadeUpVis}    : ANIMS.fadeUp(delay);
  }
}
