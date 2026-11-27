import { useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, MapPin, Pencil, Plus } from 'lucide-react';
import type { ProgramEvent, ProgramEventKind, ProgramProvider } from '../data/program';
import { programEventKinds } from '../data/program';
import { Asterisk, SplitTitle } from './glyphs';

const emptyEvent = (): ProgramEvent => ({ id: `event-${Date.now()}`, date: '2026-06-27', time: '18:00', title: 'Nouvel événement', kind: 'Culture', location: 'À définir', description: 'Décrivez cet événement…' });
const emptyProvider = (): ProgramProvider => ({ id: `provider-${Date.now()}`, name: 'Nouveau prestataire', role: 'À préciser', location: 'À définir', description: 'Présentez ce prestataire…' });

function dateLabel(date: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`));
}

function EventEditor({ event, onSave, onDelete }: { event: ProgramEvent; onSave: (event: ProgramEvent) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(event);
  const set = (patch: Partial<ProgramEvent>) => setDraft((current) => ({ ...current, ...patch }));
  return <div className="space-y-3 rounded-[18px] border border-line bg-white p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <input value={draft.title} onChange={(e) => set({ title: e.target.value })} className="field" placeholder="Titre" />
      <select value={draft.kind} onChange={(e) => set({ kind: e.target.value as ProgramEventKind })} className="field">{programEventKinds.map((kind) => <option key={kind}>{kind}</option>)}</select>
      <input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className="field" />
      <input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className="field" />
      <input value={draft.location} onChange={(e) => set({ location: e.target.value })} className="field" placeholder="Lieu" />
      <input value={draft.link ?? ''} onChange={(e) => set({ link: e.target.value })} className="field" placeholder="Lien (optionnel)" />
    </div>
    <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} className="field min-h-20" placeholder="Description" />
    <div className="flex gap-2"><button onClick={() => onSave(draft)} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white uppercase">Enregistrer</button><button onClick={onDelete} className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 uppercase">Supprimer</button></div>
  </div>;
}

function ProviderEditor({ provider, onSave, onDelete }: { provider: ProgramProvider; onSave: (provider: ProgramProvider) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(provider);
  const set = (patch: Partial<ProgramProvider>) => setDraft((current) => ({ ...current, ...patch }));
  return <div className="space-y-3 rounded-[18px] border border-line bg-white p-4">
    <div className="grid gap-3 sm:grid-cols-2"><input value={draft.name} onChange={(e) => set({ name: e.target.value })} className="field" placeholder="Nom" /><input value={draft.role} onChange={(e) => set({ role: e.target.value })} className="field" placeholder="Activité" /><input value={draft.location} onChange={(e) => set({ location: e.target.value })} className="field" placeholder="Localisation" /><input value={draft.website ?? ''} onChange={(e) => set({ website: e.target.value })} className="field" placeholder="Site web" /></div>
    <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} className="field min-h-20" placeholder="Description" />
    <div className="flex gap-2"><button onClick={() => onSave(draft)} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white uppercase">Enregistrer</button><button onClick={onDelete} className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 uppercase">Supprimer</button></div>
  </div>;
}

export default function ProgramPage({ events, providers, canEdit, onEventsChange, onProvidersChange }: { events: ProgramEvent[]; providers: ProgramProvider[]; canEdit: boolean; onEventsChange: (events: ProgramEvent[]) => void; onProvidersChange: (providers: ProgramProvider[]) => void }) {
  const [filter, setFilter] = useState<'Tous' | ProgramEventKind>('Tous');
  const [editing, setEditing] = useState(false);
  const visibleEvents = useMemo(() => [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).filter((event) => filter === 'Tous' || event.kind === filter), [events, filter]);
  return <main>
    <section className="border-b border-line bg-[#f5f2ec] px-5 py-20 md:px-10 md:py-32"><div className="mx-auto max-w-[1440px]"><p className="mb-5 font-display text-[12px] font-semibold tracking-[0.12em] text-smoke uppercase"><Asterisk className="mr-2 h-3 w-3" />Agenda culturel</p><h1 className="max-w-4xl font-display text-[clamp(3rem,8vw,8rem)] font-bold leading-[0.9] tracking-[-0.07em]"><SplitTitle text="Programme" /></h1><p className="mt-8 max-w-xl text-lg leading-8 text-smoke">Ateliers, concerts, rencontres et projets qui donnent un rythme commun aux histoires en mouvement.</p>{canEdit && <button onClick={() => setEditing((value) => !value)} className="mt-8 flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white uppercase"><Pencil className="h-4 w-4" />{editing ? 'Fermer l’édition' : 'Modifier le programme'}</button>}</div></section>
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 font-display text-[12px] font-semibold tracking-[0.12em] text-smoke uppercase">01 · À venir</p><h2 className="font-display text-4xl font-bold tracking-[-0.05em]">Les rendez-vous</h2></div><div className="flex flex-wrap gap-2"><button onClick={() => setFilter('Tous')} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase ${filter === 'Tous' ? 'bg-ink text-white' : 'border border-line'}`}>Tous</button>{programEventKinds.map((kind) => <button key={kind} onClick={() => setFilter(kind)} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase ${filter === kind ? 'bg-ink text-white' : 'border border-line'}`}>{kind}</button>)}</div></div>
      {visibleEvents.length === 0 ? <p className="rounded-[20px] border border-dashed border-line p-8 text-sm text-smoke">Aucun événement dans cette catégorie.</p> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleEvents.map((event) => <article key={event.id} className="group rounded-[22px] border border-line bg-white p-6 transition-transform hover:-translate-y-1"><div className="mb-12 flex items-start justify-between gap-3"><span className="rounded-full bg-[#ffe45e] px-3 py-1 text-[11px] font-bold uppercase">{event.kind}</span><CalendarDays className="h-5 w-5 text-smoke" /></div><p className="mb-2 font-display text-sm font-semibold uppercase">{dateLabel(event.date)} · {event.time}</p><h3 className="mb-4 font-display text-2xl font-bold tracking-[-0.04em]">{event.title}</h3><p className="mb-5 min-h-20 text-sm leading-6 text-smoke">{event.description}</p><div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{event.location}</div>{event.link && <a href={event.link} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline">En savoir plus <ExternalLink className="h-3.5 w-3.5" /></a>}</article>)}</div>}
    </section>
    <section className="bg-[#181818] px-5 py-16 text-white md:px-10 md:py-24"><div className="mx-auto max-w-[1440px]"><p className="mb-3 font-display text-[12px] font-semibold tracking-[0.12em] text-white/55 uppercase">02 · Savoir-faire</p><h2 className="mb-10 font-display text-4xl font-bold tracking-[-0.05em]">Les prestataires</h2><div className="grid gap-5 md:grid-cols-2">{providers.map((provider) => <article key={provider.id} className="rounded-[22px] border border-white/15 p-6"><p className="mb-2 text-sm text-white/55">{provider.role}</p><h3 className="mb-2 font-display text-2xl font-bold">{provider.name}</h3><p className="mb-5 text-sm leading-6 text-white/70">{provider.description}</p><div className="flex items-center gap-2 text-sm text-white/70"><MapPin className="h-4 w-4" />{provider.location}</div>{provider.website && <a href={provider.website} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline">Visiter le site <ExternalLink className="h-3.5 w-3.5" /></a>}</article>)}</div></div></section>
    {editing && canEdit && <section className="mx-auto max-w-[1440px] space-y-10 px-5 py-16 md:px-10"><div><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Éditer les événements</h2><button onClick={() => onEventsChange([...events, emptyEvent()])} className="flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-xs font-semibold uppercase"><Plus className="h-4 w-4" />Ajouter</button></div><div className="grid gap-4 md:grid-cols-2">{events.map((event) => <EventEditor key={event.id} event={event} onSave={(next) => onEventsChange(events.map((item) => item.id === next.id ? next : item))} onDelete={() => onEventsChange(events.filter((item) => item.id !== event.id))} />)}</div></div><div><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Éditer les prestataires</h2><button onClick={() => onProvidersChange([...providers, emptyProvider()])} className="flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-xs font-semibold uppercase"><Plus className="h-4 w-4" />Ajouter</button></div><div className="grid gap-4 md:grid-cols-2">{providers.map((provider) => <ProviderEditor key={provider.id} provider={provider} onSave={(next) => onProvidersChange(providers.map((item) => item.id === next.id ? next : item))} onDelete={() => onProvidersChange(providers.filter((item) => item.id !== provider.id))} />)}</div></div></section>}
  </main>;
}
