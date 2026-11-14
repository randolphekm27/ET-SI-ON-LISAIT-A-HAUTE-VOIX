import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialImage } from '../components/EditorialImage';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
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
    "Communications officielles, ouvertures des phases et notes d'organisation du concours « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
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
    <div ref={pageRef} className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Tableau"
        section="Communications officielles"
        title="Annonces et"
        italicWord="calendrier."
        subtitle="Les avis d'ouverture des phases, les consignes d'épreuves et les repères pratiques sont publiés ici par l'équipe organisatrice."
      />

      <section className="relative py-16 lg:py-24 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={220}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="brown"
          tileWidth={135}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -bottom-24 -left-16 w-60 h-60 opacity-[0.08]"
        />
        <BrandPatternWave
          variant="gold"
          tileWidth={170}
          opacity={0.08}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-[2px] bg-ucaep-ivory/30 animate-pulse border border-ucaep-brown/10"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 border border-ucaep-brown/15 rounded-[2px] bg-ucaep-linen/40 text-center space-y-3">
              <p className="font-serif text-3xl text-ucaep-brown">
                Aucune annonce publiée pour le moment.
              </p>
              <p className="text-sm text-ucaep-ink/75">
                Les prochaines communications de l&apos;équipe organisatrice apparaîtront dans cette rubrique.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ucaep-brown/15 border-t border-b border-ucaep-brown/15">
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
                        className="block aspect-[16/10] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10"
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
                      <div className="flex items-baseline justify-between gap-4 border-b border-ucaep-brown/14 pb-3 group-hover:border-ucaep-gold transition-colors">
                        <span className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-gold tabular-nums leading-none">
                          № {displayNumber}
                        </span>
                        <div className="text-xs text-ucaep-brown/75 tabular-nums">
                          <span className="font-semibold text-ucaep-green">
                            {item.category}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <time dateTime={item.publishedAt}>
                            {formatFrenchDate(item.publishedAt)}
                          </time>
                        </div>
                      </div>

                      <h2
                        className={`font-serif font-semibold text-ucaep-ink leading-[1.06] ${
                          isFirst ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-4xl'
                        }`}
                      >
                        <Link
                          to={`/annonces/${item.slug}`}
                          className="hover:text-ucaep-brown transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h2>

                      <p className="text-base text-ucaep-ink/78 leading-relaxed max-w-2xl">
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
  const candidateSession = useCandidateSession();
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
        <div className="h-80 rounded-[2px] bg-ucaep-ivory/30 animate-pulse" />
      </div>
    );
  }

  if (notFound || !announcement) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
        <h1 className="font-serif text-4xl font-semibold text-ucaep-brown">
          Cette annonce n&apos;est pas disponible
        </h1>
        <p className="text-sm text-ucaep-ink/75">
          La note demandée n&apos;a pas encore été publiée ou son adresse a changé.
        </p>
        <Link
          to="/annonces"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ucaep-brown hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Revenir aux annonces</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-10 lg:py-14 bg-ucaep-paper">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          to="/annonces"
          className="group inline-flex items-center gap-2 text-sm font-medium text-ucaep-brown hover:text-ucaep-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="editorial-underline">Toutes les annonces</span>
        </Link>

        <header className="space-y-5 border-b border-ucaep-brown/14 pb-8">
          <EditorialMark
            folio={formatFrenchDate(announcement.publishedAt)}
            label={announcement.category}
            tone="green"
          />
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-ucaep-brown leading-[1.04]">
            {announcement.title}
          </h1>
          <p className="text-lg sm:text-xl text-ucaep-ink/80 leading-relaxed max-w-2xl">
            {announcement.excerpt}
          </p>
        </header>

        <figure>
          <div className="aspect-[16/9] overflow-hidden rounded-[2px] bg-ucaep-brown/5 border border-ucaep-brown/10">
            <EditorialImage assetKey={announcement.imageKey} />
          </div>
        </figure>

        <div className="max-w-prose space-y-6 text-base sm:text-lg text-ucaep-ink/85 leading-relaxed">
          {announcement.content.split(/\n\n+/).map((paragraph, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-semibold first-letter:text-ucaep-brown first-letter:float-left first-letter:mr-3 first-letter:leading-none'
                  : ''
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-8 border-t border-ucaep-brown/15 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/parcours"
            className="editorial-underline text-sm font-medium text-ucaep-brown"
          >
            Voir les trois phases du concours
          </Link>
          {candidateSession ? (
            <Link
              to="/depot"
              className="btn-tactile group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27]"
            >
              <span>Mon espace dépôt</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              to="/inscription"
              className="btn-tactile group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c]"
            >
              <span>Je m&apos;inscris</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
