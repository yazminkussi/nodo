import {
  Trophy,
  Palette,
  Dumbbell,
  DoorOpen,
  Music,
  Target,
  Waves,
  Flame,
  BookOpen,
  LayoutGrid,
  PersonStanding,
  Footprints,
  Clapperboard,
  Zap,
} from 'lucide-react';

const mapa = {
  futbol: Trophy,
  ceramica: Palette,
  gimnasio: Dumbbell,
  sum: DoorOpen,
  ensayo: Music,
  padel: Target,
  pileta: Waves,
  parrilla: Flame,
  aula: BookOpen,
  ajedrez: LayoutGrid,
  yoga: PersonStanding,
  danza: Footprints,
  teatro: Clapperboard,
  taekwondo: Zap,
};

export const ICONOS_ESPACIO = Object.keys(mapa);

export default function SpaceIcon({ icono, className = 'h-5 w-5' }) {
  const Icon = mapa[icono] || DoorOpen;
  return <Icon className={className} strokeWidth={2.2} />;
}
