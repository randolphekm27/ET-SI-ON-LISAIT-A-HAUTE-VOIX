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

const FAQ_ITEMS = [
  {
    q: 'Qui peut participer au concours ?',
    a: "Le concours est ouvert à tous les étudiants, quelle que soit votre filière ou votre année d'études. Aucune expérience préalable en théâtre, poésie ou prise de parole n'est demandée.",
  },
  {
    q: "Est-ce que l'inscription est gratuite ?",
    a: "Oui, la participation est 100 % gratuite du début à la fin. Il suffit de remplir le formulaire en ligne pour obtenir votre numéro d'anonymat.",
  },
  {
    q: 'En quoi consiste exactement la Phase 1 (La Plume) ?',
    a: "La Phase 1 compte deux épreuves personnelles notées sur 20 points : l'épreuve 1 « Je suis… » (ici, vous êtes appelé(e) à vous présenter vraiment au-delà de votre nom ou filière, sous forme de poème, prose, monologue ou récit) et l'épreuve 2 « Les mots que l'on n'ose pas dire » (ici, vous êtes invité(e) à confier au papier une vérité, une gratitude ou une émotion gardée pour vous).",
  },
  {
    q: 'Combien de temps dure la présentation ?',
    a: "Chaque candidat dispose de jusqu'à 5 minutes pour sa présentation. Vous pouvez envoyer vos productions au format PDF, Word, audio, vidéo ou directement en texte saisi depuis la page Dépôt candidat.",
  },
  {
    q: 'Puis-je utiliser des expressions en langues nationales ?',
    a: "Les textes sont rédigés en français, mais l'usage de mots, proverbes ou expressions en langues nationales béninoises est tout à fait autorisé s'il sert votre propos et enrichit votre texte.",
  },
  {
    q: "Le plagiat ou l'intelligence artificielle sont-ils tolérés ?",
    a: "Non. Tous les textes doivent être personnels, originaux et inédits. Tout plagiat ou texte généré par intelligence artificielle entraîne l'élimination immédiate — le jury se réserve aussi le droit d'en vérifier la maîtrise à l'oral.",
  },
  {
    q: 'Comment fonctionne la notation et y a-t-il des éliminations à chaque phase ?',
    a: "Chaque phase possède ses propres notes sur 20 points. La Phase 1 et la Phase 2 sont qualificatives : les candidats ayant obtenu les meilleurs résultats passent à l'étape suivante. La Phase 3 (Grande Finale sur scène) est notée sur 20 points sans élimination en cours de soirée.",
  },
  {
    q: 'Qui compose le jury et comment garantit-il l’équité ?',
    a: "Un jury mixte de 6 à 8 membres (enseignants littéraires et scientifiques de l'ENSET, représentants de la Session Théâtre UCAEP et personnalité culturelle) corrige vos écrits en double lecture anonyme, sous votre seul code candidat.",
  },
  {
    q: 'Que reçoit chaque participant ?',
    a: "Chaque étudiant participant reçoit une attestation officielle de la Session Théâtre de l'UCAEP et une invitation à la Grande Finale sur le campus.",
  },
  {
    q: 'Peut-on demander une vérification en cas d’erreur sur une note ?',
    a: "Oui. Les résultats paraissent d'abord sous numéro d'anonymat puis par nom, et chaque candidat dispose d'un délai écrit de 24 heures pour signaler toute erreur matérielle de report ou de calcul.",
  },
  {
    q: 'Que font les finalistes avant et pendant la Grande Finale (Jour 14) ?',
    a: "Les finalistes profitent de deux jours d'ateliers de diction, de lecture expressive et de répétitions (Jours 12 et 13). Le Jour 14 sur scène, ils passent les épreuves finales qui leur seront révélées progressivement après la Phase 2, dans la limite de 5 minutes par passage.",
  },
  {
    q: 'Comment m’inscrire et suivre les annonces ?',
    a: "Remplissez le formulaire sur la page S'inscrire en deux minutes avant le vendredi 20 novembre 2026 pour obtenir votre code de référence UCAEP. Toutes les dates d'ouverture et résultats sont publiés sur la page Annonces.",
  },
];

export function FaqPage() {
  usePageSeo(
    'FAQ',
    "Réponses complètes aux questions sur le concours UCAEP « Et si on lisait à haute voix ? » : Phase 1, durée de présentation (5 minutes), jury et inscription ouverte à tous les étudiants.",
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Index"
        section="En pratique · 12 réponses"
        title="Vous vous posez peut-être"
        italicWord="ces questions."
        subtitle="L'essentiel sur la Phase 1, les 5 minutes de présentation, la correction anonyme et le déroulement sur trois semaines."
      />

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
          className="hidden lg:block absolute -top-16 -right-16 w-56 h-56 opacity-[0.07]"
        />
        <BrandPatternWave
          variant="brown"
          tileWidth={170}
          opacity={0.08}
          className="absolute bottom-0 inset-x-0 h-20"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            <EditorialMark folio="12 repères" label="Questions fréquentes" tone="brown" />

            <div className="relative overflow-hidden p-6 bg-white border border-ucaep-brown/14 rounded-sm space-y-3 paper-fiber">
              <Feather
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12"
                strokeWidth={1.25}
              />
              <p className="relative z-10 font-serif italic text-2xl text-ucaep-brown leading-snug">
                « Pas besoin d&apos;avoir déjà fait de la scène pour se lancer. »
              </p>
              <p className="relative z-10 text-xs text-ucaep-ink/75 leading-relaxed">
                Les deux premières phases se préparent calmement chez vous, avec jusqu&apos;à
                5 minutes pour votre présentation.
              </p>
            </div>

            <div className="relative overflow-hidden p-6 bg-ucaep-linen/80 paper-grain border border-ucaep-brown/14 rounded-sm space-y-3">
              <MessageCircleQuestion
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-5 -right-4 w-28 h-28 text-ucaep-brown opacity-[0.055] -rotate-12"
                strokeWidth={1.25}
              />
              <h2 className="relative z-10 font-serif text-2xl font-semibold text-ucaep-brown">
                Vous avez une autre question ?
              </h2>
              <p className="relative z-10 text-sm text-ucaep-ink/75 leading-relaxed">
                Écrivez directement à l&apos;équipe de la Session Théâtre UCAEP, on vous répondra dès
                que possible.
              </p>
              <Link
                to="/contact"
                className="relative z-10 group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors pt-1"
              >
                <span className="editorial-underline">Nous écrire</span>
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
                        <span className="font-serif text-xl sm:text-2xl text-ucaep-gold tabular-nums shrink-0">
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
