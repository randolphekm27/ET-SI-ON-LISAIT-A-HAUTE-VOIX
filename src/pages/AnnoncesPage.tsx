import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useEditorialScrollMotion } from '../lib/motion';
import type { PublicAnnouncement } from '../types/competition';

export function AnnoncesPage() {
  const { slug } = useParams();

  if (slug) {
    return <AnnouncementDetailView slug={slug} />;
  }

  return <AnnouncementsFeedView />;
}

function AnnouncementsFeedView() {
  usePageSeo(
    'Annonces',
    "Toutes les nouvelles et les annonces publiées par l'équipe UCAEP au fil du concours.",
  );

  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchApiJson<{ announcements: PublicAnnouncement[] }>('/api/announcements')
      .then((data) => {
        if (!active) return;
        setAnnouncements(data.announcements || []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEditorialScrollMotion(pageRef, [announcements.length]);

  return (
    <div ref={pageRef} className="bg-[#FBF9F5]">
      <PageFolioHeader
        folio="Tableau"
        section="En direct de l'équipe"
        title="On vous tient"
        italicWord="au courant."
        subtitle="Les informations concernant le concours seront publiées ici. Certaines choses seront dévoilées progressivement, alors pensez à revenir régulièrement."
      />

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-sm bg-[#F7E6C8]/30 animate-pulse border border-[#4E2A1E]/10"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 border border-[#4E2A1E]/15 rounded-sm bg-[#F3EBDD]/40 text-center space-y-3">
              <p className="font-serif text-3xl text-[#4E2A1E]">
                La prochaine annonce arrive bientôt.
              </p>
              <p className="text-sm text-[#1A1A1A]/75">
                On vous en dira plus prochainement.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#4E2A1E]/15 border-t border-b border-[#4E2A1E]/15">
              {announcements.map((item, idx) => {
                const isFirst = idx === 0;
                const displayNumber = String(announcements.length - idx).padStart(2, '0');
                return (
                  <article
                    key={item.id}
                    data-reveal
                    className="group py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                  >
                    <div
                      className={`${
                        isFirst ? 'lg:col-span-6' : 'lg:col-span-5 lg:order-2'
                      }`}
                    >
                      <Link
                        to={`/annonces/${item.slug}`}
                        className="block aspect-[16/10] overflow-hidden rounded-sm bg-[#4E2A1E]/5"
                      >
                        <EditorialImage
                          assetKey={item.imageKey}
                          className="group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                        />
                      </Link>
                    </div>

                    <div
                      className={`space-y-5 ${
                        isFirst ? 'lg:col-span-6' : 'lg:col-span-7 lg:order-1'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-4 border-b border-[#4E2A1E]/12 pb-3">
                        <span className="font-serif text-4xl sm:text-5xl font-semibold text-[#D19A3A] tabular-nums leading-none">
                          № {displayNumber}
                        </span>
                        <div className="text-xs text-[#4E2A1E]/75 tabular-nums">
                          <span className="font-semibold text-[#2E4D32]">
                            {item.category}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <time dateTime={item.publishedAt}>
                            {formatFrenchDate(item.publishedAt)}
                          </time>
                        </div>
                      </div>

                      <h2
                        className={`font-serif font-semibold text-[#1A1A1A] leading-[1.08] ${
                          isFirst ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-4xl'
                        }`}
                      >
                        <Link
                          to={`/annonces/${item.slug}`}
                          className="hover:text-[#4E2A1E] transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h2>

                      <p className="text-base text-[#1A1A1A]/78 leading-relaxed max-w-2xl">
                        {item.excerpt}
                      </p>

                      <div className="pt-1">
                        <Link
                          to={`/annonces/${item.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
                        >
                          <span className="editorial-underline">Lire l&apos;annonce</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AnnouncementDetailView({ slug }: { slug: string }) {
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  usePageSeo(
    announcement ? announcement.title : 'Annonce',
    announcement
      ? announcement.excerpt
      : "Annonce de l'équipe UCAEP pour le concours à l'ENSET de Lokossa.",
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchApiJson<{ announcement: PublicAnnouncement }>(
      `/api/announcements/${encodeURIComponent(slug)}`,
    )
      .then((data) => {
        if (!active) return;
        setAnnouncement(data.announcement);
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

  if (notFound || !announcement) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
        <h1 className="font-serif text-4xl font-semibold text-[#4E2A1E]">
          Cette annonce n&apos;est pas encore disponible
        </h1>
        <p className="text-sm text-[#1A1A1A]/75">
          On vous en dira plus prochainement si elle n&apos;a pas encore été publiée.
        </p>
        <Link
          to="/annonces"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Revenir aux annonces</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          to="/annonces"
          className="group inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="editorial-underline">Toutes les annonces</span>
        </Link>

        <header className="space-y-5 border-b border-[#4E2A1E]/14 pb-8">
          <EditorialMark
            folio={formatFrenchDate(announcement.publishedAt)}
            label={announcement.category}
            tone="green"
          />
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E] leading-[1.04]">
            {announcement.title}
          </h1>
          <p className="text-lg sm:text-xl text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
            {announcement.excerpt}
          </p>
        </header>

        <figure>
          <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
            <EditorialImage assetKey={announcement.imageKey} />
          </div>
        </figure>

        <div className="max-w-prose space-y-6 text-base sm:text-lg text-[#1A1A1A]/85 leading-relaxed">
          {announcement.content.split(/\n\n+/).map((paragraph, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-semibold first-letter:text-[#4E2A1E] first-letter:float-left first-letter:mr-3 first-letter:leading-none'
                  : ''
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-8 border-t border-[#4E2A1E]/15 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/parcours"
            className="editorial-underline text-sm font-medium text-[#4E2A1E]"
          >
            Voir les trois phases du concours
          </Link>
          <Link
            to="/inscription"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors"
          >
            <span>Je m&apos;inscris</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
