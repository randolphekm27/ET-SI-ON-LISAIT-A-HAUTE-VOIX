import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  FileUp,
  Lock,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { fetchApiJson } from '../lib/api';
import {
  getCandidateSession,
  saveCandidateSession,
} from '../lib/candidate-session';
import { formatFrenchDate } from '../lib/format';
import {
  ACCEPT_ATTRIBUTE,
  MAX_TEXT_SUBMISSION_LENGTH,
  formatFileSize,
  getPhaseTextSlotLabels,
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
  { label: string; className: string; pillClass: string }
> = {
  received: {
    label: 'Reçu · En attente de validation',
    className: 'text-amber-800',
    pillClass: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  validated: {
    label: 'Validé par le jury',
    className: 'text-ucaep-green',
    pillClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  rejected: {
    label: 'À reprendre',
    className: 'text-red-800',
    pillClass: 'bg-red-50 text-red-900 border-red-300',
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

interface DepotSubmissionPanelProps {
  /** Si renseigné (mode page unique centrée sur une phase), verrouille l'espace sur cette phase uniquement */
  lockedPhaseId?: string;
  /** Masque le lien vers /inscription lorsque les inscriptions sont clôturées en mode phase unique */
  hideRegistrationHint?: boolean;
}

export function DepotSubmissionPanel({
  lockedPhaseId,
  hideRegistrationHint = false,
}: DepotSubmissionPanelProps) {
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
  const [selectedPhaseId, setSelectedPhaseId] = useState(lockedPhaseId || '');
  const [activeKind, setActiveKind] = useState<SubmissionKind>('text');
  const [replaceFileMode, setReplaceFileMode] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validatedMime, setValidatedMime] = useState<string>('');
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileSubmitLoading, setFileSubmitLoading] = useState(false);
  const [fileSubmitError, setFileSubmitError] = useState('');
  const [fileJustSubmitted, setFileJustSubmitted] =
    useState<CandidateSubmissionSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dual-Text submission state (Texte 1 & Texte 2)
  const [text1Draft, setText1Draft] = useState('');
  const [text2Draft, setText2Draft] = useState('');
  const [editingSlot1, setEditingSlot1] = useState(true);
  const [editingSlot2, setEditingSlot2] = useState(true);
  const [slot1Loading, setSlot1Loading] = useState(false);
  const [slot2Loading, setSlot2Loading] = useState(false);
  const [slot1Error, setSlot1Error] = useState('');
  const [slot2Error, setSlot2Error] = useState('');
  const [slot1Success, setSlot1Success] = useState('');
  const [slot2Success, setSlot2Success] = useState('');

  useEffect(() => {
    if (lockedPhaseId) {
      setSelectedPhaseId(lockedPhaseId);
    }
  }, [lockedPhaseId]);

  const selectedPhase = useMemo(
    () =>
      sessionData?.phases.find((p) => p.id === (lockedPhaseId || selectedPhaseId)) ||
      null,
    [sessionData, selectedPhaseId, lockedPhaseId],
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
    setFileSubmitError('');
    setFileError('');
    setUploadProgress(null);
    setFileJustSubmitted(null);
    setSlot1Error('');
    setSlot2Error('');
    setSlot1Success('');
    setSlot2Success('');

    const sub = selectedPhase.existingSubmission;
    const hasGoogleForm = Boolean(
      selectedPhase.externalForm?.enabled && selectedPhase.externalForm?.googleFormUrl,
    );

    if (sub) {
      if (sub.kind === 'text') {
        setActiveKind('text');
        const t1 = sub.text1Content || '';
        const t2 = sub.text2Content || '';
        setText1Draft(t1);
        setText2Draft(t2);
        setEditingSlot1(!t1.trim());
        setEditingSlot2(!t2.trim());
      } else {
        setActiveKind(hasGoogleForm ? 'text' : 'file');
        setReplaceFileMode(false);
        setText1Draft('');
        setText2Draft('');
        setEditingSlot1(true);
        setEditingSlot2(true);
      }
    } else {
      setActiveKind('text');
      setReplaceFileMode(true);
      setText1Draft('');
      setText2Draft('');
      setEditingSlot1(true);
      setEditingSlot2(true);
    }
  }, [selectedPhase?.id]);

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
    const targetPhaseId = lockedPhaseId || selectedPhaseId;
    const matchedPhase = res.phases.find((p) => p.id === targetPhaseId);
    if (lockedPhaseId) {
      setSelectedPhaseId(lockedPhaseId);
    } else if (!selectedPhaseId || !matchedPhase) {
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
    setFileSubmitError('');
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
    if (
      selectedPhase.existingSubmission?.kind === 'file' &&
      selectedPhase.existingSubmission.status === 'validated'
    ) {
      setFileSubmitError(
        'Votre dépôt a déjà été validé par le jury : la resoumission est désactivée.',
      );
      return;
    }
    if (!selectedFile) {
      setFileError('Choisissez d’abord un fichier à envoyer.');
      return;
    }

    const check = validateSubmissionFileClient(selectedFile);
    if (check.ok === false) {
      setFileError(check.error);
      return;
    }

    setFileSubmitLoading(true);
    setFileSubmitError('');
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

      setFileJustSubmitted(done.submission);
      setReplaceFileMode(false);
      setSelectedFile(null);
      setUploadProgress(100);
      await refreshCandidateStatus(sessionData.candidate.referenceCode, email);
    } catch (err) {
      setUploadProgress(null);
      setFileSubmitError(
        err instanceof Error
          ? err.message
          : 'L’envoi a été interrompu. Votre sélection est conservée : vous pouvez réessayer.',
      );
    } finally {
      setFileSubmitLoading(false);
    }
  }

  async function handleSubmitTextSlot(slot: 1 | 2, e: FormEvent) {
    e.preventDefault();
    if (!sessionData || !selectedPhase || !selectedPhase.acceptingNow) return;

    const rawDraft = slot === 1 ? text1Draft : text2Draft;
    const cleanText = rawDraft.trim();
    const setErr = slot === 1 ? setSlot1Error : setSlot2Error;
    const setOk = slot === 1 ? setSlot1Success : setSlot2Success;
    const setLoading = slot === 1 ? setSlot1Loading : setSlot2Loading;
    const setEditing = slot === 1 ? setEditingSlot1 : setEditingSlot2;

    setErr('');
    setOk('');

    const existingSub = selectedPhase.existingSubmission;
    const slotStatus =
      slot === 1 ? existingSub?.text1Status : existingSub?.text2Status;
    if (existingSub?.kind === 'text' && slotStatus === 'validated') {
      setErr(
        `Le Texte ${slot} a déjà été validé par le jury : la resoumission est désactivée.`,
      );
      return;
    }

    if (!cleanText) {
      setErr(`Écrivez votre Texte ${slot} avant de valider l’envoi.`);
      return;
    }
    if (cleanText.length > MAX_TEXT_SUBMISSION_LENGTH) {
      setErr(
        `Votre Texte ${slot} dépasse la limite de ${MAX_TEXT_SUBMISSION_LENGTH.toLocaleString('fr-FR')} caractères.`,
      );
      return;
    }

    setLoading(true);
    try {
      await fetchApiJson('/api/submissions/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: sessionData.candidate.referenceCode,
          email,
          phaseId: selectedPhase.id,
          kind: 'text',
          textSlot: slot,
        }),
      });

      await fetchApiJson<{
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
          textSlot: slot,
          textContent: cleanText,
        }),
      });

      setEditing(false);
      setOk(`Texte ${slot} enregistré avec succès.`);
      await refreshCandidateStatus(sessionData.candidate.referenceCode, email);
    } catch (err) {
      setErr(
        err instanceof Error
          ? err.message
          : `Impossible d’enregistrer le Texte ${slot}. Vos mots sont conservés, réessayez.`,
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopyRef(code: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2200);
    }
  }

  const displayedFileSubmission =
    fileJustSubmitted ||
    (selectedPhase?.existingSubmission?.kind === 'file'
      ? selectedPhase.existingSubmission
      : null);

  const hasGoogleForm = Boolean(
    selectedPhase?.externalForm?.enabled &&
      selectedPhase?.externalForm?.googleFormUrl,
  );

  const slotLabels =
    selectedPhase && selectedPhase.isRevealed
      ? getPhaseTextSlotLabels(selectedPhase.id)
      : getPhaseTextSlotLabels('hidden');

  const textSub =
    selectedPhase?.existingSubmission?.kind === 'text'
      ? selectedPhase.existingSubmission
      : null;
  const submittedText1 = (textSub?.text1Content || '').trim();
  const submittedText2 = (textSub?.text2Content || '').trim();
  const text1Status: SubmissionStatus | null = submittedText1
    ? textSub?.text1Status || textSub?.status || 'received'
    : null;
  const text2Status: SubmissionStatus | null = submittedText2
    ? textSub?.text2Status || 'received'
    : null;
  const isText1Locked = text1Status === 'validated';
  const isText2Locked = text2Status === 'validated';
  const isFileLocked = displayedFileSubmission?.status === 'validated';

  function renderTextSlotCard(slot: 1 | 2) {
    if (!selectedPhase) return null;
    const isSlot1 = slot === 1;
    const title = isSlot1 ? slotLabels.slot1Title : slotLabels.slot2Title;
    const subtitle = isSlot1 ? slotLabels.slot1Subtitle : slotLabels.slot2Subtitle;
    const submittedText = isSlot1 ? submittedText1 : submittedText2;
    const slotStatus = isSlot1 ? text1Status : text2Status;
    const slotNote = isSlot1 ? textSub?.text1Note : textSub?.text2Note;
    const isLocked = isSlot1 ? isText1Locked : isText2Locked;
    const draft = isSlot1 ? text1Draft : text2Draft;
    const setDraft = isSlot1 ? setText1Draft : setText2Draft;
    const editing = isSlot1 ? editingSlot1 : editingSlot2;
    const setEditing = isSlot1 ? setEditingSlot1 : setEditingSlot2;
    const loading = isSlot1 ? slot1Loading : slot2Loading;
    const errMsg = isSlot1 ? slot1Error : slot2Error;
    const okMsg = isSlot1 ? slot1Success : slot2Success;

    const statusMeta = slotStatus ? SUBMISSION_STATUS_BADGE[slotStatus] : null;
    const showEditor =
      selectedPhase.acceptingNow && !isLocked && (!submittedText || editing);

    return (
      <div
        key={`text-slot-${slot}`}
        className={`p-5 sm:p-6 bg-white border rounded-sm space-y-4 ${
          isLocked
            ? 'border-ucaep-green/45 bg-emerald-50/15'
            : 'border-ucaep-brown/15'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-ucaep-brown/10 pb-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
              Production écrite · 0{slot}
            </span>
            <h4 className="font-serif text-xl font-semibold text-ucaep-brown">
              {title}
            </h4>
            <p className="text-xs text-ucaep-ink/65">{subtitle}</p>
          </div>

          {statusMeta ? (
            <span
              className={`self-start shrink-0 px-2.5 py-1 text-[11px] font-semibold border rounded-sm ${statusMeta.pillClass}`}
            >
              {statusMeta.label}
            </span>
          ) : (
            <span className="self-start shrink-0 px-2.5 py-1 text-[11px] font-medium border border-ucaep-brown/20 bg-ucaep-paper text-ucaep-ink/65 rounded-sm">
              Non soumis
            </span>
          )}
        </div>

        {okMsg && (
          <div
            role="status"
            className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-emerald-950 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0" />
            <span>{okMsg}</span>
          </div>
        )}

        {errMsg && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-300 rounded-sm text-xs text-red-900 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errMsg}</span>
          </div>
        )}

        {submittedText && (!editing || isLocked || !selectedPhase.acceptingNow) && (
          <div className="space-y-3">
            <div className="p-4 bg-ucaep-paper border border-ucaep-brown/12 rounded-sm">
              <p className="text-sm text-ucaep-ink/85 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {submittedText}
              </p>
            </div>

            {slotNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-950">
                <strong>Observation du jury (Texte {slot}) :</strong> {slotNote}
              </div>
            )}

            {isLocked ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-ucaep-green font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Validé par le jury : votre Texte {slot} est définitivement
                    verrouillé.
                  </span>
                </p>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/20 bg-ucaep-linen/70 text-ucaep-ink/50 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Resoumission désactivée (Validé)</span>
                </button>
              </div>
            ) : selectedPhase.acceptingNow ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-ucaep-ink/65">
                  {slotStatus === 'rejected'
                    ? 'Le jury demande une reprise de ce texte. Modifiez-le puis renvoyez-le.'
                    : 'Vous pouvez modifier ce texte tant que le jury ne l’a pas encore validé.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(submittedText);
                    setEditing(true);
                    isSlot1 ? setSlot1Success('') : setSlot2Success('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Remplacer / Mettre à jour</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {showEditor && (
          <form onSubmit={(e) => handleSubmitTextSlot(slot, e)} className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`depot-text-area-${slot}`}
                  className="font-semibold uppercase tracking-wider text-ucaep-brown"
                >
                  Rédaction — Texte {slot} *
                </label>
                <span className="tabular-nums text-ucaep-ink/65">
                  {draft.length.toLocaleString('fr-FR')} /{' '}
                  {MAX_TEXT_SUBMISSION_LENGTH.toLocaleString('fr-FR')} caractères
                </span>
              </div>
              <textarea
                id={`depot-text-area-${slot}`}
                rows={8}
                required
                maxLength={MAX_TEXT_SUBMISSION_LENGTH}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Rédigez ou collez ici votre Texte ${slot} (${title})...`}
                className="w-full px-4 py-3 text-sm leading-relaxed border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-45"
              >
                <span>
                  {loading
                    ? 'Enregistrement...'
                    : submittedText
                      ? `Mettre à jour le Texte ${slot}`
                      : `Soumettre le Texte ${slot}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {submittedText && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setEditing(false);
                    setDraft(submittedText);
                  }}
                  className="px-4 py-2.5 text-xs font-medium text-ucaep-brown/80 hover:text-ucaep-brown underline"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        )}

        {!submittedText && !selectedPhase.acceptingNow && (
          <p className="text-xs text-ucaep-ink/65 italic">
            Aucun Texte {slot} soumis et les dépôts ne sont pas ouverts pour cette phase.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ÉTAPE 1 : IDENTIFICATION */}
      {!sessionData ? (
        <form
          onSubmit={handleVerifyCandidate}
          className="p-6 sm:p-10 bg-white border border-ucaep-brown/15 rounded-sm space-y-6"
        >
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
              Identification candidat
            </p>
            <h3 className="font-serif text-3xl font-semibold text-ucaep-brown">
              Accéder à votre espace de dépôt
            </h3>
            <p className="text-sm text-ucaep-ink/75">
              Identifiez-vous à l’aide du code d’anonymat reçu lors de votre inscription
              (ex. <span className="font-mono font-semibold">UCAEP-2026-0001</span>) et
              de l’adresse e-mail associée à votre dossier.
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
            {!hideRegistrationHint && (
              <p className="text-xs text-ucaep-ink/65">
                Étudiant(e) à l&apos;ENSET de Lokossa pas encore inscrit(e) ?{' '}
                <Link
                  to="/inscription"
                  className="text-ucaep-brown font-semibold underline hover:text-ucaep-gold"
                >
                  Accéder au formulaire d&apos;inscription
                </Link>
              </p>
            )}
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
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                {sessionData.candidate.firstName} {sessionData.candidate.lastName}
              </h3>
              <p className="text-xs text-ucaep-ink/70 tabular-nums">
                Réf.{' '}
                <span className="font-mono font-semibold text-ucaep-brown">
                  {sessionData.candidate.referenceCode}
                </span>
                {' · '}
                {sessionData.candidate.department} ({sessionData.candidate.studyLevel})
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSessionData(null);
                setSelectedFile(null);
                setText1Draft('');
                setText2Draft('');
                setFileJustSubmitted(null);
                setFileSubmitError('');
              }}
              className="text-xs font-medium text-ucaep-brown hover:text-ucaep-gold underline self-start sm:self-center"
            >
              Changer de dossier
            </button>
          </div>

          {/* SÉLECTION DE PHASE (masquée si lockedPhaseId est défini pour rester focalisé) */}
          {!lockedPhaseId && (
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
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-ucaep-green">
                            · Dépôts ouverts
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ucaep-brown/60">
                            <Lock className="w-3 h-3" />
                            <span>
                              {phase.format === 'En présentiel' ? 'Présentiel' : 'Fermé'}
                            </span>
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
                        <div className="pt-1 border-t border-ucaep-brown/10">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wider ${existingBadge.className}`}
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
          )}

          {/* ÉTAPE 3 : DÉPÔT POUR LA PHASE SÉLECTIONNÉE */}
          {selectedPhase && (
            <div className="space-y-6">
              {!lockedPhaseId && selectedPhase.isRevealed && selectedPhase.testDetails && (
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

              {!selectedPhase.acceptingNow &&
                !selectedPhase.existingSubmission &&
                selectedPhase.format !== 'En présentiel' && (
                  <div className="p-6 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/75">
                    {selectedPhase.closedReason ||
                      'Les dépôts ne sont pas ouverts pour cette phase.'}
                  </div>
                )}

              {selectedPhase.format === 'En présentiel' && (
                <div className="p-6 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/80">
                  {selectedPhase.closedReason ||
                    'Épreuve en présentiel sur le campus : aucun dépôt en ligne n’est demandé.'}
                </div>
              )}

              {/* CAS 1 : GOOGLE FORM ACTIVÉ PAR L'ORGANISATEUR POUR LES VIDÉOS / FICHIERS */}
              {selectedPhase.format !== 'En présentiel' && hasGoogleForm && (
                <div className="space-y-6">
                  {selectedPhase.acceptingNow && (
                    <div className="p-6 sm:p-8 bg-white border-2 border-ucaep-gold/45 rounded-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                            Envoi des vidéos &amp; fichiers · Google Form officiel
                          </p>
                          <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                            Déposer vos vidéos d&apos;interprétation
                          </h3>
                        </div>
                        <span className="self-start px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#F7E6C8]/65 text-ucaep-brown rounded-sm">
                          Lien actif
                        </span>
                      </div>

                      <p className="text-sm text-ucaep-ink/80 leading-relaxed">
                        {selectedPhase.externalForm?.instructions ||
                          'Pour cette phase, l’envoi de vos vidéos de lecture et pièces jointes s’effectue exclusivement via le formulaire Google Form officiel ci-dessous. Renseignez-y exactement votre code d’anonymat UCAEP.'}
                      </p>

                      <div className="p-4 bg-ucaep-paper border border-ucaep-brown/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown/75">
                            Votre code d&apos;anonymat à indiquer dans le Google Form
                          </p>
                          <p className="font-mono text-lg font-bold text-ucaep-brown">
                            {sessionData.candidate.referenceCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(sessionData.candidate.referenceCode)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-ivory/40 transition-colors self-start sm:self-center"
                        >
                          {copiedRef ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-ucaep-green" />
                              <span>Code copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier mon code</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-1">
                        <a
                          href={selectedPhase.externalForm!.googleFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors"
                        >
                          <span>Ouvrir le formulaire Google Form de soumission</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {(selectedPhase.acceptingNow || textSub) && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                          Épreuves écrites · Phase {selectedPhase.number}
                        </p>
                        <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                          Soumettre vos deux textes (Texte 1 et Texte 2)
                        </h3>
                        <p className="text-xs text-ucaep-ink/70 leading-relaxed">
                          Déposez ci-dessous le texte intégral de chacune des deux épreuves.
                          Une fois qu&apos;un texte est validé par le jury, sa modification
                          est automatiquement verrouillée.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {renderTextSlotCard(1)}
                        {renderTextSlotCard(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CAS 2 : GOOGLE FORM NON ACTIVÉ — TEXTES (T1 & T2) OU FICHIER SUPABASE */}
              {selectedPhase.format !== 'En présentiel' &&
                !hasGoogleForm &&
                (selectedPhase.acceptingNow || selectedPhase.existingSubmission) && (
                  <div className="space-y-6">
                    {/* Onglets Textes vs Fichier */}
                    {selectedPhase.acceptingNow && (
                      <div
                        role="tablist"
                        aria-label="Mode de dépôt"
                        className="inline-flex p-1 bg-ucaep-linen/70 border border-ucaep-brown/15 rounded-sm gap-1"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeKind === 'text'}
                          onClick={() => {
                            setActiveKind('text');
                            setFileSubmitError('');
                            setFileError('');
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm transition-colors ${
                            activeKind === 'text'
                              ? 'bg-ucaep-brown text-ucaep-paper'
                              : 'text-ucaep-brown hover:bg-white/70'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Mes textes (Texte 1 &amp; Texte 2)</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeKind === 'file'}
                          onClick={() => {
                            setActiveKind('file');
                            setFileSubmitError('');
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
                      </div>
                    )}

                    {/* Vue Textes (Texte 1 & Texte 2) */}
                    {(activeKind === 'text' || textSub) && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-5">
                          {renderTextSlotCard(1)}
                          {renderTextSlotCard(2)}
                        </div>
                      </div>
                    )}

                    {/* Vue Fichier Supabase */}
                    {(activeKind === 'file' || displayedFileSubmission) && (
                      <div className="space-y-5">
                        {displayedFileSubmission && !replaceFileMode && (
                          <div
                            aria-live="polite"
                            className="p-6 sm:p-8 bg-white border border-ucaep-green/35 rounded-sm space-y-5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-ucaep-green shrink-0" />
                                <div>
                                  <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                                    {fileJustSubmitted
                                      ? 'Votre fichier a bien été reçu'
                                      : 'Fichier enregistré pour cette phase'}
                                  </h3>
                                  <p className="text-xs text-ucaep-ink/65 tabular-nums">
                                    Dernière mise à jour le{' '}
                                    {formatFrenchDate(displayedFileSubmission.updatedAt)}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`self-start px-2.5 py-1 text-xs font-semibold border rounded-sm ${
                                  SUBMISSION_STATUS_BADGE[displayedFileSubmission.status]
                                    .pillClass
                                }`}
                              >
                                {
                                  SUBMISSION_STATUS_BADGE[displayedFileSubmission.status]
                                    .label
                                }
                              </span>
                            </div>

                            <div className="p-4 bg-ucaep-paper border border-ucaep-brown/12 rounded-sm text-sm">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileUp className="w-4 h-4 text-ucaep-brown shrink-0" />
                                  <span className="font-medium text-ucaep-ink truncate">
                                    {displayedFileSubmission.fileName || 'Fichier déposé'}
                                  </span>
                                </div>
                                <span className="text-xs text-ucaep-ink/65 tabular-nums shrink-0">
                                  {formatFileSize(displayedFileSubmission.sizeBytes)}
                                </span>
                              </div>
                            </div>

                            {displayedFileSubmission.organizerNote && (
                              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-950">
                                <strong>Note de l&apos;équipe UCAEP :</strong>{' '}
                                {displayedFileSubmission.organizerNote}
                              </div>
                            )}

                            {selectedPhase.acceptingNow && (
                              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                                {isFileLocked ? (
                                  <>
                                    <p className="text-xs text-ucaep-green font-medium flex items-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>
                                        Dépôt validé par le jury : la resoumission est
                                        désactivée.
                                      </span>
                                    </p>
                                    <button
                                      type="button"
                                      disabled
                                      aria-disabled="true"
                                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/20 bg-ucaep-linen/70 text-ucaep-ink/50 cursor-not-allowed"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Resoumission désactivée (Validé)</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs text-ucaep-ink/70">
                                      Vous pouvez encore remplacer ce fichier tant que le
                                      jury ne l&apos;a pas validé.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplaceFileMode(true);
                                        setFileJustSubmitted(null);
                                        setFileSubmitError('');
                                        setUploadProgress(null);
                                      }}
                                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      <span>Remplacer mon dépôt</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {activeKind === 'file' &&
                          selectedPhase.acceptingNow &&
                          !isFileLocked &&
                          (!displayedFileSubmission || replaceFileMode) && (
                            <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                                    Envoi de fichier
                                  </p>
                                  <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                                    Phase {selectedPhase.number} — {selectedPhase.title}
                                  </h3>
                                </div>
                                {displayedFileSubmission && (
                                  <button
                                    type="button"
                                    onClick={() => setReplaceFileMode(false)}
                                    className="text-xs font-medium text-ucaep-brown/75 hover:text-ucaep-brown underline self-start sm:self-center"
                                  >
                                    Annuler le remplacement
                                  </button>
                                )}
                              </div>

                              {fileSubmitError && (
                                <div
                                  role="alert"
                                  className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900 flex items-start gap-3"
                                >
                                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                  <span>{fileSubmitError}</span>
                                </div>
                              )}

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
                                  Vidéo (MP4, MOV, WebM) · Audio (MP3, M4A, WAV, OGG) ·
                                  Document (PDF, DOCX, DOC)
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-ucaep-brown/75">
                                  Taille maximale : 50 Mo (conseil vidéo : exportez en
                                  MP4 720p).
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
                                  {!fileSubmitLoading && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFile(null);
                                        if (fileInputRef.current)
                                          fileInputRef.current.value = '';
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
                                disabled={
                                  !selectedFile || fileSubmitLoading || !uploadReady
                                }
                                onClick={handleSubmitFile}
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-45"
                              >
                                <span>
                                  {fileSubmitLoading
                                    ? 'Envoi en cours...'
                                    : displayedFileSubmission
                                      ? 'Remplacer avec ce fichier'
                                      : 'Envoyer mon fichier'}
                                </span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
