import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
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
    'Confirmation d’inscription',
    "Votre candidature au concours UCAEP à l'ENSET de Lokossa a bien été enregistrée.",
  );

  const location = useLocation();
  const state = location.state as ReceiptState | null;

  if (!state || !state.referenceCode) {
    return (
      <div className="py-24 bg-[#FBF9F5]">
        <div className="max-w-xl mx-auto px-4 text-center space-y-5">
          <h1 className="font-serif text-4xl font-semibold text-[#4E2A1E]">
            Aucune inscription récente détectée
          </h1>
          <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
            Cette page affiche votre reçu uniquement après validation effective du
            formulaire de candidature.
          </p>
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors"
          >
            <span>Accéder au formulaire d&apos;inscription</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="p-8 sm:p-10 border border-[#2E4D32]/25 bg-white rounded-sm space-y-6">
          <div className="flex items-center gap-3 text-[#2E4D32]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Candidature enregistrée
            </span>
          </div>

          <h1 className="font-serif text-4xl font-semibold text-[#4E2A1E]">
            Merci, {state.candidateName}.
          </h1>

          <p className="text-sm sm:text-base text-[#1A1A1A]/80 leading-relaxed">
            Votre inscription au concours « Et si on lisait à haute voix ? » a été
            sauvegardée avec succès. Conservez votre numéro de référence ci-dessous.
          </p>

          <dl className="divide-y divide-[#4E2A1E]/12 border-t border-b border-[#4E2A1E]/12 text-sm">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#4E2A1E]/75">Référence</dt>
              <dd className="font-semibold text-[#1A1A1A] tabular-nums">
                {state.referenceCode}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#4E2A1E]/75">Filière et niveau</dt>
              <dd className="text-[#1A1A1A]">
                {state.department} · {state.studyLevel}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#4E2A1E]/75">Date d&apos;enregistrement</dt>
              <dd className="text-[#1A1A1A] tabular-nums">
                {formatFrenchDate(state.createdAt)}
              </dd>
            </div>
          </dl>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to="/annonces"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors"
            >
              <span>Suivre les annonces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/parcours"
              className="text-sm font-medium text-[#4E2A1E] hover:underline"
            >
              Voir le parcours
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
