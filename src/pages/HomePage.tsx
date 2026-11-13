import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import gsap from 'gsap';
import { EditorialImage } from '../components/EditorialImage';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { prefersReducedMotion, useEditorialScrollMotion } from '../lib/motion';
import type {
  CompetitionPhase,
  PublicAnnouncement,
  PublicNewsArticle,
} from '../types/competition';

export function HomePage() {
  usePageSeo(
    'Accueil',
    "Un concours imaginé par l'UCAEP pour les étudiants de l'ENSET de Lokossa autour de l'écriture, de la connaissance et de la prise de parole.",
  );

  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
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

  // Controlled cinematic GSAP opening sequence
  useEffect(() => {
    if (!heroRef.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-portrait-frame', {
        clipPath: 'inset(10% 0% 0% 0%)',
        opacity: 0,
        duration: 0.95,
        clearProps: 'clipPath,opacity',
      })
        .from(
          '.hero-portrait-img',
          {
            scale: 1.06,
            duration: 1.1,
            ease: 'power2.out',
            clearProps: 'transform',
          },
          '<',
        )
        .from(
          '.hero-line-inner',
          {
            yPercent: 105,
            duration: 0.78,
            stagger: 0.1,
            ease: 'power4.out',
            clearProps: 'transform',
          },
          '-=0.72',
        )
        .from(
          '.hero-meta-fade',
          {
            y: 14,
            opacity: 0,
            duration: 0.55,
            stagger: 0.08,
            clearProps: 'transform,opacity',
          },
          '-=0.4',
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEditorialScrollMotion(pageRef, [phases.length, announcements.length, news.length]);

  const leadNews = news[0];
  const secondaryNews = news.slice(1, 3);

  return (
    <div ref={pageRef} className="bg-ucaep-paper">
      {/* 1. HERO: Architectural literary exhibition cover */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] lg:min-h-screen w-full bg-[#14100E] text-ucaep-paper pt-28 pb-12 lg:pt-36 lg:pb-14 flex flex-col justify-between overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_74%_38%,rgba(104,56,36,0.34),transparent_60%)]"
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
            {/* Left Typographic Composition */}
            <div className="lg:col-span-7 space-y-8">
              <div className="hero-meta-fade flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-ucaep-gold">
                <span>UCAEP</span>
                <span aria-hidden="true" className="text-ucaep-ivory/35">·</span>
                <span className="text-ucaep-ivory/75">ENSET de Lokossa</span>
              </div>

              <h1 className="font-serif text-ucaep-paper tracking-tight text-balance">
                <span className="block overflow-hidden">
                  <span className="hero-line-inner block text-5xl sm:text-7xl lg:text-[5.25rem] xl:text-[5.85rem] font-medium leading-[0.94]">
                    Et si on lisait
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span className="hero-line-inner block text-5xl sm:text-7xl lg:text-[5.5rem] xl:text-[6.1rem] italic font-normal text-ucaep-ivory leading-[0.98] pr-2">
                    à haute voix ?
                  </span>
                </span>
              </h1>

              <p className="hero-meta-fade text-base sm:text-lg text-ucaep-ivory/80 max-w-lg leading-relaxed font-normal">
                Un concours imaginé pour tous ceux qui aiment écrire, lire, expliquer
                une idée ou simplement prendre la parole sur le campus.
              </p>

              <div className="hero-meta-fade pt-1 flex flex-wrap items-center gap-6">
                <Link
                  to="/inscription"
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-[#14100E] hover:bg-[#e1ae52] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Je m&apos;inscris</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/concours"
                  className="editorial-underline py-2 text-sm font-medium text-ucaep-ivory hover:text-ucaep-gold transition-colors whitespace-nowrap shrink-0"
                >
                  Je découvre le concours
                </Link>
              </div>
            </div>

            {/* Right Museum Passe-Partout Portrait Frame */}
            <div className="lg:col-span-5">
              <figure className="hero-portrait-frame bg-[#1D1714] border border-ucaep-ivory/16 p-2.5 sm:p-3.5 rounded-[2px] shadow-[0_32px_72px_-20px_rgba(0,0,0,0.78)]">
                <div className="relative aspect-[3/4] max-h-[590px] w-full overflow-hidden bg-[#221915]">
                  <EditorialImage
                    assetKey="portrait"
                    priority
                    className="hero-portrait-img object-cover object-top"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14100E]/45 via-transparent to-transparent"
                  />
                </div>
                <figcaption className="hero-meta-fade pt-3 pb-0.5 px-0.5 flex items-center justify-between text-xs text-ucaep-ivory/68">
                  <span className="font-serif italic text-sm">
                    La voix dans le cadre
                  </span>
                  <span className="uppercase tracking-[0.2em] text-[10px] text-ucaep-gold tabular-nums">
                    Édition 2026
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Bottom Architectural Exhibition Credit Strip */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 mt-12 lg:mt-16">
          <div className="hero-meta-fade border-t border-ucaep-ivory/14 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ucaep-ivory/65 tabular-nums">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <span>01 · La Plume</span>
              <span>02 · La Connaissance</span>
              <span>03 · L&apos;Éloquence</span>
            </div>
            <div className="text-ucaep-ivory/75">
              Participation gratuite · Ouvert jusqu&apos;au vendredi 20 novembre 2026
            </div>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL MANIFESTO SPREAD */}
      <section className="py-24 lg:py-36 bg-ucaep-paper border-b border-ucaep-brown/12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6" data-reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              Pourquoi on lance ce concours
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-ucaep-brown leading-[1.02]">
              Trois étapes,{' '}
              <em className="italic font-normal text-ucaep-ink">
                du cahier jusqu&apos;à la scène.
              </em>
            </h2>
            <p className="text-base sm:text-lg text-ucaep-ink/75 max-w-xl leading-relaxed">
              Nous voulons offrir un rendez-vous simple aux étudiants qui aiment les mots,
              la lecture et l&apos;échange d&apos;idées. Pas besoin d&apos;avoir déjà
              fait de la scène : on avance étape par étape.
            </p>
            <div className="pt-4 border-t border-ucaep-brown/12 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ucaep-brown/75 tabular-nums">
              <span>Participation gratuite</span>
              <span aria-hidden="true">·</span>
              <span>Ouvert à toutes les filières de l&apos;ENSET</span>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
            <div className="sm:col-span-8" data-clip-reveal>
              <div className="aspect-[4/3] overflow-hidden rounded-sm bg-ucaep-brown/5">
                <EditorialImage assetKey="writing" data-parallax="-5" />
              </div>
              <p className="mt-3 text-xs font-serif italic text-ucaep-brown/70">
                Sur le papier, avant la prise de parole
              </p>
            </div>
            <div
              className="sm:col-span-4 flex items-center justify-start sm:justify-center"
              data-reveal
              data-reveal-delay="0.1"
            >
              <img
                src="/assets/aistudio/LOGO_CONCOURS_8664fa5e.png"
                alt="Logo officiel du concours Et si on lisait à haute voix ? 2026"
                className="w-36 sm:w-full max-w-[155px] h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. THREE-PHASE BORDERLESS EDITORIAL COLUMNS */}
      <section className="py-24 lg:py-32 bg-[#F4EDE1] border-b border-ucaep-brown/12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16" data-reveal>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                Comment ça va se passer
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-ucaep-ink leading-none">
                Voici les <em className="italic font-normal text-ucaep-brown">trois étapes</em>
              </h2>
            </div>
            <Link
              to="/parcours"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Voir comment on avance</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            {phases.map((phase, idx) => (
              <Link
                key={phase.id}
                to="/parcours"
                data-reveal
                data-reveal-delay={String(idx * 0.08)}
                className="group block space-y-5"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-ucaep-brown/8">
                  <EditorialImage
                    assetKey={phase.imageKey}
                    className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-baseline justify-between border-b border-ucaep-brown/16 pb-3">
                    <span className="font-serif text-4xl font-medium text-ucaep-gold tabular-nums leading-none">
                      {phase.number}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-ucaep-brown/75 tabular-nums">
                      <span>{phase.format}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-ucaep-green">
                        {phase.statusLabel}
                      </span>
                      {!phase.isRevealed && (
                        <Lock
                          className="w-3.5 h-3.5 text-ucaep-brown/50"
                          aria-label="Consignes dévoilées plus tard"
                        />
                      )}
                    </div>
                  </div>
                  <h3 className="font-serif text-3xl font-medium text-ucaep-ink group-hover:text-ucaep-brown transition-colors">
                    {phase.title}
                  </h3>
                  <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed">
                    {phase.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROGRESSIVE ANNOUNCEMENTS BROADSHEET */}
      <section className="py-24 lg:py-32 bg-ucaep-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14" data-reveal>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                En direct de l&apos;équipe
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-ucaep-ink leading-none">
                On vous tient <em className="italic font-normal text-ucaep-brown">au courant</em>
              </h2>
            </div>
            <Link
              to="/annonces"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Toutes les annonces</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {!loaded ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-sm bg-ucaep-ivory/30 animate-pulse border border-ucaep-brown/10"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-10 border border-ucaep-brown/12 rounded-sm bg-[#F4EDE1]/50 text-sm text-ucaep-ink/75">
              Il n&apos;y a pas encore d&apos;annonce publiée. La prochaine annonce arrive
              bientôt.
            </div>
          ) : (
            <div className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14">
              {announcements.map((item, idx) => (
                <article
                  key={item.id}
                  data-reveal
                  className="group py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                >
                  <div className="lg:col-span-2 flex lg:flex-col items-baseline gap-3 lg:gap-1.5">
                    <span className="font-serif text-4xl lg:text-5xl font-normal text-ucaep-gold tabular-nums leading-none">
                      0{idx + 1}
                    </span>
                    <time
                      dateTime={item.publishedAt}
                      className="text-xs text-ucaep-brown/65 tabular-nums"
                    >
                      {formatFrenchDate(item.publishedAt)}
                    </time>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
                      {item.category}
                    </div>
                    <h3 className="font-serif text-3xl sm:text-4xl font-medium text-ucaep-ink leading-tight">
                      <Link
                        to={`/annonces/${item.slug}`}
                        className="hover:text-ucaep-brown transition-colors"
                      >
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed max-w-xl">
                      {item.excerpt}
                    </p>
                    <div className="pt-1">
                      <Link
                        to={`/annonces/${item.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-gold transition-colors"
                      >
                        <span className="editorial-underline">Lire l&apos;annonce</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <Link
                      to={`/annonces/${item.slug}`}
                      className="block aspect-[16/10] overflow-hidden rounded-sm bg-ucaep-brown/5"
                    >
                      <EditorialImage
                        assetKey={item.imageKey}
                        className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. DEEP EARTH BROWN INVITATION BAND */}
      <section className="py-24 lg:py-28 bg-[radial-gradient(ellipse_at_top_right,#633728_0%,#4E2A1E_55%,#3B1E14_100%)] text-ucaep-ivory">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10"
          data-reveal
        >
          <div className="space-y-4 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
              Vous souhaitez participer ?
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-ucaep-paper leading-[1.02]">
              C&apos;est l&apos;occasion d&apos;essayer{' '}
              <em className="italic font-normal text-ucaep-ivory">
                et de partager vos idées.
              </em>
            </h2>
            <p className="text-sm sm:text-base text-ucaep-ivory/82 max-w-xl leading-relaxed">
              L&apos;inscription est gratuite et prend deux minutes. Tout étudiant de
              l&apos;ENSET de Lokossa peut tenter l&apos;aventure.
            </p>
          </div>
          <Link
            to="/inscription"
            className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-sm bg-ucaep-gold text-[#161210] hover:bg-[#dfb05c] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Je m&apos;inscris</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* 6. LATEST NEWS — Magazine Cover Spread */}
      <section className="py-24 lg:py-32 bg-ucaep-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14" data-reveal>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-brown/75">
                Les nouvelles du concours
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-ucaep-ink leading-none">
                Quoi de <em className="italic font-normal text-ucaep-brown">neuf ?</em>
              </h2>
            </div>
            <Link
              to="/actualites"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:text-ucaep-green transition-colors whitespace-nowrap shrink-0"
            >
              <span className="editorial-underline">Voir toutes les actualités</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {leadNews && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Lead story (7 cols) */}
              <Link
                to={`/actualites/${leadNews.slug}`}
                data-reveal
                className="lg:col-span-7 group block space-y-5"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-sm bg-ucaep-brown/5">
                  <EditorialImage
                    assetKey={leadNews.imageKey}
                    className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="space-y-3">
                  <div className="text-xs text-ucaep-brown/75 tabular-nums">
                    <span className="font-semibold text-ucaep-green">
                      {leadNews.category}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={leadNews.publishedAt}>
                      {formatFrenchDate(leadNews.publishedAt)}
                    </time>
                    <span aria-hidden="true"> · </span>
                    <span>{leadNews.readTime}</span>
                  </div>
                  <h3 className="font-serif text-3xl sm:text-5xl font-medium text-ucaep-ink group-hover:text-ucaep-brown transition-colors leading-[1.06]">
                    {leadNews.title}
                  </h3>
                  <p className="text-base text-ucaep-ink/75 leading-relaxed max-w-2xl">
                    {leadNews.excerpt}
                  </p>
                </div>
              </Link>

              {/* Secondary editorial column (5 cols) */}
              <div className="lg:col-span-5 lg:border-l border-ucaep-brown/12 lg:pl-10 divide-y divide-ucaep-brown/12">
                {secondaryNews.map((article, idx) => (
                  <Link
                    key={article.id}
                    to={`/actualites/${article.slug}`}
                    data-reveal
                    data-reveal-delay={String(idx * 0.1)}
                    className={`group block ${idx === 0 ? 'pb-8' : 'pt-8'}`}
                  >
                    <div className="grid grid-cols-12 gap-5 items-center">
                      <div className="col-span-5 aspect-[4/3] overflow-hidden rounded-sm bg-ucaep-brown/5">
                        <EditorialImage
                          assetKey={article.imageKey}
                          className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                        />
                      </div>
                      <div className="col-span-7 space-y-2">
                        <div className="text-[11px] text-ucaep-brown/70 tabular-nums">
                          <span>{article.category}</span>
                          <span aria-hidden="true"> · </span>
                          <time dateTime={article.publishedAt}>
                            {formatFrenchDate(article.publishedAt)}
                          </time>
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-medium text-ucaep-ink group-hover:text-ucaep-brown transition-colors leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-ucaep-ink/70 line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
