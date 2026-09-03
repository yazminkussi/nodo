/* Fuente única de socios para la UI.

   - Modo 'remoto'  → datos reales de Supabase (sesión activa + comunidad).
   - Modo 'demo'    → estado local de useNodoStore (sin backend).

   Expone la misma interfaz en ambos modos para que los componentes no
   tengan que saber de dónde vienen los datos. */

import { useCallback, useEffect, useState } from 'react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import {
  listarSocios,
  crearSocio,
  actualizarSocio,
  eliminarSocio,
  registrarPagoSocio,
  cambiarEstadoCuota,
} from '../lib/api/socios';
import type { SocioUI } from '../lib/api/socios';
import type { Socio } from '../data/mockData';

type SocioVista = SocioUI | Socio;

export interface UseSociosResult {
  modo: 'demo' | 'remoto';
  socios: SocioVista[];
  cargando: boolean;
  error: unknown;
  recargar: () => void;
  registrarPago: (id: string | number) => void | Promise<void>;
  toggleCuota: (id: string | number) => void | Promise<void>;
  crear: ((socio: Partial<SocioUI>) => Promise<SocioUI>) | null;
  actualizar: ((id: string, patch: Partial<SocioUI>) => Promise<void>) | null;
  eliminar: ((id: string) => Promise<void>) | null;
}

export function useSocios(): UseSociosResult {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  // --- demo ---
  const demoSocios = useNodoStore((s) => s.members);
  const demoToggle = useNodoStore((s) => s.toggleCuotaStatus);
  const demoRegistrarPago = useNodoStore((s) => s.registrarPago);

  // --- remoto ---
  const [socios, setSocios] = useState<SocioUI[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const recargar = useCallback(() => {
    if (!esRemoto || !comunidadId) return;
    setCargando(true);
    setError(null);
    listarSocios(comunidadId)
      .then(setSocios)
      .catch((e) => setError(e))
      .finally(() => setCargando(false));
  }, [esRemoto, comunidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!esRemoto) {
    return {
      modo: 'demo',
      socios: demoSocios,
      cargando: false,
      error: null,
      recargar: () => {},
      registrarPago: (id) => demoRegistrarPago(Number(id)),
      toggleCuota: (id) => demoToggle(Number(id)),
      crear: null,
      actualizar: null,
      eliminar: null,
    };
  }

  const reemplazar = (s: SocioUI) => setSocios((prev) => prev.map((x) => (x.id === s.id ? s : x)));

  return {
    modo: 'remoto',
    socios,
    cargando,
    error,
    recargar,
    registrarPago: async (id) => reemplazar(await registrarPagoSocio(String(id))),
    toggleCuota: async (id) => {
      const actual = socios.find((x) => x.id === id);
      reemplazar(await cambiarEstadoCuota(String(id), !actual?.cuotaAlDia));
    },
    crear: async (socio) => {
      const nuevo = await crearSocio(comunidadId as string, socio);
      setSocios((prev) => [...prev, nuevo]);
      return nuevo;
    },
    actualizar: async (id, patch) => reemplazar(await actualizarSocio(id, patch)),
    eliminar: async (id) => {
      await eliminarSocio(id);
      setSocios((prev) => prev.filter((x) => x.id !== id));
    },
  };
}
