import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EditorialMark } from '../components/EditorialMark';
import { usePageSeo } from '../lib/format';

export function NotFoundPage() {
  usePageSeo(
    'Page introuvable',
    "Cette page n'existe pas sur le site du concours UCAEP.",
  );

  return (
    <div className="py-24 lg:py-32 bg-ucaep-paper">
      <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
        <EditorialMark folio="404" label="Page introuvable" tone="brown" />
        <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-ucaep-brown">
          Oups, cette page <em className="italic font-medium text-ucaep-ink">n&apos;existe pas.</em>
        </h1>
        <p className="text-base text-ucaep-ink/75 max-w-md mx-auto leading-relaxed">
          Le lien que vous avez suivi n&apos;est plus actif ou l&apos;adresse a changé.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="btn-tactile group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Revenir à l&apos;accueil</span>
          </Link>
          <Link
            to="/concours"
            className="editorial-underline px-4 py-3 text-sm font-medium text-ucaep-brown"
          >
            Voir le concours
          </Link>
        </div>
      </div>
    </div>
  );
}
