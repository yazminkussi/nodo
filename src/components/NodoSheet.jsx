import { Plus, Minus } from 'lucide-react';

export default function NodoSheet({ item, setItem }) {
  const contenido =
    item.contenido && item.contenido.columnas
      ? item.contenido
      : { columnas: ['Columna 1'], filas: [['']] };
  const { columnas, filas } = contenido;

  const actualizar = (nuevo) => setItem({ ...item, contenido: nuevo });

  const setColumna = (i, v) =>
    actualizar({ columnas: columnas.map((c, j) => (j === i ? v : c)), filas });
  const setCelda = (r, c, v) =>
    actualizar({
      columnas,
      filas: filas.map((row, ri) =>
        ri === r ? row.map((celda, ci) => (ci === c ? v : celda)) : row
      ),
    });
  const agregarFila = () => actualizar({ columnas, filas: [...filas, columnas.map(() => '')] });
  const agregarColumna = () =>
    actualizar({
      columnas: [...columnas, `Columna ${columnas.length + 1}`],
      filas: filas.map((row) => [...row, '']),
    });
  const quitarFila = () => actualizar({ columnas, filas: filas.slice(0, -1) });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={agregarFila}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lav-soft px-3 py-1.5 text-xs font-bold text-lav ring-1 ring-inset ring-lav/25 transition hover:bg-nodo-cyan hover:text-white"
        >
          <Plus size={13} /> Agregar fila
        </button>
        <button
          type="button"
          onClick={agregarColumna}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lav-soft px-3 py-1.5 text-xs font-bold text-lav ring-1 ring-inset ring-lav/25 transition hover:bg-nodo-cyan hover:text-white"
        >
          <Plus size={13} /> Agregar columna
        </button>
        <button
          type="button"
          onClick={quitarFila}
          disabled={filas.length <= 1}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sand px-3 py-1.5 text-xs font-bold text-ink-soft ring-1 ring-inset ring-line transition hover:bg-crit-soft hover:text-crit disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={13} /> Quitar última fila
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-xl ring-1 ring-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-paper">
              <th className="sticky left-0 z-10 w-10 border-b border-r border-line bg-white px-2 py-2 text-center text-[10px] font-bold text-ink-faint">
                #
              </th>
              {columnas.map((col, i) => (
                <th
                  key={i}
                  className="min-w-[130px] border-b border-r border-line p-0 last:border-r-0"
                >
                  <input
                    value={col}
                    onChange={(e) => setColumna(i, e.target.value)}
                    aria-label={`Columna ${i + 1}`}
                    className="w-full bg-transparent px-3 py-2 text-xs font-extrabold text-ink focus:bg-lav-soft focus:outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((row, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 border-b border-r border-line bg-white px-2 py-1.5 text-center text-[10px] font-bold text-ink-faint">
                  {r + 1}
                </td>
                {columnas.map((_, c) => (
                  <td key={c} className="border-b border-r border-line p-0 last:border-r-0">
                    <input
                      value={row[c] ?? ''}
                      onChange={(e) => setCelda(r, c, e.target.value)}
                      aria-label={`Fila ${r + 1}, columna ${c + 1}`}
                      className="w-full bg-white px-3 py-1.5 text-xs text-ink-soft focus:bg-lav-soft focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
