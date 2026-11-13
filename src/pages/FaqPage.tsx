import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { usePageSeo } from '../lib/format';

const FAQ_ITEMS = [
  {
    q: 'Qui peut participer ?',
    a: "Le concours est ouvert à toutes les étudiantes et à tous les étudiants inscrits à l'ENSET de Lokossa, quelle que soit votre filière ou votre année d'études.",
  },
  {
    q: "Est-ce que c'est gratuit ?",
    a: 'Oui, la participation est entièrement gratuite du début à la fin.',
  },
  {
    q: "Comment s'inscrire ?",
    a: "Il suffit de remplir le formulaire sur la page S'inscrire avant le vendredi 20 novembre 2026.",
  },
  {
    q: 'Comment se déroulent les phases ?',
    a: "Le concours avance en trois étapes : 01. La Plume (en ligne), 02. La Connaissance (en ligne) et 03. L'Éloquence (en présentiel à l'ENSET de Lokossa).",
  },
  {
    q: 'Quand les épreuves seront-elles dévoilées ?',
    a: 'Nous publions les consignes étape par étape sur la page Annonces, au moment où chaque phase démarre.',
  },
  {
    q: 'Comment envoyer les vidéos ?',
    a: "Si une étape demande une vidéo, nous vous indiquerons comment l'envoyer (format, durée et lien de dépôt) dès le lancement de l'épreuve.",
  },
  {
    q: 'Comment se déroule la finale ?',
    a: "La finale se tient en présentiel à l'ENSET de Lokossa devant un jury et le public étudiant. Nous partagerons l'organisation pratique après les phases en ligne.",
  },
];

export function FaqPage() {
  usePageSeo(
    'FAQ',
    "Réponses rapides aux questions sur le concours UCAEP « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-[#FBF9F5]">
      <PageFolioHeader
        folio="Index"
        section="En pratique"
        title="Vous vous posez peut-être"
        italicWord="ces questions."
        subtitle="L'essentiel pour savoir comment ça se passe et comment participer."
      />

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            <EditorialMark folio="07 questions" label="Repères" tone="brown" />
            <p className="font-serif italic text-2xl text-[#4E2A1E] leading-snug">
              « Pas besoin d&apos;avoir déjà fait de la scène pour se lancer. »
            </p>
            <div className="p-6 bg-[#F3EBDD]/70 border border-[#4E2A1E]/14 rounded-sm space-y-3">
              <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                Vous avez une autre question ?
              </h2>
              <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                Écrivez directement à l&apos;équipe de l&apos;UCAEP, on vous répondra dès
                que possible.
              </p>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:text-[#D19A3A] transition-colors pt-1"
              >
                <span className="editorial-underline">Nous écrire</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <div className="divide-y divide-[#4E2A1E]/15 border-t border-b border-[#4E2A1E]/15">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full py-6 flex items-baseline justify-between gap-6 text-left group"
                    >
                      <div className="flex items-baseline gap-5">
                        <span className="font-serif text-xl sm:text-2xl text-[#D19A3A] tabular-nums shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors">
                          {item.q}
                        </span>
                      </div>
                      <Plus
                        className={`w-5 h-5 text-[#4E2A1E] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-45 text-[#D19A3A]' : ''
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
                          <div className="pb-6 pl-9 sm:pl-11 pr-6 text-base text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
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
