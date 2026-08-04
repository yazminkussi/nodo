import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IdCard, CalendarDays, Newspaper } from 'lucide-react';
import { Header, SectionNav } from './Navbar';
import DigitalCard from './DigitalCard';
import BookingPanel from './BookingPanel';
import Feed from './Feed';
import AdBanner from './AdBanner';

const secciones = [
  { key: 'carnet', label: 'Carnet Digital', icon: IdCard },
  { key: 'reservas', label: 'Reservas', icon: CalendarDays },
  { key: 'novedades', label: 'Novedades', icon: Newspaper },
];

export default function SocioPortal() {
  const [seccion, setSeccion] = useState('carnet');

  return (
    <div className="min-h-screen bg-nodo-bg pb-16">
      <Header />
      <div className="pt-16">
        <SectionNav sections={secciones} active={seccion} onChange={setSeccion} />

        <AnimatePresence mode="wait">
          <motion.main
            key={seccion}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-8 py-6"
          >
            {seccion === 'carnet' && (
              <>
                <DigitalCard />
                <AdBanner />
              </>
            )}
            {seccion === 'reservas' && <BookingPanel />}
            {seccion === 'novedades' && (
              <>
                <Feed />
                <AdBanner />
              </>
            )}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
