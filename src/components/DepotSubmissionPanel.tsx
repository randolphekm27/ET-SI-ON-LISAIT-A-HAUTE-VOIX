import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Lock,
  RefreshCw,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { fetchApiJson } from '../lib/api';
import { CandidateProgressCard } from './CandidateProgressCard';
import {
  getCandidateSession,
  saveCandidateSession,
} from '../lib/candidate-session';
import { formatFrenchDate } from '../lib/format';
import { EDITORIAL_EASE, TACTILE_SPRING } from '../lib/motion';
import { useSiteConfig } from '../lib/site-config';
import {
  MAX_TEXT_SUBMISSION_LENGTH,
  VIDEO_ACCEPT_ATTRIBUTE,
  findGluedTextIssue,
  formatFileSize,
  getPhaseTextSlotLabels,
  getPhaseVideoSlotLabels,
  validateSubmissionFileClient,
} from '../lib/submissions-config';
import { uploadFileToSignedStorageUrl } from '../lib/supabase';
import type {
  CandidateSubmissionSummary,
  PublicVideoSlotSummary,
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
  const { activePhase } = useSiteConfig();
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
  const [copiedRef, setCopiedRef] = useState(false);

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

  // Dual-Video upload state (Vidéo 1 & Vidéo 2)
  const [selectedVideo1, setSelectedVideo1] = useState<File | null>(null);
  const [selectedVideo2, setSelectedVideo2] = useState<File | null>(null);
  const [mimeVideo1, setMimeVideo1] = useState('');
  const [mimeVideo2, setMimeVideo2] = useState('');
  const [video1Error, setVideo1Error] = useState('');
  const [video2Error, setVideo2Error] = useState('');
  const [video1Dragging, setVideo1Dragging] = useState(false);
  const [video2Dragging, setVideo2Dragging] = useState(false);
  const [video1Progress, setVideo1Progress] = useState<number | null>(null);
  const [video2Progress, setVideo2Progress] = useState<number | null>(null);
  const [video1Loading, setVideo1Loading] = useState(false);
  const [video2Loading, setVideo2Loading] = useState(false);
  const [video1SubmitError, setVideo1SubmitError] = useState('');
  const [video2SubmitError, setVideo2SubmitError] = useState('');
  const [video1Success, setVideo1Success] = useState('');
  const [video2Success, setVideo2Success] = useState('');
  const [replaceVideo1Mode, setReplaceVideo1Mode] = useState(false);
  const [replaceVideo2Mode, setReplaceVideo2Mode] = useState(false);
  const video1InputRef = useRef<HTMLInputElement>(null);
  const video2InputRef = useRef<HTMLInputElement>(null);

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
    setSlot1Error('');
    setSlot2Error('');
    setSlot1Success('');
    setSlot2Success('');
    setSelectedVideo1(null);
    setSelectedVideo2(null);
    setVideo1Error('');
    setVideo2Error('');
    setVideo1SubmitError('');
    setVideo2SubmitError('');
    setVideo1Success('');
    setVideo2Success('');
    setVideo1Progress(null);
    setVideo2Progress(null);

    const sub = selectedPhase.existingSubmission;
    const t1 = (sub?.text1Content || '').trim();
    const t2 = (sub?.text2Content || '').trim();
    setText1Draft(t1);
    setText2Draft(t2);
    setEditingSlot1(!t1);
    setEditingSlot2(!t2);
    setReplaceVideo1Mode(!sub?.video1);
    setReplaceVideo2Mode(!sub?.video2);
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

  function handleVideoSelection(slot: 1 | 2, file: File | null) {
    const setErr = slot === 1 ? setVideo1Error : setVideo2Error;
    const setSubmitErr = slot === 1 ? setVideo1SubmitError : setVideo2SubmitError;
    const setFile = slot === 1 ? setSelectedVideo1 : setSelectedVideo2;
    const setMime = slot === 1 ? setMimeVideo1 : setMimeVideo2;

    setErr('');
    setSubmitErr('');
    if (!file) {
      setFile(null);
      setMime('');
      return;
    }

    const check = validateSubmissionFileClient(file, { videoOnly: true });
    if (check.ok === false) {
      setFile(null);
      setMime('');
      setErr(check.error);
      return;
    }

    setFile(file);
    setMime(check.mimeType);
  }

  function handleVideoDrop(slot: 1 | 2, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (slot === 1) setVideo1Dragging(false);
    else setVideo2Dragging(false);
    const dropped = e.dataTransfer.files?.[0] || null;
    handleVideoSelection(slot, dropped);
  }

  async function handleSubmitVideoSlot(slot: 1 | 2) {
    if (!sessionData || !selectedPhase || !selectedPhase.acceptingNow) return;

    const existingVideo =
      slot === 1
        ? selectedPhase.existingSubmission?.video1
        : selectedPhase.existingSubmission?.video2;
    const selectedFile = slot === 1 ? selectedVideo1 : selectedVideo2;
    const validatedMime = slot === 1 ? mimeVideo1 : mimeVideo2;

    const setErr = slot === 1 ? setVideo1Error : setVideo2Error;
    const setSubmitErr = slot === 1 ? setVideo1SubmitError : setVideo2SubmitError;
    const setOk = slot === 1 ? setVideo1Success : setVideo2Success;
    const setLoading = slot === 1 ? setVideo1Loading : setVideo2Loading;
    const setProgress = slot === 1 ? setVideo1Progress : setVideo2Progress;
    const setSelected = slot === 1 ? setSelectedVideo1 : setSelectedVideo2;
    const setReplace = slot === 1 ? setReplaceVideo1Mode : setReplaceVideo2Mode;
    const inputRef = slot === 1 ? video1InputRef : video2InputRef;

    setErr('');
    setSubmitErr('');
    setOk('');

    if (existingVideo?.status === 'validated') {
      setSubmitErr(
        `Votre Vidéo ${slot} a déjà été validée par le jury : la resoumission est désactivée.`,
      );
      return;
    }

    if (!selectedFile) {
      setErr(`Choisissez d’abord votre Vidéo ${slot} (MP4, MOV ou WebM, max 100 Mo).`);
      return;
    }

    const check = validateSubmissionFileClient(selectedFile, { videoOnly: true });
    if (check.ok === false) {
      setErr(check.error);
      return;
    }

    setLoading(true);
    setProgress(2);

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
          videoSlot: slot,
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
        onProgress: (pct) => setProgress(pct),
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
          kind: 'file',
          videoSlot: slot,
          storagePath: init.storagePath,
          fileName: selectedFile.name,
          mimeType: init.normalizedMimeType || check.mimeType,
          sizeBytes: selectedFile.size,
        }),
      });

      setReplace(false);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = '';
      setProgress(100);
      setOk(`Vidéo ${slot} reçue et enregistrée avec succès.`);
      await refreshCandidateStatus(sessionData.candidate.referenceCode, email);
    } catch (err) {
      setProgress(null);
      setSubmitErr(
        err instanceof Error
          ? err.message
          : `L’envoi de la Vidéo ${slot} a été interrompu. Réessayez dans un instant.`,
      );
    } finally {
      setLoading(false);
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
    if (slotStatus === 'validated') {
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

  const slotLabels =
    selectedPhase && selectedPhase.isRevealed
      ? getPhaseTextSlotLabels(selectedPhase.id)
      : getPhaseTextSlotLabels('hidden');

  const videoSlotLabels =
    selectedPhase && selectedPhase.isRevealed
      ? getPhaseVideoSlotLabels(selectedPhase.id)
      : getPhaseVideoSlotLabels('hidden');

  const currentSub = selectedPhase?.existingSubmission || null;
  const submittedText1 = (currentSub?.text1Content || '').trim();
  const submittedText2 = (currentSub?.text2Content || '').trim();
  const text1Status: SubmissionStatus | null = submittedText1
    ? currentSub?.text1Status || currentSub?.status || 'received'
    : null;
  const text2Status: SubmissionStatus | null = submittedText2
    ? currentSub?.text2Status || 'received'
    : null;
  const isText1Locked = text1Status === 'validated';
  const isText2Locked = text2Status === 'validated';

  const submittedVideo1: PublicVideoSlotSummary | null = currentSub?.video1 || null;
  const submittedVideo2: PublicVideoSlotSummary | null = currentSub?.video2 || null;

  function renderTextSlotCard(slot: 1 | 2) {
    if (!selectedPhase) return null;
    const isSlot1 = slot === 1;
    const title = isSlot1 ? slotLabels.slot1Title : slotLabels.slot2Title;
    const subtitle = isSlot1 ? slotLabels.slot1Subtitle : slotLabels.slot2Subtitle;
    const submittedText = isSlot1 ? submittedText1 : submittedText2;
    const slotStatus = isSlot1 ? text1Status : text2Status;
    const slotNote = isSlot1 ? currentSub?.text1Note : currentSub?.text2Note;
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
    const previewGlued = findGluedTextIssue(submittedText);
    const draftGlued = findGluedTextIssue(draft);

    return (
      <div
        key={`text-slot-${slot}`}
        className={`p-5 sm:p-6 bg-white border rounded-[2px] space-y-4 ${
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
              className={`self-start shrink-0 px-2.5 py-1 text-[11px] font-semibold border rounded-[2px] ${statusMeta.pillClass}`}
            >
              {statusMeta.label}
            </span>
          ) : (
            <span className="self-start shrink-0 px-2.5 py-1 text-[11px] font-medium border border-ucaep-brown/20 bg-ucaep-paper text-ucaep-ink/65 rounded-[2px]">
              Non soumis
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {okMsg && (
            <motion.div
              key={`ok-${slot}-${okMsg}`}
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              className="p-3 bg-emerald-50 border border-emerald-300 rounded-[2px] text-xs text-emerald-950 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0" />
              <span>{okMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {errMsg && (
            <motion.div
              key={`err-${slot}-${errMsg}`}
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              className="p-3 bg-red-50 border border-red-300 rounded-[2px] text-xs text-red-900 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {submittedText && (!editing || isLocked || !selectedPhase.acceptingNow) ? (
            <motion.div
              key={`slot-preview-${slot}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              className="space-y-3"
            >
              <div className="p-4 bg-ucaep-paper border border-ucaep-brown/12 rounded-[2px]">
                <p className="text-sm text-ucaep-ink/85 whitespace-pre-wrap break-words leading-relaxed max-h-52 overflow-y-auto">
                  {submittedText}
                </p>
              </div>

              {!isLocked && previewGlued.hasGluedText && (
                <div
                  role="note"
                  className="p-3 bg-amber-50 border border-amber-300 rounded-[2px] text-xs text-amber-950 leading-relaxed"
                >
                  <strong>Vérification conseillée :</strong> ce texte contient des mots collés sans espaces (souvent causé par un copier-coller depuis un PDF ou une capture d&apos;écran). Cliquez sur « Remplacer / Mettre à jour » pour espacer et relire votre texte avant l&apos;évaluation du jury.
                </div>
              )}

              {slotNote && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-[2px] text-xs text-amber-950">
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[2px] border border-ucaep-brown/20 bg-ucaep-linen/70 text-ucaep-ink/50 cursor-not-allowed"
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
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    transition={TACTILE_SPRING}
                    onClick={() => {
                      setDraft(submittedText);
                      setEditing(true);
                      if (isSlot1) setSlot1Success('');
                      else setSlot2Success('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[2px] border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Remplacer / Mettre à jour</span>
                  </motion.button>
                </div>
              ) : null}
            </motion.div>
          ) : showEditor ? (
            <motion.form
              key={`slot-editor-${slot}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              onSubmit={(e) => handleSubmitTextSlot(slot, e)}
              className="space-y-3"
            >
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
                  className="w-full px-4 py-3 text-sm leading-relaxed border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:outline-none"
                />
                {draftGlued.hasGluedText && (
                  <p className="p-2.5 bg-amber-50 border border-amber-300 rounded-[2px] text-xs text-amber-950 leading-relaxed">
                    <strong>Attention aux espaces :</strong> plusieurs mots apparaissent collés sans espace (probable copier-coller depuis un PDF ou une image). Pensez à vérifier et corriger l&apos;espacement avant de soumettre.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  transition={TACTILE_SPRING}
                  disabled={loading || !draft.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-45"
                >
                  <span>
                    {loading
                      ? 'Enregistrement...'
                      : submittedText
                        ? `Mettre à jour le Texte ${slot}`
                        : `Soumettre le Texte ${slot}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
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
            </motion.form>
          ) : null}
        </AnimatePresence>

        {!submittedText && !selectedPhase.acceptingNow && (
          <p className="text-xs text-ucaep-ink/65 italic">
            Aucun Texte {slot} soumis et les dépôts ne sont pas ouverts pour cette phase.
          </p>
        )}
      </div>
    );
  }

  function renderVideoSlotCard(slot: 1 | 2) {
    if (!selectedPhase) return null;
    const isSlot1 = slot === 1;
    const title = isSlot1 ? videoSlotLabels.slot1Title : videoSlotLabels.slot2Title;
    const subtitle = isSlot1
      ? videoSlotLabels.slot1Subtitle
      : videoSlotLabels.slot2Subtitle;
    const existingVideo = isSlot1 ? submittedVideo1 : submittedVideo2;
    const selectedFile = isSlot1 ? selectedVideo1 : selectedVideo2;
    const fileError = isSlot1 ? video1Error : video2Error;
    const submitError = isSlot1 ? video1SubmitError : video2SubmitError;
    const okMsg = isSlot1 ? video1Success : video2Success;
    const isDragging = isSlot1 ? video1Dragging : video2Dragging;
    const setDragging = isSlot1 ? setVideo1Dragging : setVideo2Dragging;
    const progress = isSlot1 ? video1Progress : video2Progress;
    const loading = isSlot1 ? video1Loading : video2Loading;
    const replaceMode = isSlot1 ? replaceVideo1Mode : replaceVideo2Mode;
    const setReplaceMode = isSlot1 ? setReplaceVideo1Mode : setReplaceVideo2Mode;
    const setSelectedFile = isSlot1 ? setSelectedVideo1 : setSelectedVideo2;
    const inputRef = isSlot1 ? video1InputRef : video2InputRef;

    const isLocked = existingVideo?.status === 'validated';
    const statusMeta = existingVideo
      ? SUBMISSION_STATUS_BADGE[existingVideo.status]
      : null;
    const showUploader =
      selectedPhase.acceptingNow && !isLocked && (!existingVideo || replaceMode);

    return (
      <div
        key={`video-slot-${slot}`}
        className={`p-5 sm:p-6 bg-white border rounded-[2px] space-y-4 ${
          isLocked
            ? 'border-ucaep-green/45 bg-emerald-50/15'
            : 'border-ucaep-brown/15'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-ucaep-brown/10 pb-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-green inline-flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Production vidéo · 0{slot}</span>
            </span>
            <h4 className="font-serif text-xl font-semibold text-ucaep-brown">
              {title}
            </h4>
            <p className="text-xs text-ucaep-ink/65">{subtitle}</p>
          </div>

          {statusMeta ? (
            <span
              className={`self-start shrink-0 px-2.5 py-1 text-[11px] font-semibold border rounded-[2px] ${statusMeta.pillClass}`}
            >
              {statusMeta.label}
            </span>
          ) : (
            <span className="self-start shrink-0 px-2.5 py-1 text-[11px] font-medium border border-ucaep-brown/20 bg-ucaep-paper text-ucaep-ink/65 rounded-[2px]">
              Non déposée
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {okMsg && (
            <motion.div
              key={`v-ok-${slot}-${okMsg}`}
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              className="p-3 bg-emerald-50 border border-emerald-300 rounded-[2px] text-xs text-emerald-950 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-ucaep-green shrink-0" />
              <span>{okMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {submitError && (
            <motion.div
              key={`v-suberr-${slot}-${submitError}`}
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
              className="p-3.5 bg-red-50 border border-red-300 rounded-[2px] text-xs sm:text-sm text-red-900 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {existingVideo && (!replaceMode || isLocked || !selectedPhase.acceptingNow) && (
          <div className="space-y-3">
            <div className="p-4 bg-ucaep-paper border border-ucaep-brown/12 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <Video className="w-4 h-4 text-ucaep-brown shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-ucaep-ink truncate">
                    {existingVideo.fileName}
                  </p>
                  <p className="text-[11px] text-ucaep-ink/65 tabular-nums">
                    Déposée le {formatFrenchDate(existingVideo.uploadedAt)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-ucaep-brown tabular-nums shrink-0">
                {formatFileSize(existingVideo.sizeBytes)}
              </span>
            </div>

            {existingVideo.note && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-[2px] text-xs text-amber-950">
                <strong>Observation du jury (Vidéo {slot}) :</strong>{' '}
                {existingVideo.note}
              </div>
            )}

            {isLocked ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-ucaep-green font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Validée par le jury : votre Vidéo {slot} est définitivement
                    verrouillée.
                  </span>
                </p>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[2px] border border-ucaep-brown/20 bg-ucaep-linen/70 text-ucaep-ink/50 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Resoumission désactivée (Validé)</span>
                </button>
              </div>
            ) : selectedPhase.acceptingNow ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-ucaep-ink/65">
                  {existingVideo.status === 'rejected'
                    ? 'Le jury demande une reprise de cette vidéo. Envoyez une nouvelle version.'
                    : 'Vous pouvez remplacer cette vidéo tant que le jury ne l’a pas validée.'}
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={TACTILE_SPRING}
                  onClick={() => {
                    setReplaceMode(true);
                    if (isSlot1) {
                      setVideo1Success('');
                      setVideo1SubmitError('');
                      setVideo1Progress(null);
                    } else {
                      setVideo2Success('');
                      setVideo2SubmitError('');
                      setVideo2Progress(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[2px] border border-ucaep-brown/30 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Remplacer la Vidéo {slot}</span>
                </motion.button>
              </div>
            ) : null}
          </div>
        )}

        {showUploader && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => handleVideoDrop(slot, e)}
              className={`border-2 border-dashed rounded-[2px] p-6 sm:p-7 text-center transition-colors ${
                isDragging
                  ? 'border-ucaep-gold bg-ucaep-ivory/40'
                  : 'border-ucaep-brown/25 bg-ucaep-paper/60 hover:border-ucaep-brown/45'
              }`}
            >
              <input
                ref={inputRef}
                id={`depot-video-input-${slot}`}
                type="file"
                accept={VIDEO_ACCEPT_ATTRIBUTE}
                onChange={(e) =>
                  handleVideoSelection(slot, e.target.files?.[0] || null)
                }
                className="sr-only"
              />
              <Upload
                className="w-6 h-6 mx-auto text-ucaep-brown/60 mb-2.5"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-ucaep-brown">
                Glissez votre Vidéo {slot} ici ou{' '}
                <label
                  htmlFor={`depot-video-input-${slot}`}
                  className="text-ucaep-green font-semibold underline cursor-pointer hover:text-ucaep-gold"
                >
                  choisissez-la sur votre téléphone ou ordinateur
                </label>
              </p>
              <p className="mt-1.5 text-xs text-ucaep-ink/70">
                Formats acceptés : MP4, MOV, WebM · Limite : 100 Mo maximum par vidéo (≤ 50 Mo recommandés sur téléphone).
              </p>
            </div>

            <AnimatePresence mode="wait">
              {fileError && (
                <motion.div
                  key={`v-ferr-${slot}-${fileError}`}
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                  className="p-3.5 bg-red-50 border border-red-300 rounded-[2px] text-xs sm:text-sm text-red-900 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedFile && (
              <div className="p-3.5 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-[2px] flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ucaep-brown truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-ucaep-ink/70 tabular-nums">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (inputRef.current) inputRef.current.value = '';
                    }}
                    aria-label={`Retirer la Vidéo ${slot}`}
                    className="p-1.5 text-ucaep-brown/70 hover:text-red-800 rounded-[2px]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {progress !== null && (
              <div className="space-y-1.5" aria-live="polite">
                <div className="flex items-center justify-between text-xs font-medium text-ucaep-brown tabular-nums">
                  <span>
                    {progress < 100
                      ? `Envoi de la Vidéo ${slot} vers le stockage sécurisé...`
                      : `Validation et enregistrement de la Vidéo ${slot}...`}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full h-2.5 bg-ucaep-linen rounded-[2px] overflow-hidden border border-ucaep-brown/15"
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.02, progress / 100) }}
                    transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
                    className="h-full w-full bg-ucaep-green origin-left"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                transition={TACTILE_SPRING}
                disabled={!selectedFile || loading || !uploadReady}
                onClick={() => handleSubmitVideoSlot(slot)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-45"
              >
                <span>
                  {loading
                    ? `Envoi de la Vidéo ${slot}...`
                    : existingVideo
                      ? `Remplacer la Vidéo ${slot}`
                      : `Envoyer la Vidéo ${slot}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {existingVideo && !loading && (
                <button
                  type="button"
                  onClick={() => {
                    setReplaceMode(false);
                    setSelectedFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  className="px-4 py-2.5 text-xs font-medium text-ucaep-brown/80 hover:text-ucaep-brown underline"
                >
                  Annuler le remplacement
                </button>
              )}
            </div>
          </div>
        )}

        {!existingVideo && !selectedPhase.acceptingNow && (
          <p className="text-xs text-ucaep-ink/65 italic">
            Aucune Vidéo {slot} déposée et les dépôts ne sont pas ouverts pour cette phase.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {/* ÉTAPE 1 : IDENTIFICATION */}
        {!sessionData ? (
          <motion.div
            key="depot-login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
            className="space-y-4"
          >
            <form
              onSubmit={handleVerifyCandidate}
              className="p-6 sm:p-10 bg-white border border-ucaep-brown/15 rounded-[2px] space-y-6"
            >
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-green">
                  Étape 01 · Identifiez-vous
                </p>
                <h3 className="font-serif text-3xl font-semibold text-ucaep-brown">
                  Accéder à mon espace candidat
                </h3>
                <p className="text-sm text-ucaep-ink/78 leading-relaxed">
                  Saisissez le code d’anonymat reçu à la fin de votre inscription (ex.{' '}
                  <span className="font-mono font-semibold">UCAEP-2026-0001</span>) ainsi que l’adresse e-mail utilisée dans votre dossier pour déposer directement vos deux textes et vos deux vidéos.
                </p>
                {activePhase &&
                  (!lockedPhaseId || activePhase.id === lockedPhaseId) &&
                  activePhase.submissionsOpen && (
                    <p className="pt-1 text-xs font-medium text-ucaep-green flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        Les dépôts en ligne sont ouverts pour la Phase {activePhase.number} ({activePhase.title}) : connectez-vous ci-dessous pour déposer vos textes et vos vidéos.
                      </span>
                    </p>
                  )}
              </div>

              <AnimatePresence mode="wait">
                {authError && (
                  <motion.div
                    key={authError}
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                    className="p-4 bg-red-50 border border-red-300 rounded-[2px] text-sm text-red-900 flex items-start gap-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 text-sm border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  transition={TACTILE_SPRING}
                  disabled={authLoading}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-[2px] bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors disabled:opacity-50"
                >
                  <span>
                    {authLoading ? 'Vérification en cours...' : 'Ouvrir mon dossier'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                {!hideRegistrationHint && (
                  <p className="text-xs text-ucaep-ink/65">
                    Pas encore inscrit(e) ?{' '}
                    <Link
                      to="/inscription"
                      className="text-ucaep-brown font-semibold underline hover:text-ucaep-gold"
                    >
                      Commencer mon inscription
                    </Link>
                  </p>
                )}
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="depot-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
            className="space-y-8"
          >
            {/* BANDEAU CANDIDAT IDENTIFIÉ */}
            <div className="p-6 bg-white border border-ucaep-brown/15 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  setSelectedVideo1(null);
                  setSelectedVideo2(null);
                  setText1Draft('');
                  setText2Draft('');
                  setVideo1SubmitError('');
                  setVideo2SubmitError('');
                }}
                className="text-xs font-medium text-ucaep-brown hover:text-ucaep-gold underline self-start sm:self-center"
              >
                Changer de dossier
              </button>
            </div>

            {selectedPhase && (
              <CandidateProgressCard
                referenceCode={sessionData.candidate.referenceCode}
                phaseNumber={selectedPhase.number}
                phaseTitle={selectedPhase.title}
                isPresentiel={selectedPhase.format === 'En présentiel'}
                acceptingNow={selectedPhase.acceptingNow}
                submissionDeadline={selectedPhase.submissionDeadline}
                text1Submitted={Boolean(submittedText1)}
                text1Status={text1Status}
                text2Submitted={Boolean(submittedText2)}
                text2Status={text2Status}
                video1Submitted={Boolean(submittedVideo1)}
                video1Status={submittedVideo1?.status ?? null}
                video2Submitted={Boolean(submittedVideo2)}
                video2Status={submittedVideo2?.status ?? null}
                onCopyReference={() =>
                  handleCopyRef(sessionData.candidate.referenceCode)
                }
                copiedRef={copiedRef}
              />
            )}

            {/* SÉLECTION DE PHASE (masquée si lockedPhaseId est défini) */}
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
                    const disabled =
                      !phase.acceptingNow && !phase.existingSubmission;
                    const deadlineStr = formatDeadline(phase.submissionDeadline);
                    const existingBadge = phase.existingSubmission
                      ? SUBMISSION_STATUS_BADGE[phase.existingSubmission.status]
                      : null;

                    return (
                      <motion.button
                        key={phase.id}
                        type="button"
                        role="radio"
                        whileTap={disabled ? undefined : { scale: 0.99 }}
                        transition={TACTILE_SPRING}
                        aria-checked={isSelected}
                        disabled={disabled}
                        onClick={() => setSelectedPhaseId(phase.id)}
                        className={`text-left p-5 rounded-[2px] border transition-colors space-y-2.5 ${
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
                                {phase.format === 'En présentiel'
                                  ? 'Présentiel'
                                  : 'Fermé'}
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
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : DÉPÔT UNIFIÉ POUR LA PHASE SÉLECTIONNÉE (TEXTE 1/2 + VIDÉO 1/2) */}
            {selectedPhase && (
              <div className="space-y-8">
                {!lockedPhaseId && selectedPhase.isRevealed && selectedPhase.testDetails && (
                  <div className="p-5 bg-ucaep-linen/70 border border-ucaep-brown/15 rounded-[2px] space-y-2">
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

                {selectedPhase.format === 'En présentiel' ? (
                  <div className="p-6 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-[2px] text-sm text-ucaep-ink/80">
                    {selectedPhase.closedReason ||
                      'Épreuve en présentiel sur le campus : aucun dépôt en ligne n’est demandé.'}
                  </div>
                ) : !selectedPhase.acceptingNow && !selectedPhase.existingSubmission ? (
                  <div className="p-6 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-[2px] text-sm text-ucaep-ink/75">
                    {selectedPhase.closedReason ||
                      'Les dépôts ne sont pas ouverts pour cette phase.'}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* SECTION 1 : TEXTE 1 & TEXTE 2 */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                          Épreuves écrites · Phase {selectedPhase.number}
                        </p>
                        <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                          1. Déposez vos deux textes (Texte 1 et Texte 2)
                        </h3>
                        <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                          Collez et envoyez séparément le texte complet de chaque épreuve ci-dessous. Vérifiez l&apos;ordre (Texte 1 puis Texte 2) : dès qu&apos;un texte est validé par le jury, sa modification est automatiquement bloquée.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {renderTextSlotCard(1)}
                        {renderTextSlotCard(2)}
                      </div>
                    </div>

                    {/* SECTION 2 : VIDÉO 1 & VIDÉO 2 SUR SUPABASE */}
                    <div className="space-y-4 pt-4 border-t border-ucaep-brown/15">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                            Épreuves orales filmées · Phase {selectedPhase.number}
                          </p>
                          <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                            2. Déposez vos deux vidéos (Vidéo 1 et Vidéo 2)
                          </h3>
                          <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                            Téléversez ici les deux vidéos face caméra correspondant à vos deux textes (MP4, MOV ou WebM · 100 Mo max par vidéo · ≤ 50 Mo conseillés). Vos textes ci-dessus restent conservés.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(sessionData.candidate.referenceCode)}
                          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-[2px] border border-ucaep-brown/20 bg-white text-ucaep-brown hover:border-ucaep-gold transition-colors shrink-0"
                        >
                          {copiedRef ? (
                            <>
                              <Check className="w-3 h-3 text-ucaep-green" />
                              <span>Code copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{sessionData.candidate.referenceCode}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {renderVideoSlotCard(1)}
                        {renderVideoSlotCard(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
