import { Lock, ArrowRight } from 'lucide-react';
import { planMinimoPara, irAPlanes } from '../../hooks/usePlan';

/* Pantalla de una función que el plan actual del club no incluye. */
export default function PlanBloqueado({ funcion, titulo, descripcion }) {
  const minimo = planMinimoPara(funcion);
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6">
      <div className="rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-line sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lav-soft text-lav-deep">
          <Lock size={22} />
        </span>
        <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink">{titulo}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{descripcion}</p>
        <p className="mt-3 text-xs font-bold text-lav-deep">Incluido desde el {minimo.nombre}</p>
        <button
          onClick={irAPlanes}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-lav-deep px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-lav"
        >
          Ver planes <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
