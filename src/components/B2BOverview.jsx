import { motion } from 'framer-motion';
import { Check, MessageSquareX, Sheet, FileX2, Rocket, ArrowRight } from 'lucide-react';
import { planesB2B, valueProps, formatARS, clubInfo } from '../data/mockData';
import { useNodoStore } from '../store/useNodoStore';

const iconosProps = [MessageSquareX, Sheet, FileX2];

export default function B2BOverview() {
  const addToast = useNodoStore((s) => s.addToast);

  return (
    <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-nodo-navy via-nodo-navy-2 to-[#0B1222] p-6 text-white shadow-lift sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-nodo-cyan/15 px-3 py-1 text-xs font-extrabold text-nodo-cyan ring-1 ring-inset ring-nodo-cyan/30">
          <Rocket size={13} /> NODO para instituciones
        </span>
        <h2 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          Unificá WhatsApp, Excel y carpetas en una sola plataforma digital.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-300">
          NODO es la experiencia digital integral para clubes, centros culturales y movimientos juveniles. Carnet con QR,
          cuotas al día, reservas y comunidad, todo en el bolsillo de cada socio.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {valueProps.map((v, i) => {
            const Icon = iconosProps[i];
            return (
              <motion.div
                key={v.titulo}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nodo-cyan/20 text-nodo-cyan">
                  <Icon size={17} />
                </div>
                <p className="mt-3 font-extrabold">{v.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{v.detalle}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-5 text-center text-xl font-extrabold tracking-tight text-nodo-navy">Planes comerciales</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {planesB2B.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className={`relative flex flex-col rounded-3xl p-6 ${
                plan.destacado
                  ? 'bg-nodo-navy text-white shadow-lift ring-2 ring-nodo-cyan'
                  : 'bg-white text-nodo-navy shadow-card ring-1 ring-nodo-border'
              }`}
            >
              {plan.destacado && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-nodo-cyan px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-card">
                  Recomendado · El plan actual del club
                </span>
              )}
              <h4 className="text-lg font-extrabold">{plan.nombre}</h4>
              <p className={`text-xs font-semibold ${plan.destacado ? 'text-slate-400' : 'text-slate-500'}`}>{plan.socios}</p>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">
                {formatARS(plan.precioMensual)}
                <span className={`ml-1 text-xs font-medium ${plan.destacado ? 'text-slate-400' : 'text-slate-400'}`}>/ mes</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} strokeWidth={3} className={`mt-0.5 shrink-0 ${plan.destacado ? 'text-nodo-green' : 'text-nodo-teal'}`} />
                    <span className={plan.destacado ? 'text-slate-200' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => addToast(`Consulta recibida para el ${plan.nombre}. ¡Nos contactamos!`, 'success')}
                className={`mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                  plan.destacado
                    ? 'bg-nodo-cyan text-white hover:bg-cyan-600'
                    : 'bg-nodo-surface text-nodo-navy ring-1 ring-inset ring-nodo-border hover:bg-slate-100'
                }`}
              >
                Solicitar demo <ArrowRight size={15} />
              </button>
            </motion.div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">
          Precios expresados en pesos argentinos. {clubInfo.ciudad} · IVA incluido · Sin permanencia.
        </p>
      </div>
    </section>
  );
}
