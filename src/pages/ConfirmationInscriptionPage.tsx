import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { EditorialMark } from '../components/EditorialMark';
import { EditorialHairline, EditorialReveal } from '../components/MotionPrimitives';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { EDITORIAL_EASE } from '../lib/motion';

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
    'Inscription enregistrée',
    "Votre candidature au concours UCAEP « Et si on lisait à haute voix ? » à l'ENSET de Lokossa est enregistrée.",
  );

  const location = useLocation();
  const storedSession = useCandidateSession();
  const state = (location.state as ReceiptState | null) || storedSession;

  if (!state || !state.referenceCode) {
    return (
      <div className="py-24 bg-ucaep-paper">
        <EditorialReveal className="max-w-xl mx-auto px-4 text-center space-y-6">
          <EditorialMark folio="Reçu" label="Inscription" tone="brown" />
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-brown">
            Aucune inscription enregistrée sur cette session
          </h1>
          <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed">
            Ce récapitulatif s&apos;affiche immédiatement après la validation du
            formulaire d&apos;inscription.
          </p>
          <Link
            to="/inscription"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors"
          >
            <span>Aller à l&apos;inscription</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </EditorialReveal>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-16 bg-ucaep-paper paper-fiber">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: EDITORIAL_EASE }}
          className="art-card p-8 sm:p-12 border border-ucaep-green/25 bg-white rounded-[2px] space-y-7"
        >
          <div className="flex items-center justify-between gap-4">
            <EditorialMark folio="Confirmé" label="ENSET de Lokossa" tone="green" />
            <CheckCircle2 className="w-6 h-6 text-ucaep-green shrink-0" />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ucaep-brown leading-tight">
            Inscription enregistrée,{' '}
            <em className="italic font-normal text-ucaep-ink">{state.candidateName}.</em>
          </h1>

          <p className="text-sm sm:text-base text-ucaep-ink/82 leading-relaxed">
            Votre participation au concours « Et si on lisait à haute voix ? » est confirmée. Notez dès maintenant ou capturez votre code d&apos;anonymat ci-dessous : il vous sera demandé pour vous connecter à votre espace candidat et déposer vos textes et vidéos sans révéler votre nom aux membres du jury.
          </p>

          <EditorialHairline className="h-px bg-ucaep-brown/12" delay={0.12} />

          <dl className="divide-y divide-ucaep-brown/12 border-b border-ucaep-brown/12 text-sm">
            <div className="py-3.5 flex justify-between gap-4">
              <dt className="text-ucaep-brown/75">Votre code d&apos;anonymat</dt>
              <dd className="font-mono font-semibold text-ucaep-ink tabular-nums">
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
          <EditorialReveal delay={0.14} y={12}>
            <div className="p-6 sm:p-7 rounded-[2px] bg-[#25D366]/10 border border-[#25D366]/30 space-y-3.5">
              <div className="flex items-center gap-2.5 text-[#128C7E] font-semibold text-sm">
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span>Étape suivante : rejoindre le canal d&apos;information officiel</span>
              </div>
              <p className="text-xs sm:text-sm text-ucaep-ink/85 leading-relaxed">
                Ce canal WhatsApp sert à annoncer l&apos;ouverture des phases en ligne, les rappels de délais et la publication des résultats sous code.
              </p>
              <a
                href="https://chat.whatsapp.com/D2RVspXf4Sp1OfllUCskoE?s=cl&p=a&iam=2"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-[2px] bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20ba59]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Rejoindre le canal WhatsApp officiel</span>
              </a>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.2} y={10}>
            <div className="pt-2 flex flex-wrap items-center gap-5">
              <Link
                to={`/depot?ref=${encodeURIComponent(state.referenceCode)}`}
                className="btn-tactile group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-[2px] bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16]"
              >
                <span>Accéder à mon espace candidat</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/annonces"
                className="editorial-underline text-sm font-semibold text-ucaep-green"
              >
                Consulter les annonces
              </Link>
              <Link
                to="/parcours"
                className="editorial-underline text-sm font-medium text-ucaep-brown"
              >
                Voir le déroulement des phases
              </Link>
            </div>
          </EditorialReveal>
        </motion.div>
      </div>
    </div>
  );
}
