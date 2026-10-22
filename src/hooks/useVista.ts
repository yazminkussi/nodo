/* Vista efectiva de la app (portal del socio o panel de administración).
   - Con sesión real: sólo quien tiene un rol de administración en la comunidad
     activa puede ver el panel; el resto siempre ve el portal del socio, sin
     importar lo que haya quedado guardado en este navegador.
   - En modo demo: la vista la elige el selector local. */

import { useSesion, useEsAdmin } from '../store/useSesion';
import { useNodoStore } from '../store/useNodoStore';

export function useVista(): { vista: 'socio' | 'admin'; puedeCambiar: boolean } {
  const remoto = useSesion((s) => s.estado === 'activo');
  const esAdmin = useEsAdmin();
  const vistaGuardada = useNodoStore((s) => s.role);

  if (!remoto) return { vista: vistaGuardada, puedeCambiar: true };
  return { vista: esAdmin ? vistaGuardada : 'socio', puedeCambiar: esAdmin };
}
