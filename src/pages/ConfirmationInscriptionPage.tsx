import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { EditorialMark } from '../components/EditorialMark';
import { formatFrenchDate, usePageSeo } from '../lib/format';

interface ReceiptState {
  referenceCode: string;
  candidateName: string;
  department: string;
  studyLevel: string;
  createdAt: string;
  syncedToGoogleSheets: boolean;
}

export function ConfirmationInscriptionPage() {
  usePageSeo(
    'Inscription reçue',
    "Votre inscription au concours UCAEP à l'ENSET de Lokossa a bien été enregistrée.",
  );

  const location = useLocation();
  const state = location.state as ReceiptState | null;

  if (!state || !state.referenceCode) {
    return (
      <div className="py-24 bg-[#FBF9F5]">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <EditorialMark folio="Reçu" label="Inscription" tone="brown" />
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E]">
            Aucune inscription trouvée ici
          </h1>
          <p className="text-sm sm:text-base text-[#1A1A1A]/75 leading-relaxed">
            Cette page s&apos;affiche juste après avoir envoyé votre inscription depuis
            le formulaire.
          </p>
          <Link
            to="/inscription"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors"
          >
            <span>Aller à l&apos;inscription</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 lg:py-28 bg-[#FBF9F5]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="p-8 sm:p-12 border border-[#2E4D32]/25 bg-white rounded-sm space-y-7">
          <div className="flex items-center justify-between gap-4">
            <EditorialMark folio="Confirmé" label="ENSET de Lokossa" tone="green" />
            <CheckCircle2 className="w-6 h-6 text-[#2E4D32] shrink-0" />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E] leading-tight">
            C&apos;est bon,{' '}
            <em className="italic font-medium text-[#1A1A1A]">{state.candidateName}.</em>
          </h1>

          <p className="text-sm sm:text-base text-[#1A1A1A]/80 leading-relaxed">
            C&apos;est envoyé ! Nous avons bien reçu votre inscription pour « Et si on
            lisait à haute voix ? ». Gardez votre numéro de référence ci-dessous, il
            pourra vous servir pour la suite.
          </p>

          <dl className="divide-y divide-[#4E2A1E]/12 border-t border-b border-[#4E2A1E]/12 text-sm">
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-[#4E2A1E]/75">Référence</dt>
              <dd className="font-semibold text-[#1A1A1A] tabular-nums">
                {state.referenceCode}
              </dd>
            </div>
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-[#4E2A1E]/75">Filière et niveau</dt>
              <dd className="text-[#1A1A1A]">
                {state.department} · {state.studyLevel}
              </dd>
            </div>
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-[#4E2A1E]/75">Enregistrée le</dt>
              <dd className="text-[#1A1A1A] tabular-nums">
                {formatFrenchDate(state.createdAt)}
              </dd>
            </div>
          </dl>

          <div className="pt-2 flex flex-wrap items-center gap-5">
            <Link
              to="/annonces"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors"
            >
              <span>Voir les annonces</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/parcours"
              className="editorial-underline text-sm font-medium text-[#4E2A1E]"
            >
              Découvrir le parcours
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
