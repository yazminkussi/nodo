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
        <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-10 text-center text-sm text-ink-faint">
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
          <h2 className="text-lg font-extrabold tracking-tight text-ink">Novedades</h2>
          <p className="text-xs text-ink-soft">
            {novedades.length} publicada{novedades.length === 1 ? '' : 's'} · las ve el socio en su
            portal
          </p>
        </div>
        <button
          onClick={() => {
            setEnEdicion(null);
            setAbierto(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-lav-deep px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-lav-deep"
        >
          <Plus size={16} /> Nueva novedad
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-crit-soft px-4 py-3 text-sm font-semibold text-crit ring-1 ring-inset ring-red-200">
          <AlertCircle size={16} /> {error.message}
        </div>
      )}

      {cargando && novedades.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-ink-faint">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </p>
      )}

      <div className="space-y-3">
        {novedades.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line"
          >
            <span className="text-2xl">{n.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {n.destacada && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-crit-soft px-2 py-0.5 text-[10px] font-extrabold text-crit ring-1 ring-inset ring-red-200">
                    <Pin size={10} /> DESTACADA
                  </span>
                )}
                <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                  {n.categoria}
                </span>
                <span className="text-[11px] font-semibold text-ink-faint">
                  {formatFechaCorta(String(n.fecha))}
                </span>
              </div>
              <h3 className="mt-1 truncate font-extrabold text-ink">{n.titulo}</h3>
              <p className="line-clamp-2 text-sm text-ink-soft">{n.contenido}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => {
                  setEnEdicion(n);
                  setAbierto(true);
                }}
                className="rounded-lg p-2 text-lav transition hover:bg-lav-soft"
                title="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => borrar(n)}
                className="rounded-lg p-2 text-crit transition hover:bg-crit-soft"
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!cargando && novedades.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink-faint">
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
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-extrabold text-ink">
            {editando ? 'Editar novedad' : 'Nueva novedad'}
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-ink-faint transition hover:bg-sand"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <label className="block text-xs font-bold text-ink-soft">
            Título
            <input
              value={datos.titulo}
              onChange={(e) => setDatos((d) => ({ ...d, titulo: e.target.value }))}
              className="mt-1 w-full rounded-xl border-0 bg-paper px-3 py-2.5 text-sm text-ink ring-1 ring-inset ring-line focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
              required
            />
          </label>

          <label className="block text-xs font-bold text-ink-soft">
            Contenido
            <textarea
              value={datos.contenido}
              onChange={(e) => setDatos((d) => ({ ...d, contenido: e.target.value }))}
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border-0 bg-paper px-3 py-2.5 text-sm text-ink ring-1 ring-inset ring-line focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-ink-soft">
              Categoría
              <select
                value={datos.categoria}
                onChange={(e) => setDatos((d) => ({ ...d, categoria: e.target.value }))}
                className="mt-1 w-full rounded-xl border-0 bg-paper px-3 py-2.5 text-sm text-ink ring-1 ring-inset ring-line focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-ink-soft">
              Fecha
              <input
                type="date"
                value={datos.fecha}
                onChange={(e) => setDatos((d) => ({ ...d, fecha: e.target.value }))}
                className="mt-1 w-full rounded-xl border-0 bg-paper px-3 py-2.5 text-sm text-ink ring-1 ring-inset ring-line focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
              />
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-soft">Emoji</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setDatos((d) => ({ ...d, emoji: em }))}
                  className={`rounded-lg px-2 py-1 text-lg transition ${
                    datos.emoji === em ? 'bg-nodo-navy' : 'bg-paper hover:bg-slate-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={datos.destacada}
              onChange={(e) => setDatos((d) => ({ ...d, destacada: e.target.checked }))}
              className="h-4 w-4 rounded border-line text-lav focus:ring-nodo-cyan"
            />
            Destacar en el portal del socio
          </label>

          {error && (
            <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-line p-4">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl bg-sand px-4 py-3 text-sm font-bold text-ink-soft transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-lav-deep px-4 py-3 text-sm font-extrabold text-white transition hover:bg-lav-deep disabled:opacity-60"
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
