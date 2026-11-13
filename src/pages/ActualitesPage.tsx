import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EditorialImage } from '../components/EditorialImage';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
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
    "La vie du concours UCAEP à l'ENSET de Lokossa : coulisses, portraits de candidats, temps forts et résultats.",
  );

  const [articles, setArticles] = useState<PublicNewsArticle[]>([]);
  const [filter, setFilter] = useState<string>('Toutes');
  const [loading, setLoading] = useState(true);

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
    <div className="bg-[#FBF9F5]">
      <section className="py-16 lg:py-24 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
              Le journal du concours
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E] leading-[1.06]">
              Actualités
            </h1>
            <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-xl leading-relaxed">
              Coulisses, portraits, temps forts sur le campus et résultats officiels.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtrer les actualités par catégorie"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7E6C8]/45 rounded-sm border border-[#4E2A1E]/12"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={filter === cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  filter === cat
                    ? 'bg-[#4E2A1E] text-[#FBF9F5]'
                    : 'text-[#4E2A1E]/80 hover:text-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {loading ? (
            <div className="h-96 rounded-sm bg-[#F7E6C8]/30 animate-pulse" />
          ) : filtered.length === 0 ? (
            <div className="p-10 border border-[#4E2A1E]/15 rounded-sm text-center space-y-2">
              <p className="font-serif text-2xl text-[#4E2A1E]">
                Aucun article dans cette rubrique pour le moment.
              </p>
              <button
                type="button"
                onClick={() => setFilter('Toutes')}
                className="text-sm font-semibold text-[#4E2A1E] underline"
              >
                Afficher toutes les actualités
              </button>
            </div>
          ) : (
            <>
              {/* Tier 1: Lead Story */}
              {leadArticle && (
                <Link
                  to={`/actualites/${leadArticle.slug}`}
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                >
                  <div className="lg:col-span-7 aspect-[16/10] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                    <EditorialImage
                      assetKey={leadArticle.imageKey}
                      className="group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <div className="text-xs text-[#4E2A1E]/75 tabular-nums">
                      <span>{leadArticle.category}</span>
                      <span aria-hidden="true"> · </span>
                      <time dateTime={leadArticle.publishedAt}>
                        {formatFrenchDate(leadArticle.publishedAt)}
                      </time>
                      <span aria-hidden="true"> · </span>
                      <span>{leadArticle.readTime}</span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors leading-[1.08]">
                      {leadArticle.title}
                    </h2>
                    <p className="text-base text-[#1A1A1A]/80 leading-relaxed">
                      {leadArticle.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E]">
                      <span>Lire l&apos;article</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              )}

              {/* Tier 2: Secondary Stories */}
              {secondaryArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-[#4E2A1E]/12">
                  {secondaryArticles.map((article) => (
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
                          <span aria-hidden="true"> · </span>
                          <span>{article.readTime}</span>
                        </div>
                        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tier 3: Archive List */}
              {archiveArticles.length > 0 && (
                <div className="pt-8 border-t border-[#4E2A1E]/12 space-y-6">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[#4E2A1E]/75">
                    Autres dépêches
                  </h2>
                  <div className="divide-y divide-[#4E2A1E]/12">
                    {archiveArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/actualites/${article.slug}`}
                        className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-[#1A1A1A]/60 tabular-nums">
                            <span>{article.category}</span>
                            <span aria-hidden="true"> · </span>
                            <time dateTime={article.publishedAt}>
                              {formatFrenchDate(article.publishedAt)}
                            </time>
                          </div>
                          <h3 className="font-serif text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors">
                            {article.title}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4E2A1E] whitespace-nowrap shrink-0">
                          <span>Lire</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
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
    article ? article.excerpt : "Actualité du concours UCAEP à l'ENSET de Lokossa.",
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
        <div className="h-80 rounded-sm bg-[#F7E6C8]/30 animate-pulse" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
        <h1 className="font-serif text-4xl font-semibold text-[#4E2A1E]">
          Article introuvable
        </h1>
        <Link
          to="/actualites"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux actualités</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/actualites"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Toutes les actualités</span>
        </Link>

        <header className="space-y-4">
          <div className="text-xs text-[#2E4D32] font-semibold uppercase tracking-widest tabular-nums">
            <span>{article.category}</span>
            <span aria-hidden="true"> · </span>
            <time dateTime={article.publishedAt}>
              {formatFrenchDate(article.publishedAt)}
            </time>
            <span aria-hidden="true"> · </span>
            <span>{article.readTime}</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E] leading-[1.08]">
            {article.title}
          </h1>
          <p className="text-lg text-[#1A1A1A]/80 leading-relaxed">{article.excerpt}</p>
        </header>

        <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
          <EditorialImage assetKey={article.imageKey} />
        </div>

        <div className="max-w-prose space-y-6 text-base sm:text-lg text-[#1A1A1A]/85 leading-relaxed">
          {article.content.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-semibold first-letter:text-[#4E2A1E] first-letter:float-left first-letter:mr-3 first-letter:leading-none'
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
