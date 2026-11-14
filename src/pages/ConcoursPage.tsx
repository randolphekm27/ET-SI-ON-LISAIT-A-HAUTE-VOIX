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
import { useCandidateSession } from '../lib/candidate-session';
import { usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';

const PILLARS = [
  {
    index: 'I',
    number: '01',
    keyPoint: 'À domicile · Qualificative · / 20 pts',
    noteInfo: 'Notée sur 20 points · Phase qualificative',
    title: 'La Plume — Écriture personnelle',
    imageKey: 'writing' as const,
    caption: 'Fig. 01 — Mettre ses idées et sa sincérité sur le papier',
    text: "À travers deux épreuves personnelles (« Je suis… » et « Les mots que l'on n'ose pas dire »), vous êtes appelé(e) à écrire avec sincérité, sans chercher de phrases compliquées. Les meilleurs textes ouvrent la porte de la Phase 2.",
  },
  {
    index: 'II',
    number: '02',
    keyPoint: 'Révélée au Jour 6 · Qualificative · / 20 pts',
    noteInfo: 'Notée sur 20 points · Sélection des finalistes',
    title: 'La Connaissance — Sujets dévoilés au Jour 6',
    imageKey: 'connaissance' as const,
    caption: 'Fig. 02 — Une deuxième étape ouverte aux qualifiés de La Plume',
    text: "Une fois les résultats de La Plume proclamés, les candidats retenus découvrent progressivement deux nouvelles épreuves écrites à réaliser à domicile (Jours 6 à 9), avec jusqu'à 5 minutes pour leur présentation.",
  },
  {
    index: 'III',
    number: '03',
    keyPoint: 'Sur scène (Jour 14) · Sans élimination · / 20 pts',
    noteInfo: 'Notée sur 20 points · Finale sans élimination',
    title: "L'Éloquence — Finale sur scène",
    imageKey: 'eloquence' as const,
    caption: 'Fig. 03 — Porter sa voix devant le jury et le campus',
    text: "Après deux jours d'ateliers de diction et de répétitions (Jours 12 et 13), les finalistes montent sur scène devant le jury et le public. Les intitulés et modalités des épreuves finales sont communiqués progressivement après la Phase 2.",
  },
];

const PRACTICAL_RULES = [
  {
    number: '01',
    takeaway: 'Gratuit · Toute filière',
    title: 'Ouvert à tous les étudiants',
    text: "L'inscription est gratuite et ouverte à tous les étudiants, quelle que soit votre filière, votre niveau d'études ou votre expérience en prise de parole.",
    Icon: GraduationCap,
  },
  {
    number: '02',
    takeaway: '5 min max · Multi-format',
    title: "Jusqu'à 5 minutes pour présenter",
    text: 'Pour défendre son travail ou présenter son texte, chaque candidat dispose de jusqu’à 5 minutes. Déposez vos productions au format PDF, Word, audio, vidéo ou texte en ligne.',
    Icon: Clock,
  },
  {
    number: '03',
    takeaway: 'Français + langues locales',
    title: 'Français & langues nationales',
    text: "Les textes sont rédigés en français, mais vous pouvez tout à fait glisser des mots, proverbes ou expressions en langues nationales béninoises s'ils servent votre texte.",
    Icon: Languages,
  },
  {
    number: '04',
    takeaway: 'Original · Zéro plagiat / IA',
    title: '100 % personnel, sans plagiat ni IA',
    text: "Ce qui touche le jury, c'est votre propre voix. Tout texte copié ou généré par intelligence artificielle entraîne la disqualification — le jury peut aussi en vérifier la maîtrise à l'oral.",
    Icon: ShieldCheck,
  },
  {
    number: '05',
    takeaway: '6 à 8 jurés · Double lecture',
    title: 'Jury mixte & copies anonymes',
    text: 'Six à huit membres (enseignants littéraires et scientifiques de l’ENSET, Session Théâtre UCAEP, personnalité culturelle) corrigent vos copies à l’aveugle, deux lecteurs par texte.',
    Icon: Scale,
  },
  {
    number: '06',
    takeaway: 'Anonymat · Recours 24 h',
    title: 'Transparence & recours sous 24 h',
    text: 'Les résultats paraissent d’abord sous votre numéro de référence UCAEP pour garantir l’anonymat, avec un délai écrit de 24 heures pour signaler toute erreur matérielle.',
    Icon: Compass,
  },
];

export function ConcoursPage() {
  usePageSeo(
    'Le concours',
    "Tout comprendre sur le concours « Et si on lisait à haute voix ? » organisé par la Session Théâtre de l'UCAEP, ouvert à tous les étudiants.",
  );

  const pageRef = useRef<HTMLDivElement>(null);
  const candidateSession = useCandidateSession();
  useEditorialScrollMotion(pageRef);

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Dossier"
        section="Session Théâtre UCAEP · ENSET — UNSTIM"
        title="Pourquoi on a eu envie de lancer"
        italicWord="ce concours"
        subtitle="À côté des cours techniques, on avait envie d'ouvrir un espace simple, gratuit et ouvert à tous les étudiants où l'on prend le temps d'écrire, de partager et d'oser parler à voix haute."
        patternVariant="brown"
        quickFacts={[
          { label: 'Accès', value: 'Tous étudiants · Gratuit' },
          { label: 'Présentation', value: "Jusqu'à 5 minutes" },
          { label: 'Évaluation', value: 'Chaque phase sur 20 pts' },
          { label: 'Correction', value: '100 % anonyme' },
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
              Fig. 00 — Un rendez-vous culturel pensé pour tous les étudiants
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
                « Écrire pour clarifier, lire pour comprendre, parler pour transmettre. »
              </p>
              <p className="relative z-10 text-xs text-ucaep-ink/80 leading-relaxed">
                Un parcours complet sur <strong className="text-ucaep-brown">3 semaines en 3 phases progressives</strong>, avec jusqu&apos;à{' '}
                <strong className="text-ucaep-brown">5 minutes</strong> pour la présentation de chaque candidat.
              </p>
              <Link
                to="/parcours"
                className="relative z-10 group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors"
              >
                <span className="editorial-underline">Voir la Phase 1 &amp; les 3 étapes</span>
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
            <EditorialMark folio="Trois volets" label="Points & progression" tone="brown" />
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-ink leading-[1.06]">
              Trois façons de <em className="italic font-normal text-ucaep-brown">faire entendre sa voix</em>
            </h2>
          </div>

          <div className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14">
            {PILLARS.map((pillar, idx) => {
              const reversed = idx % 2 === 1;
              return (
                <article
                  key={pillar.index}
                  data-reveal
                  className="group py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                >
                  <div
                    className={`lg:col-span-6 ${
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
                    className={`lg:col-span-6 space-y-5 ${
                      reversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
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
            <EditorialMark folio="Règlement simple" label="Équité & modalités" tone="green" />
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink leading-tight">
              Des règles claires <em className="italic font-normal text-ucaep-brown">pour que chacun parte à égalité</em>
            </h2>
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
                Pour tous les participants
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                Une attestation pour chacun et une Grande Finale ouverte à tous
              </h2>
              <p className="text-sm sm:text-base text-ucaep-ink/80 leading-relaxed max-w-2xl">
                Chaque étudiant participant reçoit une attestation de la Session Théâtre de
                l&apos;UCAEP et est chaleureusement invité à la Grande Finale sur le campus.
                Les meilleurs candidats sont distingués sur scène à l&apos;issue de la soirée.
              </p>
            </div>
            <div className="lg:col-span-4 relative z-10 flex lg:justify-end">
              <Link
                to="/parcours"
                className="btn-tactile group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-[2px] bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] whitespace-nowrap shrink-0"
              >
                <span>Voir la Phase 1 &amp; le parcours</span>
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
            <EditorialMark folio="Invitation" label="Édition 2026" tone="ivory" />
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">
              Vous souhaitez <em className="italic font-normal text-ucaep-ivory">participer ?</em>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/90">
              L&apos;inscription est gratuite et ouverte à tous les étudiants. Remplissez votre
              fiche avant le vendredi 20 novembre 2026 pour recevoir votre code anonyme.
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
