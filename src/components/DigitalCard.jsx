import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, ScanLine, Sparkles, MapPin, RefreshCw, Wallet, IdCard } from 'lucide-react';
import { useNodoStore, useProximaReserva, useComunidadActual } from '../store/useNodoStore';
import { useSesion, useComunidadActiva } from '../store/useSesion';
import { QrSvg } from '../utils/qr';
import { createQrPayload } from '../utils/qrPayload';
import { pedirTokenCarnet } from '../lib/api/carnet';
import { vincularSocioPorDatos } from '../lib/api/socios';
import { formatFechaLarga, formatARS, mesesAdeudados } from '../data/mockData';
import { NodoLogo } from './Navbar';
import Chip from './ui/Chip';
import Button from './ui/Button';
import Field from './ui/Field';

const iniciales = (nombre, apellido) => `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

export default function DigitalCard() {
  const estado = useSesion((s) => s.estado);
  const miSocio = useSesion((s) => s.miSocio);
  const refrescarSesion = useSesion((s) => s.refrescar);
  const setComunidadActiva = useSesion((s) => s.setComunidadActiva);
  const addToast = useNodoStore((s) => s.addToast);
  const [buscando, setBuscando] = useState(false);
  const [vincDatos, setVincDatos] = useState({ numero: '', dni: '' });
  const [vinculando, setVinculando] = useState(false);
  const [vincError, setVincError] = useState('');
  const socioDemo = useNodoStore((s) => s.members.find((m) => m.id === s.socioActualId));
  const comunidadDemo = useComunidadActual();
  const comunidadReal = useComunidadActiva();

  const remoto = estado === 'activo';
  const socio = remoto ? miSocio : socioDemo;
  const comunidad = comunidadReal || comunidadDemo;
  const logoComunidad = comunidad?.logo_url || comunidad?.logo || null;
  const proxima = useProximaReserva(remoto ? null : socio?.id);
  const [qrPayload, setQrPayload] = useState(null);

  const socioId = socio?.id;
  const communityId = comunidad?.id;

  useEffect(() => {
    let activo = true;
    if (socioId == null || communityId == null) return undefined;

    // Con sesión real el payload lo firma el servidor (Edge Function): el
    // secreto ya no viaja en el bundle. En demo se firma localmente.
    const generar = async () => {
      try {
        const payload = remoto
          ? (await pedirTokenCarnet(communityId)).payload
          : await createQrPayload({ memberId: socioId, communityId });
        if (activo) setQrPayload(payload);
      } catch {
        if (activo) setQrPayload(null);
      }
    };

    generar();
    // Renovar antes de que venza (TTL 15 min).
    const t = setInterval(generar, 13 * 60 * 1000);
    return () => {
      activo = false;
      clearInterval(t);
    };
  }, [socioId, communityId, socio?.numero, remoto]);

  const vincularPorDatos = async (e) => {
    e.preventDefault();
    setVincError('');
    if (!vincDatos.numero.trim() || !vincDatos.dni.trim()) {
      return setVincError('Completá tu número de socio y tu DNI.');
    }
    setVinculando(true);
    try {
      const slug = await vincularSocioPorDatos(vincDatos.numero.trim(), vincDatos.dni.trim());
      await setComunidadActiva(slug);
      await refrescarSesion();
      addToast('¡Listo! Vinculamos tu ficha de socio.', 'success');
    } catch (err) {
      setVincError(err?.message || 'No se pudo vincular tu ficha.');
    } finally {
      setVinculando(false);
    }
  };

  if (!socio) {
    if (remoto) {
      return (
        <section className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-3xl bg-cloud p-6 shadow-card">
            <div className="mb-4 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lav-soft text-lav">
                <IdCard size={22} />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">Vinculá tu ficha de socio</h2>
              <p className="text-sm text-ink-soft">
                Ingresá tu número de socio y tu DNI, como figuran en tu carnet de{' '}
                {comunidad?.nombre || 'tu club'}.
              </p>
            </div>

            <form onSubmit={vincularPorDatos} className="space-y-3">
              <Field
                label="Número de socio"
                placeholder="Ej. 0142"
                value={vincDatos.numero}
                onChange={(e) => setVincDatos((v) => ({ ...v, numero: e.target.value }))}
              />
              <Field
                label="DNI"
                placeholder="Sin puntos"
                inputMode="numeric"
                value={vincDatos.dni}
                onChange={(e) => setVincDatos((v) => ({ ...v, dni: e.target.value }))}
              />
              {vincError && (
                <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
                  {vincError}
                </p>
              )}
              <Button type="submit" variant="lav" loading={vinculando} className="w-full">
                Vincular mi ficha
              </Button>
            </form>

            <button
              type="button"
              onClick={async () => {
                setBuscando(true);
                await refrescarSesion();
                setBuscando(false);
              }}
              className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-faint transition hover:text-ink"
            >
              <RefreshCw size={12} className={buscando ? 'animate-spin' : ''} />
              Ya me cargaron con mi email · buscar de nuevo
            </button>
          </div>
        </section>
      );
    }
    return null;
  }

  const meses = mesesAdeudados(socio);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl px-4 sm:px-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Carnet digital</h2>
        <Chip tono="sun" icon={Sparkles}>
          Ingreso sin contacto
        </Chip>
      </div>

      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative overflow-hidden rounded-[26px] bg-lav-deep p-5 text-cream shadow-lift sm:p-6"
      >
        {/* halo cálido + textura tejida */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sun/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(243,239,230,0.14) 1.5px, transparent 1.6px)',
            backgroundSize: '18px 18px',
            WebkitMaskImage: 'linear-gradient(205deg, black, transparent 68%)',
            maskImage: 'linear-gradient(205deg, black, transparent 68%)',
          }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-cream/55">
              {comunidad.nombre}
            </p>
            <p className="truncate text-[10px] font-semibold text-cream/40">
              {[comunidad.barrio, comunidad.ciudad].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
              Carnet <span className="text-sun">digital</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {logoComunidad && (
              <img
                src={logoComunidad}
                alt={`Logo de ${comunidad.nombre}`}
                className="h-9 w-9 rounded-full bg-white object-contain p-0.5 ring-1 ring-white/20"
              />
            )}
            <NodoLogo size={34} color="#F3EFE6" />
          </div>
        </div>

        <div className="relative mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-white ring-4 ring-white/10"
                style={{ background: socio.color }}
              >
                {iniciales(socio.nombre, socio.apellido)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold sm:text-xl">
                  {socio.nombre} {socio.apellido}
                </p>
                <p className="text-sm text-cream/70">
                  Socio N°{' '}
                  <span className="font-semibold tabular-nums text-cream">{socio.numero}</span>
                </p>
                <p className="text-xs text-cream/50">{socio.categoria}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Chip tono={socio.cuotaAlDia ? 'ok' : 'crit'} dot>
                {socio.cuotaAlDia ? 'Al día' : 'Adeuda'}
              </Chip>
              {!socio.cuotaAlDia && (
                <Chip tono="paper" icon={Wallet}>
                  {meses} {meses === 1 ? 'mes' : 'meses'} · {formatARS(socio.plan * meses)}
                </Chip>
              )}
              {socio.localidad && (
                <Chip tono="paper" icon={MapPin}>
                  {socio.localidad}
                </Chip>
              )}
              <Chip tono="paper" icon={CalendarClock}>
                Válido hasta {formatFechaLarga('2026-08-31')}
              </Chip>
            </div>

            {proxima && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-sun/40 bg-sun/10 px-4 py-2.5">
                <div className="text-xs">
                  <p className="font-bold text-sun">Próxima reserva</p>
                  <p className="text-cream/70">
                    {proxima.espacio?.nombre} · {proxima.inicio} hs
                  </p>
                </div>
                <ScanLine size={18} className="text-sun" />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2">
            <motion.div
              className="rounded-2xl bg-paper p-3"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(232,163,61,0)',
                  '0 0 0 6px rgba(232,163,61,0.12)',
                  '0 0 0 0 rgba(232,163,61,0)',
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <QrSvg value={qrPayload || `NODO|v1|pending`} size={132} />
            </motion.div>
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-cream/50">
              {qrPayload ? (
                <>
                  <RefreshCw size={11} /> Vigente 15 min · Mostrar al ingresar
                </>
              ) : (
                <span className="animate-pulse">Generando tu QR…</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
