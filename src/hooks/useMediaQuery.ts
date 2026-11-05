/* ¿Se cumple la media query? Se actualiza al girar o redimensionar la pantalla.
   Sirve para renderizar UNA sola versión de un componente (en vez de dos y
   ocultar una con CSS, que duplica el contenido en el DOM). */

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [coincide, setCoincide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const alCambiar = () => setCoincide(mq.matches);
    alCambiar();
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, [query]);

  return coincide;
}
