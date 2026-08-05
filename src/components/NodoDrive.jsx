import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  ShieldCheck,
  Folder,
  FolderOpen,
  ScrollText,
  Table2,
  Receipt,
  FileText,
  File,
  Upload,
  Download,
  Trash2,
  X,
  Save,
  Pencil,
} from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { driveFolders, todayISO, formatFechaCorta, ROLES_ADMIN } from '../data/mockData';
import NodoSheet from './NodoSheet';
import NodoDoc from './NodoDoc';

const iconosCarpeta = { scroll: ScrollText, sheet: Table2, receipt: Receipt, template: FileText };

const formatearBytes = (n) => {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
};

const MAX_ARCHIVO = 4 * 1024 * 1024;

export default function NodoDrive() {
  const driveItems = useNodoStore((s) => s.driveItems);
  const addDriveItem = useNodoStore((s) => s.addDriveItem);
  const updateDriveItem = useNodoStore((s) => s.updateDriveItem);
  const removeDriveItem = useNodoStore((s) => s.removeDriveItem);
  const addToast = useNodoStore((s) => s.addToast);
  const adminRole = useNodoStore((s) => s.adminRole);

  const [carpetaId, setCarpetaId] = useState(driveFolders[0].id);
  const [editando, setEditando] = useState(null);
  const fileRef = useRef(null);

  const carpeta = driveFolders.find((f) => f.id === carpetaId) || driveFolders[0];
  const items = driveItems.filter((i) => i.carpetaId === carpetaId);
  const autor = ROLES_ADMIN[adminRole]?.etiqueta || 'Admin';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setEditando(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const subirArchivo = (file) => {
    if (!file) return;
    if (file.size > MAX_ARCHIVO) {
      addToast('Máximo 4 MB por archivo en NODO Drive.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => addToast('No se pudo leer el archivo.', 'error');
    reader.onload = () => {
      addDriveItem({
        carpetaId,
        tipo: 'archivo',
        nombre: file.name,
        fecha: todayISO(),
        autor,
        mime: file.type || 'application/octet-stream',
        tamano: file.size,
        dataUrl: reader.result,
      });
      addToast(`"${file.name}" guardado en ${carpeta.nombre}.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const crearSheet = () => {
    const id = Date.now();
    const item = {
      id,
      carpetaId,
      tipo: 'sheet',
      nombre: 'Nueva planilla',
      fecha: todayISO(),
      autor,
      contenido: { columnas: ['N°', 'Nombre', 'Detalle'], filas: [['', '', '']] },
    };
    addDriveItem(item);
    setEditando(item);
  };

  const crearDoc = () => {
    const id = Date.now();
    const item = { id, carpetaId, tipo: 'doc', nombre: 'Nuevo documento', fecha: todayISO(), autor, contenido: '' };
    addDriveItem(item);
    setEditando(item);
  };

  const guardarEdicion = () => {
    if (!editando) return;
    if (!editando.nombre.trim()) {
      addToast('Poné un nombre al documento.', 'error');
      return;
    }
    updateDriveItem(editando.id, { nombre: editando.nombre.trim(), contenido: editando.contenido });
    addToast('Cambios guardados en el Drive.', 'success');
    setEditando(null);
  };

  const descargar = (item) => {
    if (!item.dataUrl) return;
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.nombre;
    a.click();
    addToast(`Descargando ${item.nombre}.`, 'info');
  };

  const eliminar = (item) => {
    removeDriveItem(item.id);
    addToast(`"${item.nombre}" eliminado del Drive.`, 'info');
  };

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-nodo-navy">
            <HardDrive size={19} className="text-nodo-teal" /> Drive Interno
          </h2>
          <p className="text-xs text-slate-500">
            Documentos de gestión, planillas NODO Sheet y textos NODO Doc de la comunidad.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-nodo-green-dark ring-1 ring-inset ring-emerald-200">
          <ShieldCheck size={13} /> Solo administradores
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {driveFolders.map((f) => {
          const Icon = iconosCarpeta[f.icono] || Folder;
          const count = driveItems.filter((i) => i.carpetaId === f.id).length;
          const activa = f.id === carpetaId;
          return (
            <button
              key={f.id}
              onClick={() => setCarpetaId(f.id)}
              className={`rounded-2xl p-4 text-left shadow-card ring-1 transition ${
                activa ? 'bg-nodo-navy text-white ring-nodo-navy' : 'bg-white ring-nodo-border hover:shadow-lift'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: f.color }}>
                  <Icon size={18} />
                </span>
                <span className={`text-[11px] font-extrabold ${activa ? 'text-nodo-cyan' : 'text-slate-400'}`}>
                  {count} ítems
                </span>
              </div>
              <p className="mt-3 text-sm font-extrabold leading-tight">{f.nombre}</p>
              <p className={`mt-1 text-[11px] font-semibold ${activa ? 'text-slate-300' : 'text-slate-500'}`}>
                {f.descripcion}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: carpeta.color }}>
            <FolderOpen size={16} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-nodo-navy">{carpeta.nombre}</p>
            <p className="text-[11px] text-slate-400">
              {items.length} documento{items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-nodo-cyan px-3.5 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-cyan-600"
          >
            <Upload size={15} /> Subir archivo
          </button>
          <button
            onClick={crearSheet}
            className="inline-flex items-center gap-1.5 rounded-xl bg-nodo-navy px-3.5 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-nodo-navy-2"
          >
            <Table2 size={15} /> NODO Sheet
          </button>
          <button
            onClick={crearDoc}
            className="inline-flex items-center gap-1.5 rounded-xl bg-nodo-navy px-3.5 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-nodo-navy-2"
          >
            <FileText size={15} /> NODO Doc
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          subirArchivo(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="space-y-2.5">
        {items.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-nodo-border bg-white p-10 text-center">
            <Folder size={28} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-nodo-navy">Carpeta vacía</p>
            <p className="text-xs text-slate-400">
              Subí archivos o creá una planilla NODO Sheet o un documento NODO Doc.
            </p>
          </div>
        )}

        <AnimatePresence>
          {items.map((it) => {
            const Icon = it.tipo === 'sheet' ? Table2 : it.tipo === 'doc' ? FileText : File;
            const esEditable = it.tipo !== 'archivo';
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-nodo-border"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: esEditable ? carpeta.color : '#0F172A' }}
                >
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-nodo-navy">{it.nombre}</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {it.tipo === 'archivo'
                      ? `${it.mime?.split('/')[0]?.toUpperCase() || 'Archivo'} · ${formatearBytes(it.tamano)}`
                      : it.tipo === 'sheet'
                        ? 'Planilla NODO Sheet'
                        : 'Documento NODO Doc'}
                    {' · '}
                    {it.autor} · {formatFechaCorta(it.fecha)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {esEditable ? (
                    <button
                      onClick={() => setEditando({ ...it })}
                      title="Editar"
                      className="rounded-lg p-2 text-nodo-teal transition hover:bg-cyan-50"
                    >
                      <Pencil size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => descargar(it)}
                      title="Descargar"
                      className="rounded-lg p-2 text-nodo-teal transition hover:bg-cyan-50"
                    >
                      <Download size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => eliminar(it)}
                    title="Eliminar"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-nodo-red"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-nodo-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setEditando(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-nodo-bg shadow-lift sm:rounded-3xl"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-nodo-border bg-white px-5 py-4">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: carpeta.color }}
                >
                  {editando.tipo === 'sheet' ? <Table2 size={16} /> : <FileText size={16} />}
                </span>
                <input
                  value={editando.nombre}
                  onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  aria-label="Nombre del documento"
                  className="min-w-0 flex-1 rounded-lg bg-nodo-surface px-3 py-2 text-sm font-extrabold text-nodo-navy focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={guardarEdicion}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-nodo-green px-3.5 py-2 text-xs font-extrabold text-white shadow-card transition hover:bg-nodo-green-dark"
                  >
                    <Save size={14} /> Guardar
                  </button>
                  <button
                    onClick={() => {
                      eliminar(editando);
                      setEditando(null);
                    }}
                    title="Eliminar documento"
                    className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-nodo-red"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    title="Cerrar"
                    className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {editando.tipo === 'sheet' ? (
                  <NodoSheet item={editando} setItem={setEditando} />
                ) : (
                  <NodoDoc item={editando} setItem={setEditando} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
