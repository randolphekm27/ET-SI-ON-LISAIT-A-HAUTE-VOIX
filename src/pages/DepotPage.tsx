import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { DepotSubmissionPanel } from '../components/DepotSubmissionPanel';
import { EditorialReveal } from '../components/MotionPrimitives';
import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';
import { usePageSeo } from '../lib/format';
import { useSiteConfig } from '../lib/site-config';

function formatHeaderDeadline(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function DepotPage() {
  usePageSeo(
    'Déposer mes productions',
    'Espace candidat pour transmettre vos deux textes et vos vidéos via le formulaire officiel du concours UCAEP à l’ENSET de Lokossa.',
  );

  const { siteConfig, activePhase } = useSiteConfig();
  const isSinglePage = siteConfig.mode === 'phase_single_page';
  const currentPhase = isSinglePage ? activePhase : null;
  const activeExternal = currentPhase
    ? siteConfig.externalForms?.[currentPhase.id]
    : undefined;
  const hasAnyExternalForm = Boolean(
    activeExternal?.enabled ||
      siteConfig.externalForms?.['phase-1']?.enabled ||
      siteConfig.externalForms?.['phase-2']?.enabled,
  );
  const deadlineText = useMemo(
    () => formatHeaderDeadline(currentPhase?.submissionDeadline),
    [currentPhase?.submissionDeadline],
  );

  const steps = useMemo(
    () => [
      {
        num: '01',
        verb: 'Identifiez-vous',
        detail:
          'Renseignez votre code UCAEP-2026-XXXX et votre adresse e-mail d’inscription.',
      },
      {
        num: '02',
        verb: 'Rédigez vos textes',
        detail:
          'Déposez séparément votre Texte 1 et votre Texte 2 dans les deux champs dédiés.',
      },
      {
        num: '03',
        verb: 'Envoyez vos vidéos',
        detail: hasAnyExternalForm
          ? 'Transmettez vos vidéos face caméra via le bouton Google Form officiel avec votre code UCAEP.'
          : 'Déposez vos enregistrements vidéo (MP4, MOV, WebM ≤ 50 Mo) ou via le lien prévu.',
      },
      {
        num: '04',
        verb: 'Suivez la validation',
        detail:
          'Chaque texte reste modifiable tant que le jury ne l’a pas encore validé.',
      },
    ],
    [hasAnyExternalForm],
  );

  return (
    <div className="bg-ucaep-paper min-h-screen">
      {/* EN-TÊTE ÉDITORIAL COMPACT & SOMBRE */}
      <header className="relative bg-[#171412] text-[#FBF9F5] pt-24 sm:pt-28 pb-10 sm:pb-12 border-b border-ucaep-gold/30 overflow-hidden">
        <BrandPatternBand
          variant="gold"
          tileWidth={130}
          className="absolute top-16 inset-x-0 h-2 opacity-75"
        />
        <BrandPatternSurface
          variant="gold"
          tileWidth={220}
          opacityClass="opacity-[0.04]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_0%,rgba(209,154,58,0.16),transparent_72%)]"
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#F7E6C8]/85 hover:text-ucaep-gold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isSinglePage && currentPhase
                  ? `Retour à la Phase ${currentPhase.number} · ${currentPhase.title}`
                  : "Retour à l'accueil"}
              </span>
            </Link>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
              Espace candidat · Dépôt des productions
            </span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#FBF9F5] leading-[1.08] [text-wrap:balance]">
              Déposer vos{' '}
              <span className="italic font-normal text-[#F7E6C8]">
                productions
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#FBF9F5]/82 leading-relaxed">
              {currentPhase
                ? `Espace dédié à la Phase ${currentPhase.number} — ${currentPhase.title}. Soumettez vos deux textes écrits en ligne, accédez au formulaire vidéo officiel dès qu'il est activé et vérifiez l'état de validation de votre dossier.`
                : 'Connectez-vous avec votre code d’anonymat UCAEP et votre adresse e-mail pour soumettre vos deux textes, accéder au formulaire vidéo officiel et suivre la validation du jury.'}
            </p>
          </div>

          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-white/12 text-xs tabular-nums">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                {currentPhase ? 'Phase active' : 'Phases en ligne'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#FBF9F5]">
                {currentPhase
                  ? `${currentPhase.number} · ${currentPhase.title}`
                  : 'La Plume · La Connaissance'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                Statut des dépôts
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#F7E6C8]">
                {currentPhase
                  ? currentPhase.submissionsOpen
                    ? 'Ouverts'
                    : 'Fermés'
                  : 'Selon phase active'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                Date limite
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#FBF9F5]">
                {deadlineText || 'Voir calendrier'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                Mode vidéo
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#FBF9F5]">
                {hasAnyExternalForm
                  ? 'Google Form officiel actif'
                  : 'MP4, MOV, WebM ≤ 50 Mo'}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* CORPS PRINCIPAL : ÉTAPES + ESPACE DE DÉPÔT + AIDE VIDÉO */}
      <section className="relative py-12 lg:py-16 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="green"
          tileWidth={220}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="green"
          tileWidth={135}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -bottom-24 -right-16 w-64 h-64 opacity-[0.08]"
        />
        <BrandPatternWave
          variant="green"
          tileWidth={170}
          opacity={0.085}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {steps.map((item, idx) => (
              <EditorialReveal key={item.num} delay={idx * 0.05} y={12}>
                <div className="art-card h-full p-4 bg-white border border-ucaep-brown/14 rounded-[2px] space-y-1.5">
                  <span className="font-mono text-[11px] font-semibold text-ucaep-gold tabular-nums">
                    {item.num}
                  </span>
                  <h2 className="font-serif text-lg font-semibold text-ucaep-brown">
                    {item.verb}
                  </h2>
                  <p className="text-xs text-ucaep-ink/78 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </EditorialReveal>
            ))}
          </div>

          <EditorialReveal delay={0.08}>
            <DepotSubmissionPanel
              lockedPhaseId={isSinglePage ? siteConfig.activePhaseId : undefined}
              hideRegistrationHint={isSinglePage}
            />
          </EditorialReveal>

          <EditorialReveal delay={0.06}>
            <div className="p-5 bg-ucaep-linen/65 border border-ucaep-brown/15 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-ucaep-ink/82">
              <p className="leading-relaxed">
                Un problème pour accéder à votre dossier ou déposer un texte avant validation ? Contactez l&apos;équipe organisatrice en précisant votre code d&apos;anonymat UCAEP.
              </p>
              <Link
                to={isSinglePage ? '/#informations' : '/contact'}
                className="font-semibold text-ucaep-brown hover:text-ucaep-gold underline whitespace-nowrap shrink-0"
              >
                Contacter l&apos;équipe
              </Link>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.08}>
            <VideoPrepWorkshop
              isPresentiel={currentPhase?.format === 'En présentiel'}
            />
          </EditorialReveal>
        </div>
      </section>
    </div>
  );
}
