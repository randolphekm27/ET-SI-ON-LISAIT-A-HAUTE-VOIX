import { useId, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Feather, MessageCircleQuestion, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import {
  EditorialExpandable,
  EditorialReveal,
  EditorialTitleReveal,
  ParallaxDepthCard,
} from '../components/MotionPrimitives';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';
import { EDITORIAL_SPRING, TACTILE_SPRING } from '../lib/motion';
import type { CompetitionPhase } from '../types/competition';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqChapter {
  id: string;
  folio: string;
  title: string;
  subtitle: string;
  items: FaqItem[];
}

const QUICK_ANSWERS = [
  {
    num: '01',
    title: 'Public & gratuité',
    summary:
      "Gratuit et ouvert à tous les étudiants de l'ENSET de Lokossa, sans aucune expérience théâtrale exigée.",
  },
  {
    num: '02',
    title: 'Matériel requis',
    summary:
      'Un téléphone portable dans un endroit calme suffit pour filmer les vidéos des deux premières phases.',
  },
  {
    num: '03',
    title: 'Phases & durée',
    summary:
      'Deux phases en ligne (texte et vidéo de 5 min max par épreuve) puis une finale en présentiel sur le campus.',
  },
  {
    num: '04',
    title: 'Anonymat & jury',
    summary:
      'Vos copies sont lues en double correction sous code UCAEP anonyme, avec recours écrit sous 24 heures.',
  },
];

function buildFaqChapters(phases: CompetitionPhase[]): FaqChapter[] {
  const p1 = phases.find((p) => p.id === 'phase-1' || p.number === '01');
  const p2 = phases.find((p) => p.id === 'phase-2' || p.number === '02');
  const p3 = phases.find((p) => p.id === 'phase-3' || p.number === '03');

  const p1Revealed = Boolean(p1?.isRevealed);
  const p2Revealed = Boolean(p2?.isRevealed);
  const p3Revealed = Boolean(p3?.isRevealed);

  return [
    {
      id: 'avant-de-participer',
      folio: 'Chapitre 01',
      title: 'Avant de participer',
      subtitle: 'Conditions d’accès, matériel nécessaire et fonctionnement de l’inscription.',
      items: [
        {
          q: 'Qui peut s’inscrire et faut-il une expérience en théâtre ?',
          a: "Le concours est ouvert à tous les étudiants régulièrement inscrits à l'ENSET de Lokossa, toutes filières et années d'études confondues. Aucune expérience préalable en théâtre, en écriture ou en prise de parole en public n'est demandée.",
        },
        {
          q: 'La participation est-elle vraiment gratuite ?',
          a: "Oui, l'inscription et l'ensemble du parcours sont entièrement gratuits du début jusqu'à la remise des attestations.",
        },
        {
          q: 'Quel matériel faut-il pour enregistrer ses vidéos ?',
          a: "Aucun appareil professionnel ni studio n'est demandé. Un smartphone posé de manière stable dans une pièce calme et suffisamment éclairée suffit. L'important est qu'on vous voie et qu'on entende clairement votre voix.",
        },
        {
          q: 'Comment s’inscrire et à quoi sert le code UCAEP ?',
          a: "Remplissez le formulaire sur la page S'inscrire avant le vendredi 20 novembre 2026. Dès que vous validez l'étape finale, votre code d'anonymat personnel (de type UCAEP-2026-XXXX) s'affiche à l'écran : conservez-le, car il vous sert à accéder à votre espace de dépôt sans révéler votre nom au jury.",
        },
      ],
    },
    {
      id: 'pendant-les-epreuves',
      folio: 'Chapitre 02',
      title: 'Pendant les épreuves',
      subtitle: 'Organisation en ligne ou en présentiel, formats acceptés et remise des travaux.',
      items: [
        {
          q: 'Comment s’enchaînent les phases en ligne et la finale sur le campus ?',
          a: "Les Phases 1 (« La Plume ») et 2 (« La Connaissance ») se déroulent à distance : vous déposez vos textes et vos vidéos depuis votre espace candidat. Les finalistes retenus rejoignent ensuite le campus de l'ENSET de Lokossa pour deux jours d'ateliers pratiques (Jours 12 et 13) puis la Grande Finale en présentiel (Jour 14).",
        },
        {
          q: 'Que faut-il produire en Phase 1 (La Plume) ?',
          a: p1Revealed
            ? "Vous rédigez deux textes personnels originaux autour des deux sujets officiels — « Je suis… » et « Les mots que l'on n'ose pas dire » — et vous réalisez pour chacun une vidéo de lecture ou d'interprétation (jusqu'à 5 minutes par épreuve)."
            : "Vous rédigez deux textes personnels en français et réalisez pour chacun une vidéo de lecture (jusqu'à 5 minutes). Les intitulés exacts des deux exercices sont affichés dès l'ouverture officielle de la phase.",
        },
        {
          q: 'En quoi consistent les Phases 2 et 3 ?',
          a: `${
            p2Revealed
              ? "En Phase 2 (« La Connaissance », en ligne), vous préparez un contenu de vulgarisation scientifique (« La science dans notre quotidien ») et un texte sur l'éducation (« L'école, le savoir et l'avenir »), accompagnés chacun d'une vidéo."
              : "En Phase 2 (« La Connaissance », en ligne), les candidats qualifiés travaillent sur la vulgarisation scientifique et la réflexion éducative (texte et vidéo). Les sujets précis restent masqués jusqu'au Jour 6."
          } ${
            p3Revealed
              ? "En Phase 3 (« L'Éloquence », en présentiel), les finalistes présentent un discours préparé sur sujet libre (« La parole que le monde doit entendre ») puis relèvent une épreuve d'improvisation sur place (« Le défi de l'inattendu »)."
              : "En Phase 3 (« L'Éloquence », en présentiel à l'ENSET), les finalistes présentent deux épreuves orales devant public et jury dont les intitulés seront publiés à l'approche de la finale."
          }`,
        },
        {
          q: 'Quels formats de fichiers sont acceptés et peut-on intégrer des langues nationales ?',
          a: "Les textes sont rédigés en français (des touches ou proverbes en langues nationales béninoises sont admis s'ils enrichissent naturellement le propos). Dans l'espace de dépôt, chaque phase en ligne attend 2 textes saisis directement et 2 vidéos distinctes (Vidéo 1 et Vidéo 2, formats MP4, MOV ou WebM, moins de 5 minutes et 100 Mo maximum par vidéo).",
        },
        {
          q: 'Peut-on recommencer une prise vidéo ou modifier un texte après l’envoi ?',
          a: "Oui, avant l'envoi, vous pouvez filmer autant de prises que vous le souhaitez jusqu'à obtenir un son clair. Une fois envoyé dans l'espace candidat, un texte reste modifiable tant que le jury ne l'a pas encore validé ; dès qu'il est validé, sa modification est automatiquement verrouillée.",
        },
      ],
    },
    {
      id: 'evaluation-et-resultats',
      folio: 'Chapitre 03',
      title: 'Évaluation et résultats',
      subtitle: 'Composition du jury, contrôle d’originalité, publication et attestations.',
      items: [
        {
          q: 'Qui note les productions et comment l’équité est-elle assurée ?',
          a: "Le jury réunit six à huit membres (enseignants littéraires et scientifiques de l'ENSET, membres de la Session Théâtre UCAEP et personnalité culturelle). Pendant les phases en ligne, chaque dossier est examiné anonymement sous code UCAEP par deux correcteurs distincts sur 20 points, sans connaître le nom, la filière ou le niveau d'études du candidat.",
        },
        {
          q: 'Pourquoi les textes copiés ou générés par IA sont-ils interdits ?',
          a: "Le concours cherche à évaluer votre réflexion personnelle et votre capacité à la défendre ensuite à l'oral. Tout plagiat ou texte rédigé par une intelligence artificielle fausserait l'évaluation et entraîne une disqualification ; le jury peut également vérifier votre maîtrise du texte lors de la phase orale.",
        },
        {
          q: 'Comment sont publiés les résultats et que reçoit chaque participant ?',
          a: "Les listes de qualifiés et résultats sont publiés sous code candidat sur la page Annonces et dans le canal officiel. Vous disposez d'un délai écrit de 24 heures après publication pour signaler toute erreur matérielle. Chaque étudiant inscrit reçoit une attestation officielle de la Session Théâtre UCAEP ainsi qu'une invitation à la Grande Finale sur le campus.",
        },
      ],
    },
  ];
}

export function FaqPage() {
  usePageSeo(
    'FAQ',
    "Réponses concrètes avant de participer, pendant les épreuves et sur l'évaluation au concours UCAEP à l'ENSET de Lokossa.",
  );

  const [openKey, setOpenKey] = useState<string | null>('avant-de-participer-0');
  const [phases, setPhases] = useState<CompetitionPhase[]>([]);
  const faqBarScopeId = useId();

  useEffect(() => {
    let active = true;
    fetchApiJson<{ phases: CompetitionPhase[] }>('/api/phases')
      .then((data) => {
        if (active) setPhases(data.phases || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const chapters = buildFaqChapters(phases);

  let runningIndex = 0;

  return (
    <div className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Questions fréquentes"
        section="Guide rapide · 3 chapitres"
        title="Vos questions"
        italicWord="dans l'ordre."
        subtitle="Retrouvez les réponses organisées selon le moment où vous vous trouvez : avant de vous inscrire, pendant la préparation et le dépôt de vos épreuves, puis au moment de l'évaluation et des résultats."
      />

      {/* Synthèse rapide en quatre points */}
      <section className="border-b border-ucaep-brown/14 bg-ucaep-linen/60 paper-fiber py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
          <EditorialReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              L’essentiel en quatre repères
            </p>
          </EditorialReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ANSWERS.map((qa, idx) => (
              <EditorialReveal key={qa.num} delay={idx * 0.06} y={14}>
                <div className="art-card h-full rounded-[2px] border border-ucaep-brown/15 bg-ucaep-paper p-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif text-xl font-semibold text-ucaep-brown">
                      {qa.title}
                    </h2>
                    <span className="font-mono text-xs text-ucaep-gold">{qa.num}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-ucaep-ink/80 leading-relaxed">
                    {qa.summary}
                  </p>
                </div>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 lg:py-24 overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={230}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="brown"
          tileWidth={130}
          blendMultiply
          orbit
          className="hidden lg:block absolute -top-16 -right-16 w-56 h-56 opacity-[0.07]"
        />
        <BrandPatternWave
          variant="brown"
          tileWidth={170}
          opacity={0.08}
          className="absolute bottom-0 inset-x-0 h-20"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            <EditorialMark folio="Sommaire" label="3 chapitres" tone="brown" />

            <nav
              aria-label="Chapitres de la FAQ"
              className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14 text-sm"
            >
              {chapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  className="flex items-baseline justify-between py-3 text-ucaep-brown hover:text-ucaep-gold transition-colors"
                >
                  <span className="font-medium">{chapter.title}</span>
                  <span className="font-mono text-xs text-ucaep-brown/60">
                    {chapter.folio}
                  </span>
                </a>
              ))}
            </nav>

            <ParallaxDepthCard offset={6}>
              <div className="art-card relative overflow-hidden p-6 bg-white border border-ucaep-brown/14 rounded-[2px] space-y-3 paper-fiber">
                <Feather
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12"
                  strokeWidth={1.25}
                />
                <p className="relative z-10 font-serif italic text-2xl text-ucaep-brown leading-snug">
                  « Aucune expérience scénique préalable n&apos;est requise. »
                </p>
                <p className="relative z-10 text-xs text-ucaep-ink/78 leading-relaxed">
                  Les deux premières phases se réalisent en ligne avant les ateliers pratiques et la finale en présentiel à l&apos;ENSET de Lokossa.
                </p>
              </div>
            </ParallaxDepthCard>

            <EditorialReveal delay={0.08}>
              <div className="art-card relative overflow-hidden p-6 bg-ucaep-linen/80 paper-grain border border-ucaep-brown/14 rounded-[2px] space-y-3">
                <MessageCircleQuestion
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12"
                  strokeWidth={1.25}
                />
                <h2 className="relative z-10 font-serif text-2xl font-semibold text-ucaep-brown">
                  Vous ne trouvez pas votre réponse ?
                </h2>
                <p className="relative z-10 text-sm text-ucaep-ink/78 leading-relaxed">
                  Écrivez directement à l&apos;équipe de la Session Théâtre UCAEP en précisant, si possible, votre filière ou votre code candidat.
                </p>
                <Link
                  to="/contact"
                  className="relative z-10 group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors pt-1"
                >
                  <span className="editorial-underline">Contacter l&apos;organisation</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </EditorialReveal>
          </aside>

          <div className="lg:col-span-8 space-y-14">
            {chapters.map((chapter) => (
              <section
                key={chapter.id}
                id={chapter.id}
                className="scroll-mt-24 space-y-5"
              >
                <EditorialReveal className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                    {chapter.folio}
                  </p>
                  <EditorialTitleReveal>
                    <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                      {chapter.title}
                    </h2>
                  </EditorialTitleReveal>
                  <p className="text-sm text-ucaep-ink/75 max-w-prose">
                    {chapter.subtitle}
                  </p>
                </EditorialReveal>

                <div className="divide-y divide-ucaep-brown/15 border-t border-b border-ucaep-brown/15 bg-ucaep-paper/85">
                  {chapter.items.map((item, idx) => {
                    runningIndex += 1;
                    const itemKey = `${chapter.id}-${idx}`;
                    const isOpen = openKey === itemKey;
                    const displayIdx = String(runningIndex).padStart(2, '0');
                    return (
                      <div key={item.q} className="relative">
                        {isOpen && (
                          <motion.span
                            layoutId={`faq-active-${faqBarScopeId}`}
                            aria-hidden="true"
                            transition={EDITORIAL_SPRING}
                            className="absolute left-0 top-3 bottom-3 w-[2px] bg-ucaep-gold"
                          />
                        )}
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.995 }}
                          transition={TACTILE_SPRING}
                          aria-expanded={isOpen}
                          onClick={() => setOpenKey(isOpen ? null : itemKey)}
                          className="w-full py-5 sm:py-6 pl-3 sm:pl-4 pr-2 flex items-baseline justify-between gap-6 text-left group"
                        >
                          <div className="flex items-baseline gap-4 sm:gap-5">
                            <span className="font-mono text-base sm:text-lg text-ucaep-gold tabular-nums shrink-0">
                              {displayIdx}
                            </span>
                            <span className="font-serif text-xl sm:text-2xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors">
                              {item.q}
                            </span>
                          </div>
                          <motion.span
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={TACTILE_SPRING}
                            className={`shrink-0 inline-flex ${
                              isOpen ? 'text-ucaep-gold' : 'text-ucaep-brown'
                            }`}
                          >
                            <Plus className="w-5 h-5" />
                          </motion.span>
                        </motion.button>

                        <EditorialExpandable isOpen={isOpen}>
                          <div className="pb-6 pl-10 sm:pl-14 pr-6 text-sm sm:text-base text-ucaep-ink/84 leading-[1.75] max-w-prose">
                            {item.a}
                          </div>
                        </EditorialExpandable>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
