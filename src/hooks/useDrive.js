/* Fuente única del Drive interno: real (sesión activa) o demo. */

import { useCallback, useEffect, useState } from 'react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import { todayISO } from '../data/mockData';
import {
  listarDriveItems,
  crearDocDrive,
  subirArchivoDrive,
  actualizarDriveItem,
  eliminarDriveItem,
  urlDescargaDrive,
} from '../lib/api/drive';

export function useDrive() {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  const demoItems = useNodoStore((s) => s.driveItems);
  const demoAdd = useNodoStore((s) => s.addDriveItem);
  const demoUpdate = useNodoStore((s) => s.updateDriveItem);
  const demoRemove = useNodoStore((s) => s.removeDriveItem);

  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    if (!esRemoto || !comunidadId) return;
    setCargando(true);
    setError(null);
    listarDriveItems(comunidadId)
      .then(setItems)
      .catch(setError)
      .finally(() => setCargando(false));
  }, [esRemoto, comunidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!esRemoto) {
    return {
      modo: 'demo',
      items: demoItems,
      cargando: false,
      error: null,
      recargar: () => {},
      crearDoc: async ({ carpetaId, nombre, autor }) => {
        const item = {
          id: Date.now(),
          carpetaId,
          tipo: 'doc',
          nombre,
          fecha: todayISO(),
          autor,
          contenido: '',
        };
        demoAdd(item);
        return item;
      },
      crearSheet: async ({ carpetaId, nombre, autor }) => {
        const item = {
          id: Date.now(),
          carpetaId,
          tipo: 'sheet',
          nombre,
          fecha: todayISO(),
          autor,
          contenido: { columnas: ['N°', 'Nombre', 'Detalle'], filas: [['', '', '']] },
        };
        demoAdd(item);
        return item;
      },
      subirArchivo: async ({ carpetaId, file, autor }) => {
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onerror = () => reject(new Error('No se pudo leer el archivo.'));
          r.onload = () => resolve(r.result);
          r.readAsDataURL(file);
        });
        const item = {
          id: Date.now(),
          carpetaId,
          tipo: 'archivo',
          nombre: file.name,
          fecha: todayISO(),
          autor,
          mime: file.type || 'application/octet-stream',
          tamano: file.size,
          dataUrl,
        };
        demoAdd(item);
        return item;
      },
      actualizar: async (id, _tipo, patch) => demoUpdate(id, patch),
      eliminar: async (item) => demoRemove(item.id),
      urlDescarga: async (item) => item.dataUrl || null,
    };
  }

  return {
    modo: 'remoto',
    items,
    cargando,
    error,
    recargar,
    crearDoc: async ({ carpetaId, nombre, autor }) => {
      const nuevo = await crearDocDrive(comunidadId, { carpetaId, nombre, autor, tipo: 'doc' });
      setItems((prev) => [nuevo, ...prev]);
      return nuevo;
    },
    crearSheet: async ({ carpetaId, nombre, autor }) => {
      const nuevo = await crearDocDrive(comunidadId, { carpetaId, nombre, autor, tipo: 'sheet' });
      setItems((prev) => [nuevo, ...prev]);
      return nuevo;
    },
    subirArchivo: async ({ carpetaId, file, autor }) => {
      const nuevo = await subirArchivoDrive(comunidadId, { carpetaId, file, autor });
      setItems((prev) => [nuevo, ...prev]);
      return nuevo;
    },
    actualizar: async (id, tipo, patch) => {
      await actualizarDriveItem(id, tipo, patch);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    eliminar: async (item) => {
      await eliminarDriveItem(item);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    urlDescarga: async (item) => (item.storagePath ? urlDescargaDrive(item.storagePath) : null),
  };
}
