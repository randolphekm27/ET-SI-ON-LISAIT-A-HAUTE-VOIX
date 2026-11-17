import { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Mic2,
  RotateCcw,
  Video,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EDITORIAL_EASE, EDITORIAL_SPRING } from '../lib/motion';

type ReadingPace = 'slow' | 'natural' | 'brisk';

const PACE_CONFIG: Record<
  ReadingPace,
  { label: string; wpm: number; hint: string }
> = {
  slow: {
    label: 'Posé · 110 mots/min',
    wpm: 110,
    hint: 'Idéal pour la poésie, les silences expressifs et l’émotion.',
  },
  natural: {
    label: 'Naturel · 130 mots/min',
    wpm: 130,
    hint: 'Rythme conseillé pour une lecture claire et fluide à haute voix.',
  },
  brisk: {
    label: 'Soutenu · 150 mots/min',
    wpm: 150,
    hint: 'Rythme dynamique pour une argumentation ou vulgarisation rythmée.',
  },
};

const CHECKLIST_ITEMS = [
  {
    id: 'quiet-space',
    title: 'Endroit calme sans écho ni vent',
    detail:
      'Privilégiez une chambre ou une salle fermée, loin des ventilateurs ou du bruit extérieur.',
  },
  {
    id: 'face-light',
    title: 'Lumière naturelle face au visage',
    detail:
      'Placez-vous face à une fenêtre ou une lampe douce ; évitez d’avoir la fenêtre derrière vous.',
  },
  {
    id: 'eye-framing',
    title: 'Téléphone stable à hauteur des yeux',
    detail:
      'Posez votre smartphone sur un support stable (livres ou trépied) sans le tenir à la main.',
  },
  {
    id: 'sound-test',
    title: 'Test micro de 10 secondes avant tournage',
    detail:
      'Enregistrez deux phrases test et écoutez au casque pour vérifier que votre voix porte nettement.',
  },
  {
    id: 'five-min-cap',
    title: 'Durée finale inférieure à 5 minutes',
    detail:
      'Visez 3 min 30 à 4 min 30 pour garder une respiration sereine et ne jamais dépasser 05:00.',
  },
  {
    id: 'ucaep-code',
    title: 'Code d’anonymat UCAEP vérifié',
    detail:
      'Vérifiez l’exactitude de votre référence UCAEP avant d’envoyer vos textes et votre vidéo.',
  },
];

const CHECKLIST_STORAGE_KEY = 'ucaep-video-prep-checklist-v1';

const SAMPLE_DRAFT = `Quand on arrive pour la première fois dans une salle de cours à Lokossa, on retient d'abord les formules, les schémas et les heures de travaux pratiques. Mais derrière chaque cahier de notes, il existe une question plus silencieuse : comment faire entendre ce que l'on comprend, ce que l'on ressent et ce que l'on espère construire ?\n\nPrendre le temps d'écrire, puis lire ses propres mots à haute voix, oblige à ralentir. Chaque virgule devient une respiration. Chaque phrase demande de la justesse, non pour impressionner, mais pour être compris avec sincérité.`;

function formatDurationMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface VideoPrepWorkshopProps {
  isPresentiel?: boolean;
}

export function VideoPrepWorkshop({
  isPresentiel = false,
}: VideoPrepWorkshopProps) {
  const [activeTab, setActiveTab] = useState<'timer' | 'checklist'>('timer');
  const [draftText, setDraftText] = useState('');
  const [pace, setPace] = useState<ReadingPace>('natural');
  const workshopId = useId();
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // Ignorer si stockage local indisponible
    }
  }, [checkedIds]);

  const metrics = useMemo(() => {
    const trimmed = draftText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = trimmed.length;
    const wpm = PACE_CONFIG[pace].wpm;
    const estimatedSeconds = words > 0 ? Math.round((words / wpm) * 60) : 0;
    const maxSeconds = 300; // 5 minutes strictes
    const progressPct = Math.min(100, Math.round((estimatedSeconds / maxSeconds) * 100));
    const maxRecommendedWords = wpm * 5;
    const overByWords = Math.max(0, words - maxRecommendedWords);

    let verdict: {
      status: 'empty' | 'good' | 'tight' | 'over';
      label: string;
      message: string;
    };

    if (words === 0) {
      verdict = {
        status: 'empty',
        label: 'En attente de votre texte',
        message: `À ${wpm} mots/min, la limite de 5 minutes correspond à environ ${maxRecommendedWords} mots maximum.`,
      };
    } else if (estimatedSeconds <= 255) {
      verdict = {
        status: 'good',
        label: 'Format confortable',
        message:
          'Votre durée laisse la place aux respirations et aux silences sans risquer de dépasser les 5 minutes.',
      };
    } else if (estimatedSeconds <= 300) {
      verdict = {
        status: 'tight',
        label: 'Proche de la limite des 5 min',
        message:
          'Durée acceptable, mais prévoyez une marge de 20 à 30 secondes pour éviter d’accélérer pendant l’enregistrement.',
      };
    } else {
      verdict = {
        status: 'over',
        label: 'Dépassement des 5 minutes',
        message: `Votre texte dépasse la fenêtre autorisée. Raccourcissez d’environ ${overByWords} mot${overByWords > 1 ? 's' : ''} pour rester sous 05:00.`,
      };
    }

    return {
      words,
      chars,
      estimatedSeconds,
      progressPct,
      maxRecommendedWords,
      verdict,
    };
  }, [draftText, pace]);

  const completedChecks = CHECKLIST_ITEMS.filter((c) => Boolean(checkedIds[c.id])).length;

  function toggleCheck(id: string) {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="bg-white border border-ucaep-brown/16 rounded-[2px] overflow-hidden">
      {/* En-tête + Sélecteur d'atelier */}
      <div className="p-6 sm:p-8 bg-ucaep-linen/55 border-b border-ucaep-brown/14 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
            Atelier pratique · Du texte à la prestation {isPresentiel ? 'orale' : 'vidéo'}
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
            Préparez votre passage dans la limite des 5 minutes
          </h3>
          <p className="text-xs sm:text-sm text-ucaep-ink/78 leading-relaxed">
            Testez votre texte avant de vous enregistrer afin de caler votre rythme de lecture, puis validez la liste technique pour réussir votre prise {isPresentiel ? 'sur scène' : 'au smartphone'}.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Outils de préparation"
          className="inline-flex items-center gap-1 p-1 bg-ucaep-paper border border-ucaep-brown/16 rounded-[2px] self-start lg:self-center shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timer'}
            onClick={() => setActiveTab('timer')}
            className={`relative inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[2px] transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'timer'
                ? 'text-ucaep-paper'
                : 'text-ucaep-brown/75 hover:text-ucaep-brown'
            }`}
          >
            {activeTab === 'timer' && (
              <motion.span
                layoutId={`workshop-tab-${workshopId}`}
                aria-hidden="true"
                transition={EDITORIAL_SPRING}
                className="absolute inset-0 bg-ucaep-brown rounded-[2px]"
              />
            )}
            <Clock className="relative z-10 w-3.5 h-3.5" aria-hidden="true" />
            <span className="relative z-10">Calculateur 5 min</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'checklist'}
            onClick={() => setActiveTab('checklist')}
            className={`relative inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[2px] transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'checklist'
                ? 'text-ucaep-paper'
                : 'text-ucaep-brown/75 hover:text-ucaep-brown'
            }`}
          >
            {activeTab === 'checklist' && (
              <motion.span
                layoutId={`workshop-tab-${workshopId}`}
                aria-hidden="true"
                transition={EDITORIAL_SPRING}
                className="absolute inset-0 bg-ucaep-brown rounded-[2px]"
              />
            )}
            {isPresentiel ? (
              <Mic2 className="relative z-10 w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Video className="relative z-10 w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span className="relative z-10">
              Checklist ({completedChecks}/{CHECKLIST_ITEMS.length})
            </span>
          </button>
        </div>
      </div>

      {/* Corps de l'atelier */}
      <AnimatePresence mode="wait">
        {activeTab === 'timer' ? (
          <motion.div
            key="timer-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
            className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
          {/* Colonne saisie brouillon */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="ucaep-voice-timer-draft"
                className="text-xs font-semibold uppercase tracking-wider text-ucaep-brown inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-ucaep-gold" aria-hidden="true" />
                <span>Collez ou rédigez un brouillon à tester</span>
              </label>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDraftText(SAMPLE_DRAFT)}
                  className="font-semibold text-ucaep-green hover:underline whitespace-nowrap"
                >
                  Charger un exemple
                </button>
                {draftText && (
                  <button
                    type="button"
                    onClick={() => setDraftText('')}
                    className="font-medium text-ucaep-brown/70 hover:text-ucaep-brown inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Effacer</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="ucaep-voice-timer-draft"
              rows={8}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Collez ici votre texte pour connaître instantanément votre temps de lecture estimé à haute voix..."
              className="w-full px-4 py-3 text-sm bg-ucaep-paper border border-ucaep-brown/20 rounded-[2px] leading-relaxed focus:outline-none focus:border-ucaep-gold"
            />

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/75">
                Cadence de lecture à haute voix
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(PACE_CONFIG) as ReadingPace[]).map((key) => {
                  const cfg = PACE_CONFIG[key];
                  const active = pace === key;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setPace(key)}
                      className={`relative p-3 text-left rounded-[2px] border transition-colors ${
                        active
                          ? 'text-ucaep-paper border-ucaep-brown'
                          : 'bg-white text-ucaep-ink border-ucaep-brown/16 hover:border-ucaep-brown/40'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId={`workshop-pace-${workshopId}`}
                          aria-hidden="true"
                          transition={EDITORIAL_SPRING}
                          className="absolute inset-0 bg-ucaep-brown rounded-[1px]"
                        />
                      )}
                      <span className="relative z-10 block text-xs font-semibold tabular-nums">
                        {cfg.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-xs text-ucaep-ink/70">{PACE_CONFIG[pace].hint}</p>
            </div>
          </div>

          {/* Colonne résultats instantanés */}
          <div className="lg:col-span-5 p-6 bg-ucaep-paper border border-ucaep-brown/15 rounded-[2px] space-y-5">
            <div className="flex items-baseline justify-between border-b border-ucaep-brown/12 pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown/75">
                Temps estimé à l&apos;oral
              </span>
              <span className="text-xs font-medium text-ucaep-brown/70 tabular-nums">
                Plafond : 05:00
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <p
                className={`font-mono text-4xl sm:text-5xl font-bold tabular-nums ${
                  metrics.verdict.status === 'over'
                    ? 'text-red-800'
                    : metrics.verdict.status === 'tight'
                      ? 'text-amber-700'
                      : 'text-ucaep-brown'
                }`}
              >
                {formatDurationMMSS(metrics.estimatedSeconds)}
              </p>
              <div className="text-right text-xs text-ucaep-ink/75 tabular-nums">
                <p>
                  <strong className="text-ucaep-brown">{metrics.words}</strong> mots
                </p>
                <p>{metrics.chars} caractères</p>
              </div>
            </div>

            {/* Barre de progression par rapport à 5 min (GPU scaleX) */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-ucaep-brown/10 rounded-full overflow-hidden">
                <motion.div
                  animate={{ scaleX: metrics.progressPct / 100 }}
                  transition={{ duration: 0.25, ease: EDITORIAL_EASE }}
                  className={`h-full w-full origin-left transition-colors duration-200 ${
                    metrics.verdict.status === 'over'
                      ? 'bg-red-700'
                      : metrics.verdict.status === 'tight'
                        ? 'bg-amber-600'
                        : 'bg-ucaep-green'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-ucaep-brown/65 font-mono tabular-nums">
                <span>00:00</span>
                <span>Cible 03:30 – 04:30</span>
                <span>05:00</span>
              </div>
            </div>

            {/* Verdict dual-codé (icône + texte) */}
            <div
              className={`p-4 rounded-[2px] border text-xs leading-relaxed space-y-1.5 ${
                metrics.verdict.status === 'over'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : metrics.verdict.status === 'tight'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : metrics.verdict.status === 'good'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-white border-ucaep-brown/14 text-ucaep-ink/80'
              }`}
            >
              <p className="font-semibold inline-flex items-center gap-1.5">
                {metrics.verdict.status === 'over' || metrics.verdict.status === 'tight' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{metrics.verdict.label}</span>
              </p>
              <p>{metrics.verdict.message}</p>
            </div>

            <p className="text-[11px] text-ucaep-ink/65 leading-relaxed">
              Ce simulateur reste strictement local dans votre navigateur : aucun brouillon n&apos;est envoyé au serveur avant votre dépôt officiel.
            </p>
          </div>
          </motion.div>
        ) : (
          <motion.div
            key="checklist-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
            className="p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ucaep-brown tabular-nums">
                  Progression de préparation : {completedChecks} / {CHECKLIST_ITEMS.length} vérifications validées
                </p>
                <p className="text-xs text-ucaep-ink/70">
                  Cochez chaque repère au fur et à mesure ; votre progression est mémorisée automatiquement sur cet appareil.
                </p>
              </div>
              {completedChecks > 0 && (
                <button
                  type="button"
                  onClick={() => setCheckedIds({})}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ucaep-brown/75 hover:text-ucaep-brown underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Réinitialiser la liste</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHECKLIST_ITEMS.map((item, idx) => {
                const checked = Boolean(checkedIds[item.id]);
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => toggleCheck(item.id)}
                    className={`text-left p-5 rounded-[2px] border transition-colors space-y-2 ${
                      checked
                        ? 'bg-emerald-50/60 border-ucaep-green/45'
                        : 'bg-ucaep-paper/70 border-ucaep-brown/15 hover:border-ucaep-brown/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-ucaep-gold tabular-nums">
                        0{idx + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          checked ? 'text-ucaep-green' : 'text-ucaep-brown/60'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{checked ? 'Vérifié' : 'À vérifier'}</span>
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-semibold text-ucaep-brown leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-ucaep-ink/78 leading-relaxed">
                      {item.detail}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
