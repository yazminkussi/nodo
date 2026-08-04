import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, WifiOff } from 'lucide-react';
import RoleToggle from './RoleToggle';

function NodoLogo({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <rect x="8" y="8" width="112" height="112" rx="28" fill="none" stroke="#06B6D4" strokeWidth="3" />
      <g stroke="#475569" strokeWidth="5" strokeLinecap="round">
        <line x1="40" y1="64" x2="80" y2="34" />
        <line x1="40" y1="64" x2="80" y2="94" />
        <line x1="80" y1="34" x2="80" y2="94" />
      </g>
      <circle cx="40" cy="64" r="13" fill="#06B6D4" />
      <circle cx="80" cy="34" r="13" fill="#0D9488" />
      <circle cx="80" cy="94" r="13" fill="#10B981" />
      <circle cx="64" cy="64" r="7" fill="#F8FAFC" />
    </svg>
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

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-nodo-navy/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <NodoLogo />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-extrabold tracking-tight text-white">NODO</p>
            <p className="hidden truncate text-[11px] text-slate-400 sm:block">Experiencia Digital para Comunidades</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-3 sm:px-6" aria-label="Secciones">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                active === key ? 'bg-nodo-navy text-white shadow-card' : 'text-slate-500 hover:bg-white hover:text-nodo-navy'
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
