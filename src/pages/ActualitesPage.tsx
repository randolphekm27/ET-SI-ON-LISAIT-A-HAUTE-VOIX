import { useEffect, useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import {
  EditorialReveal,
  EditorialTabPill,
  EditorialTitleReveal,
  PhotographicPlate,
} from '../components/MotionPrimitives';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { EDITORIAL_EASE } from '../lib/motion';
import type { PublicNewsArticle } from '../types/competition';

const CATEGORIES = [
  'Toutes',
  'Vie du concours',
  'Coulisses',
  'Candidats',
  'Résultats',
] as const;

export function ActualitesPage() {
  const { slug } = useParams();

  if (slug) {
    return <NewsArticleView slug={slug} />;
  }

  return <NewsMagazineView />;
}

function NewsMagazineView() {
  usePageSeo(
    'Actualités',
    "Articles explicatifs et repères sur la démarche pédagogique du concours « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
  );

  const [articles, setArticles] = useState<PublicNewsArticle[]>([]);
  const [filter, setFilter] = useState<string>('Toutes');
  const [loading, setLoading] = useState(true);
  const tabGroupId = useId();

  useEffect(() => {
    let active = true;
    fetchApiJson<{ news: PublicNewsArticle[] }>('/api/news')
      .then((data) => {
        if (!active) return;
        setArticles(data.news || []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    filter === 'Toutes' ? articles : articles.filter((a) => a.category === filter);

  const leadArticle = filtered[0];
  const secondaryArticles = filtered.slice(1, 3);
  const archiveArticles = filtered.slice(3);

  return (
    <div className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Journal"
        section="Vie du concours et repères"
        title="Actualités"
        italicWord="et préparatifs"
        subtitle="Suivez les moments du concours sur le campus et lisez des articles pratiques pour mieux préparer vos textes, vos présentations vidéo et votre prise de parole à l'ENSET de Lokossa."
        aside={
          <div
            role="tablist"
            aria-label="Filtrer les actualités par rubrique"
            className="flex flex-wrap items-center gap-1 p-1 bg-ucaep-linen rounded-[2px] border border-ucaep-brown/14"
          >
            {CATEGORIES.map((cat) => {
              const isSelected = filter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setFilter(cat)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'text-ucaep-paper'
                      : 'text-ucaep-brown/80 hover:text-ucaep-ink'
                  }`}
                >
                  {isSelected && (
                    <EditorialTabPill
                      groupId={`news-filter-${tabGroupId}`}
                      className="absolute inset-0 rounded-[2px] bg-ucaep-brown"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>
        }
      />

      <section className="relative py-16 lg:py-24 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={220}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="gold"
          tileWidth={135}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -bottom-24 -right-16 w-60 h-60 opacity-[0.08]"
        />
        <BrandPatternWave
          variant="brown"
          tileWidth={170}
          opacity={0.08}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-16">
          {loading ? (
            <div className="h-96 rounded-[2px] bg-ucaep-ivory/30 animate-pulse" />
          ) : (
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div
                  key={`empty-${filter}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                  className="p-12 border border-ucaep-brown/15 rounded-[2px] bg-ucaep-linen/40 text-center space-y-3"
                >
                  <p className="font-serif text-3xl text-ucaep-brown">
                    Aucun article publié dans cette rubrique pour le moment.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilter('Toutes')}
                    className="text-sm font-semibold text-ucaep-brown underline"
                  >
                    Voir toutes les actualités
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={`feed-${filter}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
                  className="space-y-16"
                >
                  {/* Tier 1: Lead Cover Story */}
                  {leadArticle && (
                    <Link
                      to={`/actualites/${leadArticle.slug}`}
                      className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                    >
                      <PhotographicPlate
                        immediate
                        parallaxAmount={8}
                        className="lg:col-span-7 aspect-[16/10] rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
                      >
                        <EditorialImage
                          assetKey={leadArticle.imageKey}
                          className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        />
                      </PhotographicPlate>
                      <div className="lg:col-span-5 space-y-5">
                        <div className="text-xs text-ucaep-brown/75 tabular-nums">
                          <span className="font-semibold text-ucaep-green">
                            À la une · {leadArticle.category}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <time dateTime={leadArticle.publishedAt}>
                            {formatFrenchDate(leadArticle.publishedAt)}
                          </time>
                          <span aria-hidden="true"> · </span>
                          <span>{leadArticle.readTime}</span>
                        </div>
                        <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors leading-[1.06]">
                          <EditorialTitleReveal>{leadArticle.title}</EditorialTitleReveal>
                        </h2>
                        <p className="text-base text-ucaep-ink/80 leading-relaxed">
                          {leadArticle.excerpt}
                        </p>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown">
                          <span className="editorial-underline">Lire l&apos;article</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Tier 2: Two Editorial Columns separated by vertical hairline */}
                  {secondaryArticles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14">
                      {secondaryArticles.map((article, idx) => (
                        <EditorialReveal
                          key={article.id}
                          delay={idx * 0.08}
                          className={idx === 0 ? 'md:pr-10' : 'md:pl-10'}
                        >
                          <Link
                            to={`/actualites/${article.slug}`}
                            className="group block py-10 space-y-5"
                          >
                            <PhotographicPlate
                              parallaxAmount={8}
                              className="aspect-[16/10] rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
                            >
                              <EditorialImage
                                assetKey={article.imageKey}
                                className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                              />
                            </PhotographicPlate>
                            <div className="space-y-2.5">
                              <div className="text-xs text-ucaep-ink/60 tabular-nums">
                                <span className="font-medium text-ucaep-brown">
                                  {article.category}
                                </span>
                                <span aria-hidden="true"> · </span>
                                <time dateTime={article.publishedAt}>
                                  {formatFrenchDate(article.publishedAt)}
                                </time>
                                <span aria-hidden="true"> · </span>
                                <span>{article.readTime}</span>
                              </div>
                              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors leading-snug">
                                {article.title}
                              </h3>
                              <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed">
                                {article.excerpt}
                              </p>
                            </div>
                          </Link>
                        </EditorialReveal>
                      ))}
                    </div>
                  )}

                  {/* Tier 3: Broadsheet Archive List */}
                  {archiveArticles.length > 0 && (
                    <EditorialReveal className="space-y-6">
                      <EditorialMark folio="Archives" label="Articles précédents" tone="brown" />
                      <div className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14">
                        {archiveArticles.map((article) => (
                          <Link
                            key={article.id}
                            to={`/actualites/${article.slug}`}
                            className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="space-y-1">
                              <div className="text-xs text-ucaep-ink/60 tabular-nums">
                                <span>{article.category}</span>
                                <span aria-hidden="true"> · </span>
                                <time dateTime={article.publishedAt}>
                                  {formatFrenchDate(article.publishedAt)}
                                </time>
                                <span aria-hidden="true"> · </span>
                                <span>{article.readTime}</span>
                              </div>
                              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-ink group-hover:text-ucaep-brown transition-colors">
                                {article.title}
                              </h3>
                            </div>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown whitespace-nowrap shrink-0">
                              <span className="editorial-underline">Lire</span>
                              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </EditorialReveal>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}

function NewsArticleView({ slug }: { slug: string }) {
  const [article, setArticle] = useState<PublicNewsArticle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  usePageSeo(
    article ? article.title : 'Actualité',
    article
      ? article.excerpt
      : "Article d'information sur le concours « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchApiJson<{ article: PublicNewsArticle }>(
      `/api/news/${encodeURIComponent(slug)}`,
    )
      .then((data) => {
        if (!active) return;
        setArticle(data.article);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="h-80 rounded-[2px] bg-ucaep-ivory/30 animate-pulse" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
        <h1 className="font-serif text-4xl font-semibold text-ucaep-brown">
          Cet article est introuvable
        </h1>
        <Link
          to="/actualites"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Revenir aux actualités</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-10 lg:py-14 bg-ucaep-paper">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          to="/actualites"
          className="group inline-flex items-center gap-2 text-sm font-medium text-ucaep-brown hover:text-ucaep-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="editorial-underline">Toutes les actualités</span>
        </Link>

        <header className="space-y-5 border-b border-ucaep-brown/14 pb-8">
          <EditorialMark
            folio={`${formatFrenchDate(article.publishedAt)} · ${article.readTime}`}
            label={article.category}
            tone="green"
          />
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-ucaep-brown leading-[1.04]">
            {article.title}
          </h1>
          <p className="text-lg sm:text-xl text-ucaep-ink/80 leading-relaxed max-w-2xl">
            {article.excerpt}
          </p>
        </header>

        <figure>
          <PhotographicPlate
            immediate
            parallaxAmount={8}
            className="aspect-[16/9] rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
          >
            <EditorialImage assetKey={article.imageKey} priority />
          </PhotographicPlate>
        </figure>

        <div className="max-w-prose space-y-6 text-base sm:text-lg text-ucaep-ink/85 leading-relaxed">
          {article.content.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-semibold first-letter:text-ucaep-brown first-letter:float-left first-letter:mr-3 first-letter:leading-none'
                  : ''
              }
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
