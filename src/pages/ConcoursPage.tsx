import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Clock,
  Compass,
  GraduationCap,
  Languages,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  BrandPatternCircle,
  BrandPatternEdge,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { ScenicStageAsset } from '../components/ScenicStageAsset';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';
import type { CompetitionPhase } from '../types/competition';

function buildPillars(phases: CompetitionPhase[]) {
  const p1 = phases.find((p) => p.id === 'phase-1' || p.number === '01');
  const p2 = phases.find((p) => p.id === 'phase-2' || p.number === '02');
  const p3 = phases.find((p) => p.id === 'phase-3' || p.number === '03');

  const p1Revealed = Boolean(p1?.isRevealed);
  const p2Revealed = Boolean(p2?.isRevealed);
  const p3Revealed = Boolean(p3?.isRevealed);

  return [
    {
      index: 'I',
      number: '01',
      keyPoint: 'En ligne · Qualificative · / 20 pts',
      noteInfo: 'Notée sur 20 points · Phase qualificative',
      title: 'La Plume — Écrire avec justesse et lire face caméra',
      imageKey: 'writing' as const,
      caption: 'Fig. 01 — Préparation manuscrite des deux créations avant enregistrement vidéo',
      revealed: p1Revealed,
      text: p1Revealed
        ? "Vous rédigez d'abord deux textes personnels (« Je suis… » et « Les mots que l'on n'ose pas dire ») puis vous les lisez en vidéo (jusqu'à 5 minutes par épreuve). Cette première étape entraîne à trouver le mot exact, à structurer une pensée sincère et à porter votre texte à l'oral."
        : "Vous rédigez d'abord deux textes personnels en français puis vous les lisez face caméra (jusqu'à 5 minutes par épreuve). Cette étape entraîne à structurer une pensée sincère et à la porter clairement à haute voix ; les intitulés précis sont dévoilés au lancement officiel.",
    },
    {
      index: 'II',
      number: '02',
      keyPoint: 'En ligne · Qualificative · / 20 pts',
      noteInfo: 'Notée sur 20 points · Sélection des finalistes',
      title: 'La Connaissance — Expliquer pour faire comprendre',
      imageKey: 'connaissance' as const,
      caption: 'Fig. 02 — Expliquer clairement une notion technique ou éducative devant un auditeur',
      revealed: p2Revealed,
      text: p2Revealed
        ? "Les candidats qualifiés préparent deux exposés écrits et vidéo autour de « La science dans notre quotidien » et « L'école, le savoir et l'avenir ». L'exercice consiste à traduire une notion scientifique sans jargon inutile et à argumenter sur le rôle de la transmission."
        : "Les candidats qualifiés préparent deux dossiers explicatifs et leurs vidéos (jusqu'à 5 minutes) pour rendre accessibles des notions scientifiques ou éducatives sans jargon inutile. Les deux sujets exacts restent masqués jusqu'à l'ouverture de cette étape.",
    },
    {
      index: 'III',
      number: '03',
      keyPoint: 'En présentiel (Jour 14) · Finale · / 20 pts',
      noteInfo: 'Notée sur 20 points · Prestations sur scène',
      title: "L'Éloquence — Convaincre en public à l'ENSET",
      imageKey: 'eloquence' as const,
      caption: 'Fig. 03 — Prise de parole en direct devant le jury et les étudiants',
      revealed: p3Revealed,
      text: p3Revealed
        ? "Après deux journées d'ateliers pratiques de diction et de posture sur le campus (Jours 12 et 13), les finalistes montent sur scène pour présenter « La parole que le monde doit entendre » puis relever « Le défi de l'inattendu » en improvisation."
        : "Après deux journées d'ateliers pratiques de diction et de posture sur le campus (Jours 12 et 13), les finalistes prennent la parole en présentiel devant le jury et leurs camarades. Les modalités précises des deux épreuves finales sont communiquées aux finalistes avant le Jour 14.",
    },
  ];
}

const PRACTICAL_RULES = [
  {
    number: '01',
    takeaway: 'Pour qui · Gratuit',
    title: 'Ouvert à chaque étudiant de l’ENSET de Lokossa',
    text: "Toutes les filières techniques, scientifiques et didactiques sont éligibles, de la Licence au Master. Aucune cotisation n'est demandée et vous n'avez pas besoin d'avoir déjà pratiqué le théâtre ou la déclamation.",
    Icon: GraduationCap,
  },
  {
    number: '02',
    takeaway: 'Équité · Anonymat',
    title: 'Pourquoi vos copies portent uniquement un code UCAEP',
    text: "L'anonymat protège votre évaluation contre toute préférence involontaire liée à un nom ou à une filière. Les correcteurs reçoivent exclusivement votre code UCAEP-2026-XXXX et notent chaque production à deux.",
    Icon: Scale,
  },
  {
    number: '03',
    takeaway: 'Authenticité · Zéro IA',
    title: 'Pourquoi le plagiat et l’IA sont strictement interdits',
    text: "Le concours vise à vous faire progresser dans votre propre expression. Un texte copié ou généré par intelligence artificielle empêche cet apprentissage et entraîne la disqualification ; le jury peut vérifier à l'oral que vous maîtrisez votre texte.",
    Icon: ShieldCheck,
  },
  {
    number: '04',
    takeaway: 'Langues du Bénin',
    title: 'Français principal et expressions nationales possibles',
    text: "Les épreuves se rédigent et se présentent en français. Vous pouvez toutefois glisser un proverbe, un mot ou une tournure en langue nationale béninoise s'il éclaire naturellement votre propos.",
    Icon: Languages,
  },
  {
    number: '05',
    takeaway: 'Format vidéo simple',
    title: 'Deux phases en ligne pensées pour votre emploi du temps',
    text: "Pour que vos cours et travaux pratiques ne soient pas perturbés, les deux premières étapes se font à distance dans une limite de 5 minutes par vidéo, avec un simple téléphone portable.",
    Icon: Clock,
  },
  {
    number: '06',
    takeaway: 'Recours 24 h',
    title: 'Transparence des résultats et droit de vérification',
    text: "Chaque étape qualificative est notée sur 20 points. Les listes paraissent d'abord sous code candidat, accompagnées d'un délai écrit de 24 heures pour signaler toute erreur matérielle.",
    Icon: Compass,
  },
];

export function ConcoursPage() {
  usePageSeo(
    'Le concours',
    "Présentation pédagogique et règlement complet du concours « Et si on lisait à haute voix ? » organisé gratuitement par l'UCAEP pour les étudiants de l'ENSET de Lokossa.",
  );

  const pageRef = useRef<HTMLDivElement>(null);
  const candidateSession = useCandidateSession();
  const [phases, setPhases] = useState<CompetitionPhase[]>([]);

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

  useEditorialScrollMotion(pageRef, [phases.length]);
  const pillars = buildPillars(phases);

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Présentation"
        section="Session Théâtre UCAEP · ENSET de Lokossa — UNSTIM"
        title="Pourquoi ce concours"
        italicWord="et comment il fonctionne"
        subtitle="Organisé gratuitement pour les étudiants de l'ENSET de Lokossa, « Et si on lisait à haute voix ? » associe l'écriture personnelle, la vulgarisation scientifique et la prise de parole en public."
        patternVariant="brown"
        quickFacts={[
          { label: 'Organisateur', value: 'Session Théâtre UCAEP' },
          { label: 'Accès', value: 'Gratuit · Tout l’ENSET' },
          { label: 'Jury', value: '6 à 8 membres · Anonyme' },
          { label: 'Notation', value: 'Double lecture sur 20 pts' },
        ]}
        aside={
          <div className="relative flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3">
            <BrandPatternCircle
              variant="gold"
              tileWidth={120}
              blendMultiply
              orbit
              className="hidden sm:block absolute -top-6 -right-4 w-36 h-36 opacity-[0.14]"
            />
            <img
              src="/assets/aistudio/LOGO_CONCOURS_8664fa5e.png"
              alt="Logo officiel Et si on lisait à haute voix ? 2026"
              className="relative z-10 w-36 sm:w-40 h-auto object-contain transition-transform duration-300 hover:scale-105"
            />
            <p className="relative z-10 text-[11px] uppercase tracking-[0.2em] text-ucaep-brown/75 font-semibold">
              Créer · Transmettre · Rayonner
            </p>
          </div>
        }
      />

      {/* Documentary Exhibition Opening Image + Continuous Editorial Explanation */}
      <section className="py-14 lg:py-20 border-b border-ucaep-brown/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7" data-clip-reveal>
            <div className="aspect-[16/10] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/12">
              <EditorialImage assetKey="audience" data-parallax="-5" />
            </div>
            <p className="mt-3 text-xs font-serif italic text-ucaep-brown/75">
              Fig. 00 — Un rendez-vous pensé pour les étudiants de toutes les filières de l&apos;ENSET de Lokossa
            </p>
          </div>
          <div className="lg:col-span-5 space-y-5" data-reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
              Comprendre l&apos;intention
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown leading-tight">
              Apprendre à formuler ses idées, de la feuille jusqu&apos;à l&apos;auditoire
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-ucaep-ink/85 leading-relaxed max-w-prose">
              <p>
                À l&apos;université, on vous évalue souvent sur des calculs, des plans techniques ou des devoirs sur table. Pourtant, dans votre futur métier d&apos;enseignant ou de technicien supérieur, vous devrez expliquer des concepts complexes à des non-spécialistes et défendre votre point de vue à l&apos;oral.
              </p>
              <p>
                C&apos;est pour répondre à ce besoin concret que la Session Théâtre de l&apos;UCAEP organise ce concours gratuit en trois phases : écrire d&apos;abord pour soi, vulgariser ensuite un savoir pour les autres, et enfin convaincre devant un jury et un public sur le campus.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/parcours"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors"
              >
                <span className="editorial-underline">Voir le déroulement pas à pas et le calendrier</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three Editorial Pillar Spreads */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-16">
          <div className="space-y-3 max-w-2xl" data-reveal>
            <EditorialMark folio="Architecture du concours" label="3 phases · 6 épreuves" tone="brown" />
            <div className="overflow-hidden">
              <h2
                data-mask-title
                className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-ink leading-[1.06]"
              >
                Trois phases pour exercer <em className="italic font-normal text-ucaep-brown">l&apos;écrit, la pédagogie et l&apos;éloquence</em>
              </h2>
            </div>
          </div>

          <div className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14">
            {pillars.map((pillar, idx) => {
              const reversed = idx % 2 === 1;
              const isEloquence = pillar.index === 'III';
              return (
                <article
                  key={pillar.index}
                  data-reveal
                  data-scenic-stage={isEloquence ? 'eloquence' : undefined}
                  className="group relative py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                >
                  {isEloquence && (
                    <ScenicStageAsset
                      assetKey="tamtam"
                      plan={1}
                      motionId="tamtam"
                      className="order-3 ml-auto w-24 opacity-40 sm:order-none sm:ml-0 sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:right-4 lg:right-6 sm:w-40 lg:w-48 sm:opacity-30 lg:opacity-35"
                    />
                  )}

                  <div
                    className={`relative z-10 lg:col-span-6 ${
                      reversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div
                      className="aspect-[4/3] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/12"
                      data-clip-reveal
                    >
                      <EditorialImage
                        assetKey={pillar.imageKey}
                        className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      />
                    </div>
                    <p className="mt-2.5 text-xs font-serif italic text-ucaep-brown/70">
                      {pillar.caption}
                    </p>
                  </div>

                  <div
                    className={`relative z-10 lg:col-span-6 space-y-5 ${
                      isEloquence ? 'sm:pr-28 lg:pr-36' : ''
                    } ${reversed ? 'lg:order-1' : 'lg:order-2'}`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ucaep-brown/14 pb-3">
                      <span className="font-serif text-5xl sm:text-6xl font-semibold text-ucaep-gold tabular-nums leading-none">
                        {pillar.number}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-green tabular-nums">
                        Volet {pillar.index} · {pillar.keyPoint}
                      </span>
                    </div>
                    <h3 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-brown leading-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-base sm:text-lg text-ucaep-ink/80 leading-relaxed max-w-xl">
                      {pillar.text}
                    </p>
                    {!pillar.revealed && (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-ucaep-brown/80 bg-ucaep-linen/70 border border-ucaep-brown/15 px-3 py-2 rounded-[2px]">
                        <Lock className="w-3.5 h-3.5 text-ucaep-gold shrink-0" aria-hidden="true" />
                        <span>Sujets des épreuves masqués jusqu&apos;au lancement de la phase</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Practical Rules Cards with Fast-Scan Takeaways */}
      <section className="relative py-20 lg:py-24 bg-ucaep-linen/75 paper-grain border-y border-ucaep-brown/14 overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={210}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={140}
          blendMultiply
          orbit
          className="hidden lg:block absolute -top-20 -right-20 w-64 h-64 opacity-[0.1]"
        />
        <BrandPatternWave
          variant="brown"
          tileWidth={170}
          opacity={0.08}
          className="absolute bottom-0 inset-x-0 h-20"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="space-y-2 max-w-2xl" data-reveal>
            <EditorialMark folio="Cadre réglementaire" label="Équité & modalités" tone="green" />
            <div className="overflow-hidden">
              <h2
                data-mask-title
                className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight"
              >
                Des règles précises <em className="italic font-normal text-ucaep-brown">pour garantir l&apos;équité d&apos;évaluation</em>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRACTICAL_RULES.map((rule, idx) => {
              const Icon = rule.Icon;
              return (
                <article
                  key={rule.number}
                  data-reveal
                  data-reveal-delay={String(idx * 0.05)}
                  className="art-card group relative overflow-hidden rounded-[2px] border border-ucaep-brown/15 bg-ucaep-paper p-7 space-y-3"
                >
                  <Icon
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute -bottom-5 -right-4 w-32 h-32 text-ucaep-brown opacity-[0.055] -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
                    strokeWidth={1.3}
                  />
                  <div className="relative z-10 flex items-baseline justify-between border-b border-ucaep-brown/10 pb-2.5">
                    <span className="font-mono text-xs font-semibold text-ucaep-gold tabular-nums">
                      {rule.number}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ucaep-green">
                      {rule.takeaway}
                    </span>
                  </div>
                  <h3 className="relative z-10 font-serif text-2xl font-semibold text-ucaep-brown leading-snug">
                    {rule.title}
                  </h3>
                  <p className="relative z-10 text-sm text-ucaep-ink/78 leading-relaxed">
                    {rule.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple Participation Recognition Strip (No detailed prize breakdown) */}
      <section className="relative py-20 bg-ucaep-paper paper-fiber overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div
            data-reveal
            className="art-card relative overflow-hidden rounded-[2px] border border-ucaep-brown/20 bg-ucaep-linen/80 paper-grain p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <Award
              aria-hidden="true"
              className="pointer-events-none select-none absolute -bottom-6 right-8 w-40 h-40 text-ucaep-brown opacity-[0.055] -rotate-12"
              strokeWidth={1.2}
            />
            <Users
              aria-hidden="true"
              className="pointer-events-none select-none absolute -top-8 right-52 w-32 h-32 text-ucaep-brown opacity-[0.035] rotate-12"
              strokeWidth={1.2}
            />
            <div className="lg:col-span-8 relative z-10 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                Valorisation du parcours
              </p>
              <div className="overflow-hidden">
                <h2
                  data-mask-title
                  className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown"
                >
                  Une attestation pour chaque inscrit et une finale publique à l&apos;ENSET
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ucaep-ink/80 leading-relaxed max-w-2xl">
                Tout étudiant de l&apos;ENSET de Lokossa inscrit au concours reçoit une attestation
                de participation délivrée par la Session Théâtre de l&apos;UCAEP ainsi qu&apos;une
                invitation à la Grande Finale en présentiel, où les finalistes et lauréats sont distingués.
              </p>
            </div>
            <div className="lg:col-span-4 relative z-10 flex lg:justify-end">
              <Link
                to="/parcours"
                className="btn-tactile group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-[2px] bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] whitespace-nowrap shrink-0"
              >
                <span>Consulter le parcours et le calendrier</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nature Green Registration Invitation */}
      <section className="relative py-20 bg-ucaep-green text-ucaep-paper overflow-hidden">
        <BrandPatternEdge
          variant="green"
          side="right"
          className="w-3 sm:w-5 lg:w-7 opacity-85 border-l border-ucaep-gold/30"
        />
        <BrandPatternSurface
          variant="green"
          tileWidth={200}
          opacityClass="opacity-[0.09]"
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={120}
          orbit
          className="hidden md:block absolute -bottom-16 left-12 w-40 h-40 opacity-20"
        />
        <div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          data-reveal
        >
          <div className="space-y-3 max-w-xl">
            <EditorialMark folio="Inscription" label="Édition 2026" tone="ivory" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
              Prêt à rejoindre <em className="italic font-normal text-ucaep-ivory">l&apos;édition 2026 ?</em>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/90">
              Complétez votre inscription gratuite avant le vendredi 20 novembre 2026 : vous obtiendrez aussitôt votre code d&apos;anonymat UCAEP pour préparer et déposer vos productions en ligne.
            </p>
          </div>
          {candidateSession ? (
            <Link
              to="/depot"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Accéder à mon espace dépôt</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              to="/inscription"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Commencer mon inscription</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
