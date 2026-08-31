import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Pin, Loader2, X, AlertCircle } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { useNovedades } from '../hooks/useNovedades';
import { formatFechaCorta } from '../data/mockData';

const CATEGORIAS = ['Institucional', 'Evento', 'Comunicado', 'Comunidad'];
const EMOJIS = ['📣', '🏛️', '⚽', '🏺', '📋', '🛍️', '🎉', '🏆', '🎭', '💪', '📢', '⚠️'];

const vacio = {
  titulo: '',
  contenido: '',
  categoria: 'Comunicado',
  emoji: '📣',
  destacada: false,
  fecha: new Date().toISOString().slice(0, 10),
};

export default function NovedadesManager() {
  const { modo, novedades, cargando, error, crear, actualizar, eliminar } = useNovedades();
  const addToast = useNodoStore((s) => s.addToast);
  const [abierto, setAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);

  if (modo === 'demo') {
    return (
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border-2 border-dashed border-nodo-border bg-white px-6 py-10 text-center text-sm text-slate-400">
          La gestión de novedades se habilita con la cuenta conectada a Supabase.
        </div>
      </section>
    );
  }

  const guardar = async (datos) => {
    if (enEdicion) {
      await actualizar(enEdicion.id, datos);
      addToast('Novedad actualizada.', 'success');
    } else {
      await crear(datos);
      addToast('Novedad publicada.', 'success');
    }
    setAbierto(false);
  };

  const borrar = async (n) => {
    if (!window.confirm(`¿Eliminar la novedad "${n.titulo}"?`)) return;
    try {
      await eliminar(n.id);
      addToast('Novedad eliminada.', 'success');
    } catch {
      addToast('No se pudo eliminar.', 'error');
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">Novedades</h2>
          <p className="text-xs text-slate-500">
            {novedades.length} publicada{novedades.length === 1 ? '' : 's'} · las ve el socio en su
            portal
          </p>
        </div>
        <button
          onClick={() => {
            setEnEdicion(null);
            setAbierto(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-nodo-navy px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-nodo-navy-2"
        >
          <Plus size={16} /> Nueva novedad
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-nodo-red ring-1 ring-inset ring-red-200">
          <AlertCircle size={16} /> {error.message}
        </div>
      )}

      {cargando && novedades.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </p>
      )}

      <div className="space-y-3">
        {novedades.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border"
          >
            <span className="text-2xl">{n.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {n.destacada && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-nodo-red ring-1 ring-inset ring-red-200">
                    <Pin size={10} /> DESTACADA
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  {n.categoria}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {formatFechaCorta(String(n.fecha))}
                </span>
              </div>
              <h3 className="mt-1 truncate font-extrabold text-nodo-navy">{n.titulo}</h3>
              <p className="line-clamp-2 text-sm text-slate-500">{n.contenido}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => {
                  setEnEdicion(n);
                  setAbierto(true);
                }}
                className="rounded-lg p-2 text-nodo-teal transition hover:bg-cyan-50"
                title="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => borrar(n)}
                className="rounded-lg p-2 text-nodo-red transition hover:bg-red-50"
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!cargando && novedades.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-nodo-border bg-white px-4 py-10 text-center text-sm text-slate-400">
            Todavía no publicaste ninguna novedad.
          </p>
        )}
      </div>

      <AnimatePresence>
        {abierto && (
          <NovedadForm novedad={enEdicion} onGuardar={guardar} onCerrar={() => setAbierto(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

function NovedadForm({ novedad, onGuardar, onCerrar }) {
  const editando = Boolean(novedad);
  const [datos, setDatos] = useState(novedad ? { ...vacio, ...novedad } : vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!datos.titulo.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    setGuardando(true);
    try {
      await onGuardar({
        titulo: datos.titulo.trim(),
        contenido: datos.contenido.trim(),
        categoria: datos.categoria,
        emoji: datos.emoji,
        destacada: datos.destacada,
        fecha: datos.fecha,
      });
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-nodo-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <motion.form
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={enviar}
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-nodo-border px-5 py-4">
          <h3 className="font-extrabold text-nodo-navy">
            {editando ? 'Editar novedad' : 'Nueva novedad'}
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <label className="block text-xs font-bold text-slate-500">
            Título
            <input
              value={datos.titulo}
              onChange={(e) => setDatos((d) => ({ ...d, titulo: e.target.value }))}
              className="mt-1 w-full rounded-xl border-0 bg-nodo-surface px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
              required
            />
          </label>

          <label className="block text-xs font-bold text-slate-500">
            Contenido
            <textarea
              value={datos.contenido}
              onChange={(e) => setDatos((d) => ({ ...d, contenido: e.target.value }))}
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border-0 bg-nodo-surface px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-500">
              Categoría
              <select
                value={datos.categoria}
                onChange={(e) => setDatos((d) => ({ ...d, categoria: e.target.value }))}
                className="mt-1 w-full rounded-xl border-0 bg-nodo-surface px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-500">
              Fecha
              <input
                type="date"
                value={datos.fecha}
                onChange={(e) => setDatos((d) => ({ ...d, fecha: e.target.value }))}
                className="mt-1 w-full rounded-xl border-0 bg-nodo-surface px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
              />
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold text-slate-500">Emoji</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setDatos((d) => ({ ...d, emoji: em }))}
                  className={`rounded-lg px-2 py-1 text-lg transition ${
                    datos.emoji === em ? 'bg-nodo-navy' : 'bg-nodo-surface hover:bg-slate-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={datos.destacada}
              onChange={(e) => setDatos((d) => ({ ...d, destacada: e.target.checked }))}
              className="h-4 w-4 rounded border-nodo-border text-nodo-teal focus:ring-nodo-cyan"
            />
            Destacar en el portal del socio
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-nodo-red">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-nodo-border p-4">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-nodo-navy px-4 py-3 text-sm font-extrabold text-white transition hover:bg-nodo-navy-2 disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editando ? (
              'Guardar cambios'
            ) : (
              'Publicar'
            )}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
