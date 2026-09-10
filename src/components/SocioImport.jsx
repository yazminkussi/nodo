import { useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Copy, Download } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { parsearCSV } from '../utils/csv';

const CATEGORIAS = ['Activo', 'Adherente', 'Juvenil', 'Honorario'];

const COLUMNAS = [
  ['numero', 'obligatorio · N° de socio, como figura en el club'],
  ['nombre', 'obligatorio'],
  ['apellido', 'obligatorio'],
  ['dni', 'sin puntos (sirve para que el socio vincule su cuenta)'],
  ['email', 'con este email el socio engancha su cuenta al registrarse'],
  ['celular', 'para los recordatorios por WhatsApp'],
  ['categoria', 'Activo · Adherente · Juvenil · Honorario (si falta, queda Activo)'],
  ['cuota', 'si / no  (al día o adeuda)'],
];

function descargarPlantilla() {
  const filas = [
    'numero,nombre,apellido,dni,email,celular,categoria,cuota',
    '0001,María,González,20111222,maria.gonzalez@email.com,1145551234,Activo,si',
    '0002,Juan,Pérez,25333444,juanperez@email.com,1156667788,Juvenil,no',
  ];
  const blob = new Blob(['﻿' + filas.join('\r\n') + '\r\n'], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-socios-nodo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Alias de encabezado → campo del socio.
const ALIAS = {
  numero: ['numero', 'nro', 'n', 'ndesocio', 'nrosocio', 'socio', 'legajo'],
  nombre: ['nombre', 'nombres'],
  apellido: ['apellido', 'apellidos'],
  dni: ['dni', 'documento', 'doc', 'nrodocumento'],
  email: ['email', 'mail', 'correo', 'correoelectronico'],
  celular: ['celular', 'cel', 'telefono', 'tel', 'whatsapp', 'movil'],
  categoria: ['categoria', 'tipo', 'tiposocio'],
  cuotaAlDia: ['cuota', 'aldia', 'estado', 'estadocuota', 'pago'],
};

function mapearColumnas(headers) {
  const mapa = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    for (const [campo, alias] of Object.entries(ALIAS)) {
      if (alias.includes(n) && mapa[campo] === undefined) mapa[campo] = i;
    }
  });
  return mapa;
}

const esVerdadero = (v) => ['si', 'sí', 'true', '1', 'aldia', 'x', 'ok'].includes(norm(v));
const esFalso = (v) => ['no', 'false', '0', 'adeuda', 'moroso', 'debe'].includes(norm(v));

export default function SocioImport({ onClose, onImportar, numerosExistentes }) {
  const [texto, setTexto] = useState('');
  const [vista, setVista] = useState('entrada'); // entrada | previa
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const analisis = useMemo(() => {
    if (!texto.trim()) return null;
    const { headers, filas } = parsearCSV(texto);
    if (headers.length === 0) return { error: 'No se pudo leer el archivo.' };
    const mapa = mapearColumnas(headers);
    if (mapa.numero === undefined && mapa.nombre === undefined) {
      return {
        error:
          'No se reconocieron las columnas. Necesito al menos "numero", "nombre" y "apellido".',
        headers,
      };
    }

    const vistos = new Set();
    const filasAnalizadas = filas.map((f, idx) => {
      const val = (campo) => (mapa[campo] !== undefined ? (f[mapa[campo]] || '').trim() : '');
      const numero = val('numero');
      const nombre = val('nombre');
      const apellido = val('apellido');
      const catRaw = val('categoria');
      const categoria = CATEGORIAS.find((c) => norm(c) === norm(catRaw)) || 'Activo';
      const cuotaRaw = val('cuotaAlDia');
      const cuotaAlDia = esFalso(cuotaRaw) ? false : esVerdadero(cuotaRaw) || cuotaRaw === '';

      const datos = {
        numero,
        nombre,
        apellido,
        dni: val('dni'),
        email: val('email'),
        celular: val('celular'),
        categoria,
        cuotaAlDia,
      };

      let estado = 'ok';
      let motivo = '';
      if (!numero || !nombre || !apellido) {
        estado = 'error';
        motivo = 'Faltan número, nombre o apellido';
      } else if (vistos.has(numero)) {
        estado = 'duplicado';
        motivo = 'Repetido en el archivo';
      } else if (numerosExistentes.has(numero)) {
        estado = 'duplicado';
        motivo = 'Ya existe un socio con ese número';
      }
      if (numero) vistos.add(numero);
      return { fila: idx + 2, datos, estado, motivo };
    });

    const aImportar = filasAnalizadas.filter((r) => r.estado === 'ok');
    return {
      headers,
      mapa,
      filas: filasAnalizadas,
      total: filasAnalizadas.length,
      okCount: aImportar.length,
      omitidos: filasAnalizadas.length - aImportar.length,
      aImportar: aImportar.map((r) => r.datos),
    };
  }, [texto, numerosExistentes]);

  const onArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTexto(await file.text());
    setVista('previa');
  };

  const confirmar = async () => {
    if (!analisis?.aImportar?.length) return;
    setImportando(true);
    try {
      const creados = await onImportar(analisis.aImportar);
      setResultado({ ok: true, creados: creados.length, omitidos: analisis.omitidos });
    } catch (err) {
      setResultado({ ok: false, error: err?.message || 'No se pudieron importar los socios.' });
    } finally {
      setImportando(false);
    }
  };

  const campoArea =
    'w-full rounded-xl border border-line bg-cloud px-3 py-2.5 font-mono text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-lav';

  return (
    <Modal title="Importar socios" icon={FileSpreadsheet} onClose={onClose} wide>
      <div className="max-h-[70vh] overflow-y-auto p-5">
        {resultado ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            {resultado.ok ? (
              <>
                <CheckCircle2 size={44} className="text-ok" />
                <p className="text-lg font-bold text-ink">
                  {resultado.creados} socio{resultado.creados === 1 ? '' : 's'} importado
                  {resultado.creados === 1 ? '' : 's'}
                </p>
                {resultado.omitidos > 0 && (
                  <p className="text-sm text-ink-soft">
                    {resultado.omitidos} fila{resultado.omitidos === 1 ? '' : 's'} se omitieron
                    (errores o duplicados).
                  </p>
                )}
                <Button variant="lav" onClick={onClose} className="mt-2">
                  Listo
                </Button>
              </>
            ) : (
              <>
                <AlertTriangle size={44} className="text-crit" />
                <p className="text-sm font-semibold text-crit">{resultado.error}</p>
                <Button variant="ghost" onClick={() => setResultado(null)} className="mt-2">
                  Volver
                </Button>
              </>
            )}
          </div>
        ) : vista === 'entrada' || !analisis ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Subí un archivo <strong>.csv</strong> exportado de tu planilla, o pegá las filas
              directamente desde Excel. La primera fila tiene que ser el encabezado con los nombres
              de columna.
            </p>

            <div className="rounded-xl bg-lav-soft/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-lav-deep">Columnas que reconoce</p>
                <button
                  type="button"
                  onClick={descargarPlantilla}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-lav-deep shadow-card transition hover:bg-cream"
                >
                  <Download size={13} /> Descargar plantilla
                </button>
              </div>
              <ul className="space-y-0.5 text-[11px] text-ink-soft">
                {COLUMNAS.map(([campo, nota]) => (
                  <li key={campo}>
                    <span className="font-mono font-bold text-ink">{campo}</span> — {nota}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-ink-faint">
                El orden no importa y podés omitir columnas. Si tu archivo es <strong>.xlsx</strong>
                , guardalo primero como “CSV UTF-8”.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-paper px-4 py-6 text-sm font-semibold text-ink-soft transition hover:border-lav hover:bg-lav-soft">
              <Upload size={16} />
              Elegir archivo CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onArchivo} />
            </label>

            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                <Copy size={12} /> …o pegá acá
              </p>
              <textarea
                rows={7}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={
                  'numero,nombre,apellido,dni,email,celular,categoria,cuota\n0142,Julieta,Méndez,30111222,jm@mail.com,1145551234,Activo,si'
                }
                className={campoArea}
              />
            </div>

            {analisis?.error && (
              <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
                {analisis.error}
              </p>
            )}

            {analisis && !analisis.error && (
              <Button variant="lav" onClick={() => setVista('previa')} className="w-full">
                Ver previsualización ({analisis.total} filas)
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="rounded-full bg-ok-soft px-2.5 py-1 text-ok">
                {analisis.okCount} a importar
              </span>
              {analisis.omitidos > 0 && (
                <span className="rounded-full bg-sun-soft px-2.5 py-1 text-warn">
                  {analisis.omitidos} se omiten
                </span>
              )}
              <button
                type="button"
                onClick={() => setVista('entrada')}
                className="ml-auto text-ink-faint underline hover:text-ink"
              >
                cambiar archivo
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper text-ink-soft">
                  <tr>
                    <th className="px-2 py-1.5 font-bold">#</th>
                    <th className="px-2 py-1.5 font-bold">N°</th>
                    <th className="px-2 py-1.5 font-bold">Nombre</th>
                    <th className="px-2 py-1.5 font-bold">Categoría</th>
                    <th className="px-2 py-1.5 font-bold">Cuota</th>
                    <th className="px-2 py-1.5 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {analisis.filas.slice(0, 100).map((r) => (
                    <tr
                      key={r.fila}
                      className={`border-t border-line ${
                        r.estado === 'ok' ? '' : 'bg-sun-soft/40 text-ink-faint'
                      }`}
                    >
                      <td className="px-2 py-1.5">{r.fila}</td>
                      <td className="px-2 py-1.5 font-mono">{r.datos.numero || '—'}</td>
                      <td className="px-2 py-1.5">
                        {r.datos.nombre} {r.datos.apellido}
                      </td>
                      <td className="px-2 py-1.5">{r.datos.categoria}</td>
                      <td className="px-2 py-1.5">{r.datos.cuotaAlDia ? 'Al día' : 'Adeuda'}</td>
                      <td className="px-2 py-1.5">
                        {r.estado === 'ok' ? (
                          <span className="text-ok">OK</span>
                        ) : (
                          <span className="text-warn">{r.motivo}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analisis.filas.length > 100 && (
                <p className="px-2 py-1.5 text-[11px] text-ink-faint">
                  … y {analisis.filas.length - 100} filas más
                </p>
              )}
            </div>

            <Button
              variant="lav"
              size="lg"
              loading={importando}
              disabled={analisis.okCount === 0}
              onClick={confirmar}
              className="w-full"
            >
              Importar {analisis.okCount} socio{analisis.okCount === 1 ? '' : 's'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
