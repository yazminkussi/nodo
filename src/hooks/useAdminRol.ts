/* Rol de administración efectivo.
   - Con sesión real: el rol sale de la membresía (`useRolActivo`).
   - En modo demo: sale del selector local (`AdminRoleSwitcher` → useNodoStore).
   Los componentes del panel usan esto en vez de leer `s.adminRole` directo. */

import { useSesion, useRolActivo } from '../store/useSesion';
import { useNodoStore } from '../store/useNodoStore';
import type { AdminRoleKey } from '../data/mockData';

export function useAdminRol(): AdminRoleKey {
  const remoto = useSesion((s) => s.estado === 'activo');
  const rolReal = useRolActivo();
  const rolDemo = useNodoStore((s) => s.adminRole);

  if (remoto && rolReal && rolReal !== 'socio') {
    return rolReal as AdminRoleKey;
  }
  return rolDemo;
}
