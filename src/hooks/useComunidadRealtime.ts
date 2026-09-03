/* Hook de sincronización en tiempo real de la marca (logo + nombre) y del
   historial de acceso de la comunidad, usando Supabase Realtime.

   - Se suscribe a `comunidad_config` (postgres_changes) para que cuando un
     Admin actualiza el logo/nombre, todos los dispositivos conectados y las
     PWAs instaladas actualicen su UI sin reinstalar.
   - Al arrancar, carga la configuración remota inicial (para PWAs que abren
     y ya existía un logo en la nube).
   - Sin Supabase configurado el hook no hace nada (modo demo). */

import { useEffect, useRef } from 'react';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { supabase } from '../lib/supabaseClient';
import { cargarComunidadConfig } from '../lib/brandService';
import type { Fila } from '../lib/api/tipos';

// Añade un cache-buster (etag) a la URL pública del logo para que el navegador
// y el service worker no sirvan una versión "vieja" cuando el Admin la actualiza.
function bustearLogo(url?: string | null, etag?: string | null): string | null | undefined {
  if (!url || url.startsWith('data:')) return url;
  const sufijo = etag || 'x';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(sufijo)}`;
}

export function useComunidadRealtime() {
  const comunidad = useComunidadActual();
  const comunidadId = comunidad?.id;
  const aplicarMarcaRemota = useNodoStore((s) => s.aplicarMarcaRemota);
  const inicializadoRef = useRef(new Set<string>());

  useEffect(() => {
    if (!supabase || !comunidadId) return undefined;
    const sb = supabase;

    const aplicarConfig = (fila: Fila | null | undefined) => {
      if (!fila) return;
      const patch: { logo?: string; logoEtag?: string; nombre?: string } = {};
      const logo = fila.logo_url ? bustearLogo(fila.logo_url, fila.logo_etag) : null;
      if (logo) patch.logo = logo;
      if (fila.logo_etag) patch.logoEtag = fila.logo_etag;
      if (fila.nombre) patch.nombre = fila.nombre;
      aplicarMarcaRemota(comunidadId, patch);
    };

    const canal = sb
      .channel(`nodo-marca-${comunidadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comunidad_config',
          filter: `comunidad_id=eq.${comunidadId}`,
        },
        (payload) => aplicarConfig(payload.new || payload.old)
      )
      .subscribe();

    if (!inicializadoRef.current.has(comunidadId)) {
      inicializadoRef.current.add(comunidadId);
      cargarComunidadConfig(comunidadId).then((fila) => {
        if (fila) aplicarConfig(fila);
      });
    }

    return () => {
      sb.removeChannel(canal).catch(() => {});
    };
  }, [comunidadId, aplicarMarcaRemota]);
}

export function useAccesoRealtime() {
  const addRegistroAcceso = useNodoStore((s) => s.addRegistroAcceso);

  useEffect(() => {
    if (!supabase) return undefined;
    const sb = supabase;

    const canal = sb
      .channel('nodo-acceso')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registros_acceso' },
        (payload) => {
          const fila: Fila = payload.new;
          if (!fila) return;
          addRegistroAcceso({
            id: fila.id || Date.now(),
            socioId: fila.usuario_id ?? null,
            numeroSocio: fila.numero_socio ?? '—',
            nombre: fila.nombre || 'Desconocido',
            comunidadId: fila.comunidad_id,
            comunidadNombre: fila.comunidad_nombre,
            timestamp: fila.timestamp,
            estadoAlIngreso: fila.estado_al_ingreso,
            resultado: fila.resultado,
            motivo: fila.motivo,
            escaneadoPor: fila.escaneado_por,
            metodo: fila.metodo,
            reserva: fila.detalle_reserva
              ? {
                  espacioNombre: fila.detalle_reserva.split(' · ')[0],
                  hora: fila.detalle_reserva.split(' · ')[1]?.replace(' hs', ''),
                }
              : null,
            override: fila.override || false,
          });
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(canal).catch(() => {});
    };
  }, [addRegistroAcceso]);
}
