import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  HelpCircle,
  Info,
  MessageSquarePlus,
  Pin,
  Send,
  Video,
  Wrench,
} from 'lucide-react';
import {
  BrandPatternBand,
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { DepotSubmissionPanel } from '../components/DepotSubmissionPanel';
import { EditorialReveal } from '../components/MotionPrimitives';
import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useSiteConfig } from '../lib/site-config';
import type { DepotResourceItem, DepotResourceKind } from '../types/competition';

type DepotWorkspaceTab = 'depot' | 'ressources' | 'support';

type SupportCategory =
  | 'video_compression'
  | 'google_form'
  | 'textes'
  | 'connexion'
  | 'autre';

const SUPPORT_CATEGORIES: Array<{ value: SupportCategory; label: string }> = [
  {
    value: 'video_compression',
    label: 'Vidéo trop lourde (> 100 Mo) / Compression',
  },
  {
    value: 'google_form',
    label: 'Accès ou envoi sur le Google Form vidéo',
  },
  {
    value: 'textes',
    label: 'Saisie ou modification de mes textes (Texte 1 / Texte 2)',
  },
  {
    value: 'connexion',
    label: 'Code UCAEP-2026 ou adresse e-mail non reconnus',
  },
  {
    value: 'autre',
    label: 'Autre difficulté technique ou question au jury',
  },
];

const RESOURCE_KIND_META: Record<
  DepotResourceKind,
  { label: string; badgeClass: string; cardAccent: string }
> = {
  tool: {
    label: 'Outil recommandé',
    badgeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300',
    cardAccent: 'border-ucaep-green/35 bg-white',
  },
  video_help: {
    label: 'Guide vidéo',
    badgeClass: 'bg-amber-50 text-amber-950 border-amber-300',
    cardAccent: 'border-ucaep-gold/45 bg-white',
  },
  warning: {
    label: 'Point d’attention',
    badgeClass: 'bg-red-50 text-red-950 border-red-300',
    cardAccent: 'border-red-300/80 bg-red-50/20',
  },
  info: {
    label: 'Note organisateurs',
    badgeClass: 'bg-ucaep-paper text-ucaep-brown border-ucaep-brown/25',
    cardAccent: 'border-ucaep-brown/18 bg-white',
  },
};

function isSafeExternalUrl(raw?: string): raw is string {
  if (!raw) return false;
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

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

function ResourceKindIcon({ kind }: { kind: DepotResourceKind }) {
  if (kind === 'tool') return <Wrench className="w-3.5 h-3.5" aria-hidden="true" />;
  if (kind === 'video_help') return <Video className="w-3.5 h-3.5" aria-hidden="true" />;
  if (kind === 'warning')
    return <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />;
  return <Info className="w-3.5 h-3.5" aria-hidden="true" />;
}

export function DepotPage() {
  usePageSeo(
    'Espace de dépôt & ressources',
    'Espace candidat complet : déposez vos textes et vidéos, consultez les annonces officielles, accédez aux outils recommandés et signalez toute difficulté.',
  );

  const { siteConfig, activePhase, announcements } = useSiteConfig();
  const candidateSession = useCandidateSession();
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<DepotWorkspaceTab>('depot');
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<string | null>(
    null,
  );

  // Support form state
  const [supportName, setSupportName] = useState(
    () => candidateSession?.candidateName || '',
  );
  const [supportEmail, setSupportEmail] = useState(
    () => candidateSession?.email || '',
  );
  const [supportRef, setSupportRef] = useState(
    () => candidateSession?.referenceCode || '',
  );
  const [supportPhaseId, setSupportPhaseId] = useState<string>(
    () => siteConfig.activePhaseId || 'phase-1',
  );
  const [supportCategory, setSupportCategory] =
    useState<SupportCategory>('video_compression');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [supportSentId, setSupportSentId] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateSession) return;
    setSupportName((prev) => prev || candidateSession.candidateName || '');
    setSupportEmail((prev) => prev || candidateSession.email || '');
    setSupportRef((prev) => prev || candidateSession.referenceCode || '');
  }, [candidateSession]);

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

  const activeResources = useMemo<DepotResourceItem[]>(() => {
    const raw = siteConfig.depotResources || [];
    return [...raw]
      .filter((r) => r.active !== false)
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '');
      });
  }, [siteConfig.depotResources]);

  const sidebarResources = useMemo(
    () => activeResources.slice(0, 3),
    [activeResources],
  );

  const latestAnnouncements = useMemo(
    () => announcements.slice(0, 3),
    [announcements],
  );

  const toolResources = useMemo(
    () =>
      activeResources.filter(
        (r) =>
          (r.kind === 'tool' || r.kind === 'video_help') &&
          isSafeExternalUrl(r.actionUrl),
      ),
    [activeResources],
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

  function switchToTab(nextTab: DepotWorkspaceTab) {
    setActiveTab(nextTab);
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSupportSubmit(e: FormEvent) {
    e.preventDefault();
    setSupportError('');
    setSupportSending(true);

    try {
      const res = await fetchApiJson<{ saved: boolean; id: string }>(
        '/api/depot/support',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: supportName,
            email: supportEmail,
            referenceCode: supportRef,
            phaseId: supportPhaseId,
            category: supportCategory,
            message: supportMessage,
          }),
        },
      );
      setSupportSentId(res.id);
      setSupportMessage('');
    } catch (err) {
      setSupportError(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer votre signalement pour le moment.",
      );
    } finally {
      setSupportSending(false);
    }
  }

  const totalResourceCount = activeResources.length + announcements.length;

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

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
              Espace candidat · Dépôt, annonces &amp; assistance
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
                ? `Espace complet pour la Phase ${currentPhase.number} — ${currentPhase.title}. Soumettez vos textes et vidéos, consultez les notes officielles et outils recommandés par les organisateurs, ou signalez une difficulté en direct.`
                : 'Votre espace candidat complet : déposez vos deux textes, accédez au formulaire vidéo officiel, téléchargez les outils utiles recommandés par le comité et signalez toute difficulté.'}
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
                  ? 'Google Form officiel (max 100 Mo)'
                  : 'MP4, MOV, WebM ≤ 50 Mo'}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* CORPS PRINCIPAL : ÉTAPES + BARRE D'ONGLETS + WORKSPACE COMPLET */}
      <section className="relative py-10 lg:py-14 bg-ucaep-paper paper-fiber overflow-hidden">
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

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 4 étapes synthétiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {steps.map((item, idx) => (
              <EditorialReveal key={item.num} delay={idx * 0.04} y={10}>
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

          {/* Barre d'onglets du portail candidat */}
          <div
            ref={workspaceRef}
            className="scroll-mt-24 flex flex-wrap items-center justify-between gap-3 p-1.5 bg-white border border-ucaep-brown/15 rounded-[2px]"
          >
            <div className="flex flex-wrap items-center gap-1.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'depot'}
                onClick={() => setActiveTab('depot')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[2px] transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'depot'
                    ? 'bg-ucaep-brown text-ucaep-paper'
                    : 'text-ucaep-brown hover:bg-ucaep-paper'
                }`}
              >
                <span>Dépôt des productions</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ressources'}
                onClick={() => setActiveTab('ressources')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[2px] transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  activeTab === 'ressources'
                    ? 'bg-ucaep-brown text-ucaep-paper'
                    : 'text-ucaep-brown hover:bg-ucaep-paper'
                }`}
              >
                <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Annonces &amp; Outils ({totalResourceCount})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'support'}
                onClick={() => setActiveTab('support')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[2px] transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'support'
                    ? 'bg-ucaep-brown text-ucaep-paper'
                    : 'text-ucaep-brown hover:bg-ucaep-paper'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Signaler une difficulté</span>
              </button>
            </div>

            {candidateSession && (
              <div className="px-3 py-1 text-xs text-ucaep-ink/75 tabular-nums">
                Dossier mémorisé :{' '}
                <strong className="font-mono text-ucaep-brown">
                  {candidateSession.referenceCode}
                </strong>
              </div>
            )}
          </div>

          {/* VUE 1 : DÉPÔT + BARRE LATÉRALE NOTES & OUTILS */}
          {activeTab === 'depot' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <DepotSubmissionPanel
                  lockedPhaseId={isSinglePage ? siteConfig.activePhaseId : undefined}
                  hideRegistrationHint={isSinglePage}
                />

                <VideoPrepWorkshop
                  isPresentiel={currentPhase?.format === 'En présentiel'}
                />
              </div>

              {/* Colonne latérale sticky : Outils & Notes importantes */}
              <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                {siteConfig.customNotice && (
                  <div className="p-5 bg-[#FBF6EB] border border-ucaep-gold/55 rounded-[2px] space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-brown">
                      Message du comité d&apos;organisation
                    </p>
                    <p className="text-xs sm:text-sm text-ucaep-ink/90 leading-relaxed whitespace-pre-line">
                      {siteConfig.customNotice}
                    </p>
                  </div>
                )}

                {/* Outils & Notes importants publiés depuis /gestion */}
                <div className="p-5 bg-white border border-ucaep-brown/15 rounded-[2px] space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-ucaep-brown/12 pb-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                        Outils &amp; notes utiles
                      </p>
                      <h2 className="font-serif text-xl font-semibold text-ucaep-brown">
                        Informations pratiques
                      </h2>
                    </div>
                    {activeResources.length > 0 && (
                      <button
                        type="button"
                        onClick={() => switchToTab('ressources')}
                        className="text-xs font-semibold text-ucaep-brown underline hover:text-ucaep-gold whitespace-nowrap shrink-0"
                      >
                        Tout voir
                      </button>
                    )}
                  </div>

                  {sidebarResources.length === 0 ? (
                    <p className="text-xs text-ucaep-ink/70 leading-relaxed">
                      Aucune note complémentaire publiée pour le moment. Consultez les consignes de phase ou utilisez le bouton ci-dessous en cas de difficulté.
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      {sidebarResources.map((item) => {
                        const meta = RESOURCE_KIND_META[item.kind];
                        const safeHref = isSafeExternalUrl(item.actionUrl)
                          ? item.actionUrl
                          : null;

                        return (
                          <article
                            key={item.id}
                            className={`p-4 border rounded-[2px] space-y-2.5 ${meta.cardAccent}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-[2px] ${meta.badgeClass}`}
                              >
                                <ResourceKindIcon kind={item.kind} />
                                <span>{meta.label}</span>
                              </span>
                              {item.pinned && (
                                <span className="inline-flex items-center gap-1 text-ucaep-gold">
                                  <Pin className="w-3 h-3" aria-hidden="true" />
                                  <span>Épinglé</span>
                                </span>
                              )}
                            </div>

                            <h3 className="font-serif text-base font-semibold text-ucaep-brown leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-ucaep-ink/82 leading-relaxed whitespace-pre-line">
                              {item.body}
                            </p>

                            {safeHref && (
                              <a
                                href={safeHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">
                                  {item.actionLabel || 'Ouvrir le lien'}
                                </span>
                                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                              </a>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dernières annonces officielles */}
                {latestAnnouncements.length > 0 && (
                  <div className="p-5 bg-white border border-ucaep-brown/15 rounded-[2px] space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-ucaep-brown/12 pb-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                          Communiqués
                        </p>
                        <h2 className="font-serif text-xl font-semibold text-ucaep-brown">
                          Dernières annonces
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchToTab('ressources')}
                        className="text-xs font-semibold text-ucaep-brown underline hover:text-ucaep-gold whitespace-nowrap shrink-0"
                      >
                        Lire tout
                      </button>
                    </div>

                    <div className="divide-y divide-ucaep-brown/10">
                      {latestAnnouncements.map((ann) => (
                        <div key={ann.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ucaep-green tabular-nums">
                            {ann.category} · {formatFrenchDate(ann.publishedAt)}
                          </p>
                          <h3 className="font-serif text-base font-semibold text-ucaep-brown leading-snug">
                            {ann.title}
                          </h3>
                          <p className="text-xs text-ucaep-ink/75 line-clamp-2 leading-relaxed">
                            {ann.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carte d'appel directe à l'assistance */}
                <div className="p-5 bg-[#171412] text-[#FBF9F5] border border-ucaep-gold/30 rounded-[2px] space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                    Assistance directe
                  </p>
                  <h2 className="font-serif text-xl font-semibold leading-snug">
                    Un blocage pendant votre dépôt ?
                  </h2>
                  <p className="text-xs text-[#FBF9F5]/80 leading-relaxed">
                    Vidéo supérieure à 100 Mo, code UCAEP introuvable ou question sur le Google Form : signalez votre difficulté directement ici à l&apos;équipe organisatrice.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchToTab('support')}
                    className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Signaler une difficulté</span>
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* VUE 2 : ANNONCES & OUTILS COMPLETS */}
          {activeTab === 'ressources' && (
            <div className="space-y-10">
              {siteConfig.customNotice && (
                <div className="p-5 bg-[#FBF6EB] border border-ucaep-gold/55 rounded-[2px] space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-brown">
                    Note prioritaire de l&apos;organisation
                  </p>
                  <p className="text-sm text-ucaep-ink/90 leading-relaxed whitespace-pre-line">
                    {siteConfig.customNotice}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-ucaep-brown/15 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                      Guides &amp; applications utiles
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                      Outils &amp; informations de dépôt
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchToTab('depot')}
                    className="text-xs font-semibold text-ucaep-brown underline hover:text-ucaep-gold whitespace-nowrap shrink-0"
                  >
                    Revenir au dépôt des productions →
                  </button>
                </div>

                {activeResources.length === 0 ? (
                  <div className="p-8 bg-white border border-ucaep-brown/15 rounded-[2px] text-sm text-ucaep-ink/75">
                    Aucune information complémentaire ou application externe n&apos;est affichée pour le moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {activeResources.map((item) => {
                      const meta = RESOURCE_KIND_META[item.kind];
                      const safeHref = isSafeExternalUrl(item.actionUrl)
                        ? item.actionUrl
                        : null;

                      return (
                        <article
                          key={item.id}
                          className={`p-6 border rounded-[2px] flex flex-col justify-between gap-4 ${meta.cardAccent}`}
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.15em]">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-[2px] ${meta.badgeClass}`}
                              >
                                <ResourceKindIcon kind={item.kind} />
                                <span>{meta.label}</span>
                              </span>
                              {item.pinned && (
                                <span className="inline-flex items-center gap-1 text-ucaep-gold">
                                  <Pin className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Épinglé en tête</span>
                                </span>
                              )}
                            </div>

                            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ucaep-brown leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-sm text-ucaep-ink/82 leading-relaxed whitespace-pre-line">
                              {item.body}
                            </p>
                          </div>

                          {safeHref && (
                            <div className="pt-2 border-t border-ucaep-brown/10">
                              <a
                                href={safeHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] transition-colors"
                              >
                                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>{item.actionLabel || 'Ouvrir le lien'}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              </a>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border-b border-ucaep-brown/15 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                    Tableau officiel
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                    Annonces publiées aux candidats
                  </h2>
                </div>

                {announcements.length === 0 ? (
                  <div className="p-8 bg-white border border-ucaep-brown/15 rounded-[2px] text-sm text-ucaep-ink/75">
                    Aucune annonce officielle publiée pour le moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((ann) => {
                      const isExpanded = expandedAnnouncementId === ann.id;
                      return (
                        <article
                          key={ann.id}
                          className="p-6 bg-white border border-ucaep-brown/15 rounded-[2px] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold uppercase tracking-[0.16em] text-ucaep-green tabular-nums">
                              {ann.category} · {formatFrenchDate(ann.publishedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAnnouncementId(isExpanded ? null : ann.id)
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-ucaep-brown hover:text-ucaep-gold"
                            >
                              <span>
                                {isExpanded
                                  ? 'Réduire le communiqué'
                                  : 'Lire le communiqué complet'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                          </div>

                          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ucaep-brown">
                            {ann.title}
                          </h3>
                          <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                            {ann.excerpt}
                          </p>

                          {isExpanded && (
                            <div className="pt-3 border-t border-ucaep-brown/12 text-sm text-ucaep-ink/88 leading-relaxed whitespace-pre-line">
                              {ann.content}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VUE 3 : SIGNALER UNE DIFFICULTÉ */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-[2px] space-y-6">
                <div className="space-y-2 border-b border-ucaep-brown/12 pb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                    Assistance candidats · Réponse par e-mail
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                    Signaler une difficulté de dépôt
                  </h2>
                  <p className="text-sm text-ucaep-ink/78 leading-relaxed">
                    Ce formulaire transmet directement votre demande au tableau de suivi des organisateurs. Utilisez-le si vous rencontrez un blocage technique (taille vidéo, accès Google Form, textes ou code UCAEP).
                  </p>
                </div>

                {supportCategory === 'video_compression' &&
                  toolResources.length > 0 && (
                    <div className="p-4 bg-emerald-50/60 border border-ucaep-green/30 rounded-[2px] space-y-3">
                      <p className="text-xs font-semibold text-ucaep-green">
                        Outil déjà mis à disposition pour réduire vos vidéos sous 100 Mo :
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-ucaep-brown">
                            {toolResources[0].title}
                          </p>
                          <p className="text-xs text-ucaep-ink/75">
                            {toolResources[0].body}
                          </p>
                        </div>
                        <a
                          href={toolResources[0].actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[2px] bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {toolResources[0].actionLabel || 'Télécharger l’outil'}
                          </span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  )}

                {supportSentId ? (
                  <div className="p-6 bg-emerald-50/70 border border-ucaep-green/40 rounded-[2px] space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-5 h-5 text-ucaep-green shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="space-y-1">
                        <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                          Difficulté transmise à l&apos;équipe organisatrice
                        </h3>
                        <p className="text-sm text-ucaep-ink/85 leading-relaxed">
                          Votre message a bien été enregistré dans notre espace de suivi. Un membre du comité vous répondra à l&apos;adresse{' '}
                          <strong>{supportEmail}</strong> dans les plus brefs délais.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => switchToTab('depot')}
                        className="px-4 py-2 text-xs font-semibold rounded-[2px] bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16]"
                      >
                        Retourner à mon dépôt
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupportSentId(null)}
                        className="px-4 py-2 text-xs font-semibold rounded-[2px] border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-paper"
                      >
                        Envoyer un autre signalement
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    {supportError && (
                      <div
                        role="alert"
                        className="p-3.5 bg-red-50 border border-red-300 rounded-[2px] text-xs sm:text-sm text-red-900 flex items-start gap-2.5"
                      >
                        <AlertCircle
                          className="w-4 h-4 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{supportError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="support-name"
                          className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                        >
                          Nom complet *
                        </label>
                        <input
                          id="support-name"
                          type="text"
                          required
                          maxLength={100}
                          value={supportName}
                          onChange={(e) => setSupportName(e.target.value)}
                          placeholder="Prénom et Nom"
                          className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-[2px] focus:outline-none focus:border-ucaep-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="support-ref"
                          className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                        >
                          Code candidat UCAEP (optionnel)
                        </label>
                        <input
                          id="support-ref"
                          type="text"
                          maxLength={40}
                          value={supportRef}
                          onChange={(e) => setSupportRef(e.target.value.toUpperCase())}
                          placeholder="UCAEP-2026-0001"
                          className="w-full px-3.5 py-2.5 text-sm font-mono bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-[2px] focus:outline-none focus:border-ucaep-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="support-email"
                          className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                        >
                          Adresse e-mail de réponse *
                        </label>
                        <input
                          id="support-email"
                          type="email"
                          required
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          placeholder="votre.email@exemple.com"
                          className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-[2px] focus:outline-none focus:border-ucaep-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="support-phase"
                          className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                        >
                          Phase concernée
                        </label>
                        <select
                          id="support-phase"
                          value={supportPhaseId}
                          onChange={(e) => setSupportPhaseId(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-[2px] focus:outline-none focus:border-ucaep-gold"
                        >
                          <option value="phase-1">Phase 01 — La Plume</option>
                          <option value="phase-2">Phase 02 — La Connaissance</option>
                          <option value="phase-3">Phase 03 — La Finale</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-category"
                        className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                      >
                        Nature de la difficulté *
                      </label>
                      <select
                        id="support-category"
                        value={supportCategory}
                        onChange={(e) =>
                          setSupportCategory(e.target.value as SupportCategory)
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-[2px] focus:outline-none focus:border-ucaep-gold"
                      >
                        {SUPPORT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-message"
                        className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                      >
                        Décrivez précisément le problème rencontré *
                      </label>
                      <textarea
                        id="support-message"
                        required
                        rows={5}
                        minLength={10}
                        maxLength={2600}
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Indiquez le message d'erreur affiché, la taille de votre fichier vidéo ou l'étape à laquelle vous êtes bloqué..."
                        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-[2px] focus:outline-none focus:border-ucaep-gold leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <p className="text-xs text-ucaep-ink/65">
                        L&apos;équipe vous répond par e-mail après examen de votre dossier.
                      </p>
                      <button
                        type="submit"
                        disabled={supportSending}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {supportSending
                            ? 'Envoi en cours...'
                            : 'Envoyer le signalement'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <aside className="lg:col-span-4 space-y-4">
                <div className="p-5 bg-white border border-ucaep-brown/15 rounded-[2px] space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-gold">
                    Avant d&apos;écrire
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                    Vérifications rapides
                  </h3>
                  <ul className="space-y-2.5 text-xs text-ucaep-ink/80 leading-relaxed">
                    <li>
                      <strong>Vidéo &gt; 100 Mo :</strong> Google Form limite l&apos;envoi à 100 Mo par fichier. Utilisez l&apos;application conseillée dans l&apos;onglet <em>Annonces &amp; Outils</em>.
                    </li>
                    <li>
                      <strong>Code UCAEP :</strong> vérifiez les majuscules (<span className="font-mono">UCAEP-2026-XXXX</span>) et l&apos;e-mail exact utilisé lors de l&apos;inscription.
                    </li>
                    <li>
                      <strong>Texte déjà validé :</strong> une fois validé par le jury, un texte est verrouillé pour préserver l&apos;équité d&apos;évaluation.
                    </li>
                  </ul>
                </div>

                {!isSinglePage && (
                  <div className="p-5 bg-ucaep-linen/65 border border-ucaep-brown/15 rounded-[2px] space-y-2 text-xs text-ucaep-ink/80">
                    <p className="font-semibold text-ucaep-brown">
                      Demande générale hors dépôt ?
                    </p>
                    <p className="leading-relaxed">
                      Pour toute question administrative ou partenariat avec le campus, utilisez la page de contact générale.
                    </p>
                    <Link
                      to="/contact"
                      className="inline-block font-semibold text-ucaep-brown underline hover:text-ucaep-gold"
                    >
                      Ouvrir la page Contact →
                    </Link>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
