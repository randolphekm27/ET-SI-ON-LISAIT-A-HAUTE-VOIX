import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Lightbulb,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export interface RubricCriterion {
  id: string;
  label: string;
  points: number;
  summary: string;
  juryLooksFor: string;
  practicalTip: string;
  commonPitfall: string;
}

const PHASE_RUBRICS: Record<string, RubricCriterion[]> = {
  'phase-1': [
    {
      id: 'sincerity',
      label: 'Sincérité et profondeur du propos',
      points: 6,
      summary: 'Authenticité de la démarche et justesse émotionnelle sans artifice.',
      juryLooksFor:
        "Le jury observe si le texte exprime une voix personnelle singulière plutôt que des formules générales ou convenues.",
      practicalTip:
        'Ancrez votre texte dans une observation vécue, un souvenir précis ou une question qui vous tient réellement à cœur.',
      commonPitfall:
        'Réciter un autoportrait administratif (nom, filière, palmarès) ou copier des phrases trouvées en ligne.',
    },
    {
      id: 'language',
      label: 'Qualité de la langue et de l’écriture',
      points: 6,
      summary: 'Précision du vocabulaire, syntaxe soignée et rythme de la phrase.',
      juryLooksFor:
        "La correction grammaticale, la richesse lexicale, la musicalité des phrases à l'oral et le bon usage des langues nationales si employées.",
      practicalTip:
        'Relisez votre texte à voix haute deux fois avant de filmer : toute phrase qui vous fait buter gagnera à être simplifiée.',
      commonPitfall:
        'Accumuler des mots complexes au détriment de la clarté ou négliger la relecture orthographique.',
    },
    {
      id: 'originality',
      label: 'Originalité et créativité',
      points: 5,
      summary: 'Angle d’approche personnel, images fortes et liberté de forme.',
      juryLooksFor:
        "La capacité à surprendre avec justesse grâce au choix de forme littéraire (lettre, monologue, poème, prose) et d'images propres.",
      practicalTip:
        'Choisissez la forme dans laquelle votre voix porte le plus naturellement, sans chercher à imiter un style imposé.',
      commonPitfall:
        "Recourir à une intelligence artificielle : les textes standardisés se repèrent vite et entraînent la disqualification.",
    },
    {
      id: 'coherence',
      label: 'Cohérence et construction du texte',
      points: 3,
      summary: 'Progression logique des idées, unité du propos et chute maîtrisée.',
      juryLooksFor:
        "L'équilibre entre ouverture, développement et conclusion, ainsi que la fidélité entre le texte soumis et sa lecture filmée.",
      practicalTip:
        "Vérifiez que l'ouverture accroche l'attention et que la dernière phrase laisse une impression nette.",
      commonPitfall:
        'Empiler des idées sans transition ou dépasser la durée maximale de 5 minutes lors de la vidéo.',
    },
  ],
  'phase-2': [
    {
      id: 'clarity',
      label: 'Clarté pédagogique et vulgarisation',
      points: 6,
      summary: 'Capacité à rendre une notion complexe limpide pour tous.',
      juryLooksFor:
        "Des explications accessibles même à un auditeur non spécialiste, illustrées par des exemples concrets et justes.",
      practicalTip:
        'Expliquez le principe central en une phrase simple avant d’entrer dans le mécanisme ou l’exemple concret.',
      commonPitfall:
        'Lire un cours magistral rempli de sigles techniques sans jamais les traduire concrètement.',
    },
    {
      id: 'rigor',
      label: 'Rigueur scientifique et pertinence',
      points: 6,
      summary: 'Exactitude des faits, précision des concepts et fiabilité.',
      juryLooksFor:
        'La justesse scientifique ou éducative du contenu présenté, sans approximation trompeuse ni exagération.',
      practicalTip:
        'Vérifiez chaque donnée ou phénomène cité et gardez un fil directeur structuré du début à la fin.',
      commonPitfall:
        'Simplifier à l’extrême au point de rendre l’explication scientifiquement inexacte.',
    },
    {
      id: 'delivery',
      label: 'Aisance orale et rythme vidéo',
      points: 5,
      summary: 'Articulation, regard caméra, débit posé et présence.',
      juryLooksFor:
        "Une prise de parole vivante et posée qui donne envie d'écouter jusqu'au bout sans dépasser 5 minutes.",
      practicalTip:
        'Marquez de courtes pauses d’une seconde après chaque idée clé pour laisser le temps de comprendre.',
      commonPitfall:
        'Lire trop vite les yeux rivés sur une feuille en négligeant la prise de son.',
    },
    {
      id: 'structure',
      label: 'Structure et respect des consignes',
      points: 3,
      summary: 'Enchaînement structuré et respect strict du format demandé.',
      juryLooksFor:
        'La cohérence entre le contenu écrit transmis et l’exposé filmé, dans le respect du temps imparti.',
      practicalTip:
        'Testez votre texte avec le minuteur de lecture orale pour viser entre 3 min 30 et 4 min 30.',
      commonPitfall:
        'Dépasser les 5 minutes ou soumettre une vidéo sans rapport exact avec le texte déposé.',
    },
  ],
  'phase-3': [
    {
      id: 'stage',
      label: 'Présence scénique, posture et diction',
      points: 6,
      summary: 'Occupation de l’espace, souffle, articulation et projection.',
      juryLooksFor:
        'La maîtrise corporelle et vocale travaillée durant les ateliers des Jours 12 et 13 devant jury et public.',
      practicalTip:
        'Ancrez vos deux appuis au sol, balayez la salle du regard et projetez la fin de chaque phrase.',
      commonPitfall:
        'Parler trop bas loin du micro ou fixer un seul point de la salle par appréhension.',
    },
    {
      id: 'argument',
      label: 'Pertinence du propos et argumentation',
      points: 6,
      summary: 'Force des idées, structuration et profondeur de réflexion.',
      juryLooksFor:
        'Un discours construit capable de soutenir une thèse claire avec des arguments précis et convaincants.',
      practicalTip:
        'Appuyez chaque idée majeure sur un exemple concret et concluez par une formule mémorable.',
      commonPitfall:
        'Rester dans des généralités sans prendre position ni illustrer le propos.',
    },
    {
      id: 'improvisation',
      label: 'Spontanéité et maîtrise de l’imprévu',
      points: 5,
      summary: 'Réactivité, écoute et sang-froid lors de l’exercice spontané.',
      juryLooksFor:
        'La capacité à organiser rapidement une pensée claire et élégante sous contrainte de temps.',
      practicalTip:
        'Structurez toute improvisation en 3 temps : constat immédiat, idée centrale illustrée, ouverture.',
      commonPitfall:
        'Se précipiter dès la première seconde sans prendre 5 secondes de respiration pour poser son axe.',
    },
    {
      id: 'impact',
      label: 'Capacité à convaincre et captiver',
      points: 3,
      summary: 'Émotion maîtrisée, lien avec l’auditoire et justesse de ton.',
      juryLooksFor:
        'L’élan final qui fait vibrer la salle et donne tout son sens à l’expression orale à haute voix.',
      practicalTip:
        'Restez authentique dans votre intonation : l’émotion juste touche plus que l’emphase.',
      commonPitfall:
        'Surjouer de façon artificielle ou réciter mécaniquement sans écouter le silence de la salle.',
    },
  ],
};

interface InteractiveRubricProps {
  phaseId?: 'phase-1' | 'phase-2' | 'phase-3' | string;
  compact?: boolean;
  dark?: boolean;
}

export function InteractiveRubric({
  phaseId = 'phase-1',
  compact = false,
  dark = false,
}: InteractiveRubricProps) {
  const criteria = PHASE_RUBRICS[phaseId] || PHASE_RUBRICS['phase-1'];
  const [selectedId, setSelectedId] = useState<string>(criteria[0].id);
  const [showBlindInfo, setShowBlindInfo] = useState(false);

  const active = criteria.find((c) => c.id === selectedId) || criteria[0];
  const totalPoints = criteria.reduce((acc, item) => acc + item.points, 0);

  return (
    <div
      className={`rounded-[2px] border transition-colors ${
        dark
          ? 'border-ucaep-ivory/22 bg-[#1f3622]/90 text-ucaep-paper'
          : 'border-ucaep-brown/16 bg-white text-ucaep-ink'
      } ${compact ? 'p-6 sm:p-7 space-y-5' : 'p-6 sm:p-8 lg:p-10 space-y-7'}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-current/12 pb-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold inline-flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Barème interactif du jury</span>
          </p>
          <h3
            className={`font-serif text-2xl sm:text-3xl font-semibold ${
              dark ? 'text-ucaep-paper' : 'text-ucaep-brown'
            }`}
          >
            Cliquez sur un critère pour voir les attentes
          </h3>
        </div>
        <span className="font-mono text-sm font-semibold text-ucaep-gold tabular-nums">
          Total : {totalPoints} pts
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sélecteur des 4 critères */}
        <div
          role="tablist"
          aria-label="Critères de notation du jury"
          className="lg:col-span-6 space-y-2.5"
        >
          {criteria.map((item, idx) => {
            const isSelected = item.id === active.id;
            const widthPct = Math.round((item.points / totalPoints) * 100);
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 rounded-[2px] border transition-all duration-150 space-y-2.5 ${
                  isSelected
                    ? dark
                      ? 'bg-[#2a472e] border-ucaep-gold'
                      : 'bg-ucaep-paper border-ucaep-gold shadow-xs'
                    : dark
                      ? 'bg-transparent border-ucaep-ivory/15 hover:border-ucaep-ivory/35'
                      : 'bg-white border-ucaep-brown/14 hover:border-ucaep-brown/35'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? dark
                          ? 'text-ucaep-gold'
                          : 'text-ucaep-brown'
                        : dark
                          ? 'text-ucaep-ivory/90'
                          : 'text-ucaep-ink/85'
                    }`}
                  >
                    <span className="font-mono text-xs text-ucaep-gold mr-2 tabular-nums">
                      0{idx + 1}
                    </span>
                    {item.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-ucaep-gold tabular-nums shrink-0">
                    {item.points} pts
                  </span>
                </div>

                {/* Jauge proportionnelle */}
                <div
                  aria-hidden="true"
                  className={`h-1.5 w-full rounded-full overflow-hidden ${
                    dark ? 'bg-black/25' : 'bg-ucaep-brown/10'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      isSelected ? 'bg-ucaep-gold' : 'bg-ucaep-green/65'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Panneau détaillé du critère sélectionné */}
        <div
          role="tabpanel"
          className={`lg:col-span-6 p-5 sm:p-6 rounded-[2px] border space-y-4 ${
            dark
              ? 'bg-[#172b1a] border-ucaep-ivory/18 text-ucaep-ivory/90'
              : 'bg-ucaep-linen/55 border-ucaep-brown/15 text-ucaep-ink'
          }`}
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-current/12 pb-3">
            <h4
              className={`font-serif text-xl sm:text-2xl font-semibold ${
                dark ? 'text-ucaep-paper' : 'text-ucaep-brown'
              }`}
            >
              {active.label}
            </h4>
            <span className="font-mono text-base font-bold text-ucaep-gold tabular-nums shrink-0">
              {active.points} / {totalPoints}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium opacity-85">{active.summary}</p>

          <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-ucaep-gold shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-gold">
                  Ce que le jury observe
                </p>
                <p className="opacity-90 mt-0.5">{active.juryLooksFor}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Lightbulb
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  dark ? 'text-ucaep-gold' : 'text-ucaep-green'
                }`}
                aria-hidden="true"
              />
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    dark ? 'text-ucaep-gold' : 'text-ucaep-green'
                  }`}
                >
                  Conseil pratique
                </p>
                <p className="opacity-90 mt-0.5">{active.practicalTip}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Erreur à éviter
                </p>
                <p className="opacity-90 mt-0.5">{active.commonPitfall}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Double lecture anonyme */}
      <div className="pt-3 border-t border-current/12 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium opacity-85">
            <ShieldCheck className="w-4 h-4 text-ucaep-gold shrink-0" aria-hidden="true" />
            <span>
              Évaluation équitable : code d&apos;anonymat UCAEP et double correction
            </span>
          </div>
          <button
            type="button"
            aria-expanded={showBlindInfo}
            onClick={() => setShowBlindInfo((v) => !v)}
            className="text-xs font-semibold text-ucaep-gold hover:underline whitespace-nowrap shrink-0"
          >
            {showBlindInfo
              ? 'Masquer le protocole'
              : 'Comprendre la double lecture anonyme'}
          </button>
        </div>

        {showBlindInfo && (
          <div
            className={`p-4 rounded-[2px] border text-xs leading-relaxed grid grid-cols-1 sm:grid-cols-3 gap-4 ${
              dark
                ? 'bg-[#172b1a] border-ucaep-ivory/15 text-ucaep-ivory/90'
                : 'bg-ucaep-paper border-ucaep-brown/14 text-ucaep-ink/85'
            }`}
          >
            <div className="space-y-1">
              <p className="font-semibold text-ucaep-gold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                1. Anonymat strict
              </p>
              <p>
                Les membres du jury reçoivent uniquement votre référence UCAEP sans nom, ni filière, ni année d&apos;études.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-ucaep-gold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                2. Double correction
              </p>
              <p>
                Chaque texte et prestation vidéo est évalué indépendamment par deux membres du jury pluridisciplinaire.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-ucaep-gold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                3. Recours sous 24 h
              </p>
              <p>
                Les résultats sont publiés d&apos;abord sous code candidat, avec un délai écrit de 24 h pour signaler toute erreur matérielle.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
