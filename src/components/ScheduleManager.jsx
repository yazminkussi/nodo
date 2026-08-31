import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Save, Building2, Sparkles, ListChecks } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { ROLES_ADMIN, nombreDias, slotsDeHorario, duracionLabel } from '../data/mockData';
import SpaceIcon from './SpaceIcon';
import DiasActivosPicker from './DiasActivosPicker';

const campo =
  'w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan';
const etiqueta = 'mb-1 block text-xs font-bold text-slate-500';

export default function ScheduleManager() {
  const espacios = useNodoStore((s) => s.espacios);
  const actividades = useNodoStore((s) => s.actividades);
  const updateEspacio = useNodoStore((s) => s.updateEspacio);
  const updateActividad = useNodoStore((s) => s.updateActividad);
  const addToast = useNodoStore((s) => s.addToast);
  const adminRole = useNodoStore((s) => s.adminRole);

  const categoriasPermitidas = ROLES_ADMIN[adminRole]?.categorias;
  const espaciosVisibles = categoriasPermitidas
    ? espacios.filter((e) => categoriasPermitidas.includes(e.categoria))
    : espacios;
  const actividadesVisibles = categoriasPermitidas
    ? actividades.filter((a) => categoriasPermitidas.includes(a.categoria))
    : actividades;

  const [tipo, setTipo] = useState('espacios');
  const [selEspacio, setSelEspacio] = useState(espaciosVisibles[0]?.id ?? null);
  const [selActividad, setSelActividad] = useState(actividadesVisibles[0]?.id ?? null);

  const espacio = espacios.find((e) => e.id === selEspacio);
  const actividad = actividades.find((a) => a.id === selActividad);

  const [draft, setDraft] = useState(null);
  useEffect(() => {
    if (tipo === 'espacios' && espacio) setDraft({ ...espacio.horario });
    if (tipo === 'actividades' && actividad)
      setDraft({
        dias: [...actividad.dias],
        inicio: actividad.inicio,
        duracion: actividad.duracion,
      });
  }, [tipo, espacio, actividad]);

  const slotsPreview = useMemo(
    () => (tipo === 'espacios' && draft?.apertura && draft?.cierre ? slotsDeHorario(draft) : []),
    [draft, tipo]
  );

  const guardar = () => {
    if (!draft) return;
    if (tipo === 'espacios' && espacio) {
      updateEspacio(espacio.id, { horario: draft });
      addToast(`Horarios de ${espacio.nombre} actualizados.`, 'success');
    }
    if (tipo === 'actividades' && actividad) {
      updateActividad(actividad.id, {
        dias: draft.dias,
        inicio: draft.inicio,
        duracion: draft.duracion,
      });
      addToast(`Horarios de ${actividad.nombre} actualizados.`, 'success');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-nodo-navy">Horarios y turnos</h3>
          <p className="text-xs text-slate-500">
            Configurá días de apertura, franja horaria y duración de turnos por espacio o actividad.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTipo('espacios');
              setSelEspacio(espaciosVisibles[0]?.id ?? null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              tipo === 'espacios'
                ? 'bg-nodo-navy text-white shadow-card'
                : 'bg-white text-slate-500 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
            }`}
          >
            <Building2 size={14} /> Espacios
          </button>
          <button
            onClick={() => {
              setTipo('actividades');
              setSelActividad(actividadesVisibles[0]?.id ?? null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              tipo === 'actividades'
                ? 'bg-nodo-navy text-white shadow-card'
                : 'bg-white text-slate-500 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
            }`}
          >
            <Sparkles size={14} /> Actividades
          </button>
        </div>
      </div>

      {tipo === 'espacios' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Seleccionar espacio
            </p>
            <div className="space-y-2">
              {espaciosVisibles.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelEspacio(e.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl p-3 text-left transition ${
                    selEspacio === e.id
                      ? 'bg-nodo-navy text-white shadow-card'
                      : 'bg-white text-slate-600 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: e.color }}
                  >
                    <SpaceIcon icono={e.icono} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">{e.nombre}</span>
                    <span
                      className={`block text-[11px] font-semibold ${selEspacio === e.id ? 'text-slate-300' : 'text-slate-400'}`}
                    >
                      {nombreDias(e.horario.dias)} · {e.horario.apertura}–{e.horario.cierre}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-nodo-border lg:col-span-3">
            {espacio && draft && (
              <>
                <div className="mb-4 flex items-center gap-2.5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: espacio.color }}
                  >
                    <SpaceIcon icono={espacio.icono} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-nodo-navy">{espacio.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {espacio.categoria} · Turnos de {duracionLabel(espacio.horario.duracionTurno)}
                    </p>
                  </div>
                </div>

                <label className={etiqueta}>Días de apertura</label>
                <DiasActivosPicker
                  dias={draft.dias}
                  onChange={(dias) => setDraft({ ...draft, dias })}
                />

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={etiqueta}>Apertura</label>
                    <input
                      type="time"
                      value={draft.apertura}
                      onChange={(e) => setDraft({ ...draft, apertura: e.target.value })}
                      className={campo}
                    />
                  </div>
                  <div>
                    <label className={etiqueta}>Cierre</label>
                    <input
                      type="time"
                      value={draft.cierre}
                      onChange={(e) => setDraft({ ...draft, cierre: e.target.value })}
                      className={campo}
                    />
                  </div>
                  <div>
                    <label className={etiqueta}>Duración de turno</label>
                    <select
                      value={draft.duracionTurno}
                      onChange={(e) =>
                        setDraft({ ...draft, duracionTurno: Number(e.target.value) })
                      }
                      className={campo}
                    >
                      <option value={0.5}>30 minutos</option>
                      <option value={1}>1 hora</option>
                      <option value={1.5}>1 h 30</option>
                      <option value={2}>2 horas</option>
                      <option value={3}>3 horas</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-nodo-surface p-4 ring-1 ring-inset ring-nodo-border">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <ListChecks size={12} /> Turnos disponibles generados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {slotsPreview.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-nodo-teal ring-1 ring-inset ring-cyan-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {slotsPreview.length} turnos por día · {nombreDias(draft.dias)}
                  </p>
                </div>

                <button
                  onClick={guardar}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-nodo-navy px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-navy-2"
                >
                  <Save size={16} /> Guardar horarios del espacio
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {tipo === 'actividades' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Seleccionar actividad
            </p>
            <div className="space-y-2">
              {actividadesVisibles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelActividad(a.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl p-3 text-left transition ${
                    selActividad === a.id
                      ? 'bg-nodo-navy text-white shadow-card'
                      : 'bg-white text-slate-600 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: a.color }}
                  >
                    <SpaceIcon icono={a.icono} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">{a.nombre}</span>
                    <span
                      className={`block text-[11px] font-semibold ${selActividad === a.id ? 'text-slate-300' : 'text-slate-400'}`}
                    >
                      {nombreDias(a.dias)} · {a.inicio} hs
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-nodo-border lg:col-span-3">
            {actividad && draft && (
              <>
                <div className="mb-4 flex items-center gap-2.5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: actividad.color }}
                  >
                    <SpaceIcon icono={actividad.icono} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-nodo-navy">{actividad.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {actividad.instructor} · {actividad.categoria}
                    </p>
                  </div>
                </div>

                <label className={etiqueta}>Días de cursada</label>
                <DiasActivosPicker
                  dias={draft.dias}
                  onChange={(dias) => setDraft({ ...draft, dias })}
                />

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={etiqueta}>Hora de inicio</label>
                    <input
                      type="time"
                      value={draft.inicio}
                      onChange={(e) => setDraft({ ...draft, inicio: e.target.value })}
                      className={campo}
                    />
                  </div>
                  <div>
                    <label className={etiqueta}>Duración de la clase</label>
                    <select
                      value={draft.duracion}
                      onChange={(e) => setDraft({ ...draft, duracion: Number(e.target.value) })}
                      className={campo}
                    >
                      <option value={1}>1 hora</option>
                      <option value={1.5}>1 h 30</option>
                      <option value={2}>2 horas</option>
                      <option value={3}>3 horas</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-50 p-4 ring-1 ring-inset ring-cyan-200">
                  <CalendarDays size={18} className="shrink-0 text-nodo-teal" />
                  <p className="text-sm font-bold text-nodo-teal">
                    {nombreDias(draft.dias)} · {draft.inicio} hs · {duracionLabel(draft.duracion)}{' '}
                    por clase
                  </p>
                </div>

                <button
                  onClick={guardar}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-nodo-navy px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-navy-2"
                >
                  <Save size={16} /> Guardar horarios de la actividad
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
