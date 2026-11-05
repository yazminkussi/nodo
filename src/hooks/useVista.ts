/* Vista efectiva de la app (portal del socio o panel de administración).
   - Con sesión real: la vista la define el rol real en la comunidad activa.
     Quien administra ve siempre el panel de administración y el socio siempre
     su portal; no hay selector y lo guardado en el navegador no influye.
   - En modo demo: la vista la elige el selector local (para poder mostrar las
     dos caras de la app). */

import { useSesion, useEsAdmin } from '../store/useSesion';
import { useNodoStore } from '../store/useNodoStore';

export function useVista(): { vista: 'socio' | 'admin'; puedeCambiar: boolean } {
  const remoto = useSesion((s) => s.estado === 'activo');
  const esAdmin = useEsAdmin();
  const vistaGuardada = useNodoStore((s) => s.role);

  if (!remoto) return { vista: vistaGuardada, puedeCambiar: true };
  return { vista: esAdmin ? 'admin' : 'socio', puedeCambiar: false };
}
