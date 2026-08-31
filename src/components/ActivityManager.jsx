import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Clock, UserRound, X, ChevronDown, Power } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { ROLES_ADMIN, formatARS, nombreDias, duracionLabel } from '../data/mockData';
import SpaceIcon, { ICONOS_ESPACIO } from './SpaceIcon';
import DiasActivosPicker from './DiasActivosPicker';

const categorias = ['Deportivo', 'Cultural', 'Recreativo'];
const colores = [
  '#EF4444',
  '#059669',
  '#7C3AED',
  '#1E293B',
  '#EC4899',
  '#06B6D4',
  '#0EA5E9',
  '#F97316',
];

const campo =
  'w-full rounded-xl bg-white px-3 py-2.5 text-sm text-ink ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-nodo-cyan';
const etiqueta = 'mb-1 block text-xs font-bold text-ink-soft';

export default function ActivityManager() {
  const actividades = useNodoStore((s) => s.actividades);
  const espacios = useNodoStore((s) => s.espacios);
  const addActividad = useNodoStore((s) => s.addActividad);
  const updateActividad = useNodoStore((s) => s.updateActividad);
  const removeActividad = useNodoStore((s) => s.removeActividad);
  const inscripciones = useNodoStore((s) => s.inscripciones);
  const cancelInscripcion = useNodoStore((s) => s.cancelInscripcion);
  const addToast = useNodoStore((s) => s.addToast);
  const adminRole = useNodoStore((s) => s.adminRole);

  const categoriasPermitidas = ROLES_ADMIN[adminRole]?.categorias;
  const visibles = categoriasPermitidas
    ? actividades.filter((a) => categoriasPermitidas.includes(a.categoria))
    : actividades;

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [abierta, setAbierta] = useState(null);

  const inscriptos = (actividadId) =>
    inscripciones.filter((i) => i.actividadId === actividadId && i.estado === 'activa');

  const abrirNuevo = () => {
    setForm({
      nombre: '',
      descripcion: '',
      categoria: categoriasPermitidas?.[0] || 'Cultural',
      instructor: '',
      cupoMaximo: 15,
      dias: [2, 4],
      inicio: '18:00',
      duracion: 1.5,
      costoMensual: 4000,
      icono: 'yoga',
      color: colores[0],
      espacioId: '',
      activa: true,
    });
    setModal('nuevo');
  };

  const abrirEditar = (act) => {
    setForm({ ...act, espacioId: act.espacioId ?? '' });
    setModal(act.id);
  };

  const guardar = () => {
    if (!form.nombre.trim() || !form.instructor.trim()) {
      addToast('Completá nombre e instructor.', 'error');
      return;
    }
    const payload = {
      ...form,
      nombre: form.nombre.trim(),
      instructor: form.instructor.trim(),
      espacioId: form.espacioId || undefined,
    };
    if (modal === 'nuevo') {
      addActividad(payload);
      addToast(`Actividad ${payload.nombre} creada.`, 'success');
    } else {
      updateActividad(modal, payload);
      addToast(`Actividad ${payload.nombre} actualizada.`, 'success');
    }
    setModal(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-ink">Actividades y talleres</h3>
          <p className="text-xs text-ink-soft">
            Alta, edición y cupos de actividades con inscripción de socios.
            {categoriasPermitidas && (
              <span className="ml-1 font-bold text-lav">
                Solo {categoriasPermitidas.join(' y ')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 rounded-xl bg-nodo-green px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-nodo-green-dark"
        >
          <Plus size={16} /> Nueva actividad
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {visibles.map((act, i) => {
            const cant = inscriptos(act.id).length;
            const pct = act.cupoMaximo ? Math.round((cant / act.cupoMaximo) * 100) : 0;
            const llena = cant >= act.cupoMaximo;
            return (
              <motion.div
                key={act.id}
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
                      style={{ background: act.color }}
                    >
                      <SpaceIcon icono={act.icono} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-extrabold leading-tight text-ink">{act.nombre}</p>
                      <p className="text-[11px] font-bold text-ink-faint">
                        {act.categoria} · {act.instructor}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateActividad(act.id, { activa: !act.activa });
                      addToast(
                        act.activa ? `${act.nombre} pausada.` : `${act.nombre} reactivada.`,
                        'info'
                      );
                    }}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ring-1 ring-inset transition ${
                      act.activa
                        ? 'bg-ok-soft text-ok ring-emerald-200'
                        : 'bg-sand text-ink-faint ring-line'
                    }`}
                    title="Alternar actividad"
                  >
                    <Power size={11} /> {act.activa ? 'Activa' : 'Pausada'}
                  </button>
                </div>

                <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{act.descripcion}</p>

                <div className="mt-3 space-y-1.5 text-xs text-ink-soft">
                  <p className="flex items-center gap-1.5">
                    <Clock size={13} className="text-lav" />
                    {nombreDias(act.dias)} · {act.inicio} hs · {duracionLabel(act.duracion)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users size={13} className="text-lav" />
                    {cant} / {act.cupoMaximo} inscriptos
                    <span className="font-extrabold text-lav">
                      · {formatARS(act.costoMensual)}/mes
                    </span>
                  </p>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                  <div
                    className={`h-full rounded-full transition-all ${llena ? 'bg-nodo-red' : 'bg-nodo-green'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <button
                    onClick={() => setAbierta(abierta === act.id ? null : act.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-paper px-2 py-2 text-xs font-bold text-ink ring-1 ring-inset ring-line transition hover:bg-lav-soft"
                  >
                    <UserRound size={13} /> Socios
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${abierta === act.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => abrirEditar(act)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-paper px-2.5 py-2 text-xs font-bold text-ink ring-1 ring-inset ring-line transition hover:bg-lav-soft"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      removeActividad(act.id);
                      addToast(`Actividad ${act.nombre} eliminada.`, 'info');
                    }}
                    className="flex items-center justify-center rounded-xl bg-crit-soft px-2.5 py-2 text-xs font-bold text-crit ring-1 ring-inset ring-red-200 transition hover:bg-red-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <AnimatePresence>
                  {abierta === act.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-3 space-y-1.5 rounded-xl bg-paper p-3 ring-1 ring-inset ring-line">
                        {inscriptos(act.id).length === 0 && (
                          <li className="text-xs text-ink-faint">Sin inscriptos todavía.</li>
                        )}
                        {inscriptos(act.id).map((ins) => (
                          <li
                            key={ins.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-semibold text-ink-soft">{ins.socioNombre}</span>
                            <button
                              onClick={() => {
                                cancelInscripcion(ins.id);
                                addToast(`Inscripción de ${ins.socioNombre} cancelada.`, 'info');
                              }}
                              className="rounded-lg bg-crit-soft px-2 py-1 font-bold text-crit ring-1 ring-inset ring-red-200 hover:bg-red-100"
                            >
                              Quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
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
                  {modal === 'nuevo' ? 'Nueva actividad' : `Editar · ${form.nombre}`}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="rounded-full p-2 text-ink-faint hover:bg-sand"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={etiqueta}>Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className={campo}
                    placeholder="Ej. Folclore y Danzas"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={etiqueta}>Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={2}
                    className={campo}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Instructor / docente</label>
                  <input
                    value={form.instructor}
                    onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                    className={campo}
                  />
                </div>
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
                  <label className={etiqueta}>Cupo máximo</label>
                  <input
                    type="number"
                    min="1"
                    value={form.cupoMaximo}
                    onChange={(e) => setForm({ ...form, cupoMaximo: Number(e.target.value) })}
                    className={campo}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Costo mensual ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.costoMensual}
                    onChange={(e) => setForm({ ...form, costoMensual: Number(e.target.value) })}
                    className={campo}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Hora de inicio</label>
                  <input
                    type="time"
                    value={form.inicio}
                    onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                    className={campo}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Duración (hs)</label>
                  <select
                    value={form.duracion}
                    onChange={(e) => setForm({ ...form, duracion: Number(e.target.value) })}
                    className={campo}
                  >
                    <option value={1}>1 hora</option>
                    <option value={1.5}>1 h 30</option>
                    <option value={2}>2 horas</option>
                    <option value={3}>3 horas</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={etiqueta}>Días de cursada</label>
                  <DiasActivosPicker
                    dias={form.dias}
                    onChange={(dias) => setForm({ ...form, dias })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={etiqueta}>Espacio donde se dicta (opcional)</label>
                  <select
                    value={form.espacioId ?? ''}
                    onChange={(e) => setForm({ ...form, espacioId: e.target.value })}
                    className={campo}
                  >
                    <option value="">Sin espacio asignado</option>
                    {espacios.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
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
              <div className="mb-4 flex gap-2">
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

              <button
                onClick={guardar}
                className="w-full rounded-xl bg-nodo-green px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-green-dark"
              >
                {modal === 'nuevo' ? 'Crear actividad' : 'Guardar cambios'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
