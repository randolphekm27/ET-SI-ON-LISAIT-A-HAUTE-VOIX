import { useState, useEffect, useRef, type FormEvent, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  LayoutTemplate,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Unlock,
  X,
  XCircle,
} from 'lucide-react';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useSiteConfig } from '../lib/site-config';
import { formatFileSize } from '../lib/submissions-config';
import type {
  AdminSubmissionAccess,
  AdminSubmissionItem,
  Announcement,
  CompetitionPhase,
  ContactMessageRecord,
  MediaAssetKey,
  NewsArticle,
  PublicationStatus,
  RegistrationRecord,
  SiteDisplayConfig,
  SiteDisplayMode,
  SubmissionStatus,
} from '../types/competition';

interface AdminOverview {
  databaseConnected?: boolean;
  announcements: Announcement[];
  phases: CompetitionPhase[];
  news: NewsArticle[];
  registrations: RegistrationRecord[];
  contacts: ContactMessageRecord[];
  settings: {
    googleAppsScriptUrl: string;
    siteDisplay?: SiteDisplayConfig;
  };
}

const STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmé',
  published: 'Publié',
  archived: 'Archivé',
};

const SUBMISSION_STATUS_META: Record<
  SubmissionStatus,
  { label: string; badgeClass: string }
> = {
  received: {
    label: 'Reçu',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  validated: {
    label: 'Validé',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  rejected: {
    label: 'Refusé',
    badgeClass: 'bg-red-50 text-red-900 border-red-300',
  },
};

function toDateTimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

type GestionTab =
  | 'interface'
  | 'annonces'
  | 'actualites'
  | 'parcours'
  | 'candidats'
  | 'depots'
  | 'config';

const VALID_TABS: GestionTab[] = [
  'interface',
  'annonces',
  'actualites',
  'parcours',
  'candidats',
  'depots',
  'config',
];

const CANDIDATES_PER_PAGE = 50;

export function GestionPage() {
  usePageSeo(
    'Espace organisateurs',
    'Gestion des annonces, des phases, de l’interface publique et des inscriptions au concours UCAEP.',
  );
  const { refreshSiteConfig } = useSiteConfig();

  const [token, setToken] = useState<string>(() => {
    try {
      // Supprime l'ancien stockage permanent : la session ne dure plus que pour l'onglet en cours
      localStorage.removeItem('ucaep_admin_token');
      return sessionStorage.getItem('ucaep_admin_token') || '';
    } catch {
      return '';
    }
  });
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<GestionTab>(() => {
    try {
      const savedTab = sessionStorage.getItem('ucaep_admin_tab') as GestionTab | null;
      if (savedTab && VALID_TABS.includes(savedTab)) {
        return savedTab;
      }
    } catch {
      // ignore
    }
    return 'annonces';
  });
  const [notice, setNotice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isFetchingRef = useRef(false);
  const requestSeqRef = useRef(0);

  // Dépôts des candidats state
  const [submissions, setSubmissions] = useState<AdminSubmissionItem[]>([]);
  const [submissionsStorageReady, setSubmissionsStorageReady] = useState<boolean>(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [submissionPhaseFilter, setSubmissionPhaseFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [inspectingItem, setInspectingItem] = useState<AdminSubmissionItem | null>(null);
  const [inspectingAccess, setInspectingAccess] = useState<AdminSubmissionAccess | null>(
    null,
  );
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState('');
  const [reviewNoteDraft, setReviewNoteDraft] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [phaseDeadlines, setPhaseDeadlines] = useState<Record<string, string>>({});
  const [phaseSavingId, setPhaseSavingId] = useState<string | null>(null);
  const [phaseActionError, setPhaseActionError] = useState('');
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseDraft, setPhaseDraft] = useState<{
    title: string;
    shortDescription: string;
    instructionsTitle: string;
    theme: string;
    instructions: string;
    submissionNote: string;
  }>({
    title: '',
    shortDescription: '',
    instructionsTitle: '',
    theme: '',
    instructions: '',
    submissionNote: '',
  });

  function selectTab(newTab: GestionTab) {
    setTab(newTab);
    try {
      sessionStorage.setItem('ucaep_admin_tab', newTab);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!token) return;
    loadOverview(token);

    // Actualisation automatique en temps réel toutes les 6 secondes
    const interval = setInterval(() => {
      loadOverview(token, true);
    }, 6000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || tab !== 'depots') return;
    loadSubmissions(token);
  }, [token, tab]);

  // Announcement creation form
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState('Officiel');
  const [annExcerpt, setAnnExcerpt] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annStatus, setAnnStatus] = useState<PublicationStatus>('draft');
  const [annScheduledAt, setAnnScheduledAt] = useState('');
  const [annImage, setAnnImage] = useState<MediaAssetKey>('campus');

  // News creation form
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState<NewsArticle['category']>('Vie du concours');
  const [newsExcerpt, setNewsExcerpt] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsStatus, setNewsStatus] = useState<PublicationStatus>('published');
  const [newsImage, setNewsImage] = useState<MediaAssetKey>('campus');

  // Candidate search & pagination
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);

  // Settings form
  const [gasUrl, setGasUrl] = useState('');
  const [gasTestMsg, setGasTestMsg] = useState('');
  const [gasTestError, setGasTestError] = useState('');

  // Site architecture / interface mode switcher state
  const [draftSiteMode, setDraftSiteMode] = useState<SiteDisplayMode>('multi_page');
  const [draftActivePhaseId, setDraftActivePhaseId] = useState('phase-1');
  const [draftCustomNotice, setDraftCustomNotice] = useState('');
  const [autoRevealOnSwitch, setAutoRevealOnSwitch] = useState(true);
  const [autoOpenSubmissionsOnSwitch, setAutoOpenSubmissionsOnSwitch] = useState(true);
  const [siteConfigSaving, setSiteConfigSaving] = useState(false);
  const [siteConfigError, setSiteConfigError] = useState('');
  const siteDraftInitializedRef = useRef(false);

  function buildAuthHeaders(
    extraHeaders?: Record<string, string>,
    overrideAdminToken?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = { ...(extraHeaders || {}) };
    const effectiveAdmin = overrideAdminToken ?? token;
    if (effectiveAdmin) {
      headers['X-UCAEP-Admin-Token'] = effectiveAdmin;
      headers.Authorization = `Bearer ${effectiveAdmin}`;
    }
    return headers;
  }

  async function loadOverview(overrideAdminToken?: string, silent = false) {
    // Seules les actualisations automatiques sont ignorées si une requête est déjà en cours :
    // un rechargement demandé après une action (bouton) doit toujours avoir lieu.
    if (silent && isFetchingRef.current) return;
    const requestId = ++requestSeqRef.current;
    isFetchingRef.current = true;
    if (!silent) setIsRefreshing(true);
    try {
      const json = await fetchApiJson<AdminOverview>('/api/admin/overview', {
        headers: buildAuthHeaders(undefined, overrideAdminToken),
      });
      // Ignore une réponse plus ancienne qui arriverait après une réponse plus récente
      if (requestId !== requestSeqRef.current) return;
      setData(json);
      setGasUrl(json.settings?.googleAppsScriptUrl || '');
      if (!siteDraftInitializedRef.current && json.settings?.siteDisplay) {
        siteDraftInitializedRef.current = true;
        setDraftSiteMode(json.settings.siteDisplay.mode);
        setDraftActivePhaseId(json.settings.siteDisplay.activePhaseId || 'phase-1');
        setDraftCustomNotice(json.settings.siteDisplay.customNotice || '');
      }
      setPhaseDeadlines((prev) => {
        const next = { ...prev };
        for (const p of json.phases || []) {
          if (next[p.id] === undefined) {
            next[p.id] = toDateTimeLocalValue(p.submissionDeadline);
          }
        }
        return next;
      });
      setLastSyncedAt(new Date());
      setAuthError('');
    } catch (err) {
      if (requestId !== requestSeqRef.current) return;
      const msg = err instanceof Error ? err.message : 'Erreur de chargement.';
      if (!silent) setAuthError(msg);
      if (msg.includes('401') || msg.includes('Connexion organisateur requise')) {
        setToken('');
        setData(null);
        try {
          localStorage.removeItem('ucaep_admin_token');
          sessionStorage.removeItem('ucaep_admin_token');
        } catch {
          // ignore
        }
      }
    } finally {
      if (requestId === requestSeqRef.current) {
        isFetchingRef.current = false;
        if (!silent) setIsRefreshing(false);
      }
    }
  }

  async function loadSubmissions(overrideAdminToken?: string) {
    setSubmissionsLoading(true);
    setSubmissionsError('');
    try {
      const res = await fetchApiJson<{
        storageConfigured: boolean;
        submissions: AdminSubmissionItem[];
      }>('/api/admin/submissions', {
        headers: buildAuthHeaders(undefined, overrideAdminToken),
      });
      setSubmissions(res.submissions || []);
      setSubmissionsStorageReady(res.storageConfigured);
    } catch (err) {
      setSubmissionsError(
        err instanceof Error ? err.message : 'Impossible de charger les dépôts.',
      );
    } finally {
      setSubmissionsLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    try {
      const json = await fetchApiJson<{ token: string }>('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode }),
      });
      try {
        sessionStorage.setItem('ucaep_admin_token', json.token);
      } catch {
        // ignore
      }
      setToken(json.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion.');
    }
  }

  function handleLogout() {
    setToken('');
    setData(null);
    setAccessCode('');
    try {
      localStorage.removeItem('ucaep_admin_token');
      sessionStorage.removeItem('ucaep_admin_token');
    } catch {
      // ignore
    }
  }

  async function handleCreateAnnouncement(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    try {
      await fetchApiJson('/api/admin/announcements', {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: annTitle,
          category: annCategory,
          excerpt: annExcerpt,
          content: annContent,
          status: annStatus,
          scheduledAt: annScheduledAt || undefined,
          imageKey: annImage,
        }),
      });
      setAnnTitle('');
      setAnnExcerpt('');
      setAnnContent('');
      setNotice('Annonce enregistrée dans la base.');
      await loadOverview();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Impossible d'enregistrer cette annonce.",
      );
    }
  }

  async function handleAnnouncementStatus(id: string, status: PublicationStatus) {
    try {
      await fetchApiJson(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status }),
      });
      await loadOverview();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Mise à jour impossible.');
    }
  }

  async function handleCreateNews(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    try {
      await fetchApiJson('/api/admin/news', {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: newsTitle,
          category: newsCategory,
          excerpt: newsExcerpt,
          content: newsContent,
          status: newsStatus,
          imageKey: newsImage,
        }),
      });
      setNewsTitle('');
      setNewsExcerpt('');
      setNewsContent('');
      setNotice('Actualité enregistrée dans la base.');
      await loadOverview();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Impossible d'enregistrer cette actualité.",
      );
    }
  }

  async function handleNewsStatus(id: string, status: PublicationStatus) {
    try {
      await fetchApiJson(`/api/admin/news/${id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status }),
      });
      await loadOverview();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Mise à jour impossible.');
    }
  }

  async function handleTogglePhaseReveal(phase: CompetitionPhase) {
    setPhaseActionError('');
    setNotice('');
    setPhaseSavingId(phase.id);
    try {
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phase.id}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            isRevealed: !phase.isRevealed,
            statusLabel: !phase.isRevealed ? 'Ouverte' : 'Verrouillée',
          }),
        },
      );
      if (res?.phase) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                phases: prev.phases.map((p) => (p.id === phase.id ? res.phase : p)),
              }
            : prev,
        );
      }
      await loadOverview();
      setNotice(
        !phase.isRevealed
          ? `Consignes de la Phase ${phase.number} rendues visibles.`
          : `Consignes de la Phase ${phase.number} masquées.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setPhaseActionError(msg);
      setNotice(msg);
    } finally {
      setPhaseSavingId(null);
    }
  }

  async function handlePhaseStatusLabel(
    phaseId: string,
    statusLabel: CompetitionPhase['statusLabel'],
  ) {
    setPhaseActionError('');
    setNotice('');
    setPhaseSavingId(phaseId);
    try {
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phaseId}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ statusLabel }),
        },
      );
      if (res?.phase) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                phases: prev.phases.map((p) => (p.id === phaseId ? res.phase : p)),
              }
            : prev,
        );
      }
      await loadOverview();
      setNotice('Statut de la phase mis à jour avec succès.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setPhaseActionError(msg);
      setNotice(msg);
    } finally {
      setPhaseSavingId(null);
    }
  }

  async function handleToggleSubmissionsOpen(phase: CompetitionPhase) {
    setPhaseActionError('');
    setNotice('');
    setPhaseSavingId(phase.id);
    try {
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phase.id}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ submissionsOpen: !phase.submissionsOpen }),
        },
      );
      if (res?.phase) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                phases: prev.phases.map((p) => (p.id === phase.id ? res.phase : p)),
              }
            : prev,
        );
      }
      await loadOverview();
      setNotice(
        !phase.submissionsOpen
          ? `Dépôts en ligne ouverts pour la Phase ${phase.number}.`
          : `Dépôts fermés pour la Phase ${phase.number}.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setPhaseActionError(msg);
      setNotice(msg);
    } finally {
      setPhaseSavingId(null);
    }
  }

  async function handleSavePhaseDeadline(phaseId: string, rawValue: string | null) {
    setPhaseActionError('');
    setNotice('');
    setPhaseSavingId(phaseId);
    try {
      const isoDeadline =
        rawValue && rawValue.trim() ? new Date(rawValue).toISOString() : null;
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phaseId}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ submissionDeadline: isoDeadline }),
        },
      );
      setPhaseDeadlines((prev) => ({
        ...prev,
        [phaseId]: rawValue || '',
      }));
      if (res?.phase) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                phases: prev.phases.map((p) => (p.id === phaseId ? res.phase : p)),
              }
            : prev,
        );
      }
      await loadOverview();
      setNotice(
        isoDeadline
          ? 'Date limite de dépôt enregistrée.'
          : 'Date limite de dépôt effacée.',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setPhaseActionError(msg);
      setNotice(msg);
    } finally {
      setPhaseSavingId(null);
    }
  }

  function openPhaseEditor(phase: CompetitionPhase) {
    if (editingPhaseId === phase.id) {
      setEditingPhaseId(null);
      return;
    }
    setPhaseActionError('');
    setEditingPhaseId(phase.id);
    setPhaseDraft({
      title: phase.title || '',
      shortDescription: phase.shortDescription || '',
      instructionsTitle: phase.testDetails?.instructionsTitle || '',
      theme: phase.testDetails?.theme || '',
      instructions: phase.testDetails?.instructions || '',
      submissionNote: phase.testDetails?.submissionNote || '',
    });
  }

  async function handleSavePhaseInfo(phaseId: string) {
    if (!phaseDraft.title.trim() || !phaseDraft.shortDescription.trim()) {
      setPhaseActionError('Le titre et la description de la phase sont obligatoires.');
      return;
    }
    setPhaseActionError('');
    setNotice('');
    setPhaseSavingId(phaseId);
    try {
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phaseId}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            title: phaseDraft.title.trim(),
            shortDescription: phaseDraft.shortDescription.trim(),
            testDetails: {
              instructionsTitle: phaseDraft.instructionsTitle.trim(),
              theme: phaseDraft.theme.trim(),
              instructions: phaseDraft.instructions.trim(),
              submissionNote: phaseDraft.submissionNote.trim(),
            },
          }),
        },
      );
      if (res?.phase) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                phases: prev.phases.map((p) => (p.id === phaseId ? res.phase : p)),
              }
            : prev,
        );
      }
      await loadOverview();
      setEditingPhaseId(null);
      setNotice('Informations et consignes de la phase enregistrées.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setPhaseActionError(msg);
      setNotice(msg);
    } finally {
      setPhaseSavingId(null);
    }
  }

  async function handleInspectSubmission(item: AdminSubmissionItem) {
    setInspectingItem(item);
    setInspectingAccess(null);
    setInspectError('');
    setReviewNoteDraft(item.organizerNote || '');
    setInspectLoading(true);
    try {
      const access = await fetchApiJson<AdminSubmissionAccess>(
        `/api/admin/submissions/${item.id}/download`,
        {
          headers: buildAuthHeaders(),
        },
      );
      setInspectingAccess(access);
    } catch (err) {
      setInspectError(
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer ce dépôt pour le moment.',
      );
    } finally {
      setInspectLoading(false);
    }
  }

  async function handleUpdateSubmissionReview(
    submissionId: string,
    patch: { status?: SubmissionStatus; organizerNote?: string },
  ) {
    setReviewSaving(true);
    try {
      const res = await fetchApiJson<{
        submission: {
          id: string;
          status: SubmissionStatus;
          organizerNote: string;
          updatedAt: string;
        };
      }>(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(patch),
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: res.submission.status,
                organizerNote: res.submission.organizerNote,
                updatedAt: res.submission.updatedAt,
              }
            : s,
        ),
      );
      setInspectingItem((prev) =>
        prev && prev.id === submissionId
          ? {
              ...prev,
              status: res.submission.status,
              organizerNote: res.submission.organizerNote,
              updatedAt: res.submission.updatedAt,
            }
          : prev,
      );
      setNotice('Évaluation du dépôt enregistrée.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Mise à jour impossible.');
    } finally {
      setReviewSaving(false);
    }
  }

  function exportSubmissionsCsv() {
    if (!filteredSubmissions.length) return;
    const headers = [
      'Référence',
      'Candidat',
      'Filière',
      'Niveau',
      'Phase',
      'Type',
      'Fichier',
      'Taille (octets)',
      'Statut',
      'Note interne',
      'Date dépôt',
    ];
    const rows = filteredSubmissions.map((s) => [
      s.referenceCode,
      s.candidateName,
      s.candidateDepartment,
      s.candidateStudyLevel,
      `Phase ${s.phaseNumber} — ${s.phaseTitle}`,
      s.kind === 'file' ? 'Fichier' : 'Texte écrit',
      s.fileName || (s.kind === 'text' ? 'Texte en ligne' : ''),
      s.sizeBytes ?? '',
      SUBMISSION_STATUS_META[s.status].label,
      s.organizerNote || '',
      s.updatedAt,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'),
      )
      .join('\r\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `depots-ucaep-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    setGasTestMsg('');
    setGasTestError('');
    try {
      await fetchApiJson('/api/admin/settings', {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ googleAppsScriptUrl: gasUrl }),
      });
      setNotice('Lien Google Sheets enregistré dans la base.');
      await loadOverview();
    } catch (err) {
      setGasTestError(err instanceof Error ? err.message : "Impossible d'enregistrer.");
    }
  }

  async function handleTestGas() {
    setGasTestMsg('');
    setGasTestError('');
    try {
      const res = await fetchApiJson<{ ok: boolean; service: string }>(
        '/api/admin/test-gas',
        {
          method: 'POST',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ url: gasUrl }),
        },
      );
      setGasTestMsg(`Connexion réussie (${res.service}).`);
    } catch (err) {
      setGasTestError(
        err instanceof Error
          ? err.message
          : 'Impossible de joindre le script Google Sheets.',
      );
    }
  }

  async function handleApplySiteConfig(
    overrideMode?: SiteDisplayMode,
    overridePhaseId?: string,
  ) {
    const targetMode = overrideMode || draftSiteMode;
    const targetPhaseId = overridePhaseId || draftActivePhaseId;
    setSiteConfigSaving(true);
    setSiteConfigError('');
    setNotice('');

    try {
      const res = await fetchApiJson<{
        siteDisplay: SiteDisplayConfig;
        phases?: CompetitionPhase[];
      }>('/api/admin/site-config', {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          mode: targetMode,
          activePhaseId: targetPhaseId,
          customNotice: draftCustomNotice,
          alsoRevealPhase:
            targetMode === 'phase_single_page' ? autoRevealOnSwitch : false,
          alsoOpenSubmissions:
            targetMode === 'phase_single_page' && targetPhaseId !== 'phase-3'
              ? autoOpenSubmissionsOnSwitch
              : false,
        }),
      });

      setDraftSiteMode(res.siteDisplay.mode);
      setDraftActivePhaseId(res.siteDisplay.activePhaseId);
      setDraftCustomNotice(res.siteDisplay.customNotice || '');
      siteDraftInitializedRef.current = true;

      setData((prev) =>
        prev
          ? {
              ...prev,
              phases: res.phases || prev.phases,
              settings: {
                ...prev.settings,
                siteDisplay: res.siteDisplay,
              },
            }
          : prev,
      );

      await Promise.all([loadOverview(), refreshSiteConfig()]);

      if (res.siteDisplay.mode === 'multi_page') {
        setNotice(
          'Interface publique basculée en mode Site complet (Multi-pages · Inscriptions).',
        );
      } else {
        const chosenPhase = (res.phases || data?.phases || []).find(
          (p) => p.id === res.siteDisplay.activePhaseId,
        );
        setNotice(
          `Site public transformé en Page Unique centrée sur la Phase ${chosenPhase?.number || ''} (${chosenPhase?.title || res.siteDisplay.activePhaseId}).`,
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible d'appliquer cette interface sur le site.";
      setSiteConfigError(msg);
      setNotice(msg);
    } finally {
      setSiteConfigSaving(false);
    }
  }

  function exportCsv() {
    if (!data?.registrations.length) return;
    const headers = [
      'Référence',
      'Date inscription',
      'Prénom',
      'Nom',
      'E-mail',
      'Téléphone',
      'Date de naissance',
      'Genre',
      'Établissement',
      'Filière',
      'Niveau',
      'Matricule',
      'Motivation',
      'Expérience',
      'Synchro Google Sheets',
    ];
    const rows = data.registrations.map((r) => [
      r.referenceCode,
      r.createdAt,
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.birthDate,
      r.gender,
      r.institution,
      r.department,
      r.studyLevel,
      r.studentId,
      r.motivation,
      r.readingExperience || '',
      r.syncedToGoogleSheets ? 'Oui' : 'Non',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(';'),
      )
      .join('\r\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inscriptions-ucaep-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredCandidates = useMemo(() => {
    if (!data?.registrations) return [];
    if (!candidateSearch.trim()) return data.registrations;
    const q = candidateSearch.trim().toLowerCase();
    return data.registrations.filter(
      (r) =>
        r.referenceCode.toLowerCase().includes(q) ||
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q),
    );
  }, [data?.registrations, candidateSearch]);

  const totalCandidatePages =
    Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (candidatePage - 1) * CANDIDATES_PER_PAGE;
    return filteredCandidates.slice(start, start + CANDIDATES_PER_PAGE);
  }, [filteredCandidates, candidatePage]);

  const stats = useMemo(() => {
    if (!data?.registrations) return { total: 0, byDept: {}, byLevel: {} };
    const byDept: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    for (const r of data.registrations) {
      byDept[r.department] = (byDept[r.department] || 0) + 1;
      byLevel[r.studyLevel] = (byLevel[r.studyLevel] || 0) + 1;
    }
    return {
      total: data.registrations.length,
      byDept,
      byLevel,
    };
  }, [data?.registrations]);

  const submissionStats = useMemo(() => {
    let received = 0;
    let validated = 0;
    let rejected = 0;
    for (const s of submissions) {
      if (s.status === 'validated') validated += 1;
      else if (s.status === 'rejected') rejected += 1;
      else received += 1;
    }
    return { total: submissions.length, received, validated, rejected };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (submissionPhaseFilter !== 'all' && s.phaseId !== submissionPhaseFilter) {
        return false;
      }
      if (submissionStatusFilter !== 'all' && s.status !== submissionStatusFilter) {
        return false;
      }
      if (submissionSearch.trim()) {
        const q = submissionSearch.trim().toLowerCase();
        return (
          s.referenceCode.toLowerCase().includes(q) ||
          s.candidateName.toLowerCase().includes(q) ||
          s.candidateDepartment.toLowerCase().includes(q) ||
          (s.fileName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [submissions, submissionPhaseFilter, submissionStatusFilter, submissionSearch]);

  if (!token) {
    return (
      <div className="py-20 bg-ucaep-paper">
        <div className="max-w-md mx-auto px-4">
          <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-green">
                Équipe UCAEP
              </p>
              <h1 className="font-serif text-3xl font-semibold text-ucaep-brown">
                Espace organisateurs
              </h1>
              <p className="text-sm text-ucaep-ink/75">
                Modifier les annonces, ouvrir ou fermer les phases du concours et suivre les inscriptions reçues.
              </p>
            </div>

            {authError && (
              <p className="p-3 text-sm bg-red-50 text-red-900 border border-red-800/20 rounded-sm">
                {authError}
              </p>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="org-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                >
                  Code d&apos;accès
                </label>
                <input
                  id="org-code"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Entrez le code de l'équipe"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 text-sm font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors"
              >
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 bg-ucaep-paper">
        <div className="max-w-lg mx-auto px-4 text-center space-y-6">
          <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
              Chargement des données du concours
            </h2>
            {authError ? (
              <div className="space-y-4 text-left">
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 wrap-break-word whitespace-pre-line leading-relaxed font-mono">
                  {authError}
                </div>
                <button
                  type="button"
                  onClick={() => loadOverview(token)}
                  disabled={isRefreshing}
                  className="w-full py-2.5 text-sm font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? 'Connexion en cours...' : 'Réessayer la connexion'}
                </button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-ucaep-ink/60 hover:text-ucaep-brown underline"
                  >
                    Se déconnecter / Changer de code
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <RefreshCw className="w-8 h-8 text-ucaep-brown animate-spin" />
                <p className="text-sm text-ucaep-ink/75">
                  Synchronisation avec la base de données PostgreSQL...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-14 bg-ucaep-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ucaep-brown/15 pb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-ucaep-green">
              Équipe UCAEP · Organisation
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                Gestion du concours
              </h1>
              {data?.databaseConnected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Base PostgreSQL connectée (Supabase)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Mode dégradé local (DATABASE_URL non configuré)</span>
                </div>
              )}
              {lastSyncedAt && (
                <span className="text-[11px] text-ucaep-ink/60 hidden md:inline">
                  Synchro : {lastSyncedAt.toLocaleTimeString('fr-FR')}
                </span>
              )}
              <button
                type="button"
                onClick={() => loadOverview()}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-ucaep-brown/20 bg-white text-ucaep-brown hover:bg-ucaep-paper transition-colors disabled:opacity-50"
                title="Actualiser les données immédiatement"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-ucaep-brown/20 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-ucaep-ivory/45 rounded-sm border border-ucaep-brown/12">
            {(
              [
                ['interface', 'Interface du site'],
                ['annonces', 'Annonces'],
                ['actualites', `Actualités (${data.news.length})`],
                ['parcours', 'Phases'],
                ['candidats', `Inscrits (${data.registrations.length})`],
                ['depots', `Dépôts${submissions.length ? ` (${submissions.length})` : ''}`],
                ['config', 'Paramètres'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  tab === id
                    ? 'bg-ucaep-brown text-ucaep-paper'
                    : 'text-ucaep-brown hover:bg-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bandeau d'état rapide de l'interface publique */}
        {(() => {
          const liveConfig = data.settings?.siteDisplay || {
            mode: 'multi_page' as SiteDisplayMode,
            activePhaseId: 'phase-1',
          };
          const livePhase = data.phases.find((p) => p.id === liveConfig.activePhaseId);
          return (
            <div className="px-5 py-3.5 bg-white border border-ucaep-brown/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="font-semibold uppercase tracking-wider text-ucaep-brown/70">
                  Interface publique en ligne :
                </span>
                {liveConfig.mode === 'phase_single_page' ? (
                  <span className="font-semibold text-ucaep-green">
                    Page Unique — Phase {livePhase?.number} : {livePhase?.title}
                  </span>
                ) : (
                  <span className="font-semibold text-ucaep-brown">
                    Site Complet (Multi-pages · Inscriptions)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {tab !== 'interface' && (
                  <button
                    type="button"
                    onClick={() => selectTab('interface')}
                    className="text-xs font-semibold text-ucaep-brown underline hover:text-ucaep-gold"
                  >
                    Réorganiser l&apos;interface du site
                  </button>
                )}
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-ucaep-ivory/70 text-ucaep-brown hover:bg-ucaep-gold/30 transition-colors"
                >
                  <span>Voir le site public</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })()}

        {data && data.databaseConnected === false && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-sm text-sm space-y-1.5 shadow-xs">
            <p className="font-semibold flex items-center gap-2 text-amber-900">
              <span>⚠️ Base de données PostgreSQL non connectée sur cet environnement</span>
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              La variable <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">DATABASE_URL</code> n&apos;est pas détectée (si vous êtes sur Vercel : configurez-la dans <em>Project Settings &gt; Environment Variables</em>).
              Sans cette connexion, les données sont stockées temporairement et seront remises à zéro à chaque redémarrage ou reconnexion.
            </p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="sticky top-3 z-40 p-3.5 text-sm bg-white text-ucaep-green border border-ucaep-green/40 rounded-sm shadow-md"
          >
            {notice}
          </div>
        )}

        {/* ONGLET INTERFACE DU SITE */}
        {tab === 'interface' && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-5">
                <div className="space-y-1.5 max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                    Pilotage de l&apos;architecture publique
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ucaep-brown">
                    Basculer entre site complet et page unique par phase
                  </h2>
                  <p className="text-sm text-ucaep-ink/75 leading-relaxed">
                    Après la clôture des inscriptions, sélectionnez la phase en cours
                    pour transformer immédiatement l&apos;ensemble du site public en une
                    page unique dédiée exclusivement à cette phase (consignes, barème,
                    dépôt en ligne et annonces). L&apos;accès à{' '}
                    <span className="font-mono text-xs">/gestion</span> reste toujours
                    disponible.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-sm border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-paper shrink-0"
                >
                  <span>Ouvrir le site public</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {siteConfigError && (
                <div
                  role="alert"
                  className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900 flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{siteConfigError}</span>
                </div>
              )}

              {/* 4 cartes cliquables : Site complet OR Page unique Phase 1 / 2 / 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setDraftSiteMode('multi_page')}
                  className={`text-left p-5 rounded-sm border transition-all space-y-3 ${
                    draftSiteMode === 'multi_page'
                      ? 'bg-[#F7E6C8]/45 border-ucaep-gold ring-2 ring-ucaep-gold/30'
                      : 'bg-ucaep-paper/50 border-ucaep-brown/15 hover:border-ucaep-brown/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ucaep-brown">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Multi-pages</span>
                    </span>
                    {data.settings?.siteDisplay?.mode !== 'phase_single_page' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ucaep-green">
                        · Actif
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                    Site complet (Inscriptions)
                  </h3>
                  <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                    Affiche toutes les pages du site (Accueil, Concours, Parcours,
                    Annonces, Actualités, FAQ, Inscription et Dépôt).
                  </p>
                </button>

                {data.phases.map((phase) => {
                  const isSelected =
                    draftSiteMode === 'phase_single_page' &&
                    draftActivePhaseId === phase.id;
                  const isCurrentlyLive =
                    data.settings?.siteDisplay?.mode === 'phase_single_page' &&
                    data.settings?.siteDisplay?.activePhaseId === phase.id;

                  return (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => {
                        setDraftSiteMode('phase_single_page');
                        setDraftActivePhaseId(phase.id);
                      }}
                      className={`text-left p-5 rounded-sm border transition-all space-y-3 ${
                        isSelected
                          ? 'bg-[#F7E6C8]/45 border-ucaep-gold ring-2 ring-ucaep-gold/30'
                          : 'bg-ucaep-paper/50 border-ucaep-brown/15 hover:border-ucaep-brown/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ucaep-brown">
                          <LayoutTemplate className="w-3.5 h-3.5" />
                          <span>Page unique · {phase.number}</span>
                        </span>
                        {isCurrentlyLive && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-ucaep-green">
                            · Actif
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                        Phase {phase.number} : {phase.title}
                      </h3>
                      <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                        {phase.format === 'En présentiel'
                          ? 'Site en 1 page dédié à la Grande Finale en présentiel (programme, jury, annonces).'
                          : `Site en 1 page centré sur ${phase.title} (consignes, barème, dépôt en ligne et annonces).`}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Options complémentaires pour le mode Page Unique */}
              {draftSiteMode === 'phase_single_page' && (
                <div className="p-5 bg-ucaep-paper border border-ucaep-brown/15 rounded-sm space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ucaep-brown">
                    Options d&apos;activation pour cette phase
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-ucaep-ink/85">
                    <label className="flex items-start gap-2.5 p-3 bg-white border border-ucaep-brown/12 rounded-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRevealOnSwitch}
                        onChange={(e) => setAutoRevealOnSwitch(e.target.checked)}
                        className="mt-0.5 accent-ucaep-brown"
                      />
                      <span>
                        <strong className="block text-ucaep-brown">
                          Rendre automatiquement les consignes visibles
                        </strong>
                        Affiche les sujets, thèmes et directives détaillées de la phase
                        sur la page unique dès la bascule.
                      </span>
                    </label>

                    {draftActivePhaseId !== 'phase-3' && (
                      <label className="flex items-start gap-2.5 p-3 bg-white border border-ucaep-brown/12 rounded-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoOpenSubmissionsOnSwitch}
                          onChange={(e) =>
                            setAutoOpenSubmissionsOnSwitch(e.target.checked)
                          }
                          className="mt-0.5 accent-ucaep-brown"
                        />
                        <span>
                          <strong className="block text-ucaep-brown">
                            Ouvrir également la fenêtre de dépôt en ligne
                          </strong>
                          Permet aux candidats d&apos;envoyer leur travail directement
                          depuis la section Dépôt de la page unique.
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="site-custom-notice"
                      className="block text-xs font-semibold text-ucaep-brown"
                    >
                      Message d&apos;information rapide affiché en haut de la page unique
                      (optionnel)
                    </label>
                    <input
                      id="site-custom-notice"
                      type="text"
                      maxLength={400}
                      value={draftCustomNotice}
                      onChange={(e) => setDraftCustomNotice(e.target.value)}
                      placeholder="Ex. : Les inscriptions sont clôturées. Place à la Phase 01 jusqu'au vendredi à 23h59."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  disabled={siteConfigSaving}
                  onClick={() => handleApplySiteConfig()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {siteConfigSaving
                      ? 'Application en cours...'
                      : draftSiteMode === 'multi_page'
                        ? 'Activer le site complet (Multi-pages)'
                        : `Activer la page unique (${
                            data.phases.find((p) => p.id === draftActivePhaseId)?.title ||
                            draftActivePhaseId
                          })`}
                  </span>
                </button>
                <p className="text-xs text-ucaep-ink/65">
                  Vous pouvez modifier les consignes et dates limites de chaque phase à
                  tout moment dans l&apos;onglet <strong>Phases</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET ANNONCES */}
        {tab === 'annonces' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-5 h-fit">
              <h2 className="font-serif text-2xl font-semibold text-ucaep-brown flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Nouvelle annonce</span>
              </h2>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <input
                  type="text"
                  placeholder="Titre de l'annonce"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Catégorie"
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                  />
                  <select
                    value={annImage}
                    onChange={(e) => setAnnImage(e.target.value as MediaAssetKey)}
                    className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white"
                  >
                    <option value="campus">Photo Campus</option>
                    <option value="hero">Photo Lecture</option>
                    <option value="plume">Photo La Plume</option>
                    <option value="connaissance">Photo Connaissance</option>
                    <option value="eloquence">Photo Éloquence</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Résumé en une phrase"
                  value={annExcerpt}
                  onChange={(e) => setAnnExcerpt(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                />
                <textarea
                  rows={4}
                  placeholder="Texte complet de l'annonce"
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={annStatus}
                    onChange={(e) => setAnnStatus(e.target.value as PublicationStatus)}
                    className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="scheduled">Programmé</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                  {annStatus === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={annScheduledAt}
                      onChange={(e) => setAnnScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                >
                  Enregistrer l&apos;annonce
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {data.announcements.length === 0 ? (
                <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/70">
                  Il n&apos;y a encore aucune publication ici.
                </div>
              ) : (
                data.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white border border-ucaep-brown/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-ucaep-brown/75 tabular-nums">
                        <span>{STATUS_LABELS[item.status]}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{formatFrenchDate(item.publishedAt)}</span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-ucaep-ink">
                        {item.title}
                      </h3>
                      <p className="text-xs text-ucaep-ink/70">{item.excerpt}</p>
                    </div>
                    <select
                      aria-label={`Changer le statut de ${item.title}`}
                      value={item.status}
                      onChange={(e) =>
                        handleAnnouncementStatus(
                          item.id,
                          e.target.value as PublicationStatus,
                        )
                      }
                      className="px-3 py-2 text-xs font-medium border border-ucaep-brown/25 rounded-sm bg-ucaep-paper shrink-0"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="scheduled">Programmé</option>
                      <option value="published">Publié</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ONGLET ACTUALITÉS */}
        {tab === 'actualites' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-5 h-fit">
              <h2 className="font-serif text-2xl font-semibold text-ucaep-brown flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Nouvel article</span>
              </h2>
              <form onSubmit={handleCreateNews} className="space-y-4">
                <input
                  type="text"
                  placeholder="Titre de l'article"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newsCategory}
                    onChange={(e) =>
                      setNewsCategory(e.target.value as NewsArticle['category'])
                    }
                    className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white"
                  >
                    <option value="Vie du concours">Vie du concours</option>
                    <option value="Conseils de lecture">Conseils de lecture</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Grand angle">Grand angle</option>
                  </select>
                  <select
                    value={newsImage}
                    onChange={(e) => setNewsImage(e.target.value as MediaAssetKey)}
                    className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white"
                  >
                    <option value="campus">Photo Campus</option>
                    <option value="hero">Photo Lecture</option>
                    <option value="plume">Photo La Plume</option>
                    <option value="connaissance">Photo Connaissance</option>
                    <option value="eloquence">Photo Éloquence</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Accroche ou extrait court"
                  value={newsExcerpt}
                  onChange={(e) => setNewsExcerpt(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                />
                <textarea
                  rows={6}
                  placeholder="Corps de l'article (séparez les paragraphes par une ligne vide)"
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-ucaep-brown">
                    Statut de publication
                  </label>
                  <select
                    value={newsStatus}
                    onChange={(e) =>
                      setNewsStatus(e.target.value as PublicationStatus)
                    }
                    className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white"
                  >
                    <option value="published">Publié (visible immédiatement)</option>
                    <option value="draft">Brouillon (invisible du public)</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                >
                  Enregistrer l&apos;actualité
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {data.news.length === 0 ? (
                <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/70">
                  Aucun article d&apos;actualité pour le moment.
                </div>
              ) : (
                data.news.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white border border-ucaep-brown/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-ucaep-brown/75 tabular-nums">
                        <span>{STATUS_LABELS[item.status]}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{formatFrenchDate(item.publishedAt)}</span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-ucaep-ink">
                        {item.title}
                      </h3>
                      <p className="text-xs text-ucaep-ink/70">{item.excerpt}</p>
                    </div>
                    <select
                      aria-label={`Changer le statut de ${item.title}`}
                      value={item.status}
                      onChange={(e) =>
                        handleNewsStatus(item.id, e.target.value as PublicationStatus)
                      }
                      className="px-3 py-2 text-xs font-medium border border-ucaep-brown/25 rounded-sm bg-ucaep-paper shrink-0"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ONGLET PARCOURS */}
        {tab === 'parcours' && (
          <div className="space-y-6">
            {phaseActionError && (
              <div
                role="alert"
                className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900 flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{phaseActionError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {data.phases.map((phase) => {
                const isBusy = phaseSavingId === phase.id;
                const isEditing = editingPhaseId === phase.id;

                return (
                  <div
                    key={phase.id}
                    className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs text-ucaep-brown/75 tabular-nums">
                      <span>Phase {phase.number}</span>
                      <span>{phase.format}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
                      {phase.title}
                    </h2>
                    <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                      {phase.shortDescription}
                    </p>

                    <div className="pt-2 space-y-3 border-t border-ucaep-brown/10">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-ucaep-brown">
                          Statut affiché aux étudiants
                        </label>
                        <select
                          disabled={isBusy}
                          value={phase.statusLabel}
                          onChange={(e) =>
                            handlePhaseStatusLabel(
                              phase.id,
                              e.target.value as CompetitionPhase['statusLabel'],
                            )
                          }
                          className="w-full px-3 py-2 text-xs border border-ucaep-brown/25 rounded-sm bg-ucaep-paper disabled:opacity-50"
                        >
                          <option value="À venir">À venir</option>
                          <option value="Ouverte">Ouverte</option>
                          <option value="En cours">En cours</option>
                          <option value="Verrouillée">Verrouillée</option>
                          <option value="Clôturée">Clôturée</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleTogglePhaseReveal(phase)}
                        className={`w-full py-2.5 px-4 text-xs font-semibold rounded-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                          phase.isRevealed
                            ? 'bg-ucaep-green text-ucaep-paper'
                            : 'bg-ucaep-ivory text-ucaep-brown hover:bg-ucaep-gold/30'
                        }`}
                      >
                        {phase.isRevealed ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>
                              {isBusy ? 'Mise à jour...' : 'Consignes visibles par tous'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isBusy ? 'Activation...' : 'Rendre les consignes visibles'}
                            </span>
                          </>
                        )}
                      </button>

                      {phase.format !== 'En présentiel' && phase.id !== 'phase-3' ? (
                        <div className="pt-3 border-t border-ucaep-brown/10 space-y-3">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleSubmissionsOpen(phase)}
                            className={`w-full py-2.5 px-4 text-xs font-semibold rounded-sm inline-flex items-center justify-center gap-2 border transition-colors disabled:opacity-50 ${
                              phase.submissionsOpen
                                ? 'bg-ucaep-gold text-ucaep-ink border-ucaep-gold'
                                : 'bg-white text-ucaep-brown border-ucaep-brown/25 hover:bg-ucaep-paper'
                            }`}
                          >
                            <span>
                              {isBusy
                                ? 'Enregistrement...'
                                : phase.submissionsOpen
                                  ? 'Dépôts ouverts (cliquer pour fermer)'
                                  : 'Ouvrir les dépôts en ligne'}
                            </span>
                          </button>

                          <div className="space-y-1.5">
                            <label
                              htmlFor={`deadline-${phase.id}`}
                              className="block text-[11px] font-medium text-ucaep-brown"
                            >
                              Date limite de dépôt
                            </label>
                            <input
                              id={`deadline-${phase.id}`}
                              type="datetime-local"
                              disabled={isBusy}
                              value={
                                phaseDeadlines[phase.id] ??
                                toDateTimeLocalValue(phase.submissionDeadline)
                              }
                              onChange={(e) =>
                                setPhaseDeadlines((prev) => ({
                                  ...prev,
                                  [phase.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs border border-ucaep-brown/25 rounded-sm bg-ucaep-paper"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleSavePhaseDeadline(
                                    phase.id,
                                    phaseDeadlines[phase.id] ?? '',
                                  )
                                }
                                className="flex-1 py-1.5 px-2.5 text-[11px] font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] disabled:opacity-50"
                              >
                                Enregistrer la date
                              </button>
                              {(phase.submissionDeadline || phaseDeadlines[phase.id]) && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleSavePhaseDeadline(phase.id, null)}
                                  className="py-1.5 px-2.5 text-[11px] font-medium rounded-sm border border-ucaep-brown/20 text-ucaep-brown hover:bg-ucaep-paper disabled:opacity-50"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-ucaep-brown/10 text-[11px] text-ucaep-ink/65">
                          Épreuve en présentiel sur le campus : aucun dépôt de fichier en ligne.
                        </div>
                      )}

                      {/* Bouton et formulaire d'édition des informations & consignes */}
                      <div className="pt-3 border-t border-ucaep-brown/10 space-y-3">
                        <button
                          type="button"
                          onClick={() => openPhaseEditor(phase)}
                          className="w-full py-2 px-3 text-xs font-semibold rounded-sm border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-paper inline-flex items-center justify-center gap-2 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>
                            {isEditing
                              ? 'Fermer l’éditeur'
                              : 'Modifier les informations et consignes'}
                          </span>
                        </button>

                        {isEditing && (
                          <div className="p-3.5 bg-ucaep-paper/75 border border-ucaep-brown/15 rounded-sm space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-ucaep-brown">
                                Titre de la phase *
                              </label>
                              <input
                                type="text"
                                value={phaseDraft.title}
                                onChange={(e) =>
                                  setPhaseDraft((d) => ({ ...d, title: e.target.value }))
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-ucaep-brown">
                                Description résumée *
                              </label>
                              <textarea
                                rows={3}
                                value={phaseDraft.shortDescription}
                                onChange={(e) =>
                                  setPhaseDraft((d) => ({
                                    ...d,
                                    shortDescription: e.target.value,
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-ucaep-brown">
                                Intitulé complet des consignes
                              </label>
                              <input
                                type="text"
                                value={phaseDraft.instructionsTitle}
                                onChange={(e) =>
                                  setPhaseDraft((d) => ({
                                    ...d,
                                    instructionsTitle: e.target.value,
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-ucaep-brown">
                                Thème / Épreuves
                              </label>
                              <input
                                type="text"
                                value={phaseDraft.theme}
                                onChange={(e) =>
                                  setPhaseDraft((d) => ({ ...d, theme: e.target.value }))
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-ucaep-brown">
                                Consignes détaillées aux candidats
                              </label>
                              <textarea
                                rows={4}
                                value={phaseDraft.instructions}
                                onChange={(e) =>
                                  setPhaseDraft((d) => ({
                                    ...d,
                                    instructions: e.target.value,
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-ucaep-brown">
                                Note pratique de dépôt / notation
                              </label>
                              <input
                                type="text"
                                value={phaseDraft.submissionNote}
                                onChange={(e) =>
                                  setPhaseDraft((d) => ({
                                    ...d,
                                    submissionNote: e.target.value,
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSavePhaseInfo(phase.id)}
                                className="flex-1 py-2 px-3 text-xs font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-50"
                              >
                                {isBusy ? 'Enregistrement...' : 'Enregistrer les infos'}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setEditingPhaseId(null)}
                                className="py-2 px-3 text-xs font-medium rounded-sm border border-ucaep-brown/20 text-ucaep-brown bg-white hover:bg-ucaep-paper"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ONGLET CANDIDATS */}
        {tab === 'candidats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-ucaep-brown/15 rounded-sm space-y-1">
                <p className="text-xs uppercase tracking-wider text-ucaep-brown/75 font-medium">
                  Total des inscrits
                </p>
                <p className="text-3xl font-serif font-bold text-ucaep-brown tabular-nums">
                  {stats.total}
                </p>
              </div>

              <div className="p-5 bg-white border border-ucaep-brown/15 rounded-sm space-y-2 md:col-span-2">
                <p className="text-xs uppercase tracking-wider text-ucaep-brown/75 font-medium">
                  Répartition par filière et niveau
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(stats.byDept).map(([dept, count]) => (
                    <span
                      key={dept}
                      className="px-2.5 py-1 bg-ucaep-ivory/60 text-ucaep-brown rounded-sm font-medium"
                    >
                      {dept} : <strong className="tabular-nums">{count}</strong>
                    </span>
                  ))}
                  {Object.entries(stats.byLevel).map(([level, count]) => (
                    <span
                      key={level}
                      className="px-2.5 py-1 bg-ucaep-green/10 text-ucaep-green rounded-sm font-medium"
                    >
                      {level} : <strong className="tabular-nums">{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ucaep-brown/50" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, e-mail, matricule, code..."
                  value={candidateSearch}
                  onChange={(e) => {
                    setCandidateSearch(e.target.value);
                    setCandidatePage(1);
                  }}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white focus:outline-none focus:border-ucaep-gold"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadOverview()}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper transition-colors disabled:opacity-50"
                  title="Rafraîchir la liste des inscrits"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!data.registrations.length}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter en CSV (Excel)</span>
                </button>
              </div>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/70">
                {candidateSearch
                  ? 'Aucun inscrit ne correspond à votre recherche.'
                  : "Personne ne s'est encore inscrit pour le moment."}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto bg-white border border-ucaep-brown/15 rounded-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-ucaep-brown/15 text-xs uppercase tracking-wider text-ucaep-brown bg-ucaep-paper">
                      <tr>
                        <th className="py-3 px-4">Référence</th>
                        <th className="py-3 px-4">Participant</th>
                        <th className="py-3 px-4">Filière &amp; Niveau</th>
                        <th className="py-3 px-4">Matricule</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ucaep-brown/10 tabular-nums">
                      {paginatedCandidates.map((r) => (
                        <tr key={r.id} className="hover:bg-ucaep-paper/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-ucaep-brown">
                            {r.referenceCode}
                          </td>
                          <td className="py-3 px-4">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="py-3 px-4 text-xs text-ucaep-ink/80">
                            {r.department} · {r.studyLevel}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono">{r.studentId}</td>
                          <td className="py-3 px-4 text-xs text-ucaep-ink/75">
                            {r.email} · {r.phone}
                          </td>
                          <td className="py-3 px-4 text-xs text-right text-ucaep-ink/60">
                            {formatFrenchDate(r.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalCandidatePages > 1 && (
                  <div className="flex items-center justify-between text-xs text-ucaep-brown">
                    <span>
                      Page {candidatePage} sur {totalCandidatePages} (
                      {filteredCandidates.length} inscrits affichés)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCandidatePage((p) => Math.max(1, p - 1))}
                        disabled={candidatePage === 1}
                        className="px-3 py-1.5 border border-ucaep-brown/25 rounded-sm disabled:opacity-30 bg-white"
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCandidatePage((p) =>
                            Math.min(totalCandidatePages, p + 1),
                          )
                        }
                        disabled={candidatePage === totalCandidatePages}
                        className="px-3 py-1.5 border border-ucaep-brown/25 rounded-sm disabled:opacity-30 bg-white"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ONGLET DÉPÔTS */}
        {tab === 'depots' && (
          <div className="space-y-6">
            {!submissionsStorageReady && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 leading-relaxed">
                Les variables serveur <code className="font-mono font-bold">SUPABASE_URL</code> et{' '}
                <code className="font-mono font-bold">SUPABASE_SECRET_KEY</code> ne sont pas encore
                configurées. La génération de liens de téléchargement pour les fichiers sera disponible
                dès leur ajout.
              </div>
            )}

            {submissionsError && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900">
                {submissionsError}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-ucaep-brown/15 rounded-sm">
                <p className="text-[11px] uppercase tracking-wider text-ucaep-brown/75 font-medium">
                  Total dépôts
                </p>
                <p className="text-3xl font-serif font-bold text-ucaep-brown tabular-nums mt-1">
                  {submissionStats.total}
                </p>
              </div>
              <div className="p-4 bg-white border border-ucaep-brown/15 rounded-sm">
                <p className="text-[11px] uppercase tracking-wider text-amber-800 font-medium">
                  Reçus (à relire)
                </p>
                <p className="text-3xl font-serif font-bold text-amber-800 tabular-nums mt-1">
                  {submissionStats.received}
                </p>
              </div>
              <div className="p-4 bg-white border border-ucaep-brown/15 rounded-sm">
                <p className="text-[11px] uppercase tracking-wider text-ucaep-green font-medium">
                  Validés
                </p>
                <p className="text-3xl font-serif font-bold text-ucaep-green tabular-nums mt-1">
                  {submissionStats.validated}
                </p>
              </div>
              <div className="p-4 bg-white border border-ucaep-brown/15 rounded-sm">
                <p className="text-[11px] uppercase tracking-wider text-red-800 font-medium">
                  Refusés
                </p>
                <p className="text-3xl font-serif font-bold text-red-800 tabular-nums mt-1">
                  {submissionStats.rejected}
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[210px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ucaep-brown/50" />
                  <input
                    type="text"
                    placeholder="Nom, référence, fichier..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-ucaep-brown/25 rounded-sm bg-white focus:outline-none focus:border-ucaep-gold"
                  />
                </div>
                <select
                  aria-label="Filtrer par phase"
                  value={submissionPhaseFilter}
                  onChange={(e) => setSubmissionPhaseFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border border-ucaep-brown/25 rounded-sm bg-white"
                >
                  <option value="all">Toutes les phases</option>
                  {data.phases
                    .filter((p) => p.format !== 'En présentiel' && p.id !== 'phase-3')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        Phase {p.number} — {p.title}
                      </option>
                    ))}
                </select>
                <select
                  aria-label="Filtrer par statut"
                  value={submissionStatusFilter}
                  onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border border-ucaep-brown/25 rounded-sm bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="received">Reçu</option>
                  <option value="validated">Validé</option>
                  <option value="rejected">Refusé</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadSubmissions()}
                  disabled={submissionsLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${submissionsLoading ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
                <button
                  type="button"
                  onClick={exportSubmissionsCsv}
                  disabled={!filteredSubmissions.length}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter CSV</span>
                </button>
              </div>
            </div>

            {submissionsLoading && submissions.length === 0 ? (
              <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/70">
                Chargement des dépôts en cours...
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-8 bg-white border border-ucaep-brown/15 rounded-sm text-sm text-ucaep-ink/70">
                Aucun dépôt reçu pour ces critères pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-ucaep-brown/15 rounded-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-ucaep-brown/15 text-xs uppercase tracking-wider text-ucaep-brown bg-ucaep-paper">
                    <tr>
                      <th className="py-3 px-4">Candidat</th>
                      <th className="py-3 px-4">Phase</th>
                      <th className="py-3 px-4">Production</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ucaep-brown/10 tabular-nums">
                    {filteredSubmissions.map((item) => {
                      const badge = SUBMISSION_STATUS_META[item.status];
                      return (
                        <tr key={item.id} className="hover:bg-ucaep-paper/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-ucaep-brown">
                              {item.candidateName}
                            </div>
                            <div className="text-xs text-ucaep-ink/65">
                              <span className="font-mono">{item.referenceCode}</span> ·{' '}
                              {item.candidateDepartment}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-ucaep-brown">
                            Phase {item.phaseNumber} — {item.phaseTitle}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            {item.kind === 'file' ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-medium text-ucaep-ink truncate">
                                  {item.fileName || 'Fichier'}
                                </div>
                                <div className="text-[11px] text-ucaep-ink/60">
                                  {formatFileSize(item.sizeBytes)}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="inline-flex items-center gap-1 text-xs font-medium text-ucaep-brown">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Texte écrit</span>
                                </div>
                                <p className="text-[11px] text-ucaep-ink/65 line-clamp-2">
                                  {item.textPreview}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold border rounded-sm ${badge.badgeClass}`}
                            >
                              {badge.label}
                            </span>
                            {item.organizerNote && (
                              <p className="text-[11px] text-ucaep-ink/60 mt-1 line-clamp-1">
                                Note : {item.organizerNote}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-ucaep-ink/65">
                            {formatFrenchDate(item.updatedAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleInspectSubmission(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Voir / Évaluer</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* FENÊTRE D'INSPECTION & ÉVALUATION D'UN DÉPÔT */}
            {inspectingItem && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Dépôt de ${inspectingItem.candidateName}`}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
              >
                <div className="w-full max-w-3xl bg-white border border-ucaep-brown/20 rounded-sm shadow-2xl overflow-hidden my-8">
                  <div className="px-6 py-4 bg-ucaep-paper border-b border-ucaep-brown/15 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-ucaep-green">
                        Phase {inspectingItem.phaseNumber} — {inspectingItem.phaseTitle}
                      </p>
                      <h3 className="font-serif text-2xl font-semibold text-ucaep-brown">
                        {inspectingItem.candidateName} ({inspectingItem.referenceCode})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectingItem(null);
                        setInspectingAccess(null);
                      }}
                      aria-label="Fermer"
                      className="p-1.5 text-ucaep-brown/70 hover:text-ucaep-brown rounded-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {inspectLoading ? (
                      <div className="py-10 text-center text-sm text-ucaep-ink/70">
                        Préparation de la lecture sécurisée...
                      </div>
                    ) : inspectError ? (
                      <div className="p-4 bg-red-50 border border-red-300 rounded-sm text-sm text-red-900">
                        {inspectError}
                      </div>
                    ) : inspectingAccess ? (
                      <div className="space-y-4">
                        {inspectingAccess.kind === 'text' ? (
                          <div className="p-5 bg-ucaep-paper border border-ucaep-brown/15 rounded-sm max-h-96 overflow-y-auto">
                            <p className="text-sm text-ucaep-ink whitespace-pre-wrap leading-relaxed">
                              {inspectingAccess.textContent}
                            </p>
                          </div>
                        ) : inspectingAccess.signedUrl ? (
                          <div className="space-y-4">
                            {inspectingAccess.mimeType?.startsWith('video/') && (
                              <video
                                controls
                                src={inspectingAccess.signedUrl}
                                className="w-full max-h-[50vh] bg-black rounded-sm"
                              />
                            )}
                            {inspectingAccess.mimeType?.startsWith('audio/') && (
                              <div className="p-4 bg-ucaep-paper border border-ucaep-brown/15 rounded-sm">
                                <audio
                                  controls
                                  src={inspectingAccess.signedUrl}
                                  className="w-full"
                                />
                              </div>
                            )}
                            {inspectingAccess.mimeType === 'application/pdf' && (
                              <iframe
                                title={inspectingAccess.fileName || 'Aperçu PDF'}
                                src={inspectingAccess.signedUrl}
                                className="w-full h-96 border border-ucaep-brown/15 rounded-sm"
                              />
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-ucaep-linen/60 border border-ucaep-brown/15 rounded-sm">
                              <div className="text-xs text-ucaep-ink/75">
                                <span className="font-semibold text-ucaep-brown">
                                  {inspectingAccess.fileName}
                                </span>{' '}
                                · {formatFileSize(inspectingAccess.sizeBytes)} · Lien temporaire
                                valable 10 minutes
                              </div>
                              <a
                                href={inspectingAccess.signedUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={inspectingAccess.fileName || undefined}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Ouvrir / Télécharger</span>
                              </a>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* VALIDATION & NOTE INTERNE */}
                    <div className="pt-4 border-t border-ucaep-brown/15 space-y-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="review-note"
                          className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                        >
                          Note interne (ou motif si refus)
                        </label>
                        <textarea
                          id="review-note"
                          rows={3}
                          value={reviewNoteDraft}
                          onChange={(e) => setReviewNoteDraft(e.target.value)}
                          placeholder="Observation de l'équipe UCAEP ou du jury..."
                          className="w-full px-3 py-2 text-sm border border-ucaep-brown/25 rounded-sm"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={reviewSaving}
                            onClick={() =>
                              handleUpdateSubmissionReview(inspectingItem.id, {
                                status: 'validated',
                                organizerNote: reviewNoteDraft,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valider</span>
                          </button>
                          <button
                            type="button"
                            disabled={reviewSaving}
                            onClick={() =>
                              handleUpdateSubmissionReview(inspectingItem.id, {
                                status: 'rejected',
                                organizerNote: reviewNoteDraft,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-red-800 text-white hover:bg-red-900 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Refuser</span>
                          </button>
                          <button
                            type="button"
                            disabled={reviewSaving}
                            onClick={() =>
                              handleUpdateSubmissionReview(inspectingItem.id, {
                                organizerNote: reviewNoteDraft,
                              })
                            }
                            className="px-4 py-2 text-xs font-medium rounded-sm border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-paper disabled:opacity-50"
                          >
                            Enregistrer la note
                          </button>
                        </div>

                        <span
                          className={`px-2.5 py-1 text-xs font-semibold border rounded-sm ${
                            SUBMISSION_STATUS_META[inspectingItem.status].badgeClass
                          }`}
                        >
                          Statut actuel : {SUBMISSION_STATUS_META[inspectingItem.status].label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET CONFIG */}
        {tab === 'config' && (
          <div className="max-w-2xl p-6 sm:p-8 bg-white border border-ucaep-brown/15 rounded-sm space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
              Lien Google Apps Script / Google Sheets
            </h2>
            <p className="text-sm text-ucaep-ink/75 leading-relaxed">
              Quand cette adresse Web App est renseignée, chaque inscription envoyée sur
              le site est automatiquement transmise à votre feuille Google Sheets sans
              bloquer l&apos;enregistrement dans Supabase.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="gas-url"
                  className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                >
                  Adresse Web App Google Apps Script
                </label>
                <input
                  id="gas-url"
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 text-sm border border-ucaep-brown/25 rounded-sm"
                />
              </div>
              {gasTestMsg && (
                <p className="p-3 text-xs bg-ucaep-green/10 text-ucaep-green border border-ucaep-green/25 rounded-sm">
                  {gasTestMsg}
                </p>
              )}
              {gasTestError && (
                <p className="p-3 text-xs bg-red-50 text-red-900 border border-red-800/20 rounded-sm">
                  {gasTestError}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                >
                  Enregistrer le lien
                </button>
                <button
                  type="button"
                  onClick={handleTestGas}
                  className="px-5 py-2.5 text-sm font-medium rounded-sm border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-brown/5"
                >
                  Tester la connexion
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
