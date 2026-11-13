import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';
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
    "Quoi de neuf autour du concours à l'ENSET de Lokossa : les coulisses, les candidats et la vie du campus.",
  );

  const [articles, setArticles] = useState<PublicNewsArticle[]>([]);
  const [filter, setFilter] = useState<string>('Toutes');
  const [loading, setLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

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

  useEditorialScrollMotion(pageRef, [articles.length, filter]);

  const filtered =
    filter === 'Toutes' ? articles : articles.filter((a) => a.category === filter);

  const leadArticle = filtered[0];
  const secondaryArticles = filtered.slice(1, 3);
  const archiveArticles = filtered.slice(3);

  return (
    <div ref={pageRef} className="bg-[#FBF9F5]">
      <PageFolioHeader
        folio="Journal"
        section="Les nouvelles du concours"
        title="Quoi de neuf"
        italicWord="depuis la dernière fois ?"
        subtitle="Ce qui se prépare dans les coulisses, les nouvelles du campus et les retours sur les étapes du concours."
        aside={
          <div
            role="tablist"
            aria-label="Filtrer les actualités par rubrique"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3EBDD] rounded-sm border border-[#4E2A1E]/14"
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
        }
      />

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {loading ? (
            <div className="h-96 rounded-sm bg-[#F7E6C8]/30 animate-pulse" />
          ) : filtered.length === 0 ? (
            <div className="p-12 border border-[#4E2A1E]/15 rounded-sm bg-[#F3EBDD]/40 text-center space-y-3">
              <p className="font-serif text-3xl text-[#4E2A1E]">
                Il n&apos;y a pas encore d&apos;article dans cette rubrique.
              </p>
              <button
                type="button"
                onClick={() => setFilter('Toutes')}
                className="text-sm font-semibold text-[#4E2A1E] underline"
              >
                Voir toutes les actualités
              </button>
            </div>
          ) : (
            <>
              {/* Tier 1: Lead Cover Story */}
              {leadArticle && (
                <Link
                  to={`/actualites/${leadArticle.slug}`}
                  data-reveal
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                >
                  <div className="lg:col-span-7 aspect-[16/10] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                    <EditorialImage
                      assetKey={leadArticle.imageKey}
                      className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="lg:col-span-5 space-y-5">
                    <div className="text-xs text-[#4E2A1E]/75 tabular-nums">
                      <span className="font-semibold text-[#2E4D32]">
                        À la une · {leadArticle.category}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <time dateTime={leadArticle.publishedAt}>
                        {formatFrenchDate(leadArticle.publishedAt)}
                      </time>
                      <span aria-hidden="true"> · </span>
                      <span>{leadArticle.readTime}</span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors leading-[1.06]">
                      {leadArticle.title}
                    </h2>
                    <p className="text-base text-[#1A1A1A]/80 leading-relaxed">
                      {leadArticle.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E]">
                      <span className="editorial-underline">Lire l&apos;article</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              )}

              {/* Tier 2: Two Editorial Columns separated by vertical hairline */}
              {secondaryArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#4E2A1E]/14 border-t border-b border-[#4E2A1E]/14">
                  {secondaryArticles.map((article, idx) => (
                    <Link
                      key={article.id}
                      to={`/actualites/${article.slug}`}
                      data-reveal
                      data-reveal-delay={String(idx * 0.1)}
                      className={`group block py-10 space-y-5 ${
                        idx === 0 ? 'md:pr-10' : 'md:pl-10'
                      }`}
                    >
                      <div className="aspect-[16/10] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                        <EditorialImage
                          assetKey={article.imageKey}
                          className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <div className="text-xs text-[#1A1A1A]/60 tabular-nums">
                          <span className="font-medium text-[#4E2A1E]">
                            {article.category}
                          </span>
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
                        <p className="text-sm sm:text-base text-[#1A1A1A]/75 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tier 3: Broadsheet Archive List */}
              {archiveArticles.length > 0 && (
                <div className="space-y-6" data-reveal>
                  <EditorialMark folio="Archives" label="Plus tôt" tone="brown" />
                  <div className="divide-y divide-[#4E2A1E]/14 border-t border-b border-[#4E2A1E]/14">
                    {archiveArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/actualites/${article.slug}`}
                        className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-[#1A1A1A]/60 tabular-nums">
                            <span>{article.category}</span>
                            <span aria-hidden="true"> · </span>
                            <time dateTime={article.publishedAt}>
                              {formatFrenchDate(article.publishedAt)}
                            </time>
                            <span aria-hidden="true"> · </span>
                            <span>{article.readTime}</span>
                          </div>
                          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] group-hover:text-[#4E2A1E] transition-colors">
                            {article.title}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] whitespace-nowrap shrink-0">
                          <span className="editorial-underline">Lire</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
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
    article ? article.excerpt : "Nouvelle de l'équipe UCAEP à l'ENSET de Lokossa.",
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
          Cet article est introuvable
        </h1>
        <Link
          to="/actualites"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Revenir aux actualités</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          to="/actualites"
          className="group inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="editorial-underline">Toutes les actualités</span>
        </Link>

        <header className="space-y-5 border-b border-[#4E2A1E]/14 pb-8">
          <EditorialMark
            folio={`${formatFrenchDate(article.publishedAt)} · ${article.readTime}`}
            label={article.category}
            tone="green"
          />
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E] leading-[1.04]">
            {article.title}
          </h1>
          <p className="text-lg sm:text-xl text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
            {article.excerpt}
          </p>
        </header>

        <figure>
          <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
            <EditorialImage assetKey={article.imageKey} />
          </div>
        </figure>

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
