import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Feather, MessageCircleQuestion, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { usePageSeo } from '../lib/format';

const QUICK_ANSWERS = [
  {
    num: '01',
    title: 'Public & coût ?',
    summary: "Gratuit et ouvert à tous les étudiants de l'ENSET de Lokossa, quelle que soit la filière.",
  },
  {
    num: '02',
    title: 'Déroulement ?',
    summary: "Deux phases en ligne en vidéo (La Plume, La Connaissance) et une finale en présentiel (L'Éloquence).",
  },
  {
    num: '03',
    title: 'Épreuves ?',
    summary: "Six épreuves précises (deux par phase), avec jusqu'à 5 minutes par présentation et une note sur 20 pts.",
  },
  {
    num: '04',
    title: 'Équité ?',
    summary: 'Correction en double lecture anonyme sous code UCAEP · Recours écrit sous 24 h.',
  },
];

const FAQ_ITEMS = [
  {
    q: "Qui peut participer au concours ?",
    a: "La participation est ouverte à tous les étudiants inscrits à l'ENSET de Lokossa, quelle que soit leur filière ou leur année d'études. Aucune expérience préalable en théâtre, poésie ou prise de parole n'est exigée.",
  },
  {
    q: "La participation est-elle payante ?",
    a: "Non, l'inscription et la participation sont entièrement gratuites du début à la fin du parcours. Il suffit de remplir le formulaire d'inscription en ligne pour recevoir votre code d'anonymat.",
  },
  {
    q: 'Comment se répartissent les épreuves en ligne et en présentiel ?',
    a: "Les deux premières phases (Phase 1 « La Plume » et Phase 2 « La Connaissance ») se déroulent en ligne : les candidats transmettent leurs textes ou contenus explicatifs et leurs prestations vidéo depuis l'espace Dépôt candidat. La troisième phase (Phase 3 « L'Éloquence ») se tient en présentiel sur le campus devant le jury et le public.",
  },
  {
    q: 'En quoi consiste la Phase 1 : La Plume ?',
    a: "Lors de la Phase 1 (en ligne), les candidats produisent des textes originaux autour de deux épreuves — « Je suis… » et « Les mots que l'on n'ose pas dire » — et les interprètent en vidéo (jusqu'à 5 minutes par prestation). L'évaluation porte sur la sincérité (6 pts), la qualité de la langue (6 pts), l'originalité (5 pts) et la cohérence (3 pts).",
  },
  {
    q: 'En quoi consiste la Phase 2 : La Connaissance ?',
    a: "Lors de la Phase 2 (en ligne), les candidats retenus préparent des contenus explicatifs et des prestations vidéo autour de deux sujets précis : « La science dans notre quotidien » et « L'école, le savoir et l'avenir ». L'épreuve évalue la capacité à vulgariser des idées scientifiques ou éducatives avec clarté.",
  },
  {
    q: "En quoi consiste la Phase 3 : L'Éloquence ?",
    a: "Lors de la Phase 3 (en présentiel), les finalistes participent d'abord à deux journées d'ateliers de diction et de préparation scénique (Jours 12 et 13), puis présentent leurs prestations en présentiel lors de deux épreuves : « La parole que le monde doit entendre » et « Le défi de l'inattendu ».",
  },
  {
    q: 'Quelle est la durée et quels formats sont acceptés pour les dépôts en ligne ?',
    a: "Chaque candidat dispose de jusqu'à 5 minutes par présentation. L'espace Dépôt candidat accepte les fichiers vidéo (MP4, MOV, WebM), audio, PDF, Word ou la saisie directe de texte en ligne (50 Mo maximum pour les fichiers).",
  },
  {
    q: 'Peut-on intégrer des expressions en langues nationales ?',
    a: "Les textes et présentations sont réalisés en français. L'emploi ponctuel de mots, proverbes ou expressions en langues nationales béninoises est autorisé lorsqu'il enrichit le propos.",
  },
  {
    q: "Comment le plagiat et les textes générés par IA sont-ils traités ?",
    a: "Toutes les productions doivent être strictement personnelles et originales. Tout plagiat ou usage d'intelligence artificielle pour rédiger les textes entraîne une disqualification ; le jury se réserve le droit de vérifier la maîtrise de l'œuvre à l'oral.",
  },
  {
    q: 'Qui compose le jury et comment l’équité est-elle garantie ?',
    a: "Le jury réunit six à huit membres (enseignants littéraires et scientifiques de l'ENSET, représentants de la Session Théâtre UCAEP et personnalité culturelle). Les productions en ligne sont corrigées en double lecture sous code candidat anonyme, avec un délai écrit de recours de 24 heures après publication des résultats.",
  },
  {
    q: 'Que reçoit chaque participant à l’issue du concours ?',
    a: "Chaque étudiant participant reçoit une attestation officielle de la Session Théâtre de l'UCAEP ainsi qu'une invitation à la Grande Finale en présentiel sur le campus.",
  },
  {
    q: 'Comment s’inscrire et suivre le calendrier officiel ?',
    a: "L'inscription s'effectue en ligne depuis la page S'inscrire avant le vendredi 20 novembre 2026 afin d'obtenir votre référence UCAEP. Toutes les ouvertures de phase et communications officielles sont publiées sur la page Annonces.",
  },
];

export function FaqPage() {
  usePageSeo(
    'FAQ',
    "Réponses pratiques sur le concours UCAEP à l'ENSET de Lokossa : conditions d'accès gratuites, 3 phases, 6 épreuves (en ligne en vidéo et en présentiel), notation et jury.",
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Questions fréquentes"
        section="Fonctionnement · 12 réponses"
        title="Questions pratiques"
        italicWord="et modalités."
        subtitle="Toutes les précisions sur l'inscription gratuite pour les étudiants de l'ENSET de Lokossa, le format des phases en ligne et en présentiel, et l'évaluation des six épreuves."
      />

      {/* Instant-scan 4-point top ledger */}
      <section className="border-b border-ucaep-brown/14 bg-ucaep-linen/60 paper-fiber py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
            Synthèse en quatre points
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ANSWERS.map((qa) => (
              <div
                key={qa.num}
                className="art-card rounded-[2px] border border-ucaep-brown/15 bg-ucaep-paper p-5 space-y-2"
              >
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
            <EditorialMark folio="12 repères" label="Questions fréquentes" tone="brown" />

            <div className="art-card relative overflow-hidden p-6 bg-white border border-ucaep-brown/14 rounded-[2px] space-y-3 paper-fiber">
              <Feather
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12"
                strokeWidth={1.25}
              />
              <p className="relative z-10 font-serif italic text-2xl text-ucaep-brown leading-snug">
                « Aucune expérience scénique préalable n&apos;est requise. »
              </p>
              <p className="relative z-10 text-xs text-ucaep-ink/75 leading-relaxed">
                Les deux premières phases se réalisent en ligne en vidéo avant les ateliers et la finale en présentiel à l&apos;ENSET de Lokossa.
              </p>
            </div>

            <div className="art-card relative overflow-hidden p-6 bg-ucaep-linen/80 paper-grain border border-ucaep-brown/14 rounded-[2px] space-y-3">
              <MessageCircleQuestion
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12"
                strokeWidth={1.25}
              />
              <h2 className="relative z-10 font-serif text-2xl font-semibold text-ucaep-brown">
                Une question complémentaire ?
              </h2>
              <p className="relative z-10 text-sm text-ucaep-ink/75 leading-relaxed">
                Adressez votre demande à l&apos;équipe d&apos;organisation de la Session Théâtre UCAEP depuis l&apos;espace Contact.
              </p>
              <Link
                to="/contact"
                className="relative z-10 group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors pt-1"
              >
                <span className="editorial-underline">Contacter l&apos;organisation</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <div className="divide-y divide-ucaep-brown/15 border-t border-b border-ucaep-brown/15 bg-ucaep-paper/85">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openIndex === idx;
                const displayIdx = String(idx + 1).padStart(2, '0');
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full py-6 flex items-baseline justify-between gap-6 text-left group"
                    >
                      <div className="flex items-baseline gap-5">
                        <span className="font-mono text-base sm:text-lg text-ucaep-gold tabular-nums shrink-0">
                          {displayIdx}
                        </span>
                        <span className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors">
                          {item.q}
                        </span>
                      </div>
                      <Plus
                        className={`w-5 h-5 text-ucaep-brown shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-45 text-ucaep-gold' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-6 pl-9 sm:pl-11 pr-6 text-base text-ucaep-ink/82 leading-relaxed max-w-2xl">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
