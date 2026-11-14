import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { EditorialMark } from '../components/EditorialMark';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';

interface ReceiptState {
  referenceCode: string;
  candidateName: string;
  department: string;
  studyLevel: string;
  createdAt: string;
  syncedToGoogleSheets?: boolean;
}

export function ConfirmationInscriptionPage() {
  usePageSeo(
    'Inscription reçue',
    "Votre inscription au concours UCAEP à l'ENSET de Lokossa a bien été enregistrée.",
  );

  const location = useLocation();
  const storedSession = useCandidateSession();
  const state = (location.state as ReceiptState | null) || storedSession;

  if (!state || !state.referenceCode) {
    return (
      <div className="py-24 bg-ucaep-paper">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <EditorialMark folio="Reçu" label="Inscription" tone="brown" />
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-brown">
            Aucune inscription trouvée ici
          </h1>
          <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed">
            Cette page s&apos;affiche juste après avoir envoyé votre inscription depuis
            le formulaire.
          </p>
          <Link
            to="/inscription"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors"
          >
            <span>Aller à l&apos;inscription</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-14 bg-ucaep-paper">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="p-8 sm:p-12 border border-ucaep-green/25 bg-white rounded-sm space-y-7">
          <div className="flex items-center justify-between gap-4">
            <EditorialMark folio="Confirmé" label="ENSET de Lokossa" tone="green" />
            <CheckCircle2 className="w-6 h-6 text-ucaep-green shrink-0" />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-brown leading-tight">
            C&apos;est bon,{' '}
            <em className="italic font-medium text-ucaep-ink">{state.candidateName}.</em>
          </h1>

          <p className="text-sm sm:text-base text-ucaep-ink/80 leading-relaxed">
            C&apos;est envoyé ! Nous avons bien reçu votre inscription pour « Et si on
            lisait à haute voix ? ». Gardez votre numéro de référence ci-dessous, il
            pourra vous servir pour la suite.
          </p>

          <dl className="divide-y divide-ucaep-brown/12 border-t border-b border-ucaep-brown/12 text-sm">
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-ucaep-brown/75">Référence</dt>
              <dd className="font-semibold text-ucaep-ink tabular-nums">
                {state.referenceCode}
              </dd>
            </div>
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-ucaep-brown/75">Filière et niveau</dt>
              <dd className="text-ucaep-ink">
                {state.department} · {state.studyLevel}
              </dd>
            </div>
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-ucaep-brown/75">Enregistrée le</dt>
              <dd className="text-ucaep-ink tabular-nums">
                {formatFrenchDate(state.createdAt)}
              </dd>
            </div>
          </dl>

          {/* Bouton d'adhésion au canal WhatsApp officiel */}
          <div className="p-6 sm:p-7 rounded-sm bg-[#25D366]/10 border border-[#25D366]/30 space-y-3.5">
            <div className="flex items-center gap-2.5 text-[#128C7E] font-semibold text-sm">
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>Étape suivante : Canal WhatsApp officiel</span>
            </div>
            <p className="text-xs sm:text-sm text-ucaep-ink/85 leading-relaxed">
              Rejoignez dès maintenant le canal officiel du concours pour ne manquer aucune consigne,
              suivre le calendrier des révélations et recevoir les annonces de l&apos;équipe organisatrice.
            </p>
            <a
              href="https://chat.whatsapp.com/D2RVspXf4Sp1OfllUCskoE?s=cl&p=a&iam=2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-sm bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20ba59] transition-all shadow-sm hover:shadow"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Rejoindre le canal WhatsApp</span>
            </a>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-5">
            <Link
              to="/annonces"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors"
            >
              <span>Voir les annonces</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to={`/depot?ref=${encodeURIComponent(state.referenceCode)}`}
              className="editorial-underline text-sm font-semibold text-ucaep-green"
            >
              Espace de dépôt candidat
            </Link>
            <Link
              to="/parcours"
              className="editorial-underline text-sm font-medium text-ucaep-brown"
            >
              Découvrir le parcours
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
