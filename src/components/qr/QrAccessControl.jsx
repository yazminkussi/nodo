import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, CloudOff } from 'lucide-react';
import QrScannerPanel from './QrScannerPanel';
import AccessResultModal from './AccessResultModal';
import AccessLogTable from './AccessLogTable';
import { useNodoStore, useComunidadActual } from '../../store/useNodoStore';
import { decodeQrPayload } from '../../utils/qrPayload';
import { feedbackResultado } from '../../utils/feedback';
import { guardarRegistroAcceso, supabaseDisponible } from '../../lib/accessLogService';
import { todayISO, mesesAdeudados } from '../../data/mockData';

const OPERADOR = 'Carlos Kussi';

export default function QrAccessControl() {
  const members = useNodoStore((s) => s.members);
  const comunidades = useNodoStore((s) => s.comunidades);
  const reservations = useNodoStore((s) => s.reservations);
  const espacios = useNodoStore((s) => s.espacios);
  const registrosAcceso = useNodoStore((s) => s.registrosAcceso);
  const addRegistroAcceso = useNodoStore((s) => s.addRegistroAcceso);
  const registrarPago = useNodoStore((s) => s.registrarPago);
  const addToast = useNodoStore((s) => s.addToast);
  const comunidad = useComunidadActual();

  const [resultado, setResultado] = useState(null);
  const procesandoRef = useRef(false);

  const hoy = todayISO();

  const statsHoy = useMemo(() => {
    const deHoy = registrosAcceso.filter((r) => r.timestamp.startsWith(hoy));
    return {
      total: deHoy.length,
      permitido: deHoy.filter((r) => r.resultado === 'permitido').length,
      denegado: deHoy.filter((r) => r.resultado === 'denegado').length,
      invalido: deHoy.filter((r) => r.resultado === 'invalido').length,
    };
  }, [registrosAcceso, hoy]);

  const construirResultado = ({ socio, motivo, metodo, override = false }) => {
    const reservaActiva = socio
      ? (() => {
          const res = reservations.find((r) => r.socioId === socio.id && r.fecha === hoy);
          if (!res) return null;
          const espacio = espacios.find((e) => e.id === res.espacioId);
          return { space: espacio, res };
        })()
      : null;

    let tipo = 'invalido';
    let estadoAlIngreso = socio ? (socio.cuotaAlDia ? 'Al día' : 'Adeuda') : '—';
    if (socio?.cuotaAlDia) tipo = 'permitido';
    else if (socio) tipo = 'denegado';

    return {
      tipo,
      motivo: motivo || (tipo === 'permitido' ? 'Cuotas al día.' : 'Cuota social adeudada.'),
      socio,
      numero: socio?.numero,
      metodo,
      escaneadoPor: OPERADOR,
      comunidadId: comunidad.id,
      comunidadNombre: comunidad.nombre,
      comunidadIncorrecta: false,
      estadoAlIngreso,
      override,
      meses: socio && !socio.cuotaAlDia ? mesesAdeudados(socio) : 0,
      monto: socio && !socio.cuotaAlDia ? socio.plan * Math.max(1, mesesAdeudados(socio)) : 0,
      reserva: reservaActiva ? { espacioNombre: reservaActiva.space.nombre, hora: reservaActiva.res.inicio } : null,
    };
  };

  const registrarEvento = async (res) => {
    const registro = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      socioId: res.socio?.id ?? null,
      numeroSocio: res.numero ?? '—',
      nombre: res.socio ? `${res.socio.nombre} ${res.socio.apellido}` : 'Desconocido',
      comunidadId: res.comunidadId,
      comunidadNombre: res.comunidadNombre,
      timestamp: new Date().toISOString(),
      estadoAlIngreso: res.estadoAlIngreso,
      resultado: res.tipo,
      motivo: res.motivo,
      escaneadoPor: res.escaneadoPor,
      metodo: res.metodo,
      reserva: res.reserva,
      override: res.override || false,
    };
    addRegistroAcceso(registro);
    const cloud = await guardarRegistroAcceso({
      usuario_id: registro.socioId,
      numero_socio: registro.numeroSocio,
      nombre: registro.nombre,
      comunidad_id: registro.comunidadId,
      comunidad_nombre: registro.comunidadNombre,
      timestamp: registro.timestamp,
      estado_al_ingreso: registro.estadoAlIngreso,
      resultado: registro.resultado,
      motivo: registro.motivo,
      escaneado_por: registro.escaneadoPor,
      metodo: registro.metodo,
      detalle_reserva: registro.reserva
        ? `${registro.reserva.espacioNombre} · ${registro.reserva.hora} hs`
        : null,
    });
    if (!cloud.ok && !cloud.local) {
      addToast('El registro no pudo sincronizarse con Supabase. Se guardó en local.', 'error');
    }
  };

  const mostrarResultado = (res) => {
    feedbackResultado(res.tipo);
    setResultado(res);
    registrarEvento(res);
  };

  const handleEscaneo = async (texto) => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    try {
      const decodificado = await decodeQrPayload(texto);
      if (!decodificado.ok) {
        const res = construirResultado({
          socio: null,
          motivo: decodificado.expirado
            ? 'Este QR está vencido. Pedile al socio que actualice su carnet.'
            : decodificado.error || 'El código no es un carnet NODO válido.',
          metodo: 'qr',
        });
        mostrarResultado(res);
        return;
      }

      const { memberId, communityId } = decodificado.data;

      if (communityId !== comunidad.id) {
        const otra = comunidades.find((c) => c.id === communityId);
        const res = construirResultado({
          socio: null,
          motivo: 'El QR pertenece a otra institución.',
          metodo: 'qr',
        });
        res.comunidadIncorrecta = true;
        res.comunidadNombre = otra?.nombre || 'Otra institución';
        mostrarResultado(res);
        return;
      }

      const socio = members.find((m) => m.id === Number(memberId));
      if (!socio) {
        const res = construirResultado({
          socio: null,
          motivo: 'No se encontró un socio con este carnet.',
          metodo: 'qr',
        });
        mostrarResultado(res);
        return;
      }

      mostrarResultado(construirResultado({ socio, metodo: 'qr' }));
    } finally {
      procesandoRef.current = false;
    }
  };

  const handleManual = (consulta) => {
    if (procesandoRef.current) return;
    const q = consulta.trim().toLowerCase();
    if (!q) return;
    const socio = members.find(
      (m) => m.dni === q.replace(/\D/g, '') || m.numero === q.replace(/^n\s?°/i, '').replace(/\D/g, '').padStart(4, '0')
    );
    if (!socio) {
      const res = construirResultado({
        socio: null,
        motivo: 'No se encontró ningún socio con ese DNI o Nº de socio.',
        metodo: 'manual',
      });
      mostrarResultado(res);
      return;
    }
    mostrarResultado(construirResultado({ socio, metodo: 'manual' }));
  };

  const registrarPagoYAcceso = (socio) => {
    registrarPago(socio.id);
    const metodoAcceso = resultado?.metodo || 'manual';
    setResultado(null);
    const res = construirResultado({
      socio: { ...socio, cuotaAlDia: true },
      motivo: 'Pago registrado en el momento. Acceso habilitado.',
      metodo: metodoAcceso,
      override: true,
    });
    addToast(`Pago registrado. Acceso habilitado para ${socio.nombre}.`, 'success');
    mostrarResultado(res);
  };

  const overrideAcceso = (socio) => {
    const metodoAcceso = resultado?.metodo || 'manual';
    const res = construirResultado({
      socio,
      motivo: 'Ingreso permitido manualmente por administración.',
      metodo: metodoAcceso,
      override: true,
    });
    setResultado(null);
    addToast(`Ingreso autorizado de ${socio.nombre} ${socio.apellido}.`, 'info');
    mostrarResultado(res);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-nodo-green to-nodo-teal text-white shadow-card">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">
              Escanear QR · Control de Acceso
            </h2>
            <p className="text-xs text-slate-500">
              {comunidad.nombre} · Operador: {OPERADOR}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ring-inset ${
            supabaseDisponible
              ? 'bg-cyan-50 text-nodo-teal ring-cyan-200'
              : 'bg-amber-50 text-nodo-amber ring-amber-200'
          }`}
        >
          {supabaseDisponible ? <Database size={13} /> : <CloudOff size={13} />}
          {supabaseDisponible ? 'Supabase sincronizado' : 'Modo demo · sin Supabase'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QrScannerPanel onEscaneado={handleEscaneo} onIngresoManual={handleManual} pausado={Boolean(resultado)} />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Ingresos de hoy · {comunidad.barrio}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total', valor: statsHoy.total, clase: 'text-nodo-navy', fondo: 'bg-nodo-bg' },
                { label: 'Permitidos', valor: statsHoy.permitido, clase: 'text-nodo-green-dark', fondo: 'bg-emerald-50' },
                { label: 'Con Adeuda', valor: statsHoy.denegado, clase: 'text-nodo-red', fondo: 'bg-red-50' },
                { label: 'Inválidos', valor: statsHoy.invalido, clase: 'text-nodo-amber', fondo: 'bg-amber-50' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl ${s.fondo} p-3 ring-1 ring-inset ring-nodo-border`}
                >
                  <p className={`text-2xl font-extrabold tracking-tight ${s.clase}`}>{s.valor}</p>
                  <p className="text-[11px] font-bold text-slate-500">{s.label}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              El operador verifica el carnet y puede registrar pagos o autorizar ingresos.
            </p>
          </div>
        </div>
      </div>

      <AccessLogTable />

      <AccessResultModal
        resultado={resultado}
        onClose={() => setResultado(null)}
        onRegistrarPago={registrarPagoYAcceso}
        onOverride={overrideAcceso}
      />
    </div>
  );
}