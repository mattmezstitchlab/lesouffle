export type WeddingAccent = 'pink' | 'yellow' | 'blue' | 'green';

export interface WeddingMoment {
  id: string;
  time: string; // "05:45"
  endTime?: string; // "06:30"
  title: string;
  phase: string; // Aube, Matinée, Cérémonie, Réception, Soirée, Nuit, Lendemain
  location: string;
  description: string;
  ambiance: string;
  music: string;
  dressCode: string;
  guests: string;
  contact: string;
  checklist: string[];
  notes: string;
  image: string;
  imageAlt: string;
  accent: WeddingAccent;
}

// Les données importées ou restaurées doivent être complètes avant leur affichage.
export function isWeddingTimeline(value: unknown): value is WeddingMoment[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const ids = new Set<string>();
  const stringFields = ['id', 'time', 'title', 'phase', 'location', 'description', 'ambiance', 'music', 'dressCode', 'guests', 'contact', 'notes', 'image', 'imageAlt', 'accent'];
  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return false;
    const m = entry as Record<string, unknown>;
    if (!stringFields.every((field) => typeof m[field] === 'string')) return false;
    if (!m.id || ids.has(m.id as string) || (m.endTime !== undefined && typeof m.endTime !== 'string')) return false;
    if (!Array.isArray(m.checklist) || !m.checklist.every((item: unknown) => typeof item === 'string')) return false;
    if (!['pink', 'yellow', 'blue', 'green'].includes(m.accent as string)) return false;
    ids.add(m.id as string);
    return true;
  });
}

export const WEDDING_PHASES = [
  'Aube',
  'Matinée',
  'Cérémonie',
  'Réception',
  'Soirée',
  'Nuit',
  'Lendemain',
] as const;

export const weddingDefault: WeddingMoment[] = [
  {
    id: 'aube',
    time: '05:45',
    endTime: '06:30',
    title: 'L’aube, le premier souffle',
    phase: 'Aube',
    location: 'Suite nuptiale — réveil',
    description:
      'Le jour J commence avant le jour. Un premier café, une lumière qui monte, le saxophone posé près du lit comme une promesse. On prend le temps de respirer : c’est le premier souffle du mariage, celui qui donnera le ton à toute la journée.',
    ambiance: 'Douce, intime, lumière dorée',
    music: 'Saxophone solo — improvisation douce',
    dressCode: 'Peignoir blanc, pyjama soie',
    guests: 'Mariés + témoins',
    contact: 'Témoins — réveil & petit-déjeuner',
    checklist: ['Réveil 05:45', 'Café & croissants', 'Playlist douce', 'Vérifier alliances & bouquet'],
    notes: 'Prévoir une lampe chaude, pas de flash. Photos d’ambiance uniquement, pas de mise en scène.',
    image: '/images/wedding/01.jpg',
    imageAlt: 'Mariée au réveil à l’aube, peignoir blanc, saxophone doré sur la table de chevet, fond rose vif et soleil jaune',
    accent: 'yellow',
  },
  {
    id: 'preparatifs',
    time: '08:00',
    endTime: '10:00',
    title: 'Préparatifs, coiffure & maquillage',
    phase: 'Matinée',
    location: 'Suite nuptiale — salon',
    description:
      'Coiffeuse, maquilleuse et témoins s’installent. La mariée passe en robe de chambre, le marié en chemise blanche. On rit, on boit un verre, on laisse le saxophone jouer en fond pour détendre tout le monde.',
    ambiance: 'Joyeeuse, détendue, rires',
    music: 'Jazz léger en fond — saxophone acoustique',
    dressCode: 'Robe de chambre / chemise blanche',
    guests: 'Mariée, témoins, coiffeuse, maquilleuse',
    contact: 'Coiffeuse & maquilleuse — arrivée 07:45',
    checklist: ['Coiffure 08:00', 'Maquillage 09:00', 'Bouquet livré', 'Photos détails (robe, alliances, chaussures)'],
    notes: 'Prévoir 2h sans stress. Un défroisseur pour la robe, une trousse de secours (épingles, pansements).',
    image: '/images/wedding/02.jpg',
    imageAlt: 'Mariée en peignoir blanc se faisant maquiller, maquilleuse en veste jaune éclairs, fond rose vif, saxophone doré',
    accent: 'pink',
  },
  {
    id: 'habillage',
    time: '10:30',
    endTime: '11:30',
    title: 'Habillage, robe & costume',
    phase: 'Matinée',
    location: 'Suite nuptiale — chambre',
    description:
      'Le moment où tout devient réel. La robe sort de sa housse, le costume bleu cobalt se boutonne. Le marié ajuste sa cravate rouge, la mariée lace ses chaussures. Le saxophone attend, déjà prêt pour la suite.',
    ambiance: 'Émotive, solennelle, complice',
    music: 'Morceau choisi par les mariés — première danse',
    dressCode: 'Robe de mariée / costume bleu cobalt, cravate rouge',
    guests: 'Mariés, témoins, parents',
    contact: 'Témoins — aide habillage',
    checklist: ['Robe 10:30', 'Costume & cravate', 'Voile & couronne', 'Derniers ajustements'],
    notes: 'Prévoir un miroir sur pied, des chaussettes de rechange, et 15 min de marge avant le départ.',
    image: '/images/wedding/03.jpg',
    imageAlt: 'Mariée en robe blanche et marié en costume bleu cobalt à cravate rouge, haie de topiaire verte, soleil jaune, fond rose',
    accent: 'blue',
  },
  {
    id: 'first-look',
    time: '12:00',
    endTime: '13:00',
    title: 'First look & photos de couple',
    phase: 'Matinée',
    location: 'Jardin — haie de topiaire',
    description:
      'Le marié découvre la mariée pour la première fois. Un cri, un rire, une larme. Le photographe capte l’instant, le saxophoniste joue une note tenue pendant que les mariés se retrouvent. Puis séance photo dans le jardin.',
    ambiance: 'Émotive, spontanée, lumineuse',
    music: 'Saxophone solo — thème des mariés',
    dressCode: 'Tenues complètes de cérémonie',
    guests: 'Mariés, photographe, saxophoniste',
    contact: 'Photographe — rendez-vous 11:45',
    checklist: ['First look 12:00', 'Photos de couple', 'Photos famille restreinte', 'Bouquet & alliances en détail'],
    notes: 'Prévoir un plan B en cas de pluie (intérieur rose). Garder 30 min pour les photos de groupe.',
    image: '/images/wedding/04.jpg',
    imageAlt: 'First look, marié en costume bleu découvrant la mariée en robe blanche qui tourne, saxophoniste en costume à pois bleus, fond rose et soleil jaune',
    accent: 'yellow',
  },
  {
    id: 'ceremonie',
    time: '15:00',
    endTime: '16:00',
    title: 'Cérémonie, les vœux',
    phase: 'Cérémonie',
    location: 'Arche florale — jardin',
    description:
      'Les invités prennent place, la musique monte. La mariée avance, les alliances s’échangent, les vœux sont prononcés. Le saxophone ponctue chaque silence. À la sortie, pluie de pétales et applaudissements.',
    ambiance: 'Solennelle puis festive',
    music: 'Entrée en saxophone, vœux en acoustique, sortie en fanfare',
    dressCode: 'Tenues de cérémonie — invités en couleurs pop',
    guests: 'Tous les invités (environ 80)',
    contact: 'Officiant / DJ — installation 14:00',
    checklist: ['Installation arche 14:00', 'Entrée mariée 15:00', 'Échange des vœux & alliances', 'Sortie sous les pétales'],
    notes: 'Prévoir un micro pour les vœux, un plan pluie (barnum), et un livret de cérémonie pour les invités.',
    image: '/images/wedding/05.jpg',
    imageAlt: 'Cérémonie de mariage sous arche florale, mariés main dans la main, invités en tenues colorées, saxophoniste, fond rose et soleil jaune',
    accent: 'pink',
  },
  {
    id: 'vin-honneur',
    time: '16:30',
    endTime: '18:30',
    title: 'Vin d’honneur & cocktail',
    phase: 'Réception',
    location: 'Terrasse — cocktail',
    description:
      'Champagne, amuse-bouches, rires et premières danses. Les invités trinquent, le trio pop enchaîne les standards. C’est le moment des retrouvailles, des photos volées et des premiers pas sur la piste.',
    ambiance: 'Festive, pétillante, décontractée',
    music: 'Trio pop — standards jazz & pop, saxophone lead',
    dressCode: 'Cocktail chic — couleurs vives bienvenues',
    guests: 'Tous les invités',
    contact: 'Traiteur cocktail — service 16:30',
    checklist: ['Ouverture du bar 16:30', 'Discours des témoins 17:30', 'Photos de groupe', 'Lancer du bouquet 18:00'],
    notes: 'Prévoir un bar à champagne, des parasols, et une playlist de secours en cas de retard du groupe.',
    image: '/images/wedding/06.jpg',
    imageAlt: 'Vin d’honneur, invités trinquant au champagne et dansant, mariés au centre, trio saxophone en costumes jaune éclairs et bleu à pois, fond rose',
    accent: 'pink',
  },
  {
    id: 'diner',
    time: '19:00',
    endTime: '21:00',
    title: 'Dîner, la grande table',
    phase: 'Réception',
    location: 'Salle de réception — grande table',
    description:
      'La grande table s’illumine. Discours, plats, rires et surprises. Le saxophone passe de table en table pour une sérénade improvisée. On lève le verre aux mariés, aux parents, à ceux qui ne sont plus là.',
    ambiance: 'Chaleureuse, gourmande, émotive',
    music: 'Saxophone en déambulation — sérénades aux tables',
    dressCode: 'Tenues de soirée',
    guests: 'Tous les invités assis',
    contact: 'Traiteur dîner — service 19:00',
    checklist: ['Installation 18:30', 'Entrée des mariés 19:00', 'Discours & surprises', 'Service du dîner'],
    notes: 'Prévoir un plan de table, des bougies LED (sécurité), et un micro pour les discours.',
    image: '/images/wedding/07.jpg',
    imageAlt: 'Longue table de dîner de mariage, nappe rose, bougies, invités riant, mariés en bout de table, saxophoniste jouant, soleil jaune au mur',
    accent: 'yellow',
  },
  {
    id: 'ouverture-bal',
    time: '21:00',
    endTime: '22:00',
    title: 'Ouverture de bal',
    phase: 'Soirée',
    location: 'Piste de danse — boule disco',
    description:
      'Les lumières baissent, la boule disco tourne. Les mariés ouvrent le bal sur leur morceau, le saxophone les accompagne en solo. Puis la piste s’ouvre à tous : parents, témoins, invités, tout le monde danse.',
    ambiance: 'Magique, romantique puis électrique',
    music: 'Première danse en saxophone solo, puis DJ + live sax',
    dressCode: 'Tenues de soirée — chaussures de danse',
    guests: 'Tous les invités sur la piste',
    contact: 'DJ + saxophoniste — installation 20:30',
    checklist: ['Ouverture de bal 21:00', 'Danse parents / mariés', 'Ouverture de la piste', 'Photo de groupe sur la piste'],
    notes: 'Prévoir une répétition de la première danse, un sol non glissant, et des chaussures de rechange.',
    image: '/images/wedding/08.jpg',
    imageAlt: 'Première danse des mariés sur piste rose, boule disco jaune, marié en costume bleu et mariée en robe blanche, saxophoniste en solo, confettis',
    accent: 'blue',
  },
  {
    id: 'soiree-dansante',
    time: '22:30',
    endTime: '00:30',
    title: 'Soirée dansante, le saxo',
    phase: 'Soirée',
    location: 'Piste de danse — scène',
    description:
      'La soirée bat son plein. Le saxophoniste en costume à pois bleus prend la scène, le DJ enchaîne les tubes, la piste ne se vide plus. C’est le cœur de la fête : énergie, sueur, rires et souvenirs qui resteront.',
    ambiance: 'Électrique, joyeuse, sans temps mort',
    music: 'Live sax + DJ — pop, funk, disco, années 80/90',
    dressCode: 'Tenues de fête — paillettes bienvenues',
    guests: 'Tous les invités',
    contact: 'DJ & saxophoniste — set 22:30',
    checklist: ['Set live sax 22:30', 'Piste ouverte', 'Surprises (choré, karaoké)', 'Bar & rafraîchissements'],
    notes: 'Prévoir un vestiaire, de l’eau en libre service, et un niveau sonore respectueux du voisinage.',
    image: '/images/wedding/09.jpg',
    imageAlt: 'Soirée dansante, foule dansant joyeusement, saxophoniste en costume bleu à pois au centre avec saxophone doré, fond rose et lumières jaunes',
    accent: 'pink',
  },
  {
    id: 'piece-montee',
    time: '00:30',
    endTime: '01:30',
    title: 'Pièce montée & dernière danse',
    phase: 'Nuit',
    location: 'Piste de danse — gâteau',
    description:
      'Minuit passé, on découpe la pièce montée sous les étincelles. Les mariés partagent la première part, les invités lèvent le verre. Puis vient la dernière danse, lente, sur un solo de saxophone. La nuit se referme en douceur.',
    ambiance: 'Émotive, étincelante, nostalgique',
    music: 'Solo saxophone — dernière danse lente',
    dressCode: 'Tenues de soirée — fin de nuit',
    guests: 'Invités restants',
    contact: 'Pâtissier — livraison 23:00, DJ fin 01:30',
    checklist: ['Pièce montée 00:30', 'Découpe & service', 'Dernière danse 01:15', 'Remerciements'],
    notes: 'Prévoir des étincelles froides (sans feu), une boîte pour la première part, et un taxi / navette pour les invités.',
    image: '/images/wedding/10.jpg',
    imageAlt: 'Pièce montée de mariage avec étincelles, mariés découpant le gâteau, invités acclamant avec étincelles, fond rose et soleil jaune, saxophone doré',
    accent: 'yellow',
  },
  {
    id: 'derniere-danse',
    time: '01:30',
    endTime: '02:00',
    title: 'Dernière danse & au revoir',
    phase: 'Nuit',
    location: 'Piste de danse — lumières basses',
    description:
      'La dernière danse réunit les plus proches. On se serre, on rit encore, on promet de se revoir. Les mariés saluent leurs invités, le saxophone joue une dernière note qui reste dans la pièce longtemps après le départ.',
    ambiance: 'Intime, émotive, douce',
    music: 'Saxophone solo — thème final',
    dressCode: 'Tenues de fin de soirée',
    guests: 'Proches & témoins',
    contact: 'Saxophoniste — dernier set 01:30',
    checklist: ['Dernière danse 01:30', 'Au revoir aux invités', 'Rangement & sécurité', 'Départ des mariés'],
    notes: 'Prévoir une navette / taxis, un vestiaire sécurisé, et un responsable de fermeture du lieu.',
    image: '/images/wedding/11.jpg',
    imageAlt: 'Dernière danse lente des mariés la nuit, étreinte intime, fond rose nuit et lune jaune, saxophoniste jouant doucement en arrière-plan',
    accent: 'blue',
  },
  {
    id: 'lendemain',
    time: '10:00',
    endTime: '13:00',
    title: 'Lendemain, brunch & souvenirs',
    phase: 'Lendemain',
    location: 'Terrasse — brunch',
    description:
      'Le lendemain, on se retrouve pour un brunch sans horaire. Croissants, café, photos des invités, anecdotes de la veille. Le saxophone repose sur une chaise, témoin silencieux de la plus belle des fêtes. On se promet de recommencer.',
    ambiance: 'Détendue, ensoleillée, nostalgique et joyeuse',
    music: 'Playlist douce — jazz du matin',
    dressCode: 'Tenues décontractées — lin, couleurs claires',
    guests: 'Proches, témoins, invités du lendemain',
    contact: 'Traiteur brunch — service 10:00',
    checklist: ['Brunch 10:00', 'Visionnage photos', 'Remerciements & cartes', 'Rangement & départ'],
    notes: 'Prévoir un livre d’or, un album photo à commander, et des boîtes à souvenirs pour les invités.',
    image: '/images/wedding/12.jpg',
    imageAlt: 'Brunch du lendemain de mariage sur terrasse ensoleillée, mariés en tenue décontractée, croissants et café, mur rose et soleil jaune, saxophone posé sur une chaise',
    accent: 'green',
  },
];

export const weddingImageOf = (index: number) =>
  `/images/wedding/${String(index + 1).padStart(2, '0')}.jpg`;

export const weddingTimeLabel = (m: WeddingMoment) =>
  m.endTime ? `${m.time} — ${m.endTime}` : m.time;

export const weddingPhaseColor: Record<string, string> = {
  Aube: 'bg-[#ffe45e] text-ink',
  Matinée: 'bg-[#ffd6e8] text-ink',
  Cérémonie: 'bg-ink text-white',
  Réception: 'bg-[#ff2e88] text-white',
  Soirée: 'bg-[#1e4dff] text-white',
  Nuit: 'bg-[#111111] text-white',
  Lendemain: 'bg-[#2ecc71] text-white',
};
