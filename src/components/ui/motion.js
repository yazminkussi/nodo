/* Presets de animación compartidos (framer-motion).
   framer-motion respeta prefers-reduced-motion cuando se usa <MotionConfig
   reducedMotion="user">, que está puesto en main.jsx. */

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25 },
};

/* Contenedor con aparición en cascada de sus hijos. */
export const stagger = {
  animate: { transition: { staggerChildren: 0.045 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

/* Elevación al pasar el mouse (tarjetas). */
export const hoverLift = {
  whileHover: { y: -3 },
  transition: { type: 'spring', stiffness: 300, damping: 22 },
};

/* Entrada de modales. */
export const modalPanel = {
  initial: { opacity: 0, y: 36, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 36, scale: 0.98 },
  transition: { type: 'spring', stiffness: 320, damping: 30 },
};
