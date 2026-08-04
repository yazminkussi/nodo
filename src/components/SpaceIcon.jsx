import { Trophy, Palette, Dumbbell, DoorOpen, Music } from 'lucide-react';

const mapa = {
  futbol: Trophy,
  ceramica: Palette,
  gimnasio: Dumbbell,
  sum: DoorOpen,
  ensayo: Music,
};

export default function SpaceIcon({ icono, className = 'h-5 w-5' }) {
  const Icon = mapa[icono] || DoorOpen;
  return <Icon className={className} strokeWidth={2.2} />;
}
