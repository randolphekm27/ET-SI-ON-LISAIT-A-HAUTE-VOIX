import type { SubmissionStatus, VideoSlotSubmission } from '../types/competition';

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 Mo par vidéo
export const SUPABASE_FREE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1 Go (Plan Gratuit Supabase)
export const MAX_TEXT_SUBMISSION_LENGTH = 20_000;

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const ALLOWED_SUBMISSION_MIME_TYPES = [
  // Vidéo
  ...ALLOWED_VIDEO_MIME_TYPES,
  // Audio (rétrocompatibilité)
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  // Documents (rétrocompatibilité)
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
] as const;

export const ALLOWED_EXTENSION_TO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
};

export const ALLOWED_SUBMISSION_EXTENSIONS = Object.keys(ALLOWED_EXTENSION_TO_MIME);

export const VIDEO_ACCEPT_ATTRIBUTE = '.mp4,.mov,.webm,video/mp4,video/quicktime,video/webm';

export const ACCEPT_ATTRIBUTE = [
  ...ALLOWED_SUBMISSION_EXTENSIONS,
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  '.doc',
  '.docx',
].join(',');

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot === -1) return '';
  return fileName.slice(dot).toLowerCase().trim();
}

export function normalizeSubmissionMimeType(
  fileName: string,
  rawMimeType?: string | null,
): string | null {
  const ext = getFileExtension(fileName);
  const cleanMime = (rawMimeType || '').split(';')[0].trim().toLowerCase();

  if (
    cleanMime &&
    (ALLOWED_SUBMISSION_MIME_TYPES as readonly string[]).includes(cleanMime)
  ) {
    if (cleanMime === 'audio/mp3') return 'audio/mpeg';
    if (cleanMime === 'audio/x-m4a' || cleanMime === 'audio/m4a') return 'audio/mp4';
    if (cleanMime === 'audio/x-wav') return 'audio/wav';
    return cleanMime;
  }

  if (
    (!cleanMime || cleanMime === 'application/octet-stream') &&
    ext &&
    ALLOWED_EXTENSION_TO_MIME[ext]
  ) {
    return ALLOWED_EXTENSION_TO_MIME[ext];
  }

  return null;
}

export function isVideoMimeType(mimeType?: string | null): boolean {
  if (!mimeType) return false;
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(
    mimeType.trim().toLowerCase(),
  );
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export function validateSubmissionFileClient(
  file: File,
  options?: { videoOnly?: boolean },
):
  | { ok: true; mimeType: string }
  | { ok: false; error: string; isTooLarge?: boolean } {
  if (file.size <= 0) {
    return {
      ok: false,
      error: 'Ce fichier semble vide (0 octet). Vérifiez votre sélection avant de l’envoyer.',
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      isTooLarge: true,
      error: `Votre vidéo pèse ${formatFileSize(file.size)}, ce qui dépasse la limite de 100 Mo. Compressez-la (ex. avec Proton Video Compressor dans « Annonces & Outils » ou en MP4 720p) avant de réessayer.`,
    };
  }

  const normalizedMime = normalizeSubmissionMimeType(file.name, file.type);
  if (!normalizedMime) {
    return {
      ok: false,
      error: options?.videoOnly
        ? 'Format non accepté pour le dépôt vidéo. Utilisez un fichier MP4, MOV ou WebM.'
        : 'Ce format de fichier n’est pas accepté. Formats autorisés : vidéo (MP4, MOV, WebM), audio (MP3, M4A, WAV, OGG), ou document (PDF, DOCX, DOC).',
    };
  }

  if (options?.videoOnly && !isVideoMimeType(normalizedMime)) {
    return {
      ok: false,
      error: 'Veuillez choisir une vidéo au format MP4, MOV ou WebM (maximum 100 Mo).',
    };
  }

  return { ok: true, mimeType: normalizedMime };
}

export interface PhaseTextSlotLabels {
  slot1Title: string;
  slot1Subtitle: string;
  slot2Title: string;
  slot2Subtitle: string;
}

export const PHASE_TEXT_SLOTS: Record<string, PhaseTextSlotLabels> = {
  'phase-1': {
    slot1Title: 'Texte 1 — « Je suis… »',
    slot1Subtitle: 'Autoportrait littéraire personnel',
    slot2Title: "Texte 2 — « Les mots que l'on n'ose pas dire »",
    slot2Subtitle: 'Expression libre d’une pensée ou émotion retenue',
  },
  'phase-2': {
    slot1Title: 'Texte 1 — « La science dans notre quotidien »',
    slot1Subtitle: 'Vulgarisation scientifique accessible et rigoureuse',
    slot2Title: "Texte 2 — « L'école, le savoir et l'avenir »",
    slot2Subtitle: 'Réflexion structurée et argumentée sur l’éducation',
  },
};

export function getPhaseTextSlotLabels(phaseId: string): PhaseTextSlotLabels {
  return (
    PHASE_TEXT_SLOTS[phaseId] || {
      slot1Title: 'Texte 1 — Première épreuve',
      slot1Subtitle: 'Première production écrite de la phase',
      slot2Title: 'Texte 2 — Deuxième épreuve',
      slot2Subtitle: 'Deuxième production écrite de la phase',
    }
  );
}

export const PHASE_VIDEO_SLOTS: Record<string, PhaseTextSlotLabels> = {
  'phase-1': {
    slot1Title: 'Vidéo 1 — Lecture « Je suis… »',
    slot1Subtitle: 'Interprétation face caméra de votre Texte 1 (jusqu’à 5 min · max 100 Mo)',
    slot2Title: "Vidéo 2 — Lecture « Les mots que l'on n'ose pas dire »",
    slot2Subtitle: 'Interprétation face caméra de votre Texte 2 (jusqu’à 5 min · max 100 Mo)',
  },
  'phase-2': {
    slot1Title: 'Vidéo 1 — Exposé « La science dans notre quotidien »',
    slot1Subtitle: 'Présentation filmée de votre Texte 1 (jusqu’à 5 min · max 100 Mo)',
    slot2Title: "Vidéo 2 — Exposé « L'école, le savoir et l'avenir »",
    slot2Subtitle: 'Présentation filmée de votre Texte 2 (jusqu’à 5 min · max 100 Mo)',
  },
};

export function getPhaseVideoSlotLabels(phaseId: string): PhaseTextSlotLabels {
  return (
    PHASE_VIDEO_SLOTS[phaseId] || {
      slot1Title: 'Vidéo 1 — Première prestation',
      slot1Subtitle: 'Vidéo associée au Texte 1 (MP4, MOV, WebM · max 100 Mo)',
      slot2Title: 'Vidéo 2 — Deuxième prestation',
      slot2Subtitle: 'Vidéo associée au Texte 2 (MP4, MOV, WebM · max 100 Mo)',
    }
  );
}

export interface DualTextSubmissionPayload {
  __ucaepDualText: 1;
  text1: string;
  text2: string;
  text1Status: SubmissionStatus;
  text2Status: SubmissionStatus;
  text1Note: string;
  text2Note: string;
  video1?: VideoSlotSubmission | null;
  video2?: VideoSlotSubmission | null;
}

function normalizeSlotStatus(
  val: unknown,
  fallback: SubmissionStatus = 'received',
): SubmissionStatus {
  if (val === 'received' || val === 'validated' || val === 'rejected') {
    return val;
  }
  return fallback;
}

function normalizeVideoSlot(raw: unknown): VideoSlotSubmission | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const storagePath = typeof r.storagePath === 'string' ? r.storagePath.trim() : '';
  const fileName = typeof r.fileName === 'string' ? r.fileName.trim() : '';
  const mimeType = typeof r.mimeType === 'string' ? r.mimeType.trim() : '';
  const sizeBytes = Number(r.sizeBytes);
  if (!storagePath || !fileName || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return null;
  }
  return {
    storagePath,
    fileName,
    mimeType: mimeType || 'video/mp4',
    sizeBytes,
    status: normalizeSlotStatus(r.status, 'received'),
    note: typeof r.note === 'string' ? r.note : '',
    uploadedAt:
      typeof r.uploadedAt === 'string' && r.uploadedAt.trim()
        ? r.uploadedAt
        : new Date().toISOString(),
  };
}

export function parseDualTextContent(
  raw: string | null | undefined,
  fallbackStatus: SubmissionStatus = 'received',
): {
  isStructured: boolean;
  text1: string;
  text2: string;
  text1Status: SubmissionStatus;
  text2Status: SubmissionStatus;
  text1Note: string;
  text2Note: string;
  video1: VideoSlotSubmission | null;
  video2: VideoSlotSubmission | null;
} {
  const trimmed = (raw || '').trim();
  if (trimmed.startsWith('{') && trimmed.includes('__ucaepDualText')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<DualTextSubmissionPayload>;
      if (parsed && parsed.__ucaepDualText === 1) {
        return {
          isStructured: true,
          text1: typeof parsed.text1 === 'string' ? parsed.text1 : '',
          text2: typeof parsed.text2 === 'string' ? parsed.text2 : '',
          text1Status: normalizeSlotStatus(parsed.text1Status, fallbackStatus),
          text2Status: normalizeSlotStatus(parsed.text2Status, 'received'),
          text1Note: typeof parsed.text1Note === 'string' ? parsed.text1Note : '',
          text2Note: typeof parsed.text2Note === 'string' ? parsed.text2Note : '',
          video1: normalizeVideoSlot(parsed.video1),
          video2: normalizeVideoSlot(parsed.video2),
        };
      }
    } catch {
      // Fallback en texte simple
    }
  }

  return {
    isStructured: false,
    text1: trimmed,
    text2: '',
    text1Status: trimmed ? fallbackStatus : 'received',
    text2Status: 'received',
    text1Note: '',
    text2Note: '',
    video1: null,
    video2: null,
  };
}

export function serializeDualTextContent(input: {
  text1: string;
  text2: string;
  text1Status: SubmissionStatus;
  text2Status: SubmissionStatus;
  text1Note?: string;
  text2Note?: string;
  video1?: VideoSlotSubmission | null;
  video2?: VideoSlotSubmission | null;
}): string {
  const payload: DualTextSubmissionPayload = {
    __ucaepDualText: 1,
    text1: (input.text1 || '').trim(),
    text2: (input.text2 || '').trim(),
    text1Status: input.text1Status,
    text2Status: input.text2Status,
    text1Note: (input.text1Note || '').trim(),
    text2Note: (input.text2Note || '').trim(),
    ...(input.video1 ? { video1: input.video1 } : {}),
    ...(input.video2 ? { video2: input.video2 } : {}),
  };
  return JSON.stringify(payload);
}

export function computeBundleOverallStatus(bundle: {
  text1: string;
  text2: string;
  text1Status: SubmissionStatus;
  text2Status: SubmissionStatus;
  video1?: VideoSlotSubmission | null;
  video2?: VideoSlotSubmission | null;
}): SubmissionStatus {
  const hasT1 = Boolean(bundle.text1.trim());
  const hasT2 = Boolean(bundle.text2.trim());
  const hasV1 = Boolean(bundle.video1);
  const hasV2 = Boolean(bundle.video2);

  if (
    (hasT1 && bundle.text1Status === 'rejected') ||
    (hasT2 && bundle.text2Status === 'rejected') ||
    (hasV1 && bundle.video1?.status === 'rejected') ||
    (hasV2 && bundle.video2?.status === 'rejected')
  ) {
    return 'rejected';
  }

  if (
    hasT1 &&
    hasT2 &&
    hasV1 &&
    hasV2 &&
    bundle.text1Status === 'validated' &&
    bundle.text2Status === 'validated' &&
    bundle.video1?.status === 'validated' &&
    bundle.video2?.status === 'validated'
  ) {
    return 'validated';
  }

  return 'received';
}

export function buildBundleCombinedNote(bundle: {
  text1Note?: string;
  text2Note?: string;
  video1Note?: string;
  video2Note?: string;
}): string {
  const parts: string[] = [];
  if (bundle.text1Note?.trim()) parts.push(`T1 : ${bundle.text1Note.trim()}`);
  if (bundle.text2Note?.trim()) parts.push(`T2 : ${bundle.text2Note.trim()}`);
  if (bundle.video1Note?.trim()) parts.push(`V1 : ${bundle.video1Note.trim()}`);
  if (bundle.video2Note?.trim()) parts.push(`V2 : ${bundle.video2Note.trim()}`);
  return parts.join(' | ').slice(0, 1500);
}

/**
 * Détecte les suites anormalement longues de lettres sans espaces (≥ 28 lettres consécutives),
 * typiques d'un copier-coller depuis un PDF, un scan OCR ou une capture d'écran.
 */
export function findGluedTextIssue(text?: string | null): {
  hasGluedText: boolean;
  gluedCount: number;
  longestTokenLength: number;
} {
  if (!text) {
    return { hasGluedText: false, gluedCount: 0, longestTokenLength: 0 };
  }
  const matches = text.match(/\p{L}{28,}/gu) || [];
  let longest = 0;
  for (const m of matches) {
    if (m.length > longest) longest = m.length;
  }
  return {
    hasGluedText: matches.length > 0,
    gluedCount: matches.length,
    longestTokenLength: longest,
  };
}

