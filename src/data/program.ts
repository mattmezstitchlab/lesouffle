export type ProgramEventKind = 'Atelier' | 'Concert' | 'Pédagogie' | 'Culture';

export interface ProgramEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  kind: ProgramEventKind;
  location: string;
  description: string;
  image?: string;
  link?: string;
}

export interface ProgramProvider {
  id: string;
  name: string;
  role: string;
  location: string;
  description: string;
  image?: string;
  website?: string;
  contact?: string;
}

export const programEventKinds: ProgramEventKind[] = ['Atelier', 'Concert', 'Pédagogie', 'Culture'];

export const programDefaultEvents: ProgramEvent[] = [
  {
    id: 'event-atelier-souffle', date: '2026-12-05', time: '10:00', title: 'Atelier — trouver son souffle', kind: 'Atelier',
    location: 'Studio Matt Mez', description: 'Une matinée pour explorer le rythme, l’écoute et les gestes qui font naître une présence musicale.',
  },
  {
    id: 'event-concert-rives', date: '2026-12-12', time: '20:30', title: 'Concert — Entre les rives', kind: 'Concert',
    location: 'La Grange culturelle', description: 'Un concert en mouvement, entre jazz, récit et mémoire des paysages traversés.',
  },
  {
    id: 'event-rencontre-transmission', date: '2026-12-19', time: '15:00', title: 'Rencontre — transmettre une histoire', kind: 'Pédagogie',
    location: 'Médiathèque de Comines', description: 'Échange ouvert autour de la transmission, de la création et de la place des pratiques artistiques.',
  },
];

export const programDefaultProviders: ProgramProvider[] = [
  {
    id: 'provider-studio', name: 'Studio Matt Mez', role: 'Studio & accompagnement artistique', location: 'Nord / Belgique',
    description: 'Un espace pour faire émerger les projets, préparer une rencontre ou enregistrer une idée.',
  },
  {
    id: 'provider-grange', name: 'La Grange culturelle', role: 'Lieu de concerts et rencontres', location: 'Hauts-de-France',
    description: 'Un lieu chaleureux pour accueillir des formes musicales, pédagogiques et culturelles.',
  },
];

export function isProgramEvents(value: unknown): value is ProgramEvent[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && typeof (item as ProgramEvent).id === 'string' && typeof (item as ProgramEvent).title === 'string');
}

export function isProgramProviders(value: unknown): value is ProgramProvider[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && typeof (item as ProgramProvider).id === 'string' && typeof (item as ProgramProvider).name === 'string');
}
