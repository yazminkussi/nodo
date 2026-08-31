import { motion } from 'framer-motion';

/* Logo de NODO — glifo de trazo continuo (vector oficial).
   - `color`: cualquier color CSS (default: hereda con currentColor).
   - `animate`: dibuja el trazo y aparecen los remates, al montar.
   Respeta prefers-reduced-motion vía el <MotionConfig> de main.jsx. */

const VIEWBOX = '0 0 105.05 103.8';
const D =
  'M74.8,27.18c-8.72-5.95-19.63-5.13-28.46.11,17.6,17.8,28.8,46.05,8.67,61.53-7.02,5.4-16.66,6.11-25.69,2.38-21.07-8.71-19.73-41.79-6.16-62.33-4-4.04-8.3-6.89-12.88-9.54l8.61-13.59,15.43,10.71c17.75-14.52,43.56-12.96,57.84,4.84,7.06,8.8,10.77,19.75,10.89,31.02l.45,39.63-16.87-.06c-.88-21.89,5.21-53.09-11.82-64.7ZM33.86,75.28c2.48,2.4,8.56,2.47,11.15.49,8.35-6.38,2.75-20.81-4.93-30.86-2.06-2.69-6.18-1.99-7.52,1.12,0,.02-.02.03-.02.05-4.3,9.52-4.95,23.11,1.33,29.19Z';

export default function NodoMark({
  size = 36,
  color = 'currentColor',
  animate = false,
  className = '',
}) {
  const common = {
    width: size,
    height: size,
    viewBox: VIEWBOX,
    className,
    role: 'img',
    'aria-label': 'NODO',
  };

  if (!animate) {
    return (
      <svg {...common}>
        <path d={D} fill={color} fillRule="evenodd" />
        <circle cx="10.27" cy="10.27" r="10.27" fill={color} />
        <circle cx="94.78" cy="93.53" r="10.27" fill={color} />
      </svg>
    );
  }

  // El relleno siempre está visible; el trazo lo recorre por encima y se
  // desvanece — así el logo nunca queda "a medio dibujar".
  return (
    <svg {...common}>
      <motion.path
        d={D}
        fill={color}
        fillRule="evenodd"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'center' }}
      />
      <circle cx="10.27" cy="10.27" r="10.27" fill={color} />
      <circle cx="94.78" cy="93.53" r="10.27" fill={color} />
      <motion.path
        d={D}
        fill="none"
        stroke="#fff"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
      />
    </svg>
  );
}
