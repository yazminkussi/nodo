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
import { supabase, supabaseDisponible } from '../lib/supabaseClient';
import { cargarComunidadConfig } from '../lib/brandService';

// Añade un cache-buster (etag) a la URL pública del logo para que el navegador
// y el service worker no sirvan una versión "vieja" cuando el Admin la actualiza.
function bustearLogo(url, etag) {
  if (!url || url.startsWith('data:')) return url;
  const sufijo = etag || 'x';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(sufijo)}`;
}

export function useComunidadRealtime() {
  const comunidad = useComunidadActual();
  const comunidadId = comunidad?.id;
  const aplicarMarcaRemota = useNodoStore((s) => s.aplicarMarcaRemota);
  const inicializadoRef = useRef(new Set());

  useEffect(() => {
    if (!supabaseDisponible || !comunidadId) return undefined;

    const aplicarConfig = (fila) => {
      if (!fila) return;
      const patch = {};
      if (fila.logo_url) patch.logo = bustearLogo(fila.logo_url, fila.logo_etag);
      if (fila.logo_etag) patch.logoEtag = fila.logo_etag;
      if (fila.nombre) patch.nombre = fila.nombre;
      aplicarMarcaRemota(comunidadId, patch);
    };

    const canal = supabase
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
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [comunidadId, aplicarMarcaRemota]);
}

export function useAccesoRealtime() {
  const addRegistroAcceso = useNodoStore((s) => s.addRegistroAcceso);

  useEffect(() => {
    if (!supabaseDisponible) return undefined;

    const canal = supabase
      .channel('nodo-acceso')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registros_acceso' },
        (payload) => {
          const fila = payload.new;
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
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [addRegistroAcceso]);
}
