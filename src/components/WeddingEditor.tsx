import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  WEDDING_PHASES,
  weddingDefault,
  type WeddingAccent,
  type WeddingMoment,
  isWeddingTimeline,
} from '../data/wedding';
import { Asterisk, Visual } from './glyphs';
import { pad } from './visual-utils';

const fieldClass =
  'w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink placeholder:text-neutral-400';
const labelClass =
  'mb-2 block font-display text-[11px] font-semibold tracking-[0.09em] text-smoke uppercase';

function uid() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function WeddingEditor({
  moments,
  initialId,
  onSave,
  onReset,
  onClose,
  onPreview,
}: {
  moments: WeddingMoment[];
  initialId?: string | null;
  onSave: (next: WeddingMoment[]) => void;
  onReset: () => void;
  onClose: () => void;
  onPreview: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(initialId ?? moments[0]?.id ?? '');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<WeddingMoment | null>(() => moments.find((m) => m.id === (initialId ?? moments[0]?.id)) ?? moments[0] ?? null);

  const selectedIndex = moments.findIndex((m) => m.id === selectedId);

  const selectMoment = (moment: WeddingMoment) => {
    setSelectedId(moment.id);
    setDraft(moment);
    setNotice('');
  };

  const set = (patch: Partial<WeddingMoment>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const saveDraft = () => {
    if (!draft) return;
    const next = moments.map((m) => (m.id === draft.id ? { ...draft, checklist: draft.checklist.map((item) => item.trim()).filter(Boolean) } : m));
    onSave(next);
    setNotice(`Moment « ${draft.title} » (${draft.time}) enregistré — visible immédiatement dans la timeline.`);
  };

  const addMoment = () => {
    const blank: WeddingMoment = {
      id: uid(),
      time: '18:00',
      endTime: '19:00',
      title: 'Nouveau moment',
      phase: 'Réception',
      location: 'À définir',
      description: 'Décrivez ce moment du mariage…',
      ambiance: '',
      music: '',
      dressCode: '',
      guests: '',
      contact: '',
      checklist: ['Nouvelle tâche'],
      notes: '',
      image: '/images/wedding/01.jpg',
      imageAlt: 'Visuel pop du moment',
      accent: 'pink',
    };
    const next = [...moments, blank];
    onSave(next);
    selectMoment(blank);
    setNotice('Nouveau moment ajouté — complétez ses infos puis enregistrez.');
  };

  const duplicateMoment = () => {
    if (!draft) return;
    const copy: WeddingMoment = { ...draft, id: uid(), title: `${draft.title} (copie)` };
    const next = [...moments];
    next.splice(selectedIndex + 1, 0, copy);
    onSave(next);
    selectMoment(copy);
    setNotice('Moment dupliqué.');
  };

  const deleteMoment = () => {
    if (!draft) return;
    if (moments.length <= 1) {
      setNotice('Impossible de supprimer le dernier moment.');
      return;
    }
    const next = moments.filter((m) => m.id !== draft.id);
    onSave(next);
    const fallback = next[Math.max(0, selectedIndex - 1)] ?? next[0];
    selectMoment(fallback);
    setNotice(`Moment « ${draft.title} » supprimé.`);
  };

  const move = (dir: -1 | 1) => {
    const target = selectedIndex + dir;
    if (target < 0 || target >= moments.length) return;
    const next = [...moments];
    [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]];
    onSave(next);
    setNotice(`Moment déplacé ${dir === -1 ? 'vers le haut' : 'vers le bas'} — l’ordre de la timeline est mis à jour.`);
  };

  const onFile = (file: File | undefined) => {
    if (!file || !draft) return;
    const reader = new FileReader();
    reader.onload = () => {
      set({ image: String(reader.result) });
      setNotice(
        file.size > 3_500_000
          ? `« ${file.name} » chargé, mais volumineux : le navigateur pourrait ne pas le conserver. Privilégiez une URL hébergée.`
          : `« ${file.name} » chargé — pensez à enregistrer.`,
      );
    };
    reader.readAsDataURL(file);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(moments, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wedding-party-timeline.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as WeddingMoment[];
        if (!isWeddingTimeline(parsed)) throw new Error('format');
        onSave(parsed);
        selectMoment(parsed[0]);
        setNotice(`Timeline importée : ${parsed.length} moments.`);
      } catch {
        setNotice('Fichier JSON invalide — import annulé.');
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    onReset();
    selectMoment(weddingDefault[0]);
    setNotice('Timeline réinitialisée : les 12 moments d’origine sont restaurés.');
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 pt-10 pb-24 md:px-10 md:pt-14">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="flex items-center gap-3 font-display text-[12px] font-semibold tracking-[0.1em] text-smoke uppercase">
            <Asterisk className="h-4 w-4 text-ink" /> Édition Wedding Party
          </p>
          <h1 className="display-type mt-4 text-[clamp(2rem,5vw,4.2rem)]">
            Éditer <Asterisk /> <span className="text-fog">la timeline Jour-J</span>
          </h1>
          <p className="mt-4 max-w-[680px] text-[15.5px] leading-relaxed text-neutral-500">
            Choisissez un moment, modifiez son horaire (en grand titre), son titre, son lieu, sa description,
            son ambiance, sa musique, son dress code, ses invités, son contact, sa checklist, ses notes et son visuel
            (image ou vidéo, fichier ou URL). Ajoutez, dupliquez, déplacez ou supprimez des moments.
            Tout s’applique aussitôt et est conservé dans ce navigateur ; exportez en JSON pour sauvegarder.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/70 px-5 py-2.5 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:bg-ink hover:text-white"
        >
          <X className="h-4 w-4" /> Revenir à la timeline
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* liste des moments */}
        <aside className="lg:col-span-4">
          <p className={labelClass}>Moments — {moments.length} au total</p>
          <div className="max-h-[560px] overflow-y-auto rounded-[20px] border border-line">
            {moments.map((m, i) => (
              <button
                key={m.id}
                onClick={() => selectMoment(m)}
                aria-current={m.id === selectedId}
                className={`flex w-full cursor-pointer items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 ${m.id === selectedId ? 'bg-ink text-white' : 'hover:bg-mist'}`}
              >
                <span className={`font-display text-[13px] font-bold ${m.id === selectedId ? 'text-white/60' : 'text-fog'}`}>{pad(i + 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{m.title}</span>
                  <span className={`block text-[11px] ${m.id === selectedId ? 'text-white/60' : 'text-smoke'}`}>{m.time} · {m.phase} · {m.location}</span>
                </span>
                <span className={`shrink-0 font-display text-[11px] font-bold ${m.id === selectedId ? 'text-white' : 'text-ink'}`}>{m.time}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={addMoment} className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2 font-display text-[11px] font-semibold tracking-[0.04em] text-white uppercase">
              <Plus className="h-3.5 w-3.5" /> Ajouter un moment
            </button>
            <button onClick={exportJson} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[11px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink">
              <Download className="h-3.5 w-3.5" /> Exporter (JSON)
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[11px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink">
              <Upload className="h-3.5 w-3.5" /> Importer
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
            </label>
            <button onClick={resetAll} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 font-display text-[11px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink">
              <RotateCcw className="h-3.5 w-3.5" /> Tout réinitialiser
            </button>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
            Astuce : l’horaire saisi ici (ex. 15:00) s’affiche en très grand titre dans la timeline (15H00).
            La phase permet de filtrer la timeline par Aube, Matinée, Cérémonie, Réception, Soirée, Nuit, Lendemain.
          </p>
        </aside>

        {/* formulaire */}
        <section className="lg:col-span-8" aria-label="Édition du moment sélectionné">
          {draft ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-[12px] font-semibold tracking-[0.08em] text-smoke uppercase">
                  Moment {pad(selectedIndex + 1)} / {pad(moments.length)} — {draft.time}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => move(-1)} disabled={selectedIndex === 0} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-display text-[11px] font-semibold uppercase disabled:opacity-40">
                    <ArrowUp className="h-3.5 w-3.5" /> Monter
                  </button>
                  <button onClick={() => move(1)} disabled={selectedIndex === moments.length - 1} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-display text-[11px] font-semibold uppercase disabled:opacity-40">
                    <ArrowDown className="h-3.5 w-3.5" /> Descendre
                  </button>
                  <button onClick={duplicateMoment} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-display text-[11px] font-semibold uppercase">
                    <Copy className="h-3.5 w-3.5" /> Dupliquer
                  </button>
                  <button onClick={deleteMoment} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-display text-[11px] font-semibold uppercase text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="w-time">Horaire début (grand titre)</label>
                  <input id="w-time" type="time" className={fieldClass} value={draft.time} onChange={(e) => set({ time: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="w-end">Horaire fin (optionnel)</label>
                  <input id="w-end" type="time" className={fieldClass} value={draft.endTime ?? ''} onChange={(e) => set({ endTime: e.target.value || undefined })} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="w-phase">Phase</label>
                  <select id="w-phase" className={fieldClass} value={draft.phase} onChange={(e) => set({ phase: e.target.value })}>
                    {WEDDING_PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    {!WEDDING_PHASES.includes(draft.phase as (typeof WEDDING_PHASES)[number]) && <option value={draft.phase}>{draft.phase}</option>}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="w-title">Titre du moment</label>
                  <input id="w-title" className={fieldClass} value={draft.title} onChange={(e) => set({ title: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="w-location">Lieu</label>
                  <input id="w-location" className={fieldClass} value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="Ex. Arche florale — jardin" />
                </div>
              </div>

              <div className="mt-5">
                <label className={labelClass} htmlFor="w-desc">Description du moment</label>
                <textarea id="w-desc" className={`${fieldClass} min-h-[120px] leading-[1.7]`} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="w-ambiance">Ambiance</label>
                  <input id="w-ambiance" className={fieldClass} value={draft.ambiance} onChange={(e) => set({ ambiance: e.target.value })} placeholder="Ex. Festive, pétillante" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="w-music">Musique</label>
                  <input id="w-music" className={fieldClass} value={draft.music} onChange={(e) => set({ music: e.target.value })} placeholder="Ex. Saxophone solo, DJ…" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="w-dress">Dress code</label>
                  <input id="w-dress" className={fieldClass} value={draft.dressCode} onChange={(e) => set({ dressCode: e.target.value })} placeholder="Ex. Cocktail chic" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="w-guests">Invités concernés</label>
                  <input id="w-guests" className={fieldClass} value={draft.guests} onChange={(e) => set({ guests: e.target.value })} placeholder="Ex. Tous les invités" />
                </div>
              </div>

              <div className="mt-5">
                <label className={labelClass} htmlFor="w-contact">Contact / prestataire responsable</label>
                <input id="w-contact" className={fieldClass} value={draft.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="Ex. Photographe — 06 12 34 56 78" />
              </div>

              <div className="mt-5">
                <label className={labelClass} htmlFor="w-checklist">Checklist — une tâche par ligne</label>
                <textarea id="w-checklist" className={`${fieldClass} min-h-[140px] leading-[1.7]`} value={draft.checklist.join('\n')} onChange={(e) => set({ checklist: e.target.value.split('\n') })} placeholder={'Ex.\nInstallation 14:00\nEntrée mariée 15:00'} />
              </div>

              <div className="mt-5">
                <label className={labelClass} htmlFor="w-notes">Notes & infos pratiques</label>
                <textarea id="w-notes" className={`${fieldClass} min-h-[100px] leading-[1.7]`} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Horaires précis, plan B pluie, matériel à prévoir…" />
              </div>

              <div className="mt-6 rounded-[20px] border border-line p-5 md:p-6">
                <p className={labelClass}>Visuel du moment — style pop du site (rose / jaune / bleu)</p>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="w-accent">Couleur d’accent (badge phase)</label>
                    <select id="w-accent" className={fieldClass} value={draft.accent} onChange={(e) => set({ accent: e.target.value as WeddingAccent })}>
                      <option value="pink">Rose vif</option>
                      <option value="yellow">Jaune soleil</option>
                      <option value="blue">Bleu cobalt</option>
                      <option value="green">Vert topiaire</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="w-file">…ou téléverser un fichier</label>
                    <label htmlFor="w-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-neutral-300 px-4 py-3 font-display text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors hover:border-ink">
                      <Upload className="h-4 w-4" /> Image ou vidéo
                    </label>
                    <input id="w-file" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </div>
                </div>
                <div className="mt-5">
                  <label className={labelClass} htmlFor="w-image">URL du visuel (image, MP4, YouTube ou Vimeo)</label>
                  <input id="w-image" className={fieldClass} value={draft.image.startsWith('data:') ? '' : draft.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://…/image.jpg ou /images/wedding/01.jpg" />
                  {draft.image.startsWith('data:') && <p className="mt-2 text-[12.5px] text-neutral-500">Fichier téléversé en cours — pensez à enregistrer.</p>}
                </div>
                <div className="mt-5">
                  <label className={labelClass} htmlFor="w-alt">Texte alternatif du visuel (accessibilité)</label>
                  <input id="w-alt" className={fieldClass} value={draft.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} />
                </div>
                <div className="mt-5 overflow-hidden rounded-[16px] bg-mist">
                  <Visual src={draft.image} alt={draft.imageAlt} className="aspect-[16/9] w-full object-cover" controls />
                </div>
              </div>

              {notice && (
                <p className="mt-6 flex items-start gap-2 rounded-[14px] bg-mist px-4 py-3 text-[14px] leading-relaxed text-neutral-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={saveDraft} className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] text-white uppercase transition-transform hover:scale-[1.03]">
                  <Save className="h-4 w-4" /> Enregistrer ce moment
                </button>
                <button onClick={() => { saveDraft(); onPreview(draft.id); }} className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/70 px-6 py-3 font-display text-[13px] font-semibold tracking-[0.02em] uppercase transition-colors hover:bg-ink hover:text-white">
                  Voir dans la timeline
                </button>
              </div>
            </>
          ) : (
            <p className="text-neutral-500">Sélectionnez un moment à gauche.</p>
          )}
        </section>
      </div>
    </main>
  );
}
