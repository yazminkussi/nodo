import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Pin, Loader2, AlertCircle, Newspaper } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { useNovedades } from '../hooks/useNovedades';
import { formatFechaCorta } from '../data/mockData';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Field from './ui/Field';
import SectionTitle from './ui/SectionTitle';
import EmptyState from './ui/EmptyState';

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
        <EmptyState icon={Newspaper} title="Gestión de novedades">
          Se habilita con la cuenta conectada a Supabase.
        </EmptyState>
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
      <SectionTitle
        title="Novedades"
        subtitle={`${novedades.length} publicada${novedades.length === 1 ? '' : 's'} · las ve el socio en su portal`}
        action={
          <Button
            variant="lav"
            onClick={() => {
              setEnEdicion(null);
              setAbierto(true);
            }}
          >
            <Plus size={16} /> Nueva novedad
          </Button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-crit-soft px-4 py-3 text-sm font-semibold text-[#9c372f]">
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
            className="flex items-start gap-3 rounded-2xl border border-line bg-cloud p-4 shadow-card"
          >
            <span className="text-2xl">{n.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {n.destacada && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sun-soft px-2 py-0.5 text-[10px] font-extrabold text-[#97621b]">
                    <Pin size={10} /> DESTACADA
                  </span>
                )}
                <span className="rounded-md bg-sand px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                  {n.categoria}
                </span>
                <span className="text-[11px] font-semibold text-ink-faint">
                  {formatFechaCorta(String(n.fecha))}
                </span>
              </div>
              <h3 className="mt-1 truncate font-display font-bold text-ink">{n.titulo}</h3>
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
          <EmptyState icon={Newspaper} title="Todavía no publicaste ninguna novedad" />
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

  const inputCls =
    'mt-1 w-full rounded-xl border border-line bg-cloud px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lav';

  return (
    <Modal
      title={editando ? 'Editar novedad' : 'Nueva novedad'}
      onClose={onCerrar}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="novedad-form"
            variant="lav"
            loading={guardando}
            className="flex-[2]"
          >
            {!guardando && (editando ? 'Guardar cambios' : 'Publicar')}
          </Button>
        </>
      }
    >
      <form
        id="novedad-form"
        onSubmit={enviar}
        className="max-h-[65vh] space-y-3 overflow-y-auto p-5"
      >
        <Field
          label="Título"
          value={datos.titulo}
          onChange={(e) => setDatos((d) => ({ ...d, titulo: e.target.value }))}
          required
        />

        <label className="block text-xs font-bold text-ink-soft">
          Contenido
          <textarea
            value={datos.contenido}
            onChange={(e) => setDatos((d) => ({ ...d, contenido: e.target.value }))}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-bold text-ink-soft">
            Categoría
            <select
              value={datos.categoria}
              onChange={(e) => setDatos((d) => ({ ...d, categoria: e.target.value }))}
              className={inputCls}
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
              className={inputCls}
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
                  datos.emoji === em ? 'bg-lav-soft ring-2 ring-lav' : 'bg-paper hover:bg-sand'
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
            className="h-4 w-4 rounded border-line text-lav focus:ring-lav"
          />
          Destacar en el portal del socio
        </label>

        {error && (
          <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
