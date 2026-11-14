import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Clock,
  Compass,
  GraduationCap,
  Languages,
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
import { useCandidateSession } from '../lib/candidate-session';
import { usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';

const PILLARS = [
  {
    index: 'I',
    number: '01',
    keyPoint: 'En ligne · Qualificative · / 20 pts',
    noteInfo: 'Notée sur 20 points · Phase qualificative',
    title: 'La Plume — Écriture originale et interprétation vidéo',
    imageKey: 'writing' as const,
    caption: 'Fig. 01 — Rédaction des deux textes personnels avant l’interprétation vidéo',
    text: "À travers deux épreuves — « Je suis… » et « Les mots que l'on n'ose pas dire » — les candidats produisent des textes originaux et les interprètent en vidéo (jusqu'à 5 minutes par présentation). Cette phase évalue la sincérité, la maîtrise de la langue, l'originalité et la cohérence.",
  },
  {
    index: 'II',
    number: '02',
    keyPoint: 'En ligne · Qualificative · / 20 pts',
    noteInfo: 'Notée sur 20 points · Sélection des finalistes',
    title: 'La Connaissance — Contenus explicatifs et vulgarisation',
    imageKey: 'connaissance' as const,
    caption: 'Fig. 02 — Vulgariser des sujets scientifiques et éducatifs en vidéo',
    text: "Les candidats retenus préparent des contenus explicatifs et des prestations vidéo autour de deux sujets précis : « La science dans notre quotidien » et « L'école, le savoir et l'avenir ». L'objectif est de rendre des notions techniques ou éducatives claires, structurées et accessibles.",
  },
  {
    index: 'III',
    number: '03',
    keyPoint: 'En présentiel (Jour 14) · Finale · / 20 pts',
    noteInfo: 'Notée sur 20 points · Prestations en présentiel',
    title: "L'Éloquence — Prise de parole en présentiel",
    imageKey: 'eloquence' as const,
    caption: 'Fig. 03 — Prestations finales devant le jury et la communauté universitaire',
    text: "Après deux journées d'ateliers de diction et de préparation scénique (Jours 12 et 13), les finalistes présentent leurs prestations en présentiel lors de deux épreuves : « La parole que le monde doit entendre » et « Le défi de l'inattendu ».",
  },
];

const PRACTICAL_RULES = [
  {
    number: '01',
    takeaway: 'Gratuit · ENSET de Lokossa',
    title: 'Ouvert à tous les étudiants de l’ENSET',
    text: "La participation est gratuite et ouverte à tous les étudiants de l'ENSET de Lokossa, quelle que soit la filière ou l'année d'études, sans expérience scénique préalable.",
    Icon: GraduationCap,
  },
  {
    number: '02',
    takeaway: 'En ligne (1 & 2) · Présentiel (3)',
    title: 'Deux phases en vidéo, une finale en présentiel',
    text: 'Les deux premières phases se déroulent en ligne (textes et prestations vidéo dans la limite de 5 minutes par présentation). La troisième phase réunit les finalistes en présentiel sur le campus.',
    Icon: Clock,
  },
  {
    number: '03',
    takeaway: 'Français + langues locales',
    title: 'Français et apports en langues nationales',
    text: "Les productions sont rédigées et présentées en français, avec la possibilité d'intégrer des mots, proverbes ou expressions en langues nationales béninoises lorsqu'ils éclairent le propos.",
    Icon: Languages,
  },
  {
    number: '04',
    takeaway: 'Original · Zéro plagiat / IA',
    title: 'Production personnelle, sans plagiat ni IA',
    text: "Chaque texte et chaque contenu explicatif doivent être entièrement originaux. Tout plagiat ou recours à une intelligence artificielle entraîne la disqualification ; le jury peut vérifier la maîtrise à l'oral.",
    Icon: ShieldCheck,
  },
  {
    number: '05',
    takeaway: '6 à 8 jurés · Double lecture',
    title: 'Jury pluridisciplinaire et anonymat',
    text: 'Six à huit membres (enseignants littéraires et scientifiques de l’ENSET, Session Théâtre UCAEP, personnalité culturelle) évaluent les productions en double lecture sous code candidat UCAEP.',
    Icon: Scale,
  },
  {
    number: '06',
    takeaway: 'Anonymat · Recours 24 h',
    title: 'Publication transparente et recours sous 24 h',
    text: 'Les résultats sont publiés d’abord sous code de référence UCAEP pour garantir l’impartialité, avec un délai écrit de 24 heures permettant de signaler toute erreur matérielle.',
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
  useEditorialScrollMotion(pageRef);

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Présentation"
        section="Session Théâtre UCAEP · ENSET de Lokossa — UNSTIM"
        title="Comprendre le concours"
        italicWord="et sa démarche"
        subtitle="À côté des enseignements scientifiques et techniques de l'ENSET de Lokossa, ce concours gratuit vise à exercer les étudiants à l'écriture personnelle, à la vulgarisation des connaissances et à la prise de parole en public."
        patternVariant="brown"
        quickFacts={[
          { label: 'Public & tarif', value: 'ENSET · Gratuit' },
          { label: 'Format', value: '2 en ligne · 1 présentiel' },
          { label: 'Évaluation', value: 'Chaque phase sur 20 pts' },
          { label: 'Correction', value: 'Double lecture anonyme' },
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

      {/* Documentary Exhibition Opening Image */}
      <section className="py-14 lg:py-20 border-b border-ucaep-brown/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-8" data-clip-reveal>
            <div className="aspect-[16/9] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/12">
              <EditorialImage assetKey="audience" data-parallax="-5" />
            </div>
            <p className="mt-3 text-xs font-serif italic text-ucaep-brown/75">
              Fig. 00 — Un dispositif pédagogique conçu pour les étudiants de l&apos;ENSET de Lokossa
            </p>
          </div>
          <div className="lg:col-span-4 space-y-5 pb-2" data-reveal>
            <div className="art-card relative overflow-hidden rounded-[2px] border border-ucaep-brown/15 bg-ucaep-linen/65 paper-grain p-6 space-y-4">
              <Sparkles
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.06] -rotate-12"
                strokeWidth={1.3}
              />
              <p className="relative z-10 font-serif italic text-2xl text-ucaep-brown leading-snug">
                « Écrire avec justesse, expliquer avec clarté, convaincre à l&apos;oral. »
              </p>
              <p className="relative z-10 text-xs text-ucaep-ink/80 leading-relaxed">
                Un parcours complet en <strong className="text-ucaep-brown">3 phases et 6 épreuves</strong> (deux phases en ligne en vidéo suivies d&apos;une finale en présentiel), avec jusqu&apos;à{' '}
                <strong className="text-ucaep-brown">5 minutes</strong> par prestation.
              </p>
              <Link
                to="/parcours"
                className="relative z-10 group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors"
              >
                <span className="editorial-underline">Consulter les 3 phases &amp; 6 épreuves</span>
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
            {PILLARS.map((pillar, idx) => {
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
              Participer à <em className="italic font-normal text-ucaep-ivory">l&apos;édition 2026</em>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/90">
              L&apos;inscription est gratuite et ouverte à tous les étudiants de l&apos;ENSET de Lokossa. Remplissez le formulaire avant le vendredi 20 novembre 2026 pour obtenir votre code candidat anonyme.
            </p>
          </div>
          {candidateSession ? (
            <Link
              to="/depot"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Accéder à mon dossier</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              to="/inscription"
              className="btn-tactile group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] whitespace-nowrap shrink-0"
            >
              <span>Je m&apos;inscris</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
