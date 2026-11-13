import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { usePageSeo } from '../lib/format';

const FAQ_ITEMS = [
  {
    q: 'Qui peut participer ?',
    a: "Le concours est ouvert aux étudiantes et étudiants régulièrement inscrits à l'ENSET de Lokossa, toutes filières et années d'études confondues.",
  },
  {
    q: 'La participation est-elle gratuite ?',
    a: "Oui. L'inscription et la participation aux différentes phases du concours sont entièrement gratuites.",
  },
  {
    q: "Comment s'inscrire ?",
    a: "Il suffit de remplir le formulaire officiel sur la page S'inscrire en renseignant vos informations personnelles, votre parcours académique et votre motivation.",
  },
  {
    q: 'Comment se déroulent les phases ?',
    a: "Le concours comprend trois étapes successives : 01. La Plume (en ligne), 02. La Connaissance (en ligne) et 03. L'Éloquence (en présentiel à l'ENSET de Lokossa).",
  },
  {
    q: 'Quand les épreuves seront-elles dévoilées ?',
    a: "Les sujets et consignes de chaque phase sont publiés progressivement par l'UCAEP sur la page Annonces selon le calendrier officiel.",
  },
  {
    q: 'Comment envoyer les vidéos ?',
    a: "Les modalités techniques d'envoi (format, durée et lien de dépôt) sont communiquées directement aux candidats au moment de l'ouverture des épreuves concernées.",
  },
  {
    q: 'Comment se déroule la finale ?',
    a: "La phase finale se tient en présentiel à l'ENSET de Lokossa devant un jury et le public étudiant. Les détails pratiques sont annoncés après la phase de qualification.",
  },
];

export function FaqPage() {
  usePageSeo(
    'FAQ',
    "Réponses rapides aux questions pratiques sur le concours UCAEP « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-[#FBF9F5]">
      <section className="py-16 lg:py-24 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Questions pratiques
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E]">
            Foire aux questions
          </h1>
          <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-xl">
            Les réponses essentielles pour préparer votre candidature.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="divide-y divide-[#4E2A1E]/15 border-t border-b border-[#4E2A1E]/15">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full py-5 flex items-center justify-between gap-6 text-left group"
                  >
                    <span className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#4E2A1E] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-6 pr-8 text-base text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-8 bg-[#F7E6C8]/35 border border-[#4E2A1E]/12 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                Une autre question ?
              </h2>
              <p className="text-sm text-[#1A1A1A]/75">
                Écrivez directement au comité d&apos;organisation de l&apos;UCAEP.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-5 py-2.5 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors whitespace-nowrap shrink-0"
            >
              Contacter l&apos;équipe
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
