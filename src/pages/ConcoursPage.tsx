import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EditorialImage } from '../components/EditorialImage';
import { usePageSeo } from '../lib/format';

const PILLARS = [
  {
    index: '01',
    title: 'Écriture',
    imageKey: 'plume' as const,
    text: "Formuler une pensée personnelle avec précision, nuance et sens du rythme. La plume ouvre le chemin de la voix.",
  },
  {
    index: '02',
    title: 'Connaissance',
    imageKey: 'connaissance' as const,
    text: "Relier les textes, la culture générale et l'observation du monde contemporain. Lire pour comprendre avant de convaincre.",
  },
  {
    index: '03',
    title: 'Éloquence',
    imageKey: 'eloquence' as const,
    text: "Partager un texte à haute voix avec présence, clarté et écoute du public. L'art oratoire donne corps aux idées.",
  },
];

export function ConcoursPage() {
  usePageSeo(
    'Le concours',
    "Découvrez la vision, les trois piliers et le format du concours UCAEP « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
  );

  return (
    <div className="bg-[#FBF9F5]">
      {/* Editorial Title & Short Intro */}
      <section className="py-16 lg:py-24 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
              Le concours · UCAEP
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E] leading-[1.06]">
              Remettre la lecture vivante au cœur du campus.
            </h1>
            <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-2xl leading-relaxed">
              « Et si on lisait à haute voix ? » invite les étudiants de l&apos;ENSET de
              Lokossa à explorer l&apos;écriture, la culture générale et la prise de
              parole sur scène.
            </p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <Link
              to="/parcours"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
            >
              <span>Explorer les 3 phases</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Three Visual Pillars */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#4E2A1E]/75">
              Trois piliers
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
              Une discipline en trois temps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {PILLARS.map((pillar) => (
              <div key={pillar.index} className="space-y-5">
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                  <EditorialImage assetKey={pillar.imageKey} />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#D19A3A] tabular-nums">
                    Pilier {pillar.index}
                  </div>
                  <h3 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                    {pillar.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#1A1A1A]/80 leading-relaxed">
                    {pillar.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Explanation of Format */}
      <section className="py-20 bg-[#F7E6C8]/40 border-y border-[#4E2A1E]/12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
                Format
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#1A1A1A]">
                Un déroulement clair et équitable
              </h2>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-[#4E2A1E]">
                  Ouvert à tous
                </h3>
                <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                  Toutes les filières et années d&apos;études de l&apos;ENSET de Lokossa
                  peuvent candidater gratuitement.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-[#4E2A1E]">
                  Révélation progressive
                </h3>
                <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                  Les consignes de chaque phase sont dévoilées une à une sur la page
                  Annonces.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-[#4E2A1E]">
                  En ligne puis sur scène
                </h3>
                <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                  Les premières étapes se tiennent en ligne avant une finale publique à
                  Lokossa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#2E4D32] text-[#FBF9F5] rounded-sm p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
              Prêt à porter votre voix ?
            </h2>
            <p className="text-sm sm:text-base text-[#F7E6C8]/90">
              Complétez le formulaire officiel pour valider votre candidature étudiante.
            </p>
          </div>
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
          >
            <span>S&apos;inscrire au concours</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
