export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 Mo
export const MAX_TEXT_SUBMISSION_LENGTH = 20_000;

export const ALLOWED_SUBMISSION_MIME_TYPES = [
  // Vidéo
  'video/mp4',
  'video/quicktime',
  'video/webm',
  // Audio
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
  // Documents
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
    // Normalise les variantes (audio/mp3 -> audio/mpeg, audio/x-m4a -> audio/mp4)
    if (cleanMime === 'audio/mp3') return 'audio/mpeg';
    if (cleanMime === 'audio/x-m4a' || cleanMime === 'audio/m4a') return 'audio/mp4';
    if (cleanMime === 'audio/x-wav') return 'audio/wav';
    return cleanMime;
  }

  // Certains navigateurs renvoient '' ou 'application/octet-stream' pour .m4a, .mov ou .docx
  if ((!cleanMime || cleanMime === 'application/octet-stream') && ext && ALLOWED_EXTENSION_TO_MIME[ext]) {
    return ALLOWED_EXTENSION_TO_MIME[ext];
  }

  return null;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export function validateSubmissionFileClient(file: File):
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
      error: `Votre fichier pèse ${formatFileSize(file.size)}, ce qui dépasse la limite de 50 Mo. Pour une vidéo, exportez en MP4 720p (par exemple avec HandBrake ou un compresseur vidéo) avant de réessayer.`,
    };
  }

  const normalizedMime = normalizeSubmissionMimeType(file.name, file.type);
  if (!normalizedMime) {
    return {
      ok: false,
      error:
        'Ce format de fichier n’est pas accepté. Formats autorisés : vidéo (MP4, MOV, WebM), audio (MP3, M4A, WAV, OGG), ou document (PDF, DOCX, DOC).',
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

export interface DualTextSubmissionPayload {
  __ucaepDualText: 1;
  text1: string;
  text2: string;
  text1Status: 'received' | 'validated' | 'rejected';
  text2Status: 'received' | 'validated' | 'rejected';
  text1Note: string;
  text2Note: string;
}

function normalizeTextStatus(
  val: unknown,
  fallback: 'received' | 'validated' | 'rejected' = 'received',
): 'received' | 'validated' | 'rejected' {
  if (val === 'received' || val === 'validated' || val === 'rejected') {
    return val;
  }
  return fallback;
}

export function parseDualTextContent(
  raw: string | null | undefined,
  fallbackStatus: 'received' | 'validated' | 'rejected' = 'received',
): {
  isStructured: boolean;
  text1: string;
  text2: string;
  text1Status: 'received' | 'validated' | 'rejected';
  text2Status: 'received' | 'validated' | 'rejected';
  text1Note: string;
  text2Note: string;
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
          text1Status: normalizeTextStatus(parsed.text1Status, fallbackStatus),
          text2Status: normalizeTextStatus(parsed.text2Status, 'received'),
          text1Note: typeof parsed.text1Note === 'string' ? parsed.text1Note : '',
          text2Note: typeof parsed.text2Note === 'string' ? parsed.text2Note : '',
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
  };
}

export function serializeDualTextContent(input: {
  text1: string;
  text2: string;
  text1Status: 'received' | 'validated' | 'rejected';
  text2Status: 'received' | 'validated' | 'rejected';
  text1Note?: string;
  text2Note?: string;
}): string {
  const payload: DualTextSubmissionPayload = {
    __ucaepDualText: 1,
    text1: (input.text1 || '').trim(),
    text2: (input.text2 || '').trim(),
    text1Status: input.text1Status,
    text2Status: input.text2Status,
    text1Note: (input.text1Note || '').trim(),
    text2Note: (input.text2Note || '').trim(),
  };
  return JSON.stringify(payload);
}
