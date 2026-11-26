export type PublicationStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type MediaAssetKey =
  | 'hero'
  | 'plume'
  | 'connaissance'
  | 'eloquence'
  | 'campus';

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  scheduledAt?: string;
  status: PublicationStatus;
  category: string;
  imageKey: MediaAssetKey;
}

export type PublicAnnouncement = Omit<Announcement, 'status' | 'scheduledAt'>;

export type SubmissionStatus = 'received' | 'validated' | 'rejected';

export type SubmissionKind = 'file' | 'text';

export interface PhaseTestDetails {
  instructionsTitle: string;
  theme: string;
  instructions: string;
  submissionNote: string;
}

export interface CompetitionPhase {
  id: string;
  number: string;
  title: string;
  shortDescription: string;
  format: 'En ligne' | 'En présentiel';
  statusLabel: 'À venir' | 'Ouverte' | 'En cours' | 'Verrouillée' | 'Clôturée';
  isRevealed: boolean;
  submissionsOpen?: boolean;
  submissionDeadline?: string | null;
  imageKey: MediaAssetKey;
  testDetails?: PhaseTestDetails | null;
}

export interface PhaseExternalFormConfig {
  enabled: boolean;
  googleFormUrl: string;
  instructions?: string;
}

export interface CandidateSubmissionSummary {
  id: string;
  phaseId: string;
  kind: SubmissionKind;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  textExcerpt?: string | null;
  textContent?: string | null;
  text1Content?: string | null;
  text2Content?: string | null;
  text1Status?: SubmissionStatus;
  text2Status?: SubmissionStatus;
  text1Note?: string;
  text2Note?: string;
  status: SubmissionStatus;
  organizerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionPublicPhaseStatus {
  id: string;
  number: string;
  title: string;
  format: 'En ligne' | 'En présentiel';
  statusLabel: CompetitionPhase['statusLabel'];
  isRevealed: boolean;
  submissionsOpen: boolean;
  submissionDeadline: string | null;
  acceptingNow: boolean;
  closedReason: string | null;
  testDetails: PhaseTestDetails | null;
  externalForm?: PhaseExternalFormConfig | null;
  existingSubmission: CandidateSubmissionSummary | null;
}

export interface AdminSubmissionItem {
  id: string;
  registrationId: string;
  referenceCode: string;
  candidateName: string;
  candidateDepartment: string;
  candidateStudyLevel: string;
  phaseId: string;
  phaseNumber: string;
  phaseTitle: string;
  kind: SubmissionKind;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  textPreview: string | null;
  text1Status?: SubmissionStatus;
  text2Status?: SubmissionStatus;
  status: SubmissionStatus;
  organizerNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubmissionAccess {
  id: string;
  kind: SubmissionKind;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  signedUrl: string | null;
  expiresInSeconds: number | null;
  textContent: string | null;
  text1Content?: string | null;
  text2Content?: string | null;
  text1Status?: SubmissionStatus;
  text2Status?: SubmissionStatus;
  text1Note?: string;
  text2Note?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: 'Vie du concours' | 'Coulisses' | 'Candidats' | 'Résultats';
  publishedAt: string;
  readTime: string;
  excerpt: string;
  content: string[];
  imageKey: MediaAssetKey;
  featured?: boolean;
  status: PublicationStatus;
}

export type PublicNewsArticle = Omit<NewsArticle, 'status'>;

export interface RegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'Féminin' | 'Masculin' | 'Préfère ne pas préciser';
  institution: string;
  department: string;
  studyLevel: string;
  studentId: string;
  motivation: string;
  readingExperience: string;
  acceptRules: boolean;
}

export interface RegistrationRecord extends RegistrationPayload {
  id: string;
  referenceCode: string;
  createdAt: string;
  syncedToGoogleSheets: boolean;
  syncTarget: 'google_apps_script' | 'google_forms' | 'local_archive';
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageRecord extends ContactPayload {
  id: string;
  status?: 'non_lu' | 'traite';
  createdAt: string;
}

export type SiteDisplayMode = 'multi_page' | 'phase_single_page';

export type DepotResourceKind = 'info' | 'tool' | 'warning' | 'video_help';

export interface DepotResourceItem {
  id: string;
  title: string;
  body: string;
  kind: DepotResourceKind;
  actionLabel?: string;
  actionUrl?: string;
  pinned?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteDisplayConfig {
  mode: SiteDisplayMode;
  activePhaseId: string;
  customNotice?: string;
  externalForms?: Record<string, PhaseExternalFormConfig>;
  depotResources?: DepotResourceItem[];
}

export interface PublicSiteConfigPayload {
  siteConfig: SiteDisplayConfig;
  activePhase: CompetitionPhase | null;
  phasesSummary: Array<{
    id: string;
    number: string;
    title: string;
    format: CompetitionPhase['format'];
    statusLabel: CompetitionPhase['statusLabel'];
  }>;
  announcements: PublicAnnouncement[];
}


