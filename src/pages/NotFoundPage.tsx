import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageSeo } from '../lib/format';

export function NotFoundPage() {
  usePageSeo(
    'Page introuvable',
    "La page demandée n'existe pas sur le site du concours UCAEP.",
  );

  return (
    <div className="py-24 lg:py-32 bg-[#FBF9F5]">
      <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D19A3A] tabular-nums">
          Erreur 404
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-[#4E2A1E]">
          Page introuvable
        </h1>
        <p className="text-base text-[#1A1A1A]/75 max-w-md mx-auto leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <Link
            to="/concours"
            className="px-5 py-3 text-sm font-medium rounded-sm border border-[#4E2A1E]/25 text-[#4E2A1E] hover:bg-[#4E2A1E]/5 transition-colors"
          >
            Découvrir le concours
          </Link>
        </div>
      </div>
    </div>
  );
}
