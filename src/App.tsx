import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Download,
  LayoutGrid,
  Link2,
  List,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { chapterData, type Chapter } from './data/chapters';

/* ------------------------------------------------------------------ utils */

const pad = (n: number) => String(n).padStart(2, '0');
const imgOf = (index: number) => `/images/chapters/${pad(index + 1)}.jpg`;
const wordCount = (c: Chapter) =>
  c.body.reduce((s, p) => s + p.split(/\s+/).length, 0) + c.practice.split(/\s+/).length;
const readMinutes = (c: Chapter) => Math.max(2, Math.round(wordCount(c) / 190));
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const excerptOf = (c: Chapter) => {
  const t = c.body[0];
  return t.length > 150 ? `${t.slice(0, 150).trimEnd()}…` : t;
};

const TOTAL_WORDS = chapterData.reduce((s, c) => s + wordCount(c), 0);
const TOTAL_MINUTES = Math.round(TOTAL_WORDS / 190);

/* ----------------------------------------------------- édition du livre */

/** Modifications apportées via l’éditeur (footer → « Éditer »). */
interface ChapterEdit {
  title?: string;
  theme?: string;
  body?: string[];
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  linkLabel?: string;
  linkUrl?: string;
}

/** Chapitre tel qu’affiché : texte d’origine + modifications éventuelles. */
interface EffectiveChapter extends Chapter {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  linkLabel?: string;
  linkUrl?: string;
}

/** Transforme une URL YouTube / Vimeo en URL d’intégration, sinon null. */
function embedUrlOf(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

/** Affiche un visuel de chapitre : image, vidéo (fichier/URL) ou vidéo intégrée. */
function Visual({
  src,
  type = 'image',
  alt,
  className = '',
  controls = false,
}: {
  src: string;
  type?: 'image' | 'video';
  alt: string;
  className?: string;
  controls?: boolean;
}) {
  if (type === 'video') {
    const embed = embedUrlOf(src);
    if (embed) {
      return (
        <iframe
          src={embed}
          title={alt}
          className={`${className} ${controls ? '' : 'pointer-events-none'}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={controls}
          loading="lazy"
        />
      );
    }
    return (
      <video
        src={src}
        className={`${className} ${controls ? '' : 'pointer-events-none'}`}
        controls={controls}
        autoPlay={!controls}
        muted
        loop={!controls}
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

const MANIFESTO =
  'De la première note au prochain souffle, ce récit suit un musicien entre graphisme, apprentissage solitaire, routes traversées et écoute des autres. Enfant de Comines, dans le Nord de la France, le souffleur porte une mémoire qui ne s’arrête pas à une frontière : elle reçoit une transmission venue de l’autre côté de l’Atlantique et de la Loire-Atlantique, comme un fil discret entre les rives, les voix et les générations. Une édition modernisée, pensée pour une lecture simple, sensible et ouverte.';

const NOTE_TRANSMISSION =
  'Des liens anciens remontent jusqu’au soldat de la flamme du Soldat inconnu. Ils ne forment pas une ligne droite, mais une braise : une mémoire reçue, déplacée, puis confiée à une nouvelle voix.';

/* ------------------------------------------------------------- glyphes ✱ ✦ */

function Asterisk({ className = 'h-[0.62em] w-[0.62em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block shrink-0 align-baseline ${className}`}>
      <g stroke="currentColor" strokeWidth="3.1" strokeLinecap="round">
        <path d="M12 1.5v21" />
        <path d="M3.8 5.6l16.4 12.8" />
        <path d="M20.2 5.6L3.8 18.4" />
      </g>
    </svg>
  );
}

function Sparkle({ className = 'h-[0.55em] w-[0.55em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block shrink-0 align-baseline ${className}`}>
      <path fill="currentColor" d="M12 0 Q13.6 10.4 24 12 Q13.6 13.6 12 24 Q10.4 13.6 0 12 Q10.4 10.4 12 0 Z" />
    </svg>
  );
}

function Dot({ className = 'h-[0.32em] w-[0.32em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className={`inline-block shrink-0 align-baseline ${className}`}>
      <circle cx="5" cy="5" r="5" fill="currentColor" />
    </svg>
  );
}

/** Titre en deux tons, façon capture : début noir, fin grise. */
function SplitTitle({ text, className = '' }: { text: string; className?: string }) {
  const words = text.toUpperCase().split(' ');
  const cut = Math.max(1, Math.ceil(words.length * 0.55));
  return (
    <span className={className}>
      {words.slice(0, cut).join(' ')}{' '}
      <span className="text-fog">{words.slice(cut).join(' ')}</span>
    </span>
  );
}

/* ----------------------------------------------------------------- header */

type NavTarget = 'top' | 'livre' | 'chapitres';

function Header({
  onNav,
  onStart,
  inReader,
}: {
  onNav: (t: NavTarget) => void;
  onStart: () => void;
  inReader: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between gap-4 px-5 md:px-10">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNav('top')}
            className="flex cursor-pointer items-center gap-2.5"
            aria-label="Matt Mez — Le souffle en voyage, retour à l’accueil"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e4e4e4] text-ink">
              <Asterisk className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[17px] font-bold tracking-[-0.02em] whitespace-nowrap">
              MATT&nbsp;MEZ<sup className="text-[9px] font-semibold">®</sup>
            </span>
          </button>
          <nav className="hidden items-center gap-7 text-[15px] font-medium md:flex" aria-label="Navigation principale">
            <button onClick={() => onNav('livre')} className="cursor-pointer transition-colors hover:text-smoke">
              Le livre
            </button>
            <button onClick={() => onNav('chapitres')} className="cursor-pointer transition-colors hover:text-smoke">
              Chapitres
            </button>
            <button onClick={onStart} className="cursor-pointer transition-colors hover:text-smoke">
              Lire
            </button>
          </nav>
        </div>
        <button
          onClick={inReader ? () => onNav('chapitres') : onStart}
          className="cursor-pointer rounded-full border border-ink/70 px-5 py-2 font-display text-[13px] font-semibold tracking-[0.01em] whitespace-nowrap uppercase transition-colors hover:bg-ink hover:text-white"
        >
          {inReader ? 'Sommaire' : 'Commencer la lecture'}
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ home */

function MosaicTile({
  src,
  mediaType = 'image',
  alt,
  caption,
  sub,
  onClick,
  className = '',
  imgClassName = '',
}: {
  src: string;
  mediaType?: 'image' | 'video';
  alt: string;
  caption: string;
  sub: string;
  onClick: () => void;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`img-card group relative block w-full cursor-pointer overflow-hidden rounded-[20px] bg-mist text-left ${className}`}
      aria-label={`${caption} — ouvrir le chapitre`}
    >
      <Visual src={src} type={mediaType} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} />
      <span className="absolute bottom-3 left-3 flex max-w-[92%] items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3 pl-3.5 font-display text-[11px] font-semibold tracking-[0.02em] uppercase opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
        <span className="text-smoke">{sub}</span>
        <span className="truncate">{caption}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
      </span>
    </button>
  );
}

function Marquee() {
  const items = ['Une voix', 'Un souffle', 'Un voyage', 'Mémoire', 'Regard', '22 chapitres'];
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

function ChapterCard({
  chapter,
  index,
  read,
  onOpen,
}: {
  chapter: EffectiveChapter;
  index: number;
  read: boolean;
  onOpen: (i: number) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <button onClick={() => onOpen(index)} className="group block w-full cursor-pointer text-left">
        <span className="img-card relative block aspect-[4/3] overflow-hidden rounded-[20px] bg-mist">
          <Visual
            src={chapter.mediaUrl}
            type={chapter.mediaType}
            alt={`Visuel artistique du chapitre ${index + 1} — ${chapter.title}`}
            className="h-full w-full object-cover"
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 font-display text-[12px] font-bold tracking-[0.02em]">
            {pad(index + 1)}
          </span>
          {read && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-display text-[10px] font-semibold tracking-[0.06em] text-white uppercase">
              <Check className="h-3 w-3" /> Lu
            </span>
          )}
        </span>
        <span className="mt-4 flex items-center gap-3 font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
          <span>{chapter.theme}</span>
          <Dot className="h-1.5 w-1.5 text-fog" />
          <span className="flex items-center gap-1 normal-case">
            <Clock className="h-3 w-3" /> {readMinutes(chapter)} min
          </span>
        </span>
        <h3 className="display-type mt-1.5 text-[clamp(1.25rem,1.7vw,1.55rem)] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
          <SplitTitle text={chapter.title} />
        </h3>
        <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-neutral-500">{excerptOf(chapter)}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[12px] font-semibold tracking-[0.06em] uppercase">
          Lire le chapitre
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </button>
    </motion.article>
  );
}

function ChapterRow({
  chapter,
  index,
  read,
  onOpen,
}: {
  chapter: EffectiveChapter;
  index: number;
  read: boolean;
  onOpen: (i: number) => void;
}) {
  return (
    <button
      onClick={() => onOpen(index)}
      className="group flex w-full cursor-pointer items-center gap-4 border-b border-line py-4 text-left md:gap-8 md:py-5"
    >
      <span className="display-type w-12 shrink-0 text-[clamp(1.6rem,3vw,2.6rem)] text-fog transition-colors group-hover:text-ink md:w-20">
        {pad(index + 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
          {chapter.theme} · {readMinutes(chapter)} min{read ? ' · Lu' : ''}
        </span>
        <span className="display-type mt-0.5 block truncate text-[clamp(1.15rem,2.6vw,2rem)] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
          <SplitTitle text={chapter.title} />
        </span>
      </span>
      <span className="img-card hidden h-[72px] w-[108px] shrink-0 overflow-hidden rounded-[14px] bg-mist sm:block md:h-[84px] md:w-[132px]">
        <Visual src={chapter.mediaUrl} type={chapter.mediaType} alt="" className="h-full w-full object-cover" />
      </span>
      <ArrowUpRight className="h-6 w-6 shrink-0 text-fog transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
    </button>
  );
}

function Home({
  chapters,
  onOpen,
  readSet,
  lastRead,
}: {
  chapters: EffectiveChapter[];
  onOpen: (i: number) => void;
  readSet: Set<number>;
  lastRead: number | null;
}) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'mosaic' | 'list'>('mosaic');

  const totalWords = chapters.reduce((s, c) => s + wordCount(c), 0);
  const totalMinutes = Math.round(totalWords / 190);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return chapters.map((c, i) => ({ c, i }));
    return chapters
      .map((c, i) => ({ c, i }))
      .filter(({ c }) =>
        normalize(`${c.title} ${c.theme} ${c.body.join(' ')}`).includes(q),
      );
  }, [query, chapters]);

  const resumeIndex =
    lastRead !== null && lastRead < chapters.length - 1 ? lastRead + 1 : (lastRead ?? 0);

  return (
    <main>
      {/* ---------------------------------------------------------- HERO */}
      <section className="mx-auto max-w-[1440px] px-5 pt-10 md:px-10 md:pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display-type text-[clamp(2.35rem,5.9vw,5.9rem)]"
        >
          <span className="block md:whitespace-nowrap">
            Le souffle <Asterisk /> <span className="text-fog">en voyage</span>
          </span>
          <span className="block md:whitespace-nowrap">
            <span className="text-fog">Matt Mez,</span>
            <Sparkle /> un saxophone
          </span>
          <span className="block md:whitespace-nowrap">
            cherche sa voix <Dot /> <span className="text-fog">22 chapitres</span>
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-end justify-between gap-6 md:mt-10"
        >
          <p className="max-w-[560px] text-[17px] leading-relaxed text-neutral-600 md:text-[19px]">
            Un saxophone cherche sa voix et découvre que chaque respiration peut devenir un
            commencement. Une voix née à Comines, dans le Nord de la France.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpen(resumeIndex)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]"
            >
              <BookOpen className="h-4 w-4" />
              {lastRead !== null ? `Reprendre — chapitre ${pad(resumeIndex + 1)}` : 'Lire le livre'}
            </button>
            <span className="font-display text-[12px] font-semibold tracking-[0.06em] text-smoke uppercase">
              Édition enrichie · 2026 · Lecture libre
            </span>
          </div>
        </motion.div>

        {/* mosaïque d’ouverture, comme sur la capture */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 md:mt-14"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
            <MosaicTile
              src="/images/hero-trio.jpg"
              alt="Trois musiciens en costumes pop tenant un saxophone doré devant un fond rose"
              caption={chapters[0].title}
              sub="Ch. 01"
              imgClassName="object-[50%_12%]"
              onClick={() => onOpen(0)}
              className="aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3]"
            />
            <MosaicTile
              src={chapters[5].mediaUrl}
              mediaType={chapters[5].mediaType}
              alt={`Visuel artistique du chapitre 6 — ${chapters[5].title}`}
              caption={chapters[5].title}
              sub="Ch. 06"
              onClick={() => onOpen(5)}
              className="aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3]"
            />
            <MosaicTile
              src="/images/hero-topiary.jpg"
              alt="Personnage en costume bleu cobalt à la tête de topiaire verte tenant un saxophone, fond rose et soleil jaune"
              caption={chapters[15].title}
              sub="Ch. 16"
              onClick={() => onOpen(15)}
              className="aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3]"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-5 md:gap-5">
            <MosaicTile
              src={chapters[2].mediaUrl}
              mediaType={chapters[2].mediaType}
              alt={`Visuel artistique du chapitre 3 — ${chapters[2].title}`}
              caption={chapters[2].title}
              sub="Ch. 03"
              onClick={() => onOpen(2)}
              className="aspect-[16/9] sm:aspect-[2/1]"
            />
            <MosaicTile
              src={chapters[9].mediaUrl}
              mediaType={chapters[9].mediaType}
              alt={`Visuel artistique du chapitre 10 — ${chapters[9].title}`}
              caption={chapters[9].title}
              sub="Ch. 10"
              onClick={() => onOpen(9)}
              className="aspect-[16/9] sm:aspect-[2/1]"
            />
          </div>
          <p className="mt-3 font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
            Visuels originaux créés pour cette édition — un par chapitre
          </p>
        </motion.div>
      </section>

      {/* -------------------------------------------------------- LE LIVRE */}
      <section id="livre" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pt-24 md:px-10 md:pt-36">
        <p className="flex items-center gap-3 font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
          <span className="text-fog">01</span> Le livre <Asterisk className="h-3.5 w-3.5 text-ink" />
          Une histoire de mémoire, de regard et de voyage
        </p>
        <h2 className="display-type mt-6 max-w-[1100px] text-[clamp(2rem,5.2vw,4.6rem)]">
          Le son ne se voit pas. <span className="text-fog">Pourtant, il laisse une empreinte.</span>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="max-w-[680px] text-[18px] leading-[1.8] text-neutral-700 md:text-[20px] md:leading-[1.75]">
              {MANIFESTO}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                onClick={() => onOpen(0)}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]"
              >
                Commencer au premier chapitre <ArrowRight className="h-4 w-4" />
              </button>
              <span className="flex items-center rounded-full border border-line px-5 py-3 font-display text-[12px] font-semibold tracking-[0.06em] text-smoke uppercase">
                22 chapitres · {totalWords.toLocaleString('fr-FR')} mots · ≈ {totalMinutes} min de lecture
              </span>
            </div>

            <dl className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-3">
              {[
                ['Comines', 'Une voix née dans le Nord de la France'],
                ['Du trait au son', 'Du graphisme au saxophone, une même attention'],
                ['Autodidacte', 'L’école invisible : écouter, reprendre, patienter'],
              ].map(([t, d]) => (
                <div key={t} className="bg-white p-6">
                  <dt className="display-type text-[17px]">{t}</dt>
                  <dd className="mt-2 text-[14px] leading-relaxed text-neutral-500">{d}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="lg:col-span-5">
            <MosaicTile
              src={chapters[7].mediaUrl}
              mediaType={chapters[7].mediaType}
              alt={`Visuel artistique du chapitre 8 — ${chapters[7].title}`}
              caption={chapters[7].title}
              sub="Ch. 08"
              onClick={() => onOpen(7)}
              className="aspect-[4/3]"
            />
            <div className="mt-5 rounded-[20px] bg-mist p-7">
              <p className="font-display text-[11px] font-semibold tracking-[0.1em] text-smoke uppercase">
                Note de transmission
              </p>
              <p className="mt-3 text-[16.5px] leading-[1.75] text-neutral-700">{NOTE_TRANSMISSION}</p>
            </div>
          </aside>
        </div>
      </section>

      <div className="pt-24 md:pt-32">
        <Marquee />
      </div>

      {/* ------------------------------------------------------ CHAPITRES */}
      <section id="chapitres" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pt-20 md:px-10 md:pt-28">
        <p className="flex items-center gap-3 font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
          <span className="text-fog">02</span> Table des matières <Sparkle className="h-3.5 w-3.5 text-ink" />
          {readSet.size} / 22 chapitres lus
        </p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display-type text-[clamp(2rem,5.2vw,4.6rem)]">
            Le fil <span className="text-fog">du récit.</span>
          </h2>
          <p className="pb-2 text-[17px] text-neutral-500">Vingt-deux étapes. Une même voix.</p>
        </div>

        {/* barre de progression */}
        <div className="mt-6 h-[6px] overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={readSet.size} aria-valuemin={0} aria-valuemax={22} aria-label="Progression de lecture">
          <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${(readSet.size / 22) * 100}%` }} />
        </div>

        {/* recherche + bascule de vue */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <label className="flex min-w-[260px] flex-1 items-center gap-2.5 rounded-full border border-line px-5 py-3 transition-colors focus-within:border-ink sm:max-w-[420px]">
            <Search className="h-4 w-4 shrink-0 text-smoke" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un chapitre, un thème, un mot…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
              aria-label="Rechercher dans les chapitres"
            />
            {query && (
              <button onClick={() => setQuery('')} className="cursor-pointer text-smoke hover:text-ink" aria-label="Effacer la recherche">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="flex items-center gap-4">
            <span className="font-display text-[12px] font-semibold tracking-[0.06em] text-smoke uppercase">
              {filtered.length} chapitre{filtered.length > 1 ? 's' : ''}
            </span>
            <div className="flex rounded-full border border-line p-1" role="tablist" aria-label="Mode d’affichage">
              <button
                role="tab"
                aria-selected={view === 'mosaic'}
                onClick={() => setView('mosaic')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${view === 'mosaic' ? 'bg-ink text-white' : 'hover:bg-mist'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Mosaïque
              </button>
              <button
                role="tab"
                aria-selected={view === 'list'}
                onClick={() => setView('list')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${view === 'list' ? 'bg-ink text-white' : 'hover:bg-mist'}`}
              >
                <List className="h-3.5 w-3.5" /> Liste
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-[17px] text-neutral-500">
            Aucun chapitre ne correspond à cette recherche.
          </p>
        ) : view === 'mosaic' ? (
          <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ c, i }) => (
              <ChapterCard key={i} chapter={c} index={i} read={readSet.has(i)} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <div className="mt-8 border-t border-line">
            {filtered.map(({ c, i }) => (
              <ChapterRow key={i} chapter={c} index={i} read={readSet.has(i)} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ CTA */}
      <section className="mx-auto max-w-[1440px] px-5 pt-28 pb-24 md:px-10 md:pt-40">
        <p className="font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
          Chapitre 22 — L’ouverture
        </p>
        <h2 className="display-type mt-5 text-[clamp(2.4rem,6.6vw,6.2rem)]">
          Le prochain souffle <Dot /> <span className="text-fog">commence ici</span>
        </h2>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button
            onClick={() => onOpen(0)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]"
          >
            <BookOpen className="h-4 w-4" /> Ouvrir le premier chapitre
          </button>
          <button
            onClick={() => onOpen(21)}
            className="cursor-pointer rounded-full border border-ink/70 px-7 py-3.5 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:bg-ink hover:text-white"
          >
            Aller à la dernière page
          </button>
        </div>
        <MosaicTile
          src={chapters[21].mediaUrl}
          mediaType={chapters[21].mediaType}
          alt={`Visuel artistique du chapitre 22 — ${chapters[21].title}`}
          caption={chapters[21].title}
          sub="Ch. 22"
          onClick={() => onOpen(21)}
          className="mt-12 aspect-[16/10] sm:aspect-[21/9]"
        />
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------- reader */

function Reader({
  chapters,
  index,
  readSet,
  onOpen,
  onHome,
  onToggleRead,
  onMarkRead,
}: {
  chapters: EffectiveChapter[];
  index: number;
  readSet: Set<number>;
  onOpen: (i: number) => void;
  onHome: (t: NavTarget) => void;
  onToggleRead: (i: number) => void;
  onMarkRead: (i: number) => void;
}) {
  const chapter = chapters[index];
  const prev = index > 0 ? index - 1 : null;
  const next = index < chapters.length - 1 ? index + 1 : null;
  const isRead = readSet.has(index);
  const marked = useRef(false);

  /* navigation clavier */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && next !== null) onOpen(next);
      if (e.key === 'ArrowLeft' && prev !== null) onOpen(prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onOpen]);

  /* marque comme lu en fin de lecture */
  useEffect(() => {
    marked.current = false;
    const onScroll = () => {
      if (marked.current) return;
      const el = document.getElementById('fin-chapitre');
      if (el && el.getBoundingClientRect().top < window.innerHeight) {
        marked.current = true;
        onMarkRead(index);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [index, onMarkRead]);

  const mid = Math.ceil(chapter.body.length / 2);

  return (
    <motion.main
      key={index}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1440px] px-5 pt-8 pb-20 md:px-10 md:pt-12"
    >
      {/* fil d’Ariane */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onHome('chapitres')}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Sommaire
        </button>
        <p className="font-display text-[12px] font-semibold tracking-[0.08em] text-smoke uppercase">
          Chapitre {pad(index + 1)} / 22 · {readMinutes(chapter)} min de lecture
        </p>
        <span className="rounded-full bg-ink px-4 py-2 font-display text-[12px] font-semibold tracking-[0.06em] text-white uppercase">
          {chapter.theme}
        </span>
      </div>

      {/* titre */}
      <div className="mt-12 flex items-start gap-5 md:mt-16 md:gap-8">
        <span className="display-type text-[clamp(3rem,8vw,7.5rem)] text-fog select-none">{pad(index + 1)}</span>
        <div className="pt-2 md:pt-4">
          <h1 className="display-type max-w-[900px] text-[clamp(2rem,5.4vw,4.8rem)]">
            <SplitTitle text={chapter.title} />
          </h1>
          <p className="mt-4 flex items-center gap-2.5 font-display text-[13px] font-semibold tracking-[0.08em] text-smoke uppercase">
            <Asterisk className="h-4 w-4 text-ink" /> {chapter.theme} — Le souffle en voyage, Matt Mez
          </p>
        </div>
      </div>

      {/* visuel (ou vidéo) du chapitre */}
      <figure className="mt-10 md:mt-14">
        <div className="overflow-hidden rounded-[24px] bg-mist">
          <Visual
            src={chapter.mediaUrl}
            type={chapter.mediaType}
            alt={`Visuel artistique du chapitre ${index + 1} — ${chapter.title}`}
            className="aspect-[16/11] w-full object-cover sm:aspect-[21/10] lg:aspect-[21/9]"
            controls
          />
        </div>
        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
          <span>{chapter.mediaType === 'video' ? 'Vidéo' : 'Visuel'} — chapitre {pad(index + 1)} · {chapter.title}</span>
          {chapter.linkUrl ? (
            <a
              href={chapter.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-ink/60 px-3.5 py-1.5 text-ink normal-case transition-colors hover:bg-ink hover:text-white"
            >
              <Link2 className="h-3.5 w-3.5" />
              {chapter.linkLabel?.trim() || 'Lien associé au chapitre'}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="hidden sm:block">Direction artistique originale, 2026</span>
          )}
        </figcaption>
      </figure>

      {/* texte du chapitre, repris intégralement */}
      <article className="chapter-body mx-auto mt-16 max-w-[700px] md:mt-20" aria-label={`Texte du chapitre ${index + 1}`}>
        {chapter.body.map((p, i) => (
          <div key={i}>
            {i === mid && (
              <div className="my-12 flex items-center justify-center gap-4 text-fog" aria-hidden="true">
                <span className="h-px w-16 bg-line" />
                <Sparkle className="h-4 w-4" />
                <span className="h-px w-16 bg-line" />
              </div>
            )}
            <p
              className={
                i === 0
                  ? 'lead mb-8 text-[21px] leading-[1.65] text-ink md:text-[23px]'
                  : 'mb-7 text-[18px] leading-[1.85] text-neutral-800 md:text-[19px]'
              }
            >
              {p}
            </p>
          </div>
        ))}

        <div id="fin-chapitre" className="my-14 flex items-center justify-center gap-3 text-fog" aria-hidden="true">
          <Dot className="h-2 w-2" />
          <Dot className="h-2 w-2" />
          <Dot className="h-2 w-2" />
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => onToggleRead(index)}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${
              isRead ? 'bg-ink text-white' : 'border border-ink/60 hover:bg-ink hover:text-white'
            }`}
            aria-pressed={isRead}
          >
            <Check className="h-3.5 w-3.5" />
            {isRead ? 'Chapitre lu' : 'Marquer comme lu'}
          </button>
        </div>
      </article>

      {/* précédent / suivant */}
      <nav className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5" aria-label="Navigation entre chapitres">
        {prev !== null ? (
          <MosaicTile
            src={chapters[prev].mediaUrl}
            mediaType={chapters[prev].mediaType}
            alt={`Chapitre précédent — ${chapters[prev].title}`}
            caption={chapters[prev].title}
            sub={`← Ch. ${pad(prev + 1)}`}
            onClick={() => onOpen(prev)}
            className="aspect-[16/9]"
          />
        ) : (
          <div className="flex aspect-[16/9] items-center rounded-[20px] bg-mist p-7">
            <p className="display-type text-[clamp(1.2rem,2.4vw,1.8rem)] text-fog">Première page du récit</p>
          </div>
        )}
        {next !== null ? (
          <MosaicTile
            src={chapters[next].mediaUrl}
            mediaType={chapters[next].mediaType}
            alt={`Chapitre suivant — ${chapters[next].title}`}
            caption={chapters[next].title}
            sub={`Ch. ${pad(next + 1)} →`}
            onClick={() => onOpen(next)}
            className="aspect-[16/9]"
          />
        ) : (
          <button
            onClick={() => onHome('chapitres')}
            className="flex aspect-[16/9] cursor-pointer flex-col items-start justify-center gap-3 rounded-[20px] bg-ink p-7 text-left text-white"
          >
            <span className="font-display text-[11px] font-semibold tracking-[0.1em] text-white/60 uppercase">Fin du récit</span>
            <span className="display-type text-[clamp(1.3rem,2.6vw,2rem)]">Revenir au sommaire</span>
            <ArrowUpRight className="h-6 w-6" />
          </button>
        )}
      </nav>
      <div className="mt-4 flex justify-between font-display text-[12px] font-semibold tracking-[0.06em] text-smoke uppercase">
        <span>{prev !== null ? 'Chapitre précédent' : ''}</span>
        <span>{next !== null ? 'Chapitre suivant' : 'Le prochain souffle vous attend ailleurs'}</span>
      </div>

      {/* sommaire express */}
      <div className="no-scrollbar mt-14 flex gap-2 overflow-x-auto border-t border-line pt-8" aria-label="Sommaire express">
        {chapters.map((c, i) => (
          <button
            key={i}
            onClick={() => onOpen(i)}
            aria-current={i === index}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-display text-[12px] font-semibold tracking-[0.03em] whitespace-nowrap uppercase transition-colors ${
              i === index
                ? 'border-ink bg-ink text-white'
                : 'border-line hover:border-ink'
            }`}
          >
            {pad(i + 1)}
            <span className={i === index ? 'text-white/70' : 'text-smoke'}>{c.title}</span>
            {readSet.has(i) && <Check className="h-3 w-3" />}
          </button>
        ))}
      </div>
    </motion.main>
  );
}

/* ---------------------------------------------------------------- éditeur */

const fieldClass =
  'w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink placeholder:text-neutral-400';
const labelClass =
  'mb-2 block font-display text-[11px] font-semibold tracking-[0.09em] text-smoke uppercase';

function Editor({
  chapters,
  edits,
  onSave,
  onResetChapter,
  onResetAll,
  onClose,
  onPreview,
}: {
  chapters: EffectiveChapter[];
  edits: Record<number, ChapterEdit>;
  onSave: (i: number, edit: ChapterEdit) => void;
  onResetChapter: (i: number) => void;
  onResetAll: () => void;
  onClose: () => void;
  onPreview: (i: number) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState('');
  const makeDraft = useCallback(
    (i: number) => ({
      title: chapters[i].title,
      theme: chapters[i].theme,
      bodyText: chapters[i].body.join('\n\n'),
      mediaType: chapters[i].mediaType,
      mediaUrl: edits[i]?.mediaUrl ?? '',
      linkLabel: chapters[i].linkLabel ?? '',
      linkUrl: chapters[i].linkUrl ?? '',
    }),
    [chapters, edits],
  );
  const [draft, setDraft] = useState(() => makeDraft(0));

  useEffect(() => {
    setDraft(makeDraft(selected));
    setNotice('');
    // uniquement au changement de chapitre : ne pas effacer le brouillon
    // ni le message de confirmation après un enregistrement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const originalDraft = (i: number) => ({
    title: chapterData[i].title,
    theme: chapterData[i].theme,
    bodyText: chapterData[i].body.join('\n\n'),
    mediaType: 'image' as const,
    mediaUrl: '',
    linkLabel: '',
    linkUrl: '',
  });

  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      set({
        mediaUrl: String(reader.result),
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
      });
      setNotice(
        file.size > 3_500_000
          ? `« ${file.name} » chargé, mais le fichier est volumineux : le stockage du navigateur pourrait ne pas le conserver après fermeture. Pour un gros fichier, privilégiez une URL (YouTube, Vimeo, MP4 hébergé…).`
          : `« ${file.name} » chargé — pensez à enregistrer.`,
      );
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const paragraphs = draft.bodyText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    onSave(selected, {
      title: draft.title.trim() || chapterData[selected].title,
      theme: draft.theme.trim() || chapterData[selected].theme,
      body: paragraphs.length ? paragraphs : chapterData[selected].body,
      mediaType: draft.mediaType,
      mediaUrl: draft.mediaUrl.trim() || undefined,
      linkLabel: draft.linkLabel.trim() || undefined,
      linkUrl: draft.linkUrl.trim() || undefined,
    });
    setNotice(`Chapitre ${pad(selected + 1)} enregistré — la modification est visible immédiatement sur le site (dans ce navigateur).`);
  };

  const exportEdits = () => {
    const blob = new Blob([JSON.stringify(edits, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'le-souffle-en-voyage-modifications.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const previewSrc = draft.mediaUrl.trim() || imgOf(selected);

  return (
    <main className="mx-auto max-w-[1440px] px-5 pt-10 pb-24 md:px-10 md:pt-14">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="flex items-center gap-3 font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
            <Pencil className="h-4 w-4 text-ink" /> Édition du livre
          </p>
          <h1 className="display-type mt-4 text-[clamp(2rem,5vw,4.2rem)]">
            Éditer <Asterisk /> <span className="text-fog">les textes & visuels</span>
          </h1>
          <p className="mt-4 max-w-[640px] text-[15.5px] leading-relaxed text-neutral-500">
            Choisissez un chapitre, modifiez son titre, son texte, remplacez son visuel par une
            image ou une vidéo (fichier, URL MP4, YouTube ou Vimeo) et ajoutez un lien associé.
            Les modifications s’appliquent aussitôt et sont conservées dans ce navigateur ;
            exportez-les en JSON pour les sauvegarder ou les transmettre.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/70 px-5 py-2.5 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:bg-ink hover:text-white"
        >
          <X className="h-4 w-4" /> Revenir au site
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* liste des chapitres */}
        <aside className="lg:col-span-4">
          <p className={labelClass}>Chapitres — {Object.keys(edits).length} modifié(s)</p>
          <div className="max-h-[560px] overflow-y-auto rounded-[20px] border border-line">
            {chapters.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                aria-current={i === selected}
                className={`flex w-full cursor-pointer items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 ${i === selected ? 'bg-ink text-white' : 'hover:bg-mist'}`}
              >
                <span className={`font-display text-[13px] font-bold ${i === selected ? 'text-white/60' : 'text-fog'}`}>{pad(i + 1)}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{c.title}</span>
                {edits[i] && (
                  <span className={`flex shrink-0 items-center gap-1 font-display text-[10px] font-semibold tracking-[0.05em] uppercase ${i === selected ? 'text-white/70' : 'text-smoke'}`}>
                    <Pencil className="h-3 w-3" /> Modifié
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={exportEdits} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[11px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink">
              <Download className="h-3.5 w-3.5" /> Exporter (JSON)
            </button>
            <button
              onClick={() => { onResetAll(); setDraft(originalDraft(selected)); setNotice('Toutes les modifications ont été effacées : le site affiche à nouveau les textes et visuels d’origine.'); }}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[11px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Tout réinitialiser
            </button>
          </div>
        </aside>

        {/* formulaire du chapitre sélectionné */}
        <section className="lg:col-span-8" aria-label={`Édition du chapitre ${selected + 1}`}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="ed-title">Titre du chapitre {pad(selected + 1)}</label>
              <input id="ed-title" className={fieldClass} value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="ed-theme">Thème</label>
              <input id="ed-theme" className={fieldClass} value={draft.theme} onChange={(e) => set({ theme: e.target.value })} />
            </div>
          </div>

          <div className="mt-6">
            <label className={labelClass} htmlFor="ed-body">Texte du chapitre — un paragraphe par bloc, séparés par une ligne vide</label>
            <textarea
              id="ed-body"
              className={`${fieldClass} min-h-[340px] leading-[1.7]`}
              value={draft.bodyText}
              onChange={(e) => set({ bodyText: e.target.value })}
            />
          </div>

          <div className="mt-6 rounded-[20px] border border-line p-5 md:p-6">
            <p className={labelClass}>Visuel du chapitre — image ou vidéo</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="ed-type">Type de média</label>
                <select id="ed-type" className={fieldClass} value={draft.mediaType} onChange={(e) => set({ mediaType: e.target.value as 'image' | 'video' })}>
                  <option value="image">Image</option>
                  <option value="video">Vidéo</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="ed-file">…ou téléverser un fichier</label>
                <label htmlFor="ed-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-neutral-300 px-4 py-3 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink">
                  <Upload className="h-4 w-4" /> Image ou vidéo
                </label>
                <input id="ed-file" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </div>
            </div>
            <div className="mt-5">
              <label className={labelClass} htmlFor="ed-media">URL du média (vide = visuel d’origine)</label>
              <input id="ed-media" className={fieldClass} value={draft.mediaUrl} onChange={(e) => set({ mediaUrl: e.target.value })} placeholder="https://…/image.jpg, …/video.mp4, lien YouTube ou Vimeo" />
            </div>
            <div className="mt-5 overflow-hidden rounded-[16px] bg-mist">
              <Visual src={previewSrc} type={draft.mediaType} alt={`Aperçu du média du chapitre ${selected + 1}`} className="aspect-[16/9] w-full object-cover" controls />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="ed-link-label">Lien associé — libellé (optionnel)</label>
              <input id="ed-link-label" className={fieldClass} value={draft.linkLabel} onChange={(e) => set({ linkLabel: e.target.value })} placeholder="Écouter, Voir la vidéo, Lire l’article…" />
            </div>
            <div>
              <label className={labelClass} htmlFor="ed-link-url">Lien associé — URL</label>
              <input id="ed-link-url" className={fieldClass} value={draft.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>

          {notice && (
            <p className="mt-6 flex items-start gap-2 rounded-[14px] bg-mist px-4 py-3 text-[14px] leading-relaxed text-neutral-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={save} className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]">
              <Save className="h-4 w-4" /> Enregistrer le chapitre
            </button>
            <button onClick={() => onPreview(selected)} className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/70 px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:bg-ink hover:text-white">
              <BookOpen className="h-4 w-4" /> Voir le chapitre
            </button>
            <button
              onClick={() => { onResetChapter(selected); setDraft(originalDraft(selected)); setNotice(`Chapitre ${pad(selected + 1)} réinitialisé : texte et visuel d’origine restaurés.`); }}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:border-ink"
            >
              <RotateCcw className="h-4 w-4" /> Réinitialiser ce chapitre
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer({ onNav, onEdit }: { onNav: (t: NavTarget) => void; onEdit: () => void }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-8 md:px-10">
        <div>
          <p className="font-display text-[15px] font-bold tracking-[-0.01em]">
            LE SOUFFLE EN VOYAGE <span className="text-fog">— MATT MEZ · 2026</span>
          </p>
          <p className="mt-1 text-[13.5px] text-neutral-500">
            Textes des 22 chapitres repris de l’édition enrichie en ligne · Enfant de Comines, Nord de la France
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-display text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase md:block">
            Une voix · Un souffle · Un voyage
          </span>
          <button
            onClick={onEdit}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink"
          >
            <Pencil className="h-3.5 w-3.5" /> Éditer
          </button>
          <button
            onClick={() => onNav('top')}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink"
          >
            Remonter <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------- app */

function parseHash(): number | null {
  const m = window.location.hash.match(/^#\/chapitre\/(\d{1,2})$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= chapterData.length ? n - 1 : null;
}

/* Accès au stockage toujours protégé : dans une iframe sandboxée, en
   navigation privée ou si les cookies sont bloqués, localStorage lève
   une SecurityError — sans ce garde-fou, l’application plantait dès le
   premier rendu (page blanche / rechargements en boucle de l’aperçu). */
const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* stockage indisponible : la lecture continue sans persistance */
    }
  },
};

export default function App() {
  const [chapter, setChapter] = useState<number | null>(() => parseHash());
  const [readSet, setReadSet] = useState<Set<number>>(() => {
    try {
      const raw = JSON.parse(storage.get('souffle-read-v1') || '[]') as number[];
      return new Set(raw.filter((n) => Number.isInteger(n) && n >= 0 && n < 22));
    } catch {
      return new Set();
    }
  });
  const [lastRead, setLastRead] = useState<number | null>(() => {
    const saved = storage.get('souffle-last-v1');
    const v = Number(saved);
    return saved !== null && v >= 0 && v < 22 ? v : null;
  });
  /* modifications de l’éditeur (footer → « Éditer »), conservées dans le navigateur */
  const [edits, setEdits] = useState<Record<number, ChapterEdit>>(() => {
    try {
      return JSON.parse(storage.get('souffle-edits-v1') || '{}') as Record<number, ChapterEdit>;
    } catch {
      return {};
    }
  });
  const [editing, setEditing] = useState(() => window.location.hash === '#/editer');
  const chapters = useMemo<EffectiveChapter[]>(
    () =>
      chapterData.map((c, i) => {
        const e = edits[i];
        return {
          ...c,
          title: e?.title?.trim() || c.title,
          theme: e?.theme?.trim() || c.theme,
          body: e?.body?.length ? e.body : c.body,
          mediaType: e?.mediaType || 'image',
          mediaUrl: e?.mediaUrl?.trim() || imgOf(i),
          linkLabel: e?.linkLabel,
          linkUrl: e?.linkUrl,
        };
      }),
    [edits],
  );
  const pendingScroll = useRef<NavTarget | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#/editer') setEditing(true);
      else {
        setEditing(false);
        setChapter(parseHash());
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = editing
      ? 'Éditer — Le souffle en voyage, Matt Mez'
      : chapter === null
        ? 'Le souffle en voyage — Matt Mez'
        : `${chapters[chapter].title} — Le souffle en voyage, Matt Mez`;
    if (pendingScroll.current) {
      const target = pendingScroll.current;
      pendingScroll.current = null;
      requestAnimationFrame(() => {
        if (target === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      });
    } else if (!editing) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, editing]);

  const openChapter = useCallback((i: number) => {
    window.location.hash = `#/chapitre/${i + 1}`;
    setChapter(i);
    setLastRead(i);
    storage.set('souffle-last-v1', String(i));
  }, []);

  const goHome = useCallback(
    (target: NavTarget) => {
      if (editing) {
        pendingScroll.current = target;
        setEditing(false);
        if (chapter !== null) {
          window.location.hash = '#/';
          setChapter(null);
        }
        return;
      }
      if (chapter !== null) {
        pendingScroll.current = target;
        window.location.hash = '#/';
        setChapter(null);
      } else if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [chapter, editing],
  );

  const persistRead = useCallback((next: Set<number>) => {
    setReadSet(next);
    storage.set('souffle-read-v1', JSON.stringify([...next]));
  }, []);

  const markRead = useCallback(
    (i: number) => {
      setReadSet((prevSet) => {
        if (prevSet.has(i)) return prevSet;
        const next = new Set(prevSet).add(i);
        storage.set('souffle-read-v1', JSON.stringify([...next]));
        return next;
      });
    },
    [],
  );

  const toggleRead = useCallback(
    (i: number) => {
      const next = new Set(readSet);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      persistRead(next);
    },
    [readSet, persistRead],
  );

  const startReading = useCallback(() => {
    openChapter(lastRead !== null && lastRead < 21 ? lastRead + 1 : (lastRead ?? 0));
  }, [openChapter, lastRead]);

  /* ----- éditeur ----- */
  const openEditor = useCallback(() => {
    window.location.hash = '#/editer';
    setEditing(true);
    window.scrollTo({ top: 0 });
  }, []);
  const closeEditor = useCallback(() => {
    setEditing(false);
    window.location.hash = chapter !== null ? `#/chapitre/${chapter + 1}` : '#/';
    window.scrollTo({ top: 0 });
  }, [chapter]);
  const previewChapter = useCallback(
    (i: number) => {
      setEditing(false);
      openChapter(i);
    },
    [openChapter],
  );
  const saveEdit = useCallback((i: number, edit: ChapterEdit) => {
    setEdits((prev) => {
      const next = { ...prev, [i]: edit };
      storage.set('souffle-edits-v1', JSON.stringify(next));
      return next;
    });
  }, []);
  const resetChapter = useCallback((i: number) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[i];
      storage.set('souffle-edits-v1', JSON.stringify(next));
      return next;
    });
  }, []);
  const resetAllEdits = useCallback(() => {
    setEdits({});
    storage.set('souffle-edits-v1', '{}');
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* progression de lecture */}
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-ink"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
      <Header onNav={goHome} onStart={startReading} inReader={chapter !== null && !editing} />
      {editing ? (
        <Editor
          chapters={chapters}
          edits={edits}
          onSave={saveEdit}
          onResetChapter={resetChapter}
          onResetAll={resetAllEdits}
          onClose={closeEditor}
          onPreview={previewChapter}
        />
      ) : (
        <AnimatePresence mode="wait">
          {chapter === null ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Home chapters={chapters} onOpen={openChapter} readSet={readSet} lastRead={lastRead} />
            </motion.div>
          ) : (
            <Reader
              key={`ch-${chapter}`}
              chapters={chapters}
              index={chapter}
              readSet={readSet}
              onOpen={openChapter}
              onHome={goHome}
              onToggleRead={toggleRead}
              onMarkRead={markRead}
            />
          )}
        </AnimatePresence>
      )}
      <Footer onNav={goHome} onEdit={openEditor} />
    </div>
  );
}
