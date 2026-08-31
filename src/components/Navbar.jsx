import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, WifiOff, Building2, ChevronDown } from 'lucide-react';
import RoleToggle from './RoleToggle';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';

export function NodoLogo({ className = 'h-9 w-9' }) {
  return (
    <img
      src="/imagenes/nodo_logo.png"
      alt="NODO"
      className={`${className} object-contain`}
      loading="eager"
    />
  );
}

export function PWAInstallButton() {
  const [prompt, setPrompt] = useState(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const instalar = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {!online && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-300"
            title="Estás sin conexión. NODO funciona offline."
          >
            <WifiOff size={12} /> Offline
          </motion.span>
        )}
      </AnimatePresence>
      {prompt && (
        <button
          onClick={instalar}
          className="hidden items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:flex"
        >
          <Download size={14} /> Instalar App
        </button>
      )}
    </div>
  );
}

export function CommunityBadge() {
  const comunidades = useNodoStore((s) => s.comunidades);
  const comunidad = useComunidadActual();
  const setComunidadActual = useNodoStore((s) => s.setComunidadActual);
  const addToast = useNodoStore((s) => s.addToast);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const barrio = comunidad.barrio || comunidad.direccion?.split(', ')[1] || '';

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const onKey = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const cambiar = (id) => {
    const next = comunidades.find((c) => c.id === id);
    if (!next || id === comunidad.id) {
      setAbierto(false);
      return;
    }
    setComunidadActual(id);
    addToast(`Cambiaste a ${next.nombre}.`, 'info');
    setAbierto(false);
  };

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        className="flex min-w-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-2 pr-2.5 transition hover:bg-white/10"
      >
        {comunidad.logo ? (
          <img
            src={comunidad.logo}
            alt={comunidad.nombre}
            className="h-7 w-7 shrink-0 rounded-full bg-white object-contain p-0.5"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nodo-cyan to-nodo-teal text-white">
            <Building2 size={14} />
          </span>
        )}
        <span className="min-w-0 text-left leading-tight">
          <span className="block truncate text-xs font-extrabold text-white">
            {comunidad.nombre}
          </span>
          <span className="block truncate text-[10px] font-semibold text-slate-400">
            {barrio || comunidad.tipo} · {comunidad.plan}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.ul
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label="Cambiar de comunidad"
            className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-nodo-border"
          >
            <li className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Comunidad activa
            </li>
            {comunidades.map((c) => {
              const activa = c.id === comunidad.id;
              return (
                <li key={c.id}>
                  <button
                    role="option"
                    aria-selected={activa}
                    onClick={() => cambiar(c.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                      activa ? 'bg-cyan-50 ring-1 ring-inset ring-cyan-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    {c.logo ? (
                      <img
                        src={c.logo}
                        alt={c.nombre}
                        className="h-8 w-8 shrink-0 rounded-lg bg-white object-contain ring-1 ring-nodo-border"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nodo-navy text-white">
                        <Building2 size={15} />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold text-nodo-navy">
                        {c.nombre}
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-500">
                        {c.tipo} · {c.barrio || c.direccion?.split(', ')[1] || ''} · {c.plan}
                      </span>
                    </span>
                    {activa && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-nodo-green" />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-nodo-navy/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <NodoLogo />
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="text-sm font-extrabold tracking-tight text-white">NODO</p>
            <p className="truncate text-[11px] text-slate-400">
              Experiencia Digital para Comunidades
            </p>
          </div>
        </div>

        <div className="h-8 w-px shrink-0 bg-white/15" />

        <CommunityBadge />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <PWAInstallButton />
          <RoleToggle />
        </div>
      </div>
    </header>
  );
}

export function SectionNav({ sections, active, onChange }) {
  return (
    <>
      <div className="sticky top-16 z-30 border-b border-nodo-border bg-nodo-bg/95 backdrop-blur">
        <nav
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-3 sm:px-6"
          aria-label="Secciones"
        >
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                active === key
                  ? 'bg-nodo-navy text-white shadow-card'
                  : 'text-slate-500 hover:bg-white hover:text-nodo-navy'
              }`}
            >
              <Icon size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="h-1" />
    </>
  );
}

export default NodoLogo;
