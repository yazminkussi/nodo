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
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-bold text-nodo-teal ring-1 ring-inset ring-cyan-200 transition hover:bg-nodo-cyan hover:text-white"
        >
          <Plus size={13} /> Agregar fila
        </button>
        <button
          type="button"
          onClick={agregarColumna}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-bold text-nodo-teal ring-1 ring-inset ring-cyan-200 transition hover:bg-nodo-cyan hover:text-white"
        >
          <Plus size={13} /> Agregar columna
        </button>
        <button
          type="button"
          onClick={quitarFila}
          disabled={filas.length <= 1}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-nodo-border transition hover:bg-red-50 hover:text-nodo-red disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={13} /> Quitar última fila
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-xl ring-1 ring-nodo-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-nodo-surface">
              <th className="sticky left-0 z-10 w-10 border-b border-r border-nodo-border bg-white px-2 py-2 text-center text-[10px] font-bold text-slate-400">
                #
              </th>
              {columnas.map((col, i) => (
                <th
                  key={i}
                  className="min-w-[130px] border-b border-r border-nodo-border p-0 last:border-r-0"
                >
                  <input
                    value={col}
                    onChange={(e) => setColumna(i, e.target.value)}
                    aria-label={`Columna ${i + 1}`}
                    className="w-full bg-transparent px-3 py-2 text-xs font-extrabold text-nodo-navy focus:bg-cyan-50 focus:outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((row, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 border-b border-r border-nodo-border bg-white px-2 py-1.5 text-center text-[10px] font-bold text-slate-400">
                  {r + 1}
                </td>
                {columnas.map((_, c) => (
                  <td key={c} className="border-b border-r border-nodo-border p-0 last:border-r-0">
                    <input
                      value={row[c] ?? ''}
                      onChange={(e) => setCelda(r, c, e.target.value)}
                      aria-label={`Fila ${r + 1}, columna ${c + 1}`}
                      className="w-full bg-white px-3 py-1.5 text-xs text-slate-600 focus:bg-cyan-50 focus:outline-none"
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
