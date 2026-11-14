import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  Lock,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import {
  getCandidateSession,
  saveCandidateSession,
} from '../lib/candidate-session';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import {
  ACCEPT_ATTRIBUTE,
  MAX_TEXT_SUBMISSION_LENGTH,
  formatFileSize,
  validateSubmissionFileClient,
} from '../lib/submissions-config';
import { uploadFileToSignedStorageUrl } from '../lib/supabase';
import type {
  CandidateSubmissionSummary,
  SubmissionKind,
  SubmissionPublicPhaseStatus,
  SubmissionStatus,
} from '../types/competition';

interface StatusResponse {
  candidate: {
    firstName: string;
    lastName: string;
    referenceCode: string;
    department: string;
    studyLevel: string;
  };
  phases: SubmissionPublicPhaseStatus[];
}

const SUBMISSION_STATUS_BADGE: Record<
  SubmissionStatus,
  { label: string; className: string }
> = {
  received: {
    label: 'Reçu',
    className: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  validated: {
    label: 'Validé par le jury',
    className: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  rejected: {
    label: 'À reprendre',
    className: 'bg-red-50 text-red-900 border-red-300',
  },
};

function formatDeadline(iso: string | null): string | null {
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
    'Déposer ma production',
    'Espace de dépôt des textes, enregistrements audio, vidéos ou documents pour les candidats inscrits au concours UCAEP.',
  );

  const [searchParams] = useSearchParams();
  const initialStored = useMemo(() => getCandidateSession(), []);
  const [referenceCode, setReferenceCode] = useState(
    () =>
      (searchParams.get('ref') || initialStored?.referenceCode || '')
        .trim()
        .toUpperCase(),
  );
  const [email, setEmail] = useState(() => (initialStored?.email || '').trim());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [uploadReady, setUploadReady] = useState(true);
  const autoCheckedRef = useRef(false);

  const [sessionData, setSessionData] = useState<StatusResponse | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [activeKind, setActiveKind] = useState<SubmissionKind>('file');
  const [replaceMode, setReplaceMode] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validatedMime, setValidatedMime] = useState<string>('');
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text submission state
  const [textContent, setTextContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState<CandidateSubmissionSummary | null>(
    null,
  );

  const selectedPhase = useMemo(
    () => sessionData?.phases.find((p) => p.id === selectedPhaseId) || null,
    [sessionData, selectedPhaseId],
  );

  useEffect(() => {
    let active = true;
    fetchApiJson<{ fileUploadReady?: boolean }>('/api/submissions/config')
      .then((cfg) => {
        if (active && typeof cfg.fileUploadReady === 'boolean') {
          setUploadReady(cfg.fileUploadReady);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPhase) return;
    setSubmitError('');
    setFileError('');
    setUploadProgress(null);
    setJustSubmitted(null);

    if (selectedPhase.existingSubmission) {
      setReplaceMode(false);
      if (selectedPhase.existingSubmission.kind === 'text') {
        setActiveKind('text');
        setTextContent(selectedPhase.existingSubmission.textContent || '');
      } else {
        setActiveKind('file');
      }
    } else {
      setReplaceMode(true);
    }
  }, [selectedPhaseId]);

  async function refreshCandidateStatus(refVal: string, emailVal: string) {
    const cleanRef = refVal.trim().toUpperCase();
    const cleanEmail = emailVal.trim();
    const res = await fetchApiJson<StatusResponse>('/api/submissions/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceCode: cleanRef,
        email: cleanEmail,
      }),
    });
    setSessionData(res);
    setReferenceCode(res.candidate.referenceCode);
    setEmail(cleanEmail);
    saveCandidateSession({
      referenceCode: res.candidate.referenceCode,
      candidateName: `${res.candidate.firstName} ${res.candidate.lastName}`.trim(),
      email: cleanEmail,
      department: res.candidate.department,
      studyLevel: res.candidate.studyLevel,
      createdAt: initialStored?.createdAt || new Date().toISOString(),
      syncedToGoogleSheets: initialStored?.syncedToGoogleSheets,
    });
    if (!selectedPhaseId || !res.phases.some((p) => p.id === selectedPhaseId)) {
      const firstOpen = res.phases.find((p) => p.acceptingNow) || res.phases[0];
      if (firstOpen) setSelectedPhaseId(firstOpen.id);
    }
    return res;
  }

  useEffect(() => {
    if (autoCheckedRef.current) return;
    if (referenceCode && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      autoCheckedRef.current = true;
      setAuthLoading(true);
      refreshCandidateStatus(referenceCode, email)
        .catch(() => {
          // L'utilisateur peut corriger manuellement ses identifiants si nécessaire
        })
        .finally(() => setAuthLoading(false));
    }
  }, []);

  async function handleVerifyCandidate(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await refreshCandidateStatus(referenceCode, email);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Impossible de retrouver votre inscription.',
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function handleFileSelection(file: File | null) {
    setFileError('');
    setSubmitError('');
    if (!file) {
      setSelectedFile(null);
      setValidatedMime('');
      return;
    }

    const check = validateSubmissionFileClient(file);
    if (check.ok === false) {
      setSelectedFile(null);
      setValidatedMime('');
      setFileError(check.error);
      return;
    }

    setSelectedFile(file);
    setValidatedMime(check.mimeType);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0] || null;
    handleFileSelection(dropped);
  }

  async function handleSubmitFile() {
    if (!sessionData || !selectedPhase || !selectedPhase.acceptingNow) return;
    if (!selectedFile) {
      setFileError('Choisissez d’abord un fichier à envoyer.');
      return;
    }

    const check = validateSubmissionFileClient(selectedFile);
    if (check.ok === false) {
      setFileError(check.error);
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');
    setUploadProgress(2);

    try {
      const init = await fetchApiJson<{
        kind: 'file';
        uploadMode?: 'supabase_signed' | 'local_server';
        storagePath: string;
        token: string;
        signedUrl?: string;
        normalizedMimeType: string;
      }>('/api/submissions/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: sessionData.candidate.referenceCode,
          email,
          phaseId: selectedPhase.id,
          kind: 'file',
          fileName: selectedFile.name,
          mimeType: check.mimeType,
          sizeBytes: selectedFile.size,
        }),
      });

      await uploadFileToSignedStorageUrl({
        path: init.storagePath,
        token: init.token,
        signedUrl: init.signedUrl,
        uploadMode: init.uploadMode,
        file: selectedFile,
        contentType: init.normalizedMimeType || validatedMime || check.mimeType,
        onProgress: (pct) => setUploadProgress(pct),
      });

      const done = await fetchApiJson<{
        ok: true;
        submission: CandidateSubmissionSummary;
      }>('/api/submissions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: sessionData.candidate.referenceCode,
          email,
          phaseId: selectedPhase.id,
          kind: 'file',
          storagePath: init.storagePath,
          fileName: selectedFile.name,
          mimeType: init.normalizedMimeType || check.mimeType,
          sizeBytes: selectedFile.size,
        }),
      });

      setJustSubmitted(done.submission);
      setReplaceMode(false);
      setSelectedFile(null);
      setUploadProgress(100);
      await refreshCandidateStatus(sessionData.candidate.referenceCode, email);
    } catch (err) {
      setUploadProgress(null);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'L’envoi a été interrompu. Votre sélection est conservée : vous pouvez réessayer.',
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleSubmitText(e: FormEvent) {
    e.preventDefault();
    if (!sessionData || !selectedPhase || !selectedPhase.acceptingNow) return;

    const cleanText = textContent.trim();
    if (!cleanText) {
      setSubmitError('Écrivez votre texte avant de valider le dépôt.');
      return;
    }
    if (cleanText.length > MAX_TEXT_SUBMISSION_LENGTH) {
      setSubmitError(
        `Votre texte dépasse la limite de ${MAX_TEXT_SUBMISSION_LENGTH.toLocaleString('fr-FR')} caractères.`,
      );
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      await fetchApiJson('/api/submissions/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: sessionData.candidate.referenceCode,
          email,
          phaseId: selectedPhase.id,
          kind: 'text',
        }),
      });

      const done = await fetchApiJson<{
        ok: true;
        submission: CandidateSubmissionSummary;
      }>('/api/submissions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: sessionData.candidate.referenceCode,
          email,
          phaseId: selectedPhase.id,
          kind: 'text',
          textContent: cleanText,
        }),
      });

      setJustSubmitted(done.submission);
      setReplaceMode(false);
      await refreshCandidateStatus(sessionData.candidate.referenceCode, email);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer votre texte. Vos mots sont conservés, réessayez.',
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  const displayedSubmission =
    justSubmitted || selectedPhase?.existingSubmission || null;

  return (
    <div className="bg-ucaep-paper min-h-screen">
      <PageFolioHeader
        section="Espace candidat · Dépôt"
        title="Déposer votre"
        italicWord="production"
        subtitle="Retrouvez votre dossier à l’aide de votre code de référence et de votre adresse e-mail, puis envoyez votre texte, votre audio, votre vidéo ou votre document."
        patternVariant="green"
      />

      <section className="relative py-14 lg:py-20 bg-ucaep-paper paper-fiber overflow-hidden">
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
          className="hidden lg:block -bottom-24 -right-16 w-64 h-64 opacity-[0.08]"
        />
        <BrandPatternWave
          variant="green"
          tileWidth={170}
          opacity={0.085}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* ÉTAPE 1 : IDENTIFICATION */}
          {!sessionData ? (
            <form
              onSubmit={handleVerifyCandidate}
              className="p-6 sm:p-10 bg-white border border-ucaep-brown/15 rounded-sm space-y-6"
            >
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Étape 01 · Vérification
                </p>
                <h2 className="font-serif text-3xl font-semibold text-ucaep-brown">
                  Accéder à votre dossier
                </h2>
                <p className="text-sm text-ucaep-ink/75">
                  Pas besoin de créer de compte : utilisez simplement le code reçu lors de
                  votre inscription (ex. <span className="font-mono font-semibold">UCAEP-2026-0001</span>)
                  et votre adresse e-mail.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900 flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="depot-ref"
                    className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                  >
                    Code de référence *
                  </label>
                  <input
                    id="depot-ref"
                    type="text"
                    required
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
                    placeholder="UCAEP-2026-0001"
                    className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="depot-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                  >
                    E-mail d&apos;inscription *
                  </label>
                  <input
                    id="depot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@exemple.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors disabled:opacity-50"
                >
                  <span>
                    {authLoading ? 'Vérification en cours...' : 'Continuer vers le dépôt'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-ucaep-ink/65">
                  Pas encore inscrit ?{' '}
                  <Link
                    to="/inscription"
                    className="text-ucaep-brown font-semibold underline hover:text-ucaep-gold"
                  >
                    Remplir le formulaire
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* BANDEAU CANDIDAT IDENTIFIÉ */}
              <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                    Dossier vérifié
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                    {sessionData.candidate.firstName} {sessionData.candidate.lastName}
                  </h2>
                  <p className="text-xs text-ucaep-ink/70 tabular-nums">
                    Réf. <span className="font-mono font-semibold text-ucaep-brown">{sessionData.candidate.referenceCode}</span>
                    {' · '}
                    {sessionData.candidate.department} ({sessionData.candidate.studyLevel})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSessionData(null);
                    setSelectedFile(null);
                    setTextContent('');
                    setJustSubmitted(null);
                    setSubmitError('');
                  }}
                  className="text-xs font-medium text-ucaep-brown hover:text-ucaep-gold underline self-start sm:self-center"
                >
                  Changer de dossier
                </button>
              </div>

              {/* ÉTAPE 2 : SÉLECTION DE PHASE */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ucaep-brown/80">
                  Étape 02 · Choisissez la phase concernée
                </p>
                <div
                  role="radiogroup"
                  aria-label="Phases du concours"
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {sessionData.phases.map((phase) => {
                    const isSelected = phase.id === selectedPhaseId;
                    const disabled = !phase.acceptingNow && !phase.existingSubmission;
                    const deadlineStr = formatDeadline(phase.submissionDeadline);
                    const existingBadge = phase.existingSubmission
                      ? SUBMISSION_STATUS_BADGE[phase.existingSubmission.status]
                      : null;

                    return (
                      <button
                        key={phase.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled && !phase.existingSubmission}
                        onClick={() => setSelectedPhaseId(phase.id)}
                        className={`text-left p-5 rounded-sm border transition-all space-y-2.5 ${
                          isSelected
                            ? 'bg-white border-ucaep-gold ring-2 ring-ucaep-gold/30'
                            : phase.acceptingNow
                              ? 'bg-white border-ucaep-brown/20 hover:border-ucaep-brown/45'
                              : 'bg-ucaep-linen/50 border-ucaep-brown/12 opacity-70 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                          <span className="font-serif text-2xl font-semibold text-ucaep-gold leading-none">
                            {phase.number}
                          </span>
                          {phase.acceptingNow ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-ucaep-green/12 text-ucaep-green rounded-sm">
                              Dépôts ouverts
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ucaep-brown/60">
                              <Lock className="w-3 h-3" />
                              <span>{phase.format === 'En présentiel' ? 'Présentiel' : 'Fermé'}</span>
                            </span>
                          )}
                        </div>

                        <div className="font-serif text-xl font-semibold text-ucaep-brown">
                          {phase.title}
                        </div>

                        {deadlineStr && phase.acceptingNow && (
                          <p className="text-[11px] text-ucaep-ink/70 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-ucaep-gold shrink-0" />
                            <span>Jusqu&apos;au {deadlineStr}</span>
                          </p>
                        )}

                        {!phase.acceptingNow && phase.closedReason && (
                          <p className="text-[11px] text-ucaep-ink/65 leading-snug">
                            {phase.closedReason}
                          </p>
                        )}

                        {existingBadge && (
                          <div className="pt-1">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-semibold border rounded-sm ${existingBadge.className}`}
                            >
                              Dépôt : {existingBadge.label}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ÉTAPE 3 : DÉPÔT OU CONFIRMATION POUR LA PHASE SÉLECTIONNÉE */}
              {selectedPhase && (
                <div className="space-y-6">
                  {selectedPhase.isRevealed && selectedPhase.testDetails && (
                    <div className="p-5 bg-ucaep-linen/70 border border-ucaep-brown/15 rounded-sm space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-ucaep-green">
                        Consigne de la phase {selectedPhase.number}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                        {selectedPhase.testDetails.instructionsTitle}
                      </h3>
                      <p className="text-sm font-medium text-ucaep-ink">
                        Thème : {selectedPhase.testDetails.theme}
                      </p>
                      <p className="text-xs text-ucaep-ink/80 leading-relaxed">
                        {selectedPhase.testDetails.instructions}
                      </p>
                    </div>
                  )}

                  {/* DÉPÔT DÉJÀ REÇU / CONFIRMATION */}
                  {displayedSubmission && !replaceMode && (
                    <div
                      aria-live="polite"
                      className="p-6 sm:p-8 bg-white border border-ucaep-green/35 rounded-sm space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-ucaep-green shrink-0" />
                          <div>
                            <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                              {justSubmitted
                                ? 'Votre dépôt a bien été reçu'
                                : 'Dépôt enregistré pour cette phase'}
                            </h3>
                            <p className="text-xs text-ucaep-ink/65 tabular-nums">
                              Dernière mise à jour le {formatFrenchDate(displayedSubmission.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`self-start px-3 py-1 text-xs font-semibold border rounded-sm ${
                            SUBMISSION_STATUS_BADGE[displayedSubmission.status].className
                          }`}
                        >
                          {SUBMISSION_STATUS_BADGE[displayedSubmission.status].label}
                        </span>
                      </div>

                      <div className="p-4 bg-ucaep-paper border border-ucaep-brown/12 rounded-sm text-sm space-y-2">
                        {displayedSubmission.kind === 'file' ? (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileUp className="w-4 h-4 text-ucaep-brown shrink-0" />
                              <span className="font-medium text-ucaep-ink truncate">
                                {displayedSubmission.fileName || 'Fichier déposé'}
                              </span>
                            </div>
                            <span className="text-xs text-ucaep-ink/65 tabular-nums shrink-0">
                              {formatFileSize(displayedSubmission.sizeBytes)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-ucaep-brown/75">
                              Texte écrit envoyé
                            </p>
                            <p className="text-sm text-ucaep-ink/85 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                              {displayedSubmission.textContent || displayedSubmission.textExcerpt}
                            </p>
                          </div>
                        )}
                      </div>

                      {displayedSubmission.organizerNote && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-950">
                          <strong>Note de l&apos;équipe UCAEP :</strong>{' '}
                          {displayedSubmission.organizerNote}
                        </div>
                      )}

                      {selectedPhase.acceptingNow && (
                        <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-ucaep-ink/70">
                            Vous pouvez encore modifier ou remplacer ce dépôt tant que la
                            phase reste ouverte.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceMode(true);
                              setJustSubmitted(null);
                              setSubmitError('');
                              setUploadProgress(null);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Remplacer mon dépôt</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FORMULAIRE DE DÉPÔT */}
                  {selectedPhase.acceptingNow && (!displayedSubmission || replaceMode) && (
                    <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                            Étape 03 · Envoi de votre production
                          </p>
                          <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                            Phase {selectedPhase.number} — {selectedPhase.title}
                          </h3>
                        </div>

                        {displayedSubmission && (
                          <button
                            type="button"
                            onClick={() => setReplaceMode(false)}
                            className="text-xs font-medium text-ucaep-brown/75 hover:text-ucaep-brown underline self-start sm:self-center"
                          >
                            Annuler le remplacement
                          </button>
                        )}
                      </div>

                      {/* Onglets Fichier / Texte */}
                      <div
                        role="tablist"
                        aria-label="Mode de dépôt"
                        className="inline-flex p-1 bg-ucaep-linen/70 border border-ucaep-brown/15 rounded-sm gap-1"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeKind === 'file'}
                          onClick={() => {
                            setActiveKind('file');
                            setSubmitError('');
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm transition-colors ${
                            activeKind === 'file'
                              ? 'bg-ucaep-brown text-ucaep-paper'
                              : 'text-ucaep-brown hover:bg-white/70'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Envoyer un fichier</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeKind === 'text'}
                          onClick={() => {
                            setActiveKind('text');
                            setSubmitError('');
                            setFileError('');
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm transition-colors ${
                            activeKind === 'text'
                              ? 'bg-ucaep-brown text-ucaep-paper'
                              : 'text-ucaep-brown hover:bg-white/70'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Écrire mon texte</span>
                        </button>
                      </div>

                      {submitError && (
                        <div
                          role="alert"
                          className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900 flex items-start gap-3"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p>{submitError}</p>
                            <p className="text-xs text-red-800/80">
                              Votre fichier ou votre texte est toujours prêt ci-dessous :
                              corrigez si besoin et relancez l&apos;envoi.
                            </p>
                          </div>
                        </div>
                      )}

                      {activeKind === 'file' ? (
                        <div className="space-y-5">
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
                              isDragging
                                ? 'border-ucaep-gold bg-ucaep-ivory/40'
                                : 'border-ucaep-brown/25 bg-ucaep-paper/60 hover:border-ucaep-brown/45'
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              id="depot-file-input"
                              type="file"
                              accept={ACCEPT_ATTRIBUTE}
                              onChange={(e) =>
                                handleFileSelection(e.target.files?.[0] || null)
                              }
                              className="sr-only"
                            />
                            <Upload
                              className="w-7 h-7 mx-auto text-ucaep-brown/60 mb-3"
                              aria-hidden="true"
                            />
                            <p className="text-sm font-medium text-ucaep-brown">
                              Glissez votre fichier ici ou{' '}
                              <label
                                htmlFor="depot-file-input"
                                className="text-ucaep-green font-semibold underline cursor-pointer hover:text-ucaep-gold"
                              >
                                choisissez-le sur votre appareil
                              </label>
                            </p>
                            <p className="mt-2 text-xs text-ucaep-ink/65">
                              Vidéo (MP4, MOV, WebM) · Audio (MP3, M4A, WAV, OGG) · Document (PDF, DOCX, DOC)
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-ucaep-brown/75">
                              Taille maximale : 50 Mo (conseil vidéo : exportez en MP4 720p).
                            </p>
                          </div>

                          {fileError && (
                            <div
                              role="alert"
                              className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900 flex items-start gap-3"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{fileError}</span>
                            </div>
                          )}

                          {selectedFile && (
                            <div className="p-4 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-sm flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-ucaep-brown truncate">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-ucaep-ink/70 tabular-nums">
                                  {formatFileSize(selectedFile.size)}
                                </p>
                              </div>
                              {!submitLoading && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }}
                                  aria-label="Retirer ce fichier"
                                  className="p-1.5 text-ucaep-brown/70 hover:text-red-800 rounded-sm"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}

                          {uploadProgress !== null && (
                            <div className="space-y-1.5" aria-live="polite">
                              <div className="flex items-center justify-between text-xs font-medium text-ucaep-brown tabular-nums">
                                <span>
                                  {uploadProgress < 100
                                    ? 'Envoi sécurisé vers le stockage...'
                                    : 'Finalisation du dépôt...'}
                                </span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div
                                role="progressbar"
                                aria-valuenow={uploadProgress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="w-full h-2.5 bg-ucaep-linen rounded-sm overflow-hidden border border-ucaep-brown/15"
                              >
                                <div
                                  className="h-full bg-ucaep-green transition-all duration-150"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={!selectedFile || submitLoading || !uploadReady}
                            onClick={handleSubmitFile}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-45"
                          >
                            <span>
                              {submitLoading
                                ? 'Envoi en cours...'
                                : displayedSubmission
                                  ? 'Remplacer avec ce fichier'
                                  : 'Envoyer mon fichier'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitText} className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <label
                                htmlFor="depot-text-area"
                                className="font-semibold uppercase tracking-wider text-ucaep-brown"
                              >
                                Votre texte *
                              </label>
                              <span className="tabular-nums text-ucaep-ink/65">
                                {textContent.length.toLocaleString('fr-FR')} /{' '}
                                {MAX_TEXT_SUBMISSION_LENGTH.toLocaleString('fr-FR')} caractères
                              </span>
                            </div>
                            <textarea
                              id="depot-text-area"
                              rows={10}
                              required
                              maxLength={MAX_TEXT_SUBMISSION_LENGTH}
                              value={textContent}
                              onChange={(e) => setTextContent(e.target.value)}
                              placeholder="Rédigez ou collez votre texte ici..."
                              className="w-full px-4 py-3 text-sm leading-relaxed border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submitLoading || !textContent.trim()}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-45"
                          >
                            <span>
                              {submitLoading
                                ? 'Enregistrement en cours...'
                                : displayedSubmission
                                  ? 'Mettre à jour mon texte'
                                  : 'Envoyer mon texte'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {!selectedPhase.acceptingNow && !displayedSubmission && (
                    <div className="p-6 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/75">
                      {selectedPhase.closedReason ||
                        'Les dépôts ne sont pas ouverts pour cette phase.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
