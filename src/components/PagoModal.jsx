import { useEffect, useMemo, useState } from 'react';
import { Wallet, Receipt } from 'lucide-react';
import Modal from './ui/Modal';
import Field from './ui/Field';
import Button from './ui/Button';
import { formatARS } from '../data/mockData';
import { listarPagosDeSocio } from '../lib/api/pagos';
import { useComunidadActiva } from '../store/useSesion';

const METODOS = [
  ['efectivo', 'Efectivo'],
  ['transferencia', 'Transferencia'],
  ['tarjeta', 'Tarjeta'],
  ['mercadopago', 'MercadoPago'],
  ['otro', 'Otro'],
];

const mesActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const campoSelect =
  'w-full rounded-xl border border-line bg-cloud px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lav';

export default function PagoModal({ socio, modo, onRegistrar, onClose }) {
  const comunidad = useComunidadActiva();
  const [monto, setMonto] = useState(String(socio.plan || ''));
  const [metodo, setMetodo] = useState('efectivo');
  const [periodo, setPeriodo] = useState(mesActual());
  const [concepto, setConcepto] = useState('Cuota social');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [historial, setHistorial] = useState(null); // null = cargando, [] = vacío

  const recargarHistorial = useMemo(
    () => () => {
      if (modo !== 'remoto' || !comunidad?.id) {
        setHistorial([]);
        return;
      }
      setHistorial(null);
      listarPagosDeSocio(comunidad.id, socio.id)
        .then(setHistorial)
        .catch(() => setHistorial([]));
    },
    [modo, comunidad?.id, socio.id]
  );

  useEffect(() => {
    recargarHistorial();
  }, [recargarHistorial]);

  const registrar = async () => {
    const m = Number(String(monto).replace(/\D/g, ''));
    if (!m) return setError('Poné el monto del pago.');
    setError('');
    setGuardando(true);
    try {
      await onRegistrar({ monto: m, metodo, periodo, concepto: concepto.trim() || 'Cuota social' });
      setMonto('');
      recargarHistorial();
    } catch (e) {
      setError(e?.message || 'No se pudo registrar el pago.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={`Cuota de ${socio.nombre} ${socio.apellido}`}
      icon={Wallet}
      onClose={onClose}
      wide
    >
      <div className="max-h-[72vh] overflow-y-auto p-5">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-lav-soft/60 px-3 py-2.5 text-xs">
          <span className="font-bold text-lav-deep">
            N° {socio.numero} · {socio.categoria}
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 font-extrabold ${
              socio.cuotaAlDia ? 'bg-ok-soft text-ok' : 'bg-crit-soft text-crit'
            }`}
          >
            {socio.cuotaAlDia ? 'Al día' : 'Adeuda'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Monto"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={socio.plan ? String(socio.plan) : '0'}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Método</span>
            <select
              className={campoSelect}
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            >
              {METODOS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Período que cubre</span>
            <input
              type="month"
              className={campoSelect}
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
          </label>
          <Field label="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
            {error}
          </p>
        )}

        <Button
          variant="lav"
          size="lg"
          loading={guardando}
          onClick={registrar}
          className="mt-4 w-full"
        >
          Registrar pago
          {monto ? ` · ${formatARS(Number(String(monto).replace(/\D/g, '')) || 0)}` : ''}
        </Button>

        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-ink-faint">
            <Receipt size={13} /> Historial de pagos
          </p>
          {modo !== 'remoto' ? (
            <p className="rounded-xl border-2 border-dashed border-line bg-paper px-3 py-4 text-center text-xs text-ink-faint">
              El historial se guarda con la cuenta conectada a Supabase.
            </p>
          ) : historial === null ? (
            <p className="py-3 text-center text-xs text-ink-faint">Cargando…</p>
          ) : historial.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-line bg-paper px-3 py-4 text-center text-xs text-ink-faint">
              Todavía no hay pagos registrados.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {historial.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="font-bold tabular-nums text-ink">{formatARS(p.monto)}</span>
                  <span className="text-xs capitalize text-ink-soft">{p.metodo}</span>
                  {p.periodo && (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                      {p.periodo}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-ink-faint">{p.fecha}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
