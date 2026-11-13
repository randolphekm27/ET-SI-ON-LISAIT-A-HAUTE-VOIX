import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EditorialImage } from '../components/EditorialImage';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import type {
  CompetitionPhase,
  PublicAnnouncement,
  PublicNewsArticle,
} from '../types/competition';

gsap.registerPlugin(ScrollTrigger);

export function HomePage() {
  usePageSeo(
    'Accueil',
    "Concours culturel de l'UCAEP à l'ENSET de Lokossa autour de l'écriture, de la connaissance et de l'expression publique.",
  );

  const heroRef = useRef<HTMLDivElement>(null);
  const phasesRef = useRef<HTMLDivElement>(null);
  const [phases, setPhases] = useState<CompetitionPhase[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [news, setNews] = useState<PublicNewsArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchApiJson<{ phases: CompetitionPhase[] }>('/api/phases'),
      fetchApiJson<{ announcements: PublicAnnouncement[] }>('/api/announcements'),
      fetchApiJson<{ news: PublicNewsArticle[] }>('/api/news'),
    ])
      .then(([pData, aData, nData]) => {
        if (!active) return;
        setPhases(pData.phases || []);
        setAnnouncements((aData.announcements || []).slice(0, 2));
        setNews((nData.news || []).slice(0, 3));
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 22,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.to('.hero-parallax-img', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!phases.length) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.phase-preview-card', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: phasesRef.current,
          start: 'top 82%',
          once: true,
        },
      });
    }, phasesRef);

    return () => ctx.revert();
  }, [phases]);

  return (
    <div>
      {/* 1. Full-screen visual hero */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] lg:h-screen w-full overflow-hidden flex items-end bg-[#1A1A1A]"
      >
        <div className="absolute inset-0 overflow-hidden">
          <EditorialImage
            assetKey="hero"
            priority
            className="hero-parallax-img w-full h-[112%] -top-[6%] object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/92 via-[#1A1A1A]/48 to-[#1A1A1A]/30"
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-28 sm:pb-20">
          <div className="max-w-3xl space-y-6">
            <p className="hero-stagger text-xs sm:text-sm font-medium tracking-widest uppercase text-[#F7E6C8]/85">
              UCAEP · ENSET de Lokossa
            </p>
            <h1 className="hero-stagger font-serif text-4xl sm:text-6xl lg:text-7xl font-semibold text-[#FBF9F5] leading-[1.04] tracking-tight">
              Et si on lisait à haute voix ?
            </h1>
            <p className="hero-stagger text-base sm:text-lg text-[#F7E6C8]/90 max-w-xl leading-relaxed">
              Un concours pour les étudiants de l&apos;ENSET autour de l&apos;écriture,
              de la connaissance et de l&apos;expression publique.
            </p>
            <div className="hero-stagger pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/inscription"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
              >
                <span>S&apos;inscrire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/concours"
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium rounded-sm border border-[#F7E6C8]/45 text-[#FBF9F5] hover:bg-[#F7E6C8]/10 transition-colors whitespace-nowrap shrink-0"
              >
                Découvrir le concours
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Short introduction */}
      <section className="py-20 lg:py-28 bg-[#FBF9F5] border-b border-[#4E2A1E]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
              Le principe
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#4E2A1E] leading-[1.1]">
              Trois phases. Plusieurs façons de s&apos;exprimer.
            </h2>
            <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-xl leading-relaxed">
              L&apos;écriture, la connaissance et la prise de parole en public se
              réunissent dans un même concours ouvert aux étudiants de l&apos;ENSET de
              Lokossa.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#4E2A1E]/75 pt-1">
              <span>Participation gratuite</span>
              <span aria-hidden="true">·</span>
              <span>Ouvert jusqu&apos;au vendredi 20 novembre 2026</span>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-center gap-6 border-t lg:border-t-0 lg:border-l border-[#4E2A1E]/15 pt-8 lg:pt-0 lg:pl-10">
            <img
              src="/assets/aistudio/LOGO_CONCOURS_8664fa5e.png"
              alt="Logo officiel du concours Et si on lisait à haute voix ? 2026"
              className="w-44 sm:w-52 h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* 3. Three-phase overview */}
      <section ref={phasesRef} className="py-20 lg:py-24 bg-[#F7E6C8]/35 paper-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#4E2A1E]/75">
                Le parcours
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
                Trois chapitres progressifs
              </h2>
            </div>
            <Link
              to="/parcours"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#2E4D32] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Voir le calendrier du parcours</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {phases.map((phase) => (
              <Link
                key={phase.id}
                to="/parcours"
                className="phase-preview-card group block bg-[#FBF9F5] border border-[#4E2A1E]/12 rounded-sm overflow-hidden hover:border-[#D19A3A] transition-colors"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#4E2A1E]/5">
                  <EditorialImage
                    assetKey={phase.imageKey}
                    className="group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#4E2A1E]/75 tabular-nums">
                    <span>
                      {phase.format} · {phase.statusLabel}
                    </span>
                    {!phase.isRevealed && (
                      <Lock className="w-3.5 h-3.5 text-[#4E2A1E]/55" aria-label="Épreuve non dévoilée" />
                    )}
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
                    <span className="tabular-nums text-[#D19A3A] mr-2">{phase.number}.</span>
                    {phase.title}
                  </h3>
                  <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                    {phase.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Progressive announcements preview */}
      <section className="py-20 lg:py-24 bg-[#FBF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
                Révélations officielles
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
                Annonces du comité
              </h2>
            </div>
            <Link
              to="/annonces"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#2E4D32] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Toutes les annonces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {!loaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-sm bg-[#F7E6C8]/30 animate-pulse border border-[#4E2A1E]/10"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-8 border border-[#4E2A1E]/15 rounded-sm bg-[#F7E6C8]/20 text-sm text-[#1A1A1A]/75">
              Aucune annonce publiée pour le moment. Les révélations officielles seront
              mises en ligne progressivement.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className="group border border-[#4E2A1E]/15 rounded-sm overflow-hidden bg-[#FBF9F5] flex flex-col sm:flex-row items-stretch"
                >
                  <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto overflow-hidden bg-[#4E2A1E]/5">
                    <EditorialImage
                      assetKey={item.imageKey}
                      className="lg:h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                  <div className="sm:w-3/5 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="text-xs text-[#4E2A1E]/70 tabular-nums">
                        <span>{item.category}</span>
                        <span aria-hidden="true"> · </span>
                        <time dateTime={item.publishedAt}>
                          {formatFrenchDate(item.publishedAt)}
                        </time>
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-[#1A1A1A] leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                        {item.excerpt}
                      </p>
                    </div>
                    <div>
                      <Link
                        to={`/annonces/${item.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
                      >
                        <span>Voir les détails</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Registration CTA band */}
      <section className="py-16 lg:py-20 bg-[#4E2A1E] text-[#F7E6C8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D19A3A]">
              Candidatures ouvertes
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#FBF9F5] leading-tight">
              Rejoignez l&apos;édition 2026 à l&apos;ENSET de Lokossa.
            </h2>
            <p className="text-sm sm:text-base text-[#F7E6C8]/85">
              L&apos;inscription est gratuite et prend moins de trois minutes.
            </p>
          </div>
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
          >
            <span>S&apos;inscrire maintenant</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. Latest news preview */}
      <section className="py-20 lg:py-24 bg-[#FBF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#4E2A1E]/75">
                La vie du concours
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
                Dernières actualités
              </h2>
            </div>
            <Link
              to="/actualites"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#2E4D32] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lire le magazine</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((article) => (
              <Link
                key={article.id}
                to={`/actualites/${article.slug}`}
                className="group block space-y-4"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                  <EditorialImage
                    assetKey={article.imageKey}
                    className="group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-[#1A1A1A]/60 tabular-nums">
                    <span>{article.category}</span>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={article.publishedAt}>
                      {formatFrenchDate(article.publishedAt)}
                    </time>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
