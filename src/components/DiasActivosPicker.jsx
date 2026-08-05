import { DIAS_SEMANA } from '../data/mockData';

export default function DiasActivosPicker({ dias, onChange }) {
  const toggle = (n) =>
    onChange(dias.includes(n) ? dias.filter((d) => d !== n) : [...dias, n].sort((a, b) => a - b));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {DIAS_SEMANA.map((d) => {
          const activo = dias.includes(d.n);
          return (
            <button
              key={d.n}
              type="button"
              onClick={() => toggle(d.n)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                activo
                  ? 'bg-nodo-navy text-white shadow-card'
                  : 'bg-white text-slate-500 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
              }`}
              title={d.largo}
            >
              {d.corto}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-inset ring-nodo-border transition hover:bg-slate-200"
        >
          Todos los días
        </button>
        <button
          type="button"
          onClick={() => onChange([1, 2, 3, 4, 5])}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-inset ring-nodo-border transition hover:bg-slate-200"
        >
          Lunes a viernes
        </button>
        <button
          type="button"
          onClick={() => onChange([6, 0])}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-inset ring-nodo-border transition hover:bg-slate-200"
        >
          Fin de semana
        </button>
      </div>
    </div>
  );
}
