import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, UserRound, CheckCircle2, PlusCircle, XCircle, Sparkles } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { formatARS, nombreDias, duracionLabel } from '../data/mockData';
import SpaceIcon from './SpaceIcon';

const categorias = ['Todos', 'Deportivo', 'Cultural', 'Recreativo'];

export default function ActivitiesPanel() {
  const actividades = useNodoStore((s) => s.actividades);
  const inscripciones = useNodoStore((s) => s.inscripciones);
  const addInscripcion = useNodoStore((s) => s.addInscripcion);
  const cancelInscripcion = useNodoStore((s) => s.cancelInscripcion);
  const socio = useNodoStore((s) => s.members.find((m) => m.id === s.socioActualId));
  const addToast = useNodoStore((s) => s.addToast);

  const [filtro, setFiltro] = useState('Todos');

  const activas = actividades.filter((a) => a.activa);
  const visibles = activas.filter((a) => filtro === 'Todos' || a.categoria === filtro);

  const inscriptosDe = (actividadId) =>
    inscripciones.filter((i) => i.actividadId === actividadId && i.estado === 'activa');
  const esInscripto = (actividadId) =>
    inscripciones.some(
      (i) => i.actividadId === actividadId && i.socioId === socio?.id && i.estado === 'activa'
    );

  const misInscripciones = inscripciones.filter(
    (i) => i.socioId === socio?.id && i.estado === 'activa'
  );

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-ink">
              Talleres y actividades
            </h2>
            <p className="text-xs text-ink-soft">
              Inscribite desde la app y asegurá tu lugar en la cursada.
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink-soft ring-1 ring-inset ring-line sm:inline-flex">
            <Sparkles size={13} /> Cupos en tiempo real
          </span>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filtro === c
                  ? 'bg-lav-deep text-white shadow-card'
                  : 'bg-white text-ink-soft ring-1 ring-inset ring-line hover:bg-paper'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {visibles.map((act, i) => {
              const cant = inscriptosDe(act.id).length;
              const pct = act.cupoMaximo ? Math.round((cant / act.cupoMaximo) * 100) : 0;
              const llena = cant >= act.cupoMaximo;
              const inscripto = esInscripto(act.id);
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`flex flex-col rounded-2xl bg-white p-4 shadow-card ring-1 transition ${
                    inscripto ? 'ring-2 ring-nodo-green' : 'ring-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-card"
                        style={{ background: act.color }}
                      >
                        <SpaceIcon icono={act.icono} className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold leading-tight text-ink">{act.nombre}</h3>
                        <p className="text-[11px] font-bold text-ink-faint">
                          {act.categoria} · {act.instructor}
                        </p>
                      </div>
                    </div>
                    {inscripto && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-1 text-[10px] font-extrabold text-ok ring-1 ring-inset ring-emerald-200">
                        <CheckCircle2 size={11} /> Inscripto
                      </span>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{act.descripcion}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-ink-soft">
                    <p className="flex items-center gap-1.5">
                      <Clock size={13} className="text-lav" />
                      {nombreDias(act.dias)} · {act.inicio} hs · {duracionLabel(act.duracion)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <UserRound size={13} className="text-lav" /> {act.instructor}
                      <span className="ml-auto font-extrabold text-lav">
                        {formatARS(act.costoMensual)}
                        <span className="font-medium text-ink-faint"> /mes</span>
                      </span>
                    </p>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-ink-soft">Cupo</span>
                      <span className={llena ? 'text-crit' : 'text-lav'}>
                        {cant} / {act.cupoMaximo}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
                      <div
                        className={`h-full rounded-full transition-all ${llena ? 'bg-nodo-red' : 'bg-nodo-green'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (inscripto) {
                        const insc = inscripciones.find(
                          (i) =>
                            i.actividadId === act.id &&
                            i.socioId === socio?.id &&
                            i.estado === 'activa'
                        );
                        cancelInscripcion(insc.id);
                        addToast('Te desinscribiste de la actividad.', 'info');
                      } else if (llena) {
                        addToast(
                          'Cupo completo. Consultá en recepción por la lista de espera.',
                          'info'
                        );
                      } else {
                        addInscripcion({
                          actividadId: act.id,
                          socioId: socio.id,
                          socioNombre: `${socio.nombre} ${socio.apellido}`,
                        });
                        addToast(`Inscripción confirmada en ${act.nombre}.`, 'success');
                      }
                    }}
                    className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                      inscripto
                        ? 'bg-crit-soft text-crit ring-1 ring-inset ring-red-200 hover:bg-red-100'
                        : llena
                          ? 'cursor-not-allowed bg-sand text-ink-faint'
                          : 'bg-nodo-green text-white shadow-card hover:bg-nodo-green-dark'
                    }`}
                  >
                    {inscripto ? (
                      <>
                        <XCircle size={16} /> Desinscribirme
                      </>
                    ) : llena ? (
                      <>
                        <Users size={16} /> Cupo lleno
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} /> Inscribirme
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-extrabold text-ink">
          <CheckCircle2 size={18} className="text-ok" /> Mis inscripciones
        </h3>
        {misInscripciones.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-center text-sm text-ink-faint">
            Todavía no te inscribiste en ninguna actividad.
          </div>
        ) : (
          <div className="space-y-2">
            {misInscripciones.map((ins) => {
              const act = actividades.find((a) => a.id === ins.actividadId);
              if (!act) return null;
              return (
                <div
                  key={ins.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-line"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                    style={{ background: act.color }}
                  >
                    <SpaceIcon icono={act.icono} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">{act.nombre}</p>
                    <p className="text-[11px] text-ink-soft">
                      {nombreDias(act.dias)} · {act.inicio} hs · {act.instructor}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      cancelInscripcion(ins.id);
                      addToast(`Te desinscribiste de ${act.nombre}.`, 'info');
                    }}
                    className="rounded-xl bg-crit-soft px-3 py-2 text-xs font-bold text-crit ring-1 ring-inset ring-red-200 transition hover:bg-red-100"
                  >
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
