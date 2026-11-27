import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Heart,
  List,
  LayoutGrid,
  MapPin,
  Music,
  Pencil,
  Search,
  Shirt,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  weddingTimeLabel,
  type WeddingMoment,
} from '../data/wedding';
import { Asterisk, Dot, Sparkle, SplitTitle, Visual } from './glyphs';
import { pad } from './visual-utils';

const accentColor = { pink: 'bg-[#ff2e88] text-white', yellow: 'bg-[#ffe45e] text-ink', blue: 'bg-[#1e4dff] text-white', green: 'bg-[#2ecc71] text-ink' } as const;

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function WeddingMarquee() {
  const items = ['Amour', 'Souffle', 'Danse', 'Vœux', 'Fête', 'Jour-J', 'Saxophone', 'Éternité'];
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.concat(items).map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={`display-type px-6 text-[clamp(1.4rem,3vw,2.4rem)] whitespace-nowrap ${i % 2 ? 'text-fog' : ''}`}>
            {w}
          </span>
          {i % 3 === 0 ? <Asterisk className="h-5 w-5" /> : i % 3 === 1 ? <Sparkle className="h-5 w-5" /> : <Dot className="h-2.5 w-2.5" />}
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-line py-5">
      <div className="flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

function MomentCard({
  moment,
  index,
  checked,
  onToggleCheck,
  onEdit,
}: {
  moment: WeddingMoment;
  index: number;
  checked: Set<string>;
  onToggleCheck: (momentId: string, item: string) => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const phaseClass = accentColor[moment.accent];
  const isEven = index % 2 === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      id={`moment-${moment.id}`}
    >
      {/* ligne timeline */}
      <div className="absolute top-0 bottom-0 left-[19px] w-px bg-line md:left-1/2" aria-hidden="true" />
      <div className="absolute top-10 left-[13px] z-10 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[3px] border-white bg-ink md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />

      <div className={`relative grid grid-cols-1 gap-6 pl-12 md:grid-cols-2 md:gap-12 md:pl-0 ${isEven ? '' : 'md:[&>*:first-child]:order-2'}`}>
        {/* visuel */}
        <div className={isEven ? 'md:pr-4' : 'md:pl-4'}>
          <button onClick={() => setOpen((v) => !v)} className="img-card group relative block w-full cursor-pointer overflow-hidden rounded-[20px] bg-mist text-left" aria-label={`${moment.title} — ${open ? 'réduire' : 'déplier'} les détails`}>
            <Visual src={moment.image} alt={moment.imageAlt} className="aspect-[4/3] w-full object-cover" />
            <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 font-display text-[12px] font-bold tracking-[0.02em]">
              {pad(index + 1)} · {moment.time}
            </span>
            <span className={`absolute top-3 right-3 rounded-full px-3 py-1 font-display text-[10px] font-bold tracking-[0.06em] uppercase ${phaseClass}`}>
              {moment.phase}
            </span>
            <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/95 py-1.5 pr-3 pl-3.5 font-display text-[11px] font-semibold tracking-[0.02em] uppercase opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
              {open ? 'Réduire' : 'Détails'} <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </button>
          <p className="mt-3 font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
            Visuel pop — {moment.location}
          </p>
        </div>

        {/* contenu */}
        <div className={isEven ? 'md:pl-4' : 'md:pr-4'}>
          <p className="flex flex-wrap items-center gap-2 font-display text-[12px] font-semibold tracking-[0.08em] text-smoke uppercase">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-ink">{weddingTimeLabel(moment)}</span>
            <Dot className="h-1.5 w-1.5 text-fog" />
            <MapPin className="h-3.5 w-3.5" /> {moment.location}
          </p>

          {/* horaire en grand titre */}
          <h3 className="display-type mt-3 text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.95]">
            {moment.time.replace(':', 'H')}
            {moment.endTime && <span className="text-fog text-[0.45em]"> — {moment.endTime.replace(':', 'H')}</span>}
          </h3>
          <h4 className="display-type mt-2 text-[clamp(1.3rem,2.4vw,2rem)]">
            <SplitTitle text={moment.title} />
          </h4>

          <p className="mt-3 max-w-[560px] text-[15.5px] leading-[1.75] text-neutral-600">{moment.description}</p>

          {/* infos rapides */}
          <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2">
            {[
              { icon: Sparkles, label: 'Ambiance', value: moment.ambiance },
              { icon: Music, label: 'Musique', value: moment.music },
              { icon: Shirt, label: 'Dress code', value: moment.dressCode },
              { icon: Users, label: 'Invités', value: moment.guests },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white p-4">
                <dt className="flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.08em] text-smoke uppercase">
                  <Icon className="h-3 w-3" /> {label}
                </dt>
                <dd className="mt-1.5 text-[13.5px] leading-snug font-medium text-neutral-700">{value || '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-[12px] font-semibold tracking-[0.04em] text-white uppercase transition-transform hover:scale-[1.03]"
            >
              {open ? 'Réduire les infos' : 'Toutes les infos'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onEdit}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-5 py-2.5 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink"
            >
              <Pencil className="h-3.5 w-3.5" /> Éditer ce moment
            </button>
          </div>

          {/* détails dépliables */}
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4 }} className="overflow-hidden">
              <div className="mt-5 rounded-[20px] bg-mist p-6">
                <p className="font-display text-[11px] font-semibold tracking-[0.1em] text-smoke uppercase">Contact / prestataire</p>
                <p className="mt-2 text-[15px] font-medium text-neutral-800">{moment.contact || '—'}</p>

                <p className="mt-5 font-display text-[11px] font-semibold tracking-[0.1em] text-smoke uppercase">À prévoir — checklist</p>
                <ul className="mt-3 space-y-2">
                  {moment.checklist.map((item) => {
                    const key = `${moment.id}:${item}`;
                    const done = checked.has(key);
                    return (
                      <li key={key}>
                        <button
                          onClick={() => onToggleCheck(moment.id, item)}
                          className="flex w-full cursor-pointer items-start gap-3 text-left"
                          aria-pressed={done}
                        >
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${done ? 'border-ink bg-ink text-white' : 'border-neutral-300 bg-white'}`}>
                            {done && <Check className="h-3 w-3" />}
                          </span>
                          <span className={`text-[14.5px] leading-snug ${done ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>{item}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {moment.notes && (
                  <>
                    <p className="mt-5 font-display text-[11px] font-semibold tracking-[0.1em] text-smoke uppercase">Notes & infos pratiques</p>
                    <p className="mt-2 text-[14.5px] leading-[1.7] text-neutral-600">{moment.notes}</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function WeddingPage({
  moments,
  onEditMoment,
  onEditTimeline,
  onAddMoment,
  previewId,
}: {
  moments: WeddingMoment[];
  onEditMoment: (id: string) => void;
  onEditTimeline: () => void;
  onAddMoment: () => void;
  previewId?: string | null;
}) {
  const [scrollTarget, setScrollTarget] = useState<string | null>(previewId ?? null);
  const [query, setQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('Tous');
  const [view, setView] = useState<'timeline' | 'grid'>('timeline');
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('souffle-wedding-check-v1') || '[]') as string[];
      return new Set(raw);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!scrollTarget || view !== 'timeline') return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`moment-${scrollTarget}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollTarget, view]);

  const scrollToMoment = (id: string) => {
    setQuery('');
    setPhaseFilter('Tous');
    setView('timeline');
    setScrollTarget(id);
  };
  const scrollToTimeline = () => document.getElementById('timeline-jour-j')?.scrollIntoView({ behavior: 'smooth' });

  const phases = useMemo(() => ['Tous', ...Array.from(new Set(moments.map((m) => m.phase)))], [moments]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return moments
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => {
        if (phaseFilter !== 'Tous' && m.phase !== phaseFilter) return false;
        if (!q) return true;
        return normalize(`${m.title} ${m.phase} ${m.location} ${m.description} ${m.ambiance} ${m.music} ${m.dressCode} ${m.guests} ${m.contact} ${m.notes} ${m.checklist.join(' ')}`).includes(q);
      });
  }, [moments, query, phaseFilter]);

  const toggleCheck = (momentId: string, item: string) => {
    const key = `${momentId}:${item}`;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem('souffle-wedding-check-v1', JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  };

  const totalCheckItems = moments.reduce((s, m) => s + m.checklist.length, 0);
  const doneCount = moments.reduce((sum, m) => sum + m.checklist.filter((item) => checked.has(`${m.id}:${item}`)).length, 0);

  return (
    <main>
      {/* HERO */}
      <section className="mx-auto max-w-[1440px] px-5 pt-10 md:px-10 md:pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display-type text-[clamp(2.35rem,5.9vw,5.9rem)]"
        >
          <span className="block md:whitespace-nowrap">
            Wedding <Asterisk /> <span className="text-fog">party</span>
          </span>
          <span className="block md:whitespace-nowrap">
            <span className="text-fog">Le jour-j,</span>
            <Sparkle /> de l’aube
          </span>
          <span className="block md:whitespace-nowrap">
            au lendemain <Dot /> <span className="text-fog">{moments.length} moments</span>
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-end justify-between gap-6 md:mt-10"
        >
          <p className="max-w-[560px] text-[17px] leading-relaxed text-neutral-600 md:text-[19px]">
            De l’aube au brunch du lendemain, chaque moment du mariage a son heure, son lieu, sa musique et son visuel pop.
            Tout est éditable : horaires, infos, checklist, contacts et images.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={scrollToTimeline}
              className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]"
            >
              <Clock className="h-4 w-4" /> Voir la timeline
            </button>
            <button
              onClick={onEditTimeline}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/70 px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:bg-ink hover:text-white"
            >
              <Pencil className="h-4 w-4" /> Éditer la timeline
            </button>
            <span className="font-display text-[12px] font-semibold tracking-[0.06em] text-smoke uppercase">
              Édition wedding · 2026 · Tout éditable
            </span>
          </div>
        </motion.div>

        {/* mosaïque */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 md:mt-14"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
            {[0, 4, 8].map((idx) => {
              const m = moments[idx];
              if (!m) return null;
              return (
                <button key={m.id} onClick={() => scrollToMoment(m.id)} className="img-card group relative block w-full overflow-hidden rounded-[20px] bg-mist" aria-label={`${m.title} — ${m.time}`}>
                  <Visual src={m.image} alt={m.imageAlt} className="aspect-[4/3] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/3]" />
                  <span className="absolute bottom-3 left-3 flex max-w-[92%] items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3 pl-3.5 font-display text-[11px] font-semibold tracking-[0.02em] uppercase opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                    <span className="text-smoke">{m.time}</span>
                    <span className="truncate">{m.title}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
            Visuels pop créés dans le style du site — un par moment, tous remplaçables dans l’éditeur
          </p>
        </motion.div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1440px] px-5 pt-24 md:px-10 md:pt-36">
        <p className="flex items-center gap-3 font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
          <span className="text-fog">01</span> Le jour-J <Asterisk className="h-3.5 w-3.5 text-ink" />
          De l’aube au lendemain, sans rien oublier
        </p>
        <h2 className="display-type mt-6 max-w-[1100px] text-[clamp(2rem,5.2vw,4.6rem)]">
          Chaque heure <span className="text-fog">a sa musique.</span>
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="max-w-[680px] text-[18px] leading-[1.8] text-neutral-700 md:text-[20px] md:leading-[1.75]">
              Cette timeline suit les mariés de l’aube au brunch du lendemain : réveil, préparatifs, habillage, first look,
              cérémonie, vin d’honneur, dîner, ouverture de bal, soirée dansante, pièce montée, dernière danse et lendemain.
              Pour chaque moment, retrouvez l’horaire en grand titre, le lieu, l’ambiance, la musique, le dress code, les invités,
              le contact et la checklist à cocher.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button onClick={onEditTimeline} className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]">
                <Pencil className="h-4 w-4" /> Personnaliser chaque moment <ArrowRight className="h-4 w-4" />
              </button>
              <span className="flex items-center rounded-full border border-line px-5 py-3 font-display text-[12px] font-semibold tracking-[0.06em] text-smoke uppercase">
                {moments.length} moments · {doneCount}/{totalCheckItems} tâches cochées
              </span>
            </div>
            <dl className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-3">
              {[
                ['De l’aube au lendemain', 'Une journée entière à imaginer à votre rythme'],
                ['Tout éditable', 'Horaires, lieux, musique, dress code, contacts, checklist, visuels'],
                ['Checklist intégrée', 'Cochez chaque tâche directement dans la timeline'],
              ].map(([t, d]) => (
                <div key={t} className="bg-white p-6">
                  <dt className="display-type text-[17px]">{t}</dt>
                  <dd className="mt-2 text-[14px] leading-relaxed text-neutral-500">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="lg:col-span-5">
            {moments[4] && (
              <button onClick={() => scrollToMoment(moments[4].id)} className="img-card group relative block w-full overflow-hidden rounded-[20px] bg-mist">
                <Visual src={moments[4].image} alt={moments[4].imageAlt} className="aspect-[4/3] w-full object-cover" />
                <span className="absolute bottom-3 left-3 flex max-w-[92%] items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3 pl-3.5 font-display text-[11px] font-semibold tracking-[0.02em] uppercase opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                  <span className="text-smoke">{moments[4].time}</span>
                  <span className="truncate">{moments[4].title}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                </span>
              </button>
            )}
            <div className="mt-5 rounded-[20px] bg-mist p-7">
              <p className="flex items-center gap-2 font-display text-[11px] font-semibold tracking-[0.1em] text-smoke uppercase">
                <Heart className="h-4 w-4 text-[#ff2e88]" /> Le fil conducteur
              </p>
              <p className="mt-3 text-[16.5px] leading-[1.75] text-neutral-700">
                Le saxophone suit les mariés toute la journée : de l’aube douce à la piste électrique, puis à la dernière danse.
                Chaque moment garde sa propre couleur — rose, jaune, bleu — comme les visuels du livre.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div className="pt-24 md:pt-32">
        <WeddingMarquee />
      </div>

      {/* TIMELINE */}
      <section id="timeline-jour-j" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pt-20 md:px-10 md:pt-28">
        <p className="flex items-center gap-3 font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
          <span className="text-fog">02</span> Timeline Jour-J <Sparkle className="h-3.5 w-3.5 text-ink" />
          {doneCount} / {totalCheckItems} tâches cochées
        </p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display-type text-[clamp(2rem,5.2vw,4.6rem)]">
            Le fil <span className="text-fog">du jour-J.</span>
          </h2>
          <p className="pb-2 text-[17px] text-neutral-500">{moments.length} moments. Une même fête.</p>
        </div>

        <div className="mt-6 h-[6px] overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={totalCheckItems} aria-label="Progression de la checklist">
          <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${totalCheckItems ? (doneCount / totalCheckItems) * 100 : 0}%` }} />
        </div>

        {/* recherche + filtres */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <label className="flex min-w-[260px] flex-1 items-center gap-2.5 rounded-full border border-line px-5 py-3 transition-colors focus-within:border-ink sm:max-w-[420px]">
            <Search className="h-4 w-4 shrink-0 text-smoke" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un moment, un lieu, une musique…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
              aria-label="Rechercher dans la timeline"
            />
            {query && (
              <button onClick={() => setQuery('')} className="cursor-pointer text-smoke hover:text-ink" aria-label="Effacer la recherche">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Filtrer par phase">
              {phases.map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={phaseFilter === p}
                  onClick={() => setPhaseFilter(p)}
                  className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${phaseFilter === p ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex rounded-full border border-line p-1" role="tablist" aria-label="Mode d’affichage">
              <button
                role="tab"
                aria-selected={view === 'timeline'}
                onClick={() => setView('timeline')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${view === 'timeline' ? 'bg-ink text-white' : 'hover:bg-mist'}`}
              >
                <List className="h-3.5 w-3.5" /> Timeline
              </button>
              <button
                role="tab"
                aria-selected={view === 'grid'}
                onClick={() => setView('grid')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${view === 'grid' ? 'bg-ink text-white' : 'hover:bg-mist'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grille
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-[17px] text-neutral-500">Aucun moment ne correspond à cette recherche.</p>
        ) : view === 'timeline' ? (
          <div className="mt-14 space-y-20 md:space-y-28">
            {filtered.map(({ m, i }) => (
              <MomentCard key={m.id} moment={m} index={i} checked={checked} onToggleCheck={toggleCheck} onEdit={() => onEditMoment(m.id)} />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ m }) => (
              <motion.article
                key={m.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <button onClick={() => scrollToMoment(m.id)} className="group block w-full text-left">
                  <span className="img-card relative block aspect-[4/3] overflow-hidden rounded-[20px] bg-mist">
                    <Visual src={m.image} alt={m.imageAlt} className="h-full w-full object-cover" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 font-display text-[12px] font-bold tracking-[0.02em]">
                      {m.time}
                    </span>
                    <span className={`absolute top-3 right-3 rounded-full px-3 py-1 font-display text-[10px] font-bold tracking-[0.06em] uppercase ${accentColor[m.accent]}`}>
                      {m.phase}
                    </span>
                  </span>
                  <span className="mt-4 flex items-center gap-3 font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                    <span>{m.location}</span>
                    <Dot className="h-1.5 w-1.5 text-fog" />
                    <span className="flex items-center gap-1 normal-case">
                      <Calendar className="h-3 w-3" /> {weddingTimeLabel(m)}
                    </span>
                  </span>
                  <h3 className="display-type mt-1.5 text-[clamp(1.25rem,1.7vw,1.55rem)] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                    <SplitTitle text={m.title} />
                  </h3>
                  <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-neutral-500">{m.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[12px] font-semibold tracking-[0.06em] uppercase">
                    Voir le moment <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </button>
                <button onClick={() => onEditMoment(m.id)} className="mt-3 flex cursor-pointer items-center gap-1.5 font-display text-[11px] font-semibold tracking-[0.06em] text-smoke uppercase hover:text-ink">
                  <Pencil className="h-3 w-3" /> Éditer
                </button>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-16 flex flex-wrap gap-3">
          <button onClick={onAddMoment} className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]">
            <Sparkles className="h-4 w-4" /> Ajouter un moment
          </button>
          <button onClick={onEditTimeline} className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/70 px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:bg-ink hover:text-white">
            <Pencil className="h-4 w-4" /> Éditer toute la timeline
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1440px] px-5 pt-28 pb-24 md:px-10 md:pt-40">
        <p className="font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">Lendemain — brunch & souvenirs</p>
        <h2 className="display-type mt-5 text-[clamp(2.4rem,6.6vw,6.2rem)]">
          Le prochain souffle <Dot /> <span className="text-fog">commence ici</span>
        </h2>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button onClick={onEditTimeline} className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]">
            <Pencil className="h-4 w-4" /> Personnaliser la timeline
          </button>
          <button onClick={scrollToTimeline} className="cursor-pointer rounded-full border border-ink/70 px-7 py-3.5 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:bg-ink hover:text-white">
            Revoir le Jour-J
          </button>
        </div>
        {moments[moments.length - 1] && (
          <button onClick={() => scrollToMoment(moments[moments.length - 1].id)} className="img-card group relative mt-12 block w-full overflow-hidden rounded-[20px] bg-mist">
            <Visual src={moments[moments.length - 1].image} alt={moments[moments.length - 1].imageAlt} className="aspect-[16/10] w-full object-cover sm:aspect-[21/9]" />
            <span className="absolute bottom-3 left-3 flex max-w-[92%] items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3 pl-3.5 font-display text-[11px] font-semibold tracking-[0.02em] uppercase opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
              <span className="text-smoke">{moments[moments.length - 1].time}</span>
              <span className="truncate">{moments[moments.length - 1].title}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </span>
          </button>
        )}
      </section>
    </main>
  );
}
