import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';

const PILLARS = [
  {
    index: 'I',
    number: '01',
    title: 'Écriture',
    imageKey: 'writing' as const,
    caption: 'Fig. 01 — Mettre ses idées sur le papier',
    text: "Poser vos idées sur papier avec vos propres mots. On ne cherche pas des phrases compliquées, juste un texte clair et sincère.",
  },
  {
    index: 'II',
    number: '02',
    title: 'Connaissance',
    imageKey: 'connaissance' as const,
    caption: 'Fig. 02 — Lire et relier les idées',
    text: "Partager ce que vous comprenez d'un texte, relier les idées entre elles et montrer votre curiosité sur le monde qui nous entoure.",
  },
  {
    index: 'III',
    number: '03',
    title: 'Éloquence',
    imageKey: 'eloquence' as const,
    caption: 'Fig. 03 — Porter la voix devant le public',
    text: 'Lire à voix haute et parler devant le public sur le campus, en prenant le temps de se faire comprendre avec naturel.',
  },
];

export function ConcoursPage() {
  usePageSeo(
    'Le concours',
    "Pourquoi l'UCAEP organise ce concours à l'ENSET de Lokossa et comment vous pouvez y participer.",
  );

  const pageRef = useRef<HTMLDivElement>(null);
  useEditorialScrollMotion(pageRef);

  return (
    <div ref={pageRef} className="bg-[#FBF9F5]">
      <PageFolioHeader
        folio="Dossier"
        section="Le concours · UCAEP"
        title="Pourquoi on a eu envie de lancer"
        italicWord="ce concours"
        subtitle="À l'ENSET de Lokossa, nos journées sont très techniques. On avait envie d'ouvrir un moment simple où l'on prend le temps d'écrire, de lire et de parler ensemble, quelle que soit votre filière."
        aside={
          <div className="flex items-center lg:justify-end gap-5">
            <img
              src="/assets/aistudio/LOGO_CONCOURS_8664fa5e.png"
              alt="Logo officiel Et si on lisait à haute voix ? 2026"
              className="w-36 sm:w-44 h-auto object-contain"
            />
          </div>
        }
      />

      {/* Documentary Exhibition Opening Image */}
      <section className="py-14 lg:py-20 border-b border-[#4E2A1E]/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-9" data-clip-reveal>
            <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
              <EditorialImage assetKey="audience" data-parallax="-5" />
            </div>
            <p className="mt-3 text-xs font-serif italic text-[#4E2A1E]/75">
              Fig. 00 — Un rendez-vous culturel pensé pour tous les étudiants de l&apos;ENSET
            </p>
          </div>
          <div className="lg:col-span-3 space-y-5 pb-2" data-reveal>
            <p className="font-serif italic text-2xl text-[#4E2A1E] leading-snug">
              « Écrire pour clarifier, lire pour comprendre, parler pour transmettre. »
            </p>
            <Link
              to="/parcours"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
            >
              <span className="editorial-underline">Voir comment on va avancer</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Three Editorial Pillar Spreads (No card grid) */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-3 max-w-2xl" data-reveal>
            <EditorialMark folio="Les trois axes" label="Ce qu'on va partager" tone="brown" />
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1A1A] leading-[1.06]">
              Trois façons de <em className="italic font-medium text-[#4E2A1E]">vous exprimer</em>
            </h2>
          </div>

          <div className="divide-y divide-[#4E2A1E]/14 border-t border-b border-[#4E2A1E]/14">
            {PILLARS.map((pillar, idx) => {
              const reversed = idx % 2 === 1;
              return (
                <article
                  key={pillar.index}
                  data-reveal
                  className="py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                >
                  <div
                    className={`lg:col-span-6 ${
                      reversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#4E2A1E]/5" data-clip-reveal>
                      <EditorialImage assetKey={pillar.imageKey} />
                    </div>
                    <p className="mt-2.5 text-xs font-serif italic text-[#4E2A1E]/70">
                      {pillar.caption}
                    </p>
                  </div>

                  <div
                    className={`lg:col-span-6 space-y-5 ${
                      reversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-serif text-5xl sm:text-6xl font-semibold text-[#D19A3A] tabular-nums leading-none">
                        {pillar.number}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4E2A1E]/65">
                        Volet {pillar.index}
                      </span>
                    </div>
                    <h3 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E]">
                      {pillar.title}
                    </h3>
                    <p className="text-base sm:text-lg text-[#1A1A1A]/80 leading-relaxed max-w-xl">
                      {pillar.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Practical Ledger */}
      <section className="py-20 bg-[#F3EBDD]/75 paper-grain border-y border-[#4E2A1E]/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-2 max-w-xl" data-reveal>
            <EditorialMark folio="Repères" label="On vous explique" tone="green" />
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1A1A1A]">
              Ce qu&apos;il faut savoir <em className="italic font-medium text-[#4E2A1E]">en pratique</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#4E2A1E]/15 border-t border-b border-[#4E2A1E]/15">
            <div className="py-8 md:py-10 md:pr-8 space-y-3" data-reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D19A3A] tabular-nums">
                01
              </span>
              <h3 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                Ouvert à tout l&apos;ENSET
              </h3>
              <p className="text-sm text-[#1A1A1A]/78 leading-relaxed">
                Que vous soyez en première année ou en fin de formation, vous pouvez
                vous inscrire gratuitement jusqu&apos;au 20 novembre 2026.
              </p>
            </div>
            <div className="py-8 md:py-10 md:px-8 space-y-3" data-reveal data-reveal-delay="0.08">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D19A3A] tabular-nums">
                02
              </span>
              <h3 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                Dévoilé étape par étape
              </h3>
              <p className="text-sm text-[#1A1A1A]/78 leading-relaxed">
                On ne donne pas tous les sujets d&apos;un coup : chaque consigne est
                publiée sur la page Annonces au moment voulu.
              </p>
            </div>
            <div className="py-8 md:py-10 md:pl-8 space-y-3" data-reveal data-reveal-delay="0.16">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D19A3A] tabular-nums">
                03
              </span>
              <h3 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                En ligne, puis ensemble
              </h3>
              <p className="text-sm text-[#1A1A1A]/78 leading-relaxed">
                Les deux premières phases se font à distance, puis la finale réunit tout
                le monde sur le campus à Lokossa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nature Green Registration Invitation */}
      <section className="py-20 bg-[#2E4D32] text-[#FBF9F5]">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          data-reveal
        >
          <div className="space-y-3 max-w-xl">
            <EditorialMark folio="Invitation" label="Édition 2026" tone="ivory" />
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">
              Vous souhaitez <em className="italic font-medium text-[#F7E6C8]">participer ?</em>
            </h2>
            <p className="text-sm sm:text-base text-[#F7E6C8]/90">
              Prenez deux minutes pour remplir votre fiche d&apos;inscription avant le
              vendredi 20 novembre 2026.
            </p>
          </div>
          <Link
            to="/inscription"
            className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Je m&apos;inscris</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
