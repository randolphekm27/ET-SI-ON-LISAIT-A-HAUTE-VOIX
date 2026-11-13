import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EditorialImage } from '../components/EditorialImage';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
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
    'Annonces officielles',
    "Toutes les publications officielles et révélations progressives du concours UCAEP à l'ENSET de Lokossa.",
  );

  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-[#FBF9F5]">
      <section className="py-16 lg:py-24 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Communications officielles
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E] max-w-3xl leading-[1.06]">
            Annonces et révélations
          </h1>
          <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-2xl leading-relaxed">
            Seules les annonces publiées par le comité d&apos;organisation apparaissent ici.
            Chaque nouvelle phase y est révélée au moment opportun.
          </p>
        </div>
      </section>

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
            <div className="p-10 border border-[#4E2A1E]/15 rounded-sm bg-[#F7E6C8]/25 text-center space-y-3">
              <p className="font-serif text-2xl text-[#4E2A1E]">
                Aucune annonce publiée actuellement.
              </p>
              <p className="text-sm text-[#1A1A1A]/75">
                Revenez prochainement pour découvrir les prochaines révélations.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-[#4E2A1E]/12 pb-12 last:border-b-0"
                >
                  <div className="lg:col-span-5">
                    <div className="aspect-[16/10] lg:h-full overflow-hidden rounded-sm bg-[#4E2A1E]/5">
                      <EditorialImage
                        assetKey={item.imageKey}
                        className="lg:h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-7 flex flex-col justify-between py-1 space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs text-[#4E2A1E]/75 tabular-nums">
                        <span>{item.category}</span>
                        <span aria-hidden="true"> · </span>
                        <time dateTime={item.publishedAt}>
                          Publié le {formatFrenchDate(item.publishedAt)}
                        </time>
                      </div>
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A] leading-tight">
                        {item.title}
                      </h2>
                      <p className="text-base text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
                        {item.excerpt}
                      </p>
                    </div>
                    <div>
                      <Link
                        to={`/annonces/${item.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3d2016] transition-colors"
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
    </div>
  );
}

function AnnouncementDetailView({ slug }: { slug: string }) {
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  usePageSeo(
    announcement ? announcement.title : 'Annonce officielle',
    announcement
      ? announcement.excerpt
      : "Annonce officielle du concours UCAEP à l'ENSET de Lokossa.",
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
          Annonce introuvable
        </h1>
        <p className="text-sm text-[#1A1A1A]/75">
          Cette publication n&apos;est pas disponible ou n&apos;a pas encore été mise en
          ligne.
        </p>
        <Link
          to="/annonces"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E2A1E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/annonces"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#4E2A1E] hover:text-[#D19A3A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Toutes les annonces</span>
        </Link>

        <header className="space-y-4">
          <div className="text-xs text-[#2E4D32] font-semibold uppercase tracking-widest tabular-nums">
            <span>{announcement.category}</span>
            <span aria-hidden="true"> · </span>
            <time dateTime={announcement.publishedAt}>
              {formatFrenchDate(announcement.publishedAt)}
            </time>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E] leading-[1.08]">
            {announcement.title}
          </h1>
          <p className="text-lg text-[#1A1A1A]/80 leading-relaxed">
            {announcement.excerpt}
          </p>
        </header>

        <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#4E2A1E]/5">
          <EditorialImage assetKey={announcement.imageKey} />
        </div>

        <div className="max-w-prose space-y-5 text-base sm:text-lg text-[#1A1A1A]/85 leading-relaxed">
          {announcement.content.split(/\n\n+/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="pt-8 border-t border-[#4E2A1E]/15 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/parcours"
            className="text-sm font-medium text-[#4E2A1E] hover:underline"
          >
            Consulter le parcours des épreuves
          </Link>
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors"
          >
            <span>S&apos;inscrire au concours</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
