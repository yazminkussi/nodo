import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Clock, CalendarDays, Power, X } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { useReservasData } from '../hooks/useReservasData';
import {
  ROLES_ADMIN,
  formatARS,
  nombreDias,
  duracionLabel,
  HORARIO_DEFECTO,
} from '../data/mockData';
import SpaceIcon, { ICONOS_ESPACIO } from './SpaceIcon';

const categorias = ['Deportivo', 'Cultural', 'Recreativo'];
const colores = [
  '#5E52C4',
  '#32328E',
  '#2E8B5E',
  '#4B8FB0',
  '#E8A33D',
  '#C56A46',
  '#7C74D6',
  '#C0453B',
];

const campo =
  'w-full rounded-xl border border-line bg-cloud px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lav';
const etiqueta = 'mb-1 block text-xs font-bold text-ink-soft';

export default function SpaceManager() {
  const { espacios, addEspacio, updateEspacio, removeEspacio } = useReservasData();
  const addToast = useNodoStore((s) => s.addToast);
  const adminRole = useNodoStore((s) => s.adminRole);

  const categoriasPermitidas = ROLES_ADMIN[adminRole]?.categorias;
  const visibles = categoriasPermitidas
    ? espacios.filter((e) => categoriasPermitidas.includes(e.categoria))
    : espacios;

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);

  const abrirNuevo = () => {
    setForm({
      nombre: '',
      descripcion: '',
      categoria: categoriasPermitidas?.[0] || 'Deportivo',
      capacidad: 10,
      precioHora: 5000,
      icono: 'futbol',
      color: colores[0],
      disponible: true,
      horario: { ...HORARIO_DEFECTO },
    });
    setModal('nuevo');
  };

  const abrirEditar = (esp) => {
    setForm({ ...esp, horario: { ...esp.horario } });
    setModal(esp.id);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      addToast('El nombre del espacio es obligatorio.', 'error');
      return;
    }
    try {
      if (modal === 'nuevo') {
        await addEspacio(form);
        addToast(`Espacio ${form.nombre} creado.`, 'success');
      } else {
        await updateEspacio(modal, form);
        addToast(`Espacio ${form.nombre} actualizado.`, 'success');
      }
      setModal(null);
    } catch {
      addToast('No se pudo guardar el espacio.', 'error');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-ink">Espacios e instalaciones</h3>
          <p className="text-xs text-ink-soft">
            Alta, edición y disponibilidad de espacios para reservas.
            {categoriasPermitidas && (
              <span className="ml-1 font-bold text-lav">
                Solo {categoriasPermitidas.join(' y ')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 rounded-xl bg-lav-deep px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-lav"
        >
          <Plus size={16} /> Nuevo espacio
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {visibles.map((esp, i) => (
            <motion.div
              key={esp.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="flex flex-col rounded-2xl bg-white p-4 shadow-card ring-1 ring-line"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-card"
                    style={{ background: esp.color }}
                  >
                    <SpaceIcon icono={esp.icono} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold leading-tight text-ink">{esp.nombre}</p>
                    <p className="text-[11px] font-bold text-ink-faint">{esp.categoria}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    updateEspacio(esp.id, { disponible: !esp.disponible });
                    addToast(
                      esp.disponible
                        ? `${esp.nombre} deshabilitado para reservas.`
                        : `${esp.nombre} disponible para reservas.`,
                      'info'
                    );
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-inset transition ${
                    esp.disponible
                      ? 'bg-ok-soft text-ok ring-emerald-200'
                      : 'bg-sand text-ink-faint ring-line'
                  }`}
                  title="Alternar disponibilidad"
                >
                  <Power size={11} /> {esp.disponible ? 'Disponible' : 'Pausado'}
                </button>
              </div>

              <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{esp.descripcion}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <Users size={13} className="text-lav" /> {esp.capacidad} personas
                </span>
                <span className="font-extrabold text-lav">
                  {formatARS(esp.precioHora)}
                  <span className="font-medium text-ink-faint"> / h</span>
                </span>
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <Clock size={13} className="text-lav" /> {esp.horario.apertura}–
                  {esp.horario.cierre}
                </span>
                <span className="text-ink-soft">
                  Turnos de {duracionLabel(esp.horario.duracionTurno)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-ink-faint">
                <CalendarDays size={12} /> {nombreDias(esp.horario.dias)}
              </p>

              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <button
                  onClick={() => abrirEditar(esp)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-paper px-3 py-2 text-xs font-bold text-ink ring-1 ring-inset ring-line transition hover:bg-lav-soft"
                >
                  <Pencil size={13} /> Editar
                </button>
                <button
                  onClick={() => {
                    removeEspacio(esp.id);
                    addToast(`Espacio ${esp.nombre} eliminado.`, 'info');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-crit-soft px-3 py-2 text-xs font-bold text-crit ring-1 ring-inset ring-crit/20 transition hover:brightness-95"
                >
                  <Trash2 size={13} /> Quitar
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modal && form && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-nodo-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setModal(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift sm:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-extrabold text-ink">
                  {modal === 'nuevo' ? 'Nuevo espacio' : `Editar · ${form.nombre}`}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="rounded-full p-2 text-ink-faint hover:bg-sand"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <label className={etiqueta}>Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={`mb-3 ${campo}`}
                placeholder="Ej. Cancha de Básquet"
              />

              <label className={etiqueta}>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className={`mb-3 ${campo}`}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={etiqueta}>Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className={campo}
                  >
                    {categorias.map((c) => (
                      <option
                        key={c}
                        value={c}
                        disabled={categoriasPermitidas?.length && !categoriasPermitidas.includes(c)}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={etiqueta}>Capacidad</label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacidad}
                    onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })}
                    className={campo}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Precio por hora ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.precioHora}
                    onChange={(e) => setForm({ ...form, precioHora: Number(e.target.value) })}
                    className={campo}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Duración de turno (hs)</label>
                  <select
                    value={form.horario.duracionTurno}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        horario: { ...form.horario, duracionTurno: Number(e.target.value) },
                      })
                    }
                    className={campo}
                  >
                    <option value={1}>1 hora</option>
                    <option value={1.5}>1 h 30</option>
                    <option value={2}>2 horas</option>
                    <option value={3}>3 horas</option>
                  </select>
                </div>
              </div>

              <label className={`${etiqueta} mt-3`}>Ícono</label>
              <div className="mb-3 flex flex-wrap gap-2">
                {ICONOS_ESPACIO.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icono: ic })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      form.icono === ic
                        ? 'bg-lav-deep text-white shadow-card'
                        : 'bg-paper text-ink-soft ring-1 ring-inset ring-line hover:bg-lav-soft'
                    }`}
                    title={ic}
                  >
                    <SpaceIcon icono={ic} className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <label className={etiqueta}>Color de marca</label>
              <div className="mb-3 flex gap-2">
                {colores.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-nodo-navy ring-offset-2' : ''}`}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>

              <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                  className="h-4 w-4 rounded accent-nodo-cyan"
                />
                Habilitado para reservas
              </label>

              <button
                onClick={guardar}
                className="w-full rounded-xl bg-lav-deep px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-lav"
              >
                {modal === 'nuevo' ? 'Crear espacio' : 'Guardar cambios'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
