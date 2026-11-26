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
  Mail,
  MessageSquare,
  Monitor,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  Unlock,
  X,
  XCircle,
} from 'lucide-react';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import { useSiteConfig } from '../lib/site-config';
import { formatFileSize, getPhaseTextSlotLabels } from '../lib/submissions-config';
import type {
  AdminSubmissionAccess,
  AdminSubmissionItem,
  Announcement,
  CompetitionPhase,
  ContactMessageRecord,
  DepotResourceItem,
  DepotResourceKind,
  MediaAssetKey,
  NewsArticle,
  PhaseExternalFormConfig,
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
  | 'messages'
  | 'config';

const VALID_TABS: GestionTab[] = [
  'interface',
  'annonces',
  'actualites',
  'parcours',
  'candidats',
  'depots',
  'messages',
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
  const [submissionQueueFilter, setSubmissionQueueFilter] = useState<
    'all' | 'pending_t1' | 'pending_t2' | 'both_validated' | 'rejected'
  >('all');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewRoute, setPreviewRoute] = useState<'/' | '/parcours' | '/concours'>('/');
  const [previewKey, setPreviewKey] = useState(0);
  const [inspectingItem, setInspectingItem] = useState<AdminSubmissionItem | null>(null);
  const [inspectingAccess, setInspectingAccess] = useState<AdminSubmissionAccess | null>(
    null,
  );
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState('');
  const [reviewNoteDraft, setReviewNoteDraft] = useState('');
  const [reviewNote1Draft, setReviewNote1Draft] = useState('');
  const [reviewNote2Draft, setReviewNote2Draft] = useState('');
  const [reviewError, setReviewError] = useState('');
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
    loadSubmissions(token);

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

  // Google Form external submission link configurator state
  const [externalFormsDraft, setExternalFormsDraft] = useState<
    Record<string, { enabled: boolean; googleFormUrl: string; instructions: string }>
  >({
    'phase-1': { enabled: false, googleFormUrl: '', instructions: '' },
    'phase-2': { enabled: false, googleFormUrl: '', instructions: '' },
  });
  const [externalFormSavingId, setExternalFormSavingId] = useState<string | null>(null);
  const [externalFormError, setExternalFormError] = useState('');
  const externalFormsInitializedRef = useRef(false);

  // Depot resources (infos, guides & tool buttons pushed to /depot)
  const [depotResources, setDepotResources] = useState<DepotResourceItem[]>([]);
  const depotResourcesInitializedRef = useRef(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resBody, setResBody] = useState('');
  const [resKind, setResKind] = useState<DepotResourceKind>('tool');
  const [resActionLabel, setResActionLabel] = useState('');
  const [resActionUrl, setResActionUrl] = useState('');
  const [resPinned, setResPinned] = useState(true);
  const [resActive, setResActive] = useState(true);
  const [depotResourcesSaving, setDepotResourcesSaving] = useState(false);
  const [depotResourcesError, setDepotResourcesError] = useState('');

  // Candidate difficulties & contact messages state
  const [contactFilter, setContactFilter] = useState<
    'all' | 'depot' | 'non_lu' | 'traite'
  >('all');
  const [contactSavingId, setContactSavingId] = useState<string | null>(null);
  const [contactActionError, setContactActionError] = useState('');

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
      if (!externalFormsInitializedRef.current && json.settings?.siteDisplay) {
        externalFormsInitializedRef.current = true;
        const forms = json.settings.siteDisplay.externalForms || {};
        setExternalFormsDraft({
          'phase-1': {
            enabled: Boolean(forms['phase-1']?.enabled),
            googleFormUrl: forms['phase-1']?.googleFormUrl || '',
            instructions: forms['phase-1']?.instructions || '',
          },
          'phase-2': {
            enabled: Boolean(forms['phase-2']?.enabled),
            googleFormUrl: forms['phase-2']?.googleFormUrl || '',
            instructions: forms['phase-2']?.instructions || '',
          },
        });
      }
      if (
        !depotResourcesInitializedRef.current &&
        json.settings?.siteDisplay?.depotResources
      ) {
        depotResourcesInitializedRef.current = true;
        setDepotResources(json.settings.siteDisplay.depotResources);
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
      const shouldAutoOpen =
        !phase.isRevealed && phase.format !== 'En présentiel' && phase.id !== 'phase-3';
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phase.id}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            isRevealed: !phase.isRevealed,
            statusLabel: !phase.isRevealed ? 'Ouverte' : 'Verrouillée',
            ...(phase.format !== 'En présentiel' && phase.id !== 'phase-3'
              ? { submissionsOpen: shouldAutoOpen }
              : {}),
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
      await Promise.all([loadOverview(), refreshSiteConfig()]);
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
      const targetPhase = data?.phases.find((p) => p.id === phaseId);
      const isOnline =
        targetPhase && targetPhase.format !== 'En présentiel' && phaseId !== 'phase-3';
      const derivedSubmissionsOpen =
        statusLabel === 'Clôturée' ||
        statusLabel === 'Verrouillée' ||
        statusLabel === 'À venir'
          ? false
          : statusLabel === 'Ouverte' && isOnline
            ? true
            : undefined;
      const res = await fetchApiJson<{ phase: CompetitionPhase }>(
        `/api/admin/phases/${phaseId}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            statusLabel,
            ...(derivedSubmissionsOpen !== undefined
              ? { submissionsOpen: derivedSubmissionsOpen }
              : {}),
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
      await Promise.all([loadOverview(), refreshSiteConfig()]);
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
      await Promise.all([loadOverview(), refreshSiteConfig()]);
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
      await Promise.all([loadOverview(), refreshSiteConfig()]);
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
      await Promise.all([loadOverview(), refreshSiteConfig()]);
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
    setReviewError('');
    setReviewNoteDraft(item.organizerNote || '');
    setReviewNote1Draft('');
    setReviewNote2Draft('');
    setInspectLoading(true);
    try {
      const access = await fetchApiJson<AdminSubmissionAccess>(
        `/api/admin/submissions/${item.id}/download`,
        {
          headers: buildAuthHeaders(),
        },
      );
      setInspectingAccess(access);
      setReviewNote1Draft(access.text1Note || '');
      setReviewNote2Draft(access.text2Note || '');
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
    patch: { status?: SubmissionStatus; organizerNote?: string; textSlot?: 1 | 2 },
  ) {
    setReviewSaving(true);
    setReviewError('');
    try {
      const res = await fetchApiJson<{
        submission: {
          id: string;
          status: SubmissionStatus;
          organizerNote: string;
          updatedAt: string;
          text1Status?: SubmissionStatus;
          text2Status?: SubmissionStatus;
          text1Note?: string;
          text2Note?: string;
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
                ...(res.submission.text1Status !== undefined
                  ? { text1Status: res.submission.text1Status }
                  : {}),
                ...(res.submission.text2Status !== undefined
                  ? { text2Status: res.submission.text2Status }
                  : {}),
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
              ...(res.submission.text1Status !== undefined
                ? { text1Status: res.submission.text1Status }
                : {}),
              ...(res.submission.text2Status !== undefined
                ? { text2Status: res.submission.text2Status }
                : {}),
            }
          : prev,
      );
      setInspectingAccess((prev) =>
        prev && prev.id === submissionId
          ? {
              ...prev,
              ...(res.submission.text1Status !== undefined
                ? { text1Status: res.submission.text1Status }
                : {}),
              ...(res.submission.text2Status !== undefined
                ? { text2Status: res.submission.text2Status }
                : {}),
              ...(res.submission.text1Note !== undefined
                ? { text1Note: res.submission.text1Note }
                : {}),
              ...(res.submission.text2Note !== undefined
                ? { text2Note: res.submission.text2Note }
                : {}),
            }
          : prev,
      );
      setNotice(
        patch.textSlot
          ? `Évaluation du Texte ${patch.textSlot} enregistrée.`
          : 'Évaluation du dépôt enregistrée.',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setReviewError(msg);
      setNotice(msg);
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleSaveExternalForm(
    phaseId: 'phase-1' | 'phase-2',
    overrideEnabled?: boolean,
  ) {
    const draft = externalFormsDraft[phaseId] || {
      enabled: false,
      googleFormUrl: '',
      instructions: '',
    };
    const nextEnabled =
      overrideEnabled !== undefined ? overrideEnabled : draft.enabled;

    setExternalFormSavingId(phaseId);
    setExternalFormError('');
    setNotice('');

    try {
      const res = await fetchApiJson<{
        siteDisplay: SiteDisplayConfig;
        phases?: CompetitionPhase[];
      }>('/api/admin/external-forms', {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          phaseId,
          enabled: nextEnabled,
          googleFormUrl: draft.googleFormUrl,
          instructions: draft.instructions,
        }),
      });

      const savedForm: PhaseExternalFormConfig = res.siteDisplay.externalForms?.[
        phaseId
      ] || {
        enabled: false,
        googleFormUrl: '',
        instructions: '',
      };

      setExternalFormsDraft((prev) => ({
        ...prev,
        [phaseId]: {
          enabled: savedForm.enabled,
          googleFormUrl: savedForm.googleFormUrl || '',
          instructions: savedForm.instructions || '',
        },
      }));
      externalFormsInitializedRef.current = true;

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
      setNotice(
        savedForm.enabled
          ? `Lien Google Form activé pour la Phase ${phaseId === 'phase-1' ? '01' : '02'} (remplace les dépôts de fichiers Supabase).`
          : `Configuration Google Form enregistrée pour la Phase ${phaseId === 'phase-1' ? '01' : '02'}.`,
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le lien Google Form.";
      setExternalFormError(msg);
      setNotice(msg);
    } finally {
      setExternalFormSavingId(null);
    }
  }

  function resetResourceForm() {
    setEditingResourceId(null);
    setResTitle('');
    setResBody('');
    setResKind('tool');
    setResActionLabel('');
    setResActionUrl('');
    setResPinned(true);
    setResActive(true);
    setDepotResourcesError('');
  }

  function loadVideoCompressorPreset() {
    setEditingResourceId(null);
    setResKind('tool');
    setResTitle('Réduire la taille de votre vidéo (max 100 Mo sur Google Form)');
    setResBody(
      "Le Google Form officiel limite les vidéos à 100 Mo. Compressez votre vidéo sur Android avec Proton Video Compressor avant l'envoi tout en gardant un son clair.",
    );
    setResActionLabel('Télécharger Proton Video Compressor (Play Store)');
    setResActionUrl(
      'https://play.google.com/store/apps/details?id=com.arthur.hritik.proton.video.compressor',
    );
    setResPinned(true);
    setResActive(true);
    setDepotResourcesError('');
  }

  function startEditResource(item: DepotResourceItem) {
    setEditingResourceId(item.id);
    setResTitle(item.title);
    setResBody(item.body);
    setResKind(item.kind);
    setResActionLabel(item.actionLabel || '');
    setResActionUrl(item.actionUrl || '');
    setResPinned(Boolean(item.pinned));
    setResActive(item.active !== false);
    setDepotResourcesError('');
  }

  async function saveDepotResourcesList(
    nextList: DepotResourceItem[],
    successMsg: string,
  ) {
    setDepotResourcesSaving(true);
    setDepotResourcesError('');
    setNotice('');
    try {
      const res = await fetchApiJson<{
        siteDisplay: SiteDisplayConfig;
        depotResources: DepotResourceItem[];
      }>('/api/admin/depot-resources', {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ resources: nextList }),
      });

      setDepotResources(res.depotResources);
      depotResourcesInitializedRef.current = true;
      setData((prev) =>
        prev
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                siteDisplay: res.siteDisplay,
              },
            }
          : prev,
      );
      await refreshSiteConfig();
      setNotice(successMsg);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les notes et outils du dépôt.";
      setDepotResourcesError(msg);
    } finally {
      setDepotResourcesSaving(false);
    }
  }

  async function handleSubmitDepotResource(e: FormEvent) {
    e.preventDefault();
    const cleanTitle = resTitle.trim();
    const cleanBody = resBody.trim();
    const cleanUrl = resActionUrl.trim();
    const cleanLabel = resActionLabel.trim();

    if (!cleanTitle || !cleanBody) {
      setDepotResourcesError('Renseignez le titre et le message explicatif.');
      return;
    }

    if (cleanUrl) {
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('bad protocol');
        }
      } catch {
        setDepotResourcesError(
          'Le lien du bouton doit commencer par https:// ou http://.',
        );
        return;
      }
    }

    const nowIso = new Date().toISOString();
    if (editingResourceId) {
      const nextList = depotResources.map((item) =>
        item.id === editingResourceId
          ? {
              ...item,
              title: cleanTitle,
              body: cleanBody,
              kind: resKind,
              actionUrl: cleanUrl || undefined,
              actionLabel: cleanUrl ? cleanLabel || 'Ouvrir le lien' : undefined,
              pinned: resPinned,
              active: resActive,
              updatedAt: nowIso,
            }
          : item,
      );
      await saveDepotResourcesList(
        nextList,
        'Carte d’information mise à jour dans l’espace dépôt.',
      );
      resetResourceForm();
    } else {
      const newItem: DepotResourceItem = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `res-${Date.now()}`,
        title: cleanTitle,
        body: cleanBody,
        kind: resKind,
        ...(cleanUrl
          ? { actionUrl: cleanUrl, actionLabel: cleanLabel || 'Ouvrir le lien' }
          : {}),
        pinned: resPinned,
        active: resActive,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await saveDepotResourcesList(
        [newItem, ...depotResources],
        'Information et bouton publiés dans l’espace dépôt des candidats.',
      );
      resetResourceForm();
    }
  }

  async function handleToggleResourceActive(id: string) {
    const nextList = depotResources.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item,
    );
    await saveDepotResourcesList(
      nextList,
      'Visibilité de la carte mise à jour sur /depot.',
    );
  }

  async function handleToggleResourcePinned(id: string) {
    const nextList = depotResources.map((item) =>
      item.id === id ? { ...item, pinned: !item.pinned } : item,
    );
    await saveDepotResourcesList(nextList, 'Épinglage mis à jour.');
  }

  async function handleDeleteResource(id: string) {
    const nextList = depotResources.filter((item) => item.id !== id);
    if (editingResourceId === id) {
      resetResourceForm();
    }
    await saveDepotResourcesList(
      nextList,
      'Carte supprimée de l’espace dépôt.',
    );
  }

  async function handleToggleContactStatus(item: ContactMessageRecord) {
    const nextStatus = item.status === 'traite' ? 'non_lu' : 'traite';
    setContactSavingId(item.id);
    setContactActionError('');
    setNotice('');
    try {
      const res = await fetchApiJson<{ contact: ContactMessageRecord }>(
        `/api/admin/contacts/${encodeURIComponent(item.id)}`,
        {
          method: 'PATCH',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              contacts: prev.contacts.map((c) =>
                c.id === item.id ? res.contact : c,
              ),
            }
          : prev,
      );
      setNotice(
        nextStatus === 'traite'
          ? `Signalement de ${item.name} marqué comme traité.`
          : `Signalement de ${item.name} rouvert en non lu.`,
      );
    } catch (err) {
      setContactActionError(
        err instanceof Error
          ? err.message
          : 'Impossible de mettre à jour le statut de ce message.',
      );
    } finally {
      setContactSavingId(null);
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
    let pendingT1 = 0;
    let pendingT2 = 0;
    let bothValidated = 0;
    let anyRejected = 0;

    for (const s of submissions) {
      if (s.status === 'validated') validated += 1;
      else if (s.status === 'rejected') rejected += 1;
      else received += 1;

      if (s.kind === 'text') {
        const t1Status = s.text1Status || 'received';
        const t2Status = s.text2Status || 'received';
        if (t1Status === 'received') pendingT1 += 1;
        if (t2Status === 'received') pendingT2 += 1;
        if (t1Status === 'validated' && t2Status === 'validated') bothValidated += 1;
        if (s.status === 'rejected' || t1Status === 'rejected' || t2Status === 'rejected') {
          anyRejected += 1;
        }
      } else {
        if (s.status === 'received') pendingT1 += 1;
        if (s.status === 'validated') bothValidated += 1;
        if (s.status === 'rejected') anyRejected += 1;
      }
    }
    return {
      total: submissions.length,
      received,
      validated,
      rejected,
      pendingT1,
      pendingT2,
      bothValidated,
      anyRejected,
    };
  }, [submissions]);

  const contactStats = useMemo(() => {
    const list = data?.contacts || [];
    let unread = 0;
    let depotUnread = 0;
    let depotTotal = 0;
    let traite = 0;
    for (const c of list) {
      const isDepot = c.subject.startsWith('[Difficulté Dépôt');
      if (isDepot) depotTotal += 1;
      if (c.status === 'traite') {
        traite += 1;
      } else {
        unread += 1;
        if (isDepot) depotUnread += 1;
      }
    }
    return {
      total: list.length,
      unread,
      depotTotal,
      depotUnread,
      traite,
    };
  }, [data?.contacts]);

  const filteredContacts = useMemo(() => {
    const list = [...(data?.contacts || [])].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    return list.filter((c) => {
      if (contactFilter === 'depot') {
        return c.subject.startsWith('[Difficulté Dépôt');
      }
      if (contactFilter === 'non_lu') {
        return c.status !== 'traite';
      }
      if (contactFilter === 'traite') {
        return c.status === 'traite';
      }
      return true;
    });
  }, [data?.contacts, contactFilter]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (submissionPhaseFilter !== 'all' && s.phaseId !== submissionPhaseFilter) {
        return false;
      }
      if (submissionStatusFilter !== 'all' && s.status !== submissionStatusFilter) {
        return false;
      }
      if (submissionQueueFilter !== 'all') {
        const isText = s.kind === 'text';
        const t1Status = s.text1Status || 'received';
        const t2Status = s.text2Status || 'received';
        if (submissionQueueFilter === 'pending_t1') {
          if (isText ? t1Status !== 'received' : s.status !== 'received') {
            return false;
          }
        } else if (submissionQueueFilter === 'pending_t2') {
          if (!isText || t2Status !== 'received') {
            return false;
          }
        } else if (submissionQueueFilter === 'both_validated') {
          if (isText ? t1Status !== 'validated' || t2Status !== 'validated' : s.status !== 'validated') {
            return false;
          }
        } else if (submissionQueueFilter === 'rejected') {
          if (s.status !== 'rejected' && t1Status !== 'rejected' && t2Status !== 'rejected') {
            return false;
          }
        }
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
  }, [
    submissions,
    submissionPhaseFilter,
    submissionStatusFilter,
    submissionQueueFilter,
    submissionSearch,
  ]);

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
                [
                  'messages',
                  contactStats.unread > 0
                    ? `Messages & Difficultés (${contactStats.unread})`
                    : `Messages (${contactStats.total})`,
                ],
                ['config', 'Paramètres'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 tabular-nums ${
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
                <button
                  type="button"
                  onClick={() => {
                    setPreviewKey((k) => k + 1);
                    setPreviewOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm border border-ucaep-brown/25 bg-ucaep-paper text-ucaep-brown hover:border-ucaep-gold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-ucaep-green" />
                  <span>Aperçu visiteur</span>
                </button>
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

        {/* Bandeau KPI Cockpit Pro */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 bg-white border border-ucaep-brown/15 rounded-sm space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown/70">
              01 · Inscrits ENSET
            </p>
            <p className="font-serif text-3xl font-bold text-ucaep-brown tabular-nums">
              {stats.total}
            </p>
            <p className="text-xs text-ucaep-ink/70 tabular-nums">
              {Object.keys(stats.byDept).length} filière(s) représentée(s)
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-ucaep-brown/15 rounded-sm space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-brown/70">
              02 · Dépôts reçus
            </p>
            <p className="font-serif text-3xl font-bold text-ucaep-brown tabular-nums">
              {submissionStats.total}
            </p>
            <p className="text-xs text-ucaep-ink/70 tabular-nums">
              T1 en attente : {submissionStats.pendingT1} · T2 : {submissionStats.pendingT2}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmissionQueueFilter('pending_t1');
              selectTab('depots');
            }}
            className="text-left p-4 sm:p-5 bg-white border border-ucaep-brown/15 hover:border-ucaep-gold rounded-sm space-y-1 transition-colors"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
              03 · File d&apos;attente jury
            </p>
            <p className="font-serif text-3xl font-bold text-amber-800 tabular-nums">
              {submissionStats.received}
            </p>
            <p className="text-xs font-medium text-ucaep-brown underline">
              Ouvrir la file de validation →
            </p>
          </button>

          <div className="p-4 sm:p-5 bg-white border border-ucaep-brown/15 rounded-sm space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
              04 · Validés complets
            </p>
            <p className="font-serif text-3xl font-bold text-ucaep-green tabular-nums">
              {submissionStats.bothValidated}
            </p>
            <p className="text-xs text-ucaep-ink/70 tabular-nums">
              {submissionStats.anyRejected} dossier(s) à reprendre
            </p>
          </div>
        </div>

        {contactStats.unread > 0 && tab !== 'messages' && (
          <div className="px-5 py-3 bg-[#FBF6EB] border border-ucaep-gold/50 rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-ucaep-brown font-medium tabular-nums">
              <strong>{contactStats.unread}</strong> message(s) non lu(s) dont{' '}
              <strong>{contactStats.depotUnread}</strong> difficulté(s) signalée(s) depuis l&apos;espace de dépôt.
            </span>
            <button
              type="button"
              onClick={() => {
                setContactFilter(contactStats.depotUnread > 0 ? 'depot' : 'non_lu');
                selectTab('messages');
              }}
              className="font-semibold text-ucaep-brown underline hover:text-ucaep-gold whitespace-nowrap shrink-0"
            >
              Consulter les signalements →
            </button>
          </div>
        )}

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
                  Vous pouvez modifier les consignes et dates limites de chaque phase dans{' '}
                  <strong>Phases</strong>, et activer un lien Google Form de soumission dans{' '}
                  <button
                    type="button"
                    onClick={() => selectTab('depots')}
                    className="font-semibold text-ucaep-brown underline hover:text-ucaep-gold"
                  >
                    Dépôts
                  </button>
                  .
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
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-ucaep-ink/70 font-medium">
                              Dépôts en ligne :
                            </span>
                            <span
                              className={`font-semibold ${
                                phase.submissionsOpen
                                  ? 'text-ucaep-green'
                                  : 'text-ucaep-brown/75'
                              }`}
                            >
                              {phase.submissionsOpen ? 'Ouverts' : 'Fermés'}
                            </span>
                          </div>
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
            {/* CONFIGURATEUR GOOGLE FORM PAR PHASE (REMPLACE LES FICHIERS SUPABASE) */}
            <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-ucaep-brown/12 pb-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                    Mode de réception des vidéos &amp; fichiers
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
                    Activer un lien Google Form de soumission
                  </h2>
                  <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                    Lorsqu&apos;un lien Google Form est activé pour une phase, les dépôts de cette phase sont ouverts et le bouton d&apos;accès au formulaire vidéo reste visible et cliquable en permanence sur la page de dépôt, quel que soit l&apos;avancement des deux textes écrits (Texte 1 et Texte 2).
                  </p>
                </div>
              </div>

              {externalFormError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-300 rounded-sm text-xs text-red-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{externalFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {(['phase-1', 'phase-2'] as const).map((phaseId) => {
                  const phaseInfo = data.phases.find((p) => p.id === phaseId);
                  const draft = externalFormsDraft[phaseId] || {
                    enabled: false,
                    googleFormUrl: '',
                    instructions: '',
                  };
                  const liveForm =
                    data.settings?.siteDisplay?.externalForms?.[phaseId];
                  const isBusy = externalFormSavingId === phaseId;

                  return (
                    <div
                      key={phaseId}
                      className={`p-5 border rounded-sm space-y-4 ${
                        liveForm?.enabled
                          ? 'border-ucaep-green/45 bg-emerald-50/20'
                          : 'border-ucaep-brown/15 bg-ucaep-paper/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-ucaep-brown/70">
                            Phase {phaseInfo?.number || (phaseId === 'phase-1' ? '01' : '02')}
                          </span>
                          <h3 className="font-serif text-xl font-semibold text-ucaep-brown">
                            {phaseInfo?.title || phaseId}
                          </h3>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-[11px] font-semibold border rounded-sm ${
                            liveForm?.enabled
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-white text-ucaep-ink/70 border-ucaep-brown/20'
                          }`}
                        >
                          {liveForm?.enabled
                            ? 'Google Form actif'
                            : 'Stockage Supabase'}
                        </span>
                      </div>

                      {liveForm?.enabled && phaseInfo && !phaseInfo.submissionsOpen && (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-950 space-y-2 leading-relaxed">
                          <p>
                            Le formulaire Google Form est actif, mais la saisie des textes (Texte 1 &amp; Texte 2) pour cette phase est encore fermée.
                          </p>
                          <button
                            type="button"
                            disabled={phaseSavingId === phaseInfo.id}
                            onClick={() => handleToggleSubmissionsOpen(phaseInfo)}
                            className="px-3 py-1.5 text-[11px] font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-50"
                          >
                            {phaseSavingId === phaseInfo.id
                              ? 'Ouverture...'
                              : 'Ouvrir les dépôts maintenant'}
                          </button>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label
                          htmlFor={`gform-url-${phaseId}`}
                          className="block text-xs font-semibold text-ucaep-brown"
                        >
                          Lien du formulaire Google Form
                        </label>
                        <input
                          id={`gform-url-${phaseId}`}
                          type="url"
                          value={draft.googleFormUrl}
                          onChange={(e) =>
                            setExternalFormsDraft((prev) => ({
                              ...prev,
                              [phaseId]: { ...draft, googleFormUrl: e.target.value },
                            }))
                          }
                          placeholder="https://docs.google.com/forms/d/e/.../viewform"
                          className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor={`gform-note-${phaseId}`}
                          className="block text-xs font-semibold text-ucaep-brown"
                        >
                          Consigne rapide aux candidats (optionnel)
                        </label>
                        <input
                          id={`gform-note-${phaseId}`}
                          type="text"
                          maxLength={500}
                          value={draft.instructions}
                          onChange={(e) =>
                            setExternalFormsDraft((prev) => ({
                              ...prev,
                              [phaseId]: { ...draft, instructions: e.target.value },
                            }))
                          }
                          placeholder="Ex. : Déposez vos deux vidéos MP4 dans le Google Form avec votre code UCAEP."
                          className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                        />
                      </div>

                      <label className="flex items-center gap-2.5 text-xs font-medium text-ucaep-brown cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(e) =>
                            setExternalFormsDraft((prev) => ({
                              ...prev,
                              [phaseId]: { ...draft, enabled: e.target.checked },
                            }))
                          }
                          className="accent-ucaep-brown"
                        />
                        <span>
                          Activer ce lien Google Form pour remplacer l&apos;envoi de
                          fichiers via Supabase
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSaveExternalForm(phaseId)}
                          className="px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-50"
                        >
                          {isBusy ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        {draft.googleFormUrl.trim() && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleSaveExternalForm(phaseId, !draft.enabled)
                            }
                            className={`px-4 py-2 text-xs font-semibold rounded-sm border transition-colors disabled:opacity-50 ${
                              draft.enabled
                                ? 'border-red-300 bg-red-50 text-red-900 hover:bg-red-100'
                                : 'border-ucaep-green/40 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                            }`}
                          >
                            {draft.enabled ? 'Désactiver le lien' : 'Activer le lien'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INFORMATIONS, OUTILS & LIENS UTILES DIFFUSÉS SUR /DEPOT */}
            <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
                <div className="space-y-1 max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                    Assistance &amp; ressources sur /depot
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
                    Publier des notes et boutons d&apos;outils (ex. compression vidéo 100 Mo)
                  </h2>
                  <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                    Ajoutez ici des informations complémentaires, des consignes de dernière minute ou des boutons de téléchargement vers des applications utiles. Chaque carte active s&apos;affiche immédiatement dans l&apos;espace candidat <span className="font-mono">/depot</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadVideoCompressorPreset}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-sm border border-ucaep-green/40 bg-emerald-50/70 text-ucaep-green hover:bg-emerald-100/70 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Charger modèle Proton Video Compressor (100 Mo)</span>
                </button>
              </div>

              {depotResourcesError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-300 rounded-sm text-xs text-red-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{depotResourcesError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handleSubmitDepotResource}
                  className="lg:col-span-5 p-5 bg-ucaep-paper/60 border border-ucaep-brown/15 rounded-sm space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg font-semibold text-ucaep-brown">
                      {editingResourceId
                        ? 'Modifier la note publiée'
                        : 'Nouvelle note ou outil candidat'}
                    </h3>
                    {editingResourceId && (
                      <button
                        type="button"
                        onClick={resetResourceForm}
                        className="text-xs font-medium text-ucaep-brown underline"
                      >
                        Annuler l&apos;édition
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="res-kind"
                      className="block text-xs font-semibold text-ucaep-brown"
                    >
                      Type d&apos;encadré
                    </label>
                    <select
                      id="res-kind"
                      value={resKind}
                      onChange={(e) =>
                        setResKind(e.target.value as DepotResourceKind)
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                    >
                      <option value="tool">Outil / Application à télécharger</option>
                      <option value="video_help">Aide vidéo (limite 100 Mo)</option>
                      <option value="info">Information complémentaire</option>
                      <option value="warning">Point d&apos;attention important</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="res-title"
                      className="block text-xs font-semibold text-ucaep-brown"
                    >
                      Titre affiché aux candidats *
                    </label>
                    <input
                      id="res-title"
                      type="text"
                      maxLength={140}
                      required
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      placeholder="Ex. : Réduire votre vidéo sous 100 Mo"
                      className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="res-body"
                      className="block text-xs font-semibold text-ucaep-brown"
                    >
                      Message / explication *
                    </label>
                    <textarea
                      id="res-body"
                      rows={3}
                      maxLength={1500}
                      required
                      value={resBody}
                      onChange={(e) => setResBody(e.target.value)}
                      placeholder="Expliquez la consigne ou comment utiliser l'application..."
                      className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="res-btn-url"
                      className="block text-xs font-semibold text-ucaep-brown"
                    >
                      Lien du bouton (optionnel, https://...)
                    </label>
                    <input
                      id="res-btn-url"
                      type="url"
                      maxLength={1000}
                      value={resActionUrl}
                      onChange={(e) => setResActionUrl(e.target.value)}
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="res-btn-label"
                      className="block text-xs font-semibold text-ucaep-brown"
                    >
                      Texte du bouton (si un lien est saisi)
                    </label>
                    <input
                      id="res-btn-label"
                      type="text"
                      maxLength={80}
                      value={resActionLabel}
                      onChange={(e) => setResActionLabel(e.target.value)}
                      placeholder="Ex. : Télécharger l'application"
                      className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-ucaep-brown">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resPinned}
                        onChange={(e) => setResPinned(e.target.checked)}
                        className="accent-ucaep-brown"
                      />
                      <span>Épingler en tête</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resActive}
                        onChange={(e) => setResActive(e.target.checked)}
                        className="accent-ucaep-brown"
                      />
                      <span>Visible sur /depot</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={depotResourcesSaving}
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors disabled:opacity-50"
                  >
                    {depotResourcesSaving
                      ? 'Enregistrement...'
                      : editingResourceId
                        ? 'Mettre à jour sur /depot'
                        : 'Publier sur /depot'}
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between text-xs text-ucaep-ink/70">
                    <span className="font-semibold uppercase tracking-wider text-ucaep-brown">
                      Cartes configurées ({depotResources.length})
                    </span>
                    <Link
                      to="/depot"
                      className="inline-flex items-center gap-1 font-semibold text-ucaep-brown underline hover:text-ucaep-gold"
                    >
                      <span>Voir l&apos;espace dépôt public</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {depotResources.length === 0 ? (
                    <div className="p-6 bg-ucaep-paper/40 border border-dashed border-ucaep-brown/25 rounded-sm text-xs text-ucaep-ink/70">
                      Aucune note complémentaire configurée. Utilisez le formulaire à gauche ou le modèle Proton Video Compressor pour en ajouter une.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {depotResources.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 border rounded-sm space-y-2.5 ${
                            item.active
                              ? 'bg-white border-ucaep-brown/18'
                              : 'bg-ucaep-paper/45 border-ucaep-brown/10 opacity-75'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 font-semibold border border-ucaep-brown/20 bg-ucaep-paper text-ucaep-brown rounded-sm">
                                {item.kind === 'tool'
                                  ? 'Outil'
                                  : item.kind === 'video_help'
                                    ? 'Aide vidéo'
                                    : item.kind === 'warning'
                                      ? 'Attention'
                                      : 'Information'}
                              </span>
                              <span
                                className={`px-2 py-0.5 font-semibold border rounded-sm ${
                                  item.active
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : 'bg-white text-ucaep-ink/60 border-ucaep-brown/20'
                                }`}
                              >
                                {item.active ? 'En ligne' : 'Masqué'}
                              </span>
                              {item.pinned && (
                                <span className="inline-flex items-center gap-1 text-ucaep-gold font-semibold">
                                  <Pin className="w-3 h-3" />
                                  <span>Épinglé</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={depotResourcesSaving}
                                onClick={() => startEditResource(item)}
                                className="px-2 py-1 border border-ucaep-brown/20 rounded-sm text-ucaep-brown hover:bg-ucaep-paper"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                disabled={depotResourcesSaving}
                                onClick={() => handleToggleResourcePinned(item.id)}
                                className="px-2 py-1 border border-ucaep-brown/20 rounded-sm text-ucaep-brown hover:bg-ucaep-paper"
                              >
                                {item.pinned ? 'Détacher' : 'Épingler'}
                              </button>
                              <button
                                type="button"
                                disabled={depotResourcesSaving}
                                onClick={() => handleToggleResourceActive(item.id)}
                                className="px-2 py-1 border border-ucaep-brown/20 rounded-sm text-ucaep-brown hover:bg-ucaep-paper"
                              >
                                {item.active ? 'Masquer' : 'Activer'}
                              </button>
                              <button
                                type="button"
                                disabled={depotResourcesSaving}
                                onClick={() => handleDeleteResource(item.id)}
                                aria-label={`Supprimer ${item.title}`}
                                className="p-1 border border-red-200 rounded-sm text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-serif text-base font-semibold text-ucaep-brown">
                            {item.title}
                          </h4>
                          <p className="text-xs text-ucaep-ink/80 leading-relaxed whitespace-pre-line">
                            {item.body}
                          </p>

                          {item.actionUrl && (
                            <p className="text-[11px] text-ucaep-green font-medium break-all">
                              Bouton « {item.actionLabel || 'Ouvrir le lien'} » →{' '}
                              <a
                                href={item.actionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {item.actionUrl}
                              </a>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

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

            {/* Filtres rapides de file d'attente */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: `Tout (${submissionStats.total})` },
                  { id: 'pending_t1', label: `À valider Texte 1 (${submissionStats.pendingT1})` },
                  { id: 'pending_t2', label: `À valider Texte 2 (${submissionStats.pendingT2})` },
                  { id: 'both_validated', label: `Validés complets (${submissionStats.bothValidated})` },
                  { id: 'rejected', label: `À reprendre (${submissionStats.anyRejected})` },
                ] as const
              ).map((q) => {
                const active = submissionQueueFilter === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSubmissionQueueFilter(q.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors tabular-nums ${
                      active
                        ? 'bg-ucaep-brown text-ucaep-paper border-ucaep-brown'
                        : 'bg-white text-ucaep-brown border-ucaep-brown/20 hover:border-ucaep-gold'
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
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
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 text-xs font-medium text-ucaep-brown">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Textes (1 &amp; 2)</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-sm ${
                                      item.text1Status
                                        ? SUBMISSION_STATUS_META[item.text1Status].badgeClass
                                        : 'bg-ucaep-paper text-ucaep-ink/60 border-ucaep-brown/20'
                                    }`}
                                  >
                                    T1 :{' '}
                                    {item.text1Status
                                      ? SUBMISSION_STATUS_META[item.text1Status].label
                                      : 'Vide'}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-sm ${
                                      item.text2Status
                                        ? SUBMISSION_STATUS_META[item.text2Status].badgeClass
                                        : 'bg-ucaep-paper text-ucaep-ink/60 border-ucaep-brown/20'
                                    }`}
                                  >
                                    T2 :{' '}
                                    {item.text2Status
                                      ? SUBMISSION_STATUS_META[item.text2Status].label
                                      : 'Vide'}
                                  </span>
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
                      <div className="space-y-6">
                        {reviewError && (
                          <div
                            role="alert"
                            className="p-3.5 bg-red-50 border border-red-300 rounded-sm text-xs text-red-900 flex items-start gap-2"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{reviewError}</span>
                          </div>
                        )}

                        {inspectingAccess.kind === 'text' ? (
                          (() => {
                            const slotLabels = getPhaseTextSlotLabels(
                              inspectingItem.phaseId,
                            );
                            const t1HasContent = Boolean(
                              inspectingAccess.text1Content?.trim(),
                            );
                            const t2HasContent = Boolean(
                              inspectingAccess.text2Content?.trim(),
                            );
                            const t1Status = inspectingAccess.text1Status;
                            const t2Status = inspectingAccess.text2Status;
                            const t1Validated = t1Status === 'validated';

                            return (
                              <div className="space-y-6">
                                {/* ÉTAPE 1 : TEXTE 1 */}
                                <div className="p-5 bg-ucaep-paper/60 border border-ucaep-brown/20 rounded-sm space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ucaep-brown/12 pb-3">
                                    <div>
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                                        Validation étape 1 sur 2
                                      </span>
                                      <h4 className="font-serif text-xl font-semibold text-ucaep-brown">
                                        {slotLabels.slot1Title}
                                      </h4>
                                    </div>
                                    <span
                                      className={`px-2.5 py-1 text-[11px] font-semibold border rounded-sm ${
                                        t1Status
                                          ? SUBMISSION_STATUS_META[t1Status].badgeClass
                                          : 'bg-white text-ucaep-ink/60 border-ucaep-brown/20'
                                      }`}
                                    >
                                      {t1Status
                                        ? SUBMISSION_STATUS_META[t1Status].label
                                        : 'Non soumis'}
                                    </span>
                                  </div>

                                  {t1HasContent ? (
                                    <>
                                      <div className="p-4 bg-white border border-ucaep-brown/15 rounded-sm max-h-64 overflow-y-auto">
                                        <p className="text-sm text-ucaep-ink whitespace-pre-wrap leading-relaxed">
                                          {inspectingAccess.text1Content}
                                        </p>
                                      </div>

                                      <div className="space-y-1.5">
                                        <label
                                          htmlFor="review-note-1"
                                          className="block text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown"
                                        >
                                          Observation sur le Texte 1 (optionnel)
                                        </label>
                                        <textarea
                                          id="review-note-1"
                                          rows={2}
                                          value={reviewNote1Draft}
                                          onChange={(e) =>
                                            setReviewNote1Draft(e.target.value)
                                          }
                                          placeholder="Appréciation ou motif de reprise pour le Texte 1..."
                                          className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                                        />
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          disabled={reviewSaving}
                                          onClick={() =>
                                            handleUpdateSubmissionReview(
                                              inspectingItem.id,
                                              {
                                                textSlot: 1,
                                                status: 'validated',
                                                organizerNote: reviewNote1Draft,
                                              },
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] disabled:opacity-50"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>
                                            {t1Validated
                                              ? 'Texte 1 validé'
                                              : 'Valider le Texte 1'}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={reviewSaving}
                                          onClick={() =>
                                            handleUpdateSubmissionReview(
                                              inspectingItem.id,
                                              {
                                                textSlot: 1,
                                                status: 'rejected',
                                                organizerNote: reviewNote1Draft,
                                              },
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-red-800 text-white hover:bg-red-900 disabled:opacity-50"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                          <span>À reprendre (Texte 1)</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={reviewSaving}
                                          onClick={() =>
                                            handleUpdateSubmissionReview(
                                              inspectingItem.id,
                                              {
                                                textSlot: 1,
                                                organizerNote: reviewNote1Draft,
                                              },
                                            )
                                          }
                                          className="px-3.5 py-2 text-xs font-medium rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper disabled:opacity-50"
                                        >
                                          Enregistrer la note
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-xs text-ucaep-ink/65 italic">
                                      Le candidat n&apos;a pas encore soumis le Texte 1.
                                    </p>
                                  )}
                                </div>

                                {/* ÉTAPE 2 : TEXTE 2 (VALIDATION SÉQUENTIELLE APRÈS TEXTE 1) */}
                                <div
                                  className={`p-5 border rounded-sm space-y-4 ${
                                    t1Validated
                                      ? 'bg-ucaep-paper/60 border-ucaep-brown/20'
                                      : 'bg-ucaep-linen/35 border-ucaep-brown/12'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ucaep-brown/12 pb-3">
                                    <div>
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                                        Validation étape 2 sur 2 · Après Texte 1
                                      </span>
                                      <h4 className="font-serif text-xl font-semibold text-ucaep-brown">
                                        {slotLabels.slot2Title}
                                      </h4>
                                    </div>
                                    <span
                                      className={`px-2.5 py-1 text-[11px] font-semibold border rounded-sm ${
                                        t2Status
                                          ? SUBMISSION_STATUS_META[t2Status].badgeClass
                                          : 'bg-white text-ucaep-ink/60 border-ucaep-brown/20'
                                      }`}
                                    >
                                      {t2Status
                                        ? SUBMISSION_STATUS_META[t2Status].label
                                        : 'Non soumis'}
                                    </span>
                                  </div>

                                  {!t1Validated && (
                                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-950 flex items-center gap-2">
                                      <Lock className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        Validation séquentielle : validez d&apos;abord le{' '}
                                        <strong>Texte 1</strong> à l&apos;étape précédente
                                        pour pouvoir valider le Texte 2.
                                      </span>
                                    </div>
                                  )}

                                  {t2HasContent ? (
                                    <>
                                      <div className="p-4 bg-white border border-ucaep-brown/15 rounded-sm max-h-64 overflow-y-auto">
                                        <p className="text-sm text-ucaep-ink whitespace-pre-wrap leading-relaxed">
                                          {inspectingAccess.text2Content}
                                        </p>
                                      </div>

                                      <div className="space-y-1.5">
                                        <label
                                          htmlFor="review-note-2"
                                          className="block text-[11px] font-semibold uppercase tracking-wider text-ucaep-brown"
                                        >
                                          Observation sur le Texte 2 (optionnel)
                                        </label>
                                        <textarea
                                          id="review-note-2"
                                          rows={2}
                                          value={reviewNote2Draft}
                                          onChange={(e) =>
                                            setReviewNote2Draft(e.target.value)
                                          }
                                          placeholder="Appréciation ou motif de reprise pour le Texte 2..."
                                          className="w-full px-3 py-2 text-xs bg-white border border-ucaep-brown/25 rounded-sm"
                                        />
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          disabled={reviewSaving || !t1Validated}
                                          onClick={() =>
                                            handleUpdateSubmissionReview(
                                              inspectingItem.id,
                                              {
                                                textSlot: 2,
                                                status: 'validated',
                                                organizerNote: reviewNote2Draft,
                                              },
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-ucaep-green text-ucaep-paper hover:bg-[#233d27] disabled:opacity-45 disabled:cursor-not-allowed"
                                        >
                                          {t1Validated ? (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                          ) : (
                                            <Lock className="w-3.5 h-3.5" />
                                          )}
                                          <span>
                                            {t2Status === 'validated'
                                              ? 'Texte 2 validé'
                                              : 'Valider le Texte 2'}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={reviewSaving}
                                          onClick={() =>
                                            handleUpdateSubmissionReview(
                                              inspectingItem.id,
                                              {
                                                textSlot: 2,
                                                status: 'rejected',
                                                organizerNote: reviewNote2Draft,
                                              },
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-red-800 text-white hover:bg-red-900 disabled:opacity-50"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                          <span>À reprendre (Texte 2)</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={reviewSaving}
                                          onClick={() =>
                                            handleUpdateSubmissionReview(
                                              inspectingItem.id,
                                              {
                                                textSlot: 2,
                                                organizerNote: reviewNote2Draft,
                                              },
                                            )
                                          }
                                          className="px-3.5 py-2 text-xs font-medium rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper disabled:opacity-50"
                                        >
                                          Enregistrer la note
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-xs text-ucaep-ink/65 italic">
                                      Le candidat n&apos;a pas encore soumis le Texte 2.
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : inspectingAccess.signedUrl ? (
                          <div className="space-y-5">
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
                                · {formatFileSize(inspectingAccess.sizeBytes)} · Lien
                                temporaire valable 10 minutes
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

                            {/* VALIDATION & NOTE INTERNE POUR FICHIER */}
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
                                    SUBMISSION_STATUS_META[inspectingItem.status]
                                      .badgeClass
                                  }`}
                                >
                                  Statut actuel :{' '}
                                  {SUBMISSION_STATUS_META[inspectingItem.status].label}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET MESSAGES & DIFFICULTÉS CANDIDATS */}
        {tab === 'messages' && (
          <div className="space-y-6">
            <div className="p-6 bg-white border border-ucaep-brown/15 rounded-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
                    Support candidats &amp; messagerie
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-ucaep-brown">
                    Difficultés signalées sur /depot et messages de contact
                  </h2>
                  <p className="text-xs text-ucaep-ink/75 leading-relaxed">
                    Retrouvez ici toutes les demandes envoyées depuis le bouton « Signaler une difficulté » sur l&apos;espace de dépôt ainsi que les messages de la page Contact.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadOverview()}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {contactActionError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-300 rounded-sm text-xs text-red-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{contactActionError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 tabular-nums">
                {(
                  [
                    { id: 'all', label: `Tout (${contactStats.total})` },
                    { id: 'depot', label: `Difficultés dépôt (${contactStats.depotTotal})` },
                    { id: 'non_lu', label: `Non lus (${contactStats.unread})` },
                    { id: 'traite', label: `Traités (${contactStats.traite})` },
                  ] as const
                ).map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setContactFilter(flt.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-sm border transition-colors whitespace-nowrap shrink-0 ${
                      contactFilter === flt.id
                        ? 'bg-ucaep-brown text-ucaep-paper border-ucaep-brown'
                        : 'bg-ucaep-paper/50 text-ucaep-brown border-ucaep-brown/20 hover:border-ucaep-gold'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredContacts.length === 0 ? (
                <div className="p-8 bg-ucaep-paper/45 border border-ucaep-brown/12 rounded-sm text-sm text-ucaep-ink/70 text-center">
                  Aucun message ou signalement dans cette catégorie pour le moment.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredContacts.map((item) => {
                    const isDepotReport = item.subject.startsWith('[Difficulté Dépôt');
                    const isTreated = item.status === 'traite';
                    const isBusy = contactSavingId === item.id;
                    const mailSubject = encodeURIComponent(`Re: ${item.subject} — Concours UCAEP`);

                    return (
                      <article
                        key={item.id}
                        className={`p-5 border rounded-sm space-y-3 ${
                          isTreated
                            ? 'bg-ucaep-paper/40 border-ucaep-brown/12'
                            : 'bg-white border-ucaep-gold/45'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 font-semibold border rounded-sm ${
                                  isDepotReport
                                    ? 'bg-amber-50 text-amber-950 border-amber-300'
                                    : 'bg-ucaep-paper text-ucaep-brown border-ucaep-brown/20'
                                }`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>
                                  {isDepotReport ? 'Difficulté dépôt' : 'Contact général'}
                                </span>
                              </span>
                              <span
                                className={`px-2 py-0.5 font-semibold border rounded-sm ${
                                  isTreated
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : 'bg-red-50 text-red-900 border-red-300'
                                }`}
                              >
                                {isTreated ? 'Traité' : 'Non lu'}
                              </span>
                              <span className="text-ucaep-ink/60 tabular-nums">
                                {formatFrenchDate(item.createdAt)}
                              </span>
                            </div>

                            <h3 className="font-serif text-lg font-semibold text-ucaep-brown">
                              {item.subject}
                            </h3>
                            <p className="text-xs text-ucaep-ink/75">
                              De <strong>{item.name}</strong> ·{' '}
                              <span className="font-mono">{item.email}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={`mailto:${item.email}?subject=${mailSubject}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper whitespace-nowrap shrink-0"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Répondre par e-mail</span>
                            </a>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleContactStatus(item)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 ${
                                isTreated
                                  ? 'border border-ucaep-brown/25 bg-white text-ucaep-brown hover:bg-ucaep-paper'
                                  : 'bg-ucaep-green text-ucaep-paper hover:bg-[#233d27]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {isBusy
                                  ? 'Mise à jour...'
                                  : isTreated
                                    ? 'Rouvrir (non lu)'
                                    : 'Marquer comme traité'}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3.5 bg-ucaep-paper/55 border border-ucaep-brown/10 rounded-sm text-xs sm:text-sm text-ucaep-ink/88 leading-relaxed whitespace-pre-line">
                          {item.message}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* MODALE APERÇU VISITEUR IN-APP */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu visiteur du site public"
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-6"
        >
          <div className="bg-ucaep-paper border border-ucaep-brown/25 rounded-sm shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            {/* Barre supérieure de contrôle */}
            <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-ucaep-brown/15 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ucaep-green">
                  Aperçu visiteur en direct
                </p>
                <p className="text-xs text-ucaep-ink/75 tabular-nums">
                  {data.settings?.siteDisplay?.mode === 'phase_single_page'
                    ? `Mode Page Unique · ${data.settings.siteDisplay.activePhaseId}`
                    : 'Mode Site Complet (Multi-pages)'}{' '}
                  ·{' '}
                  {data.phases
                    .map(
                      (p) =>
                        `P${p.number}: ${p.isRevealed ? 'Révélée' : 'Masquée'}`,
                    )
                    .join(' · ')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['/', '/parcours', '/concours'] as const).map((route) => (
                  <button
                    key={route}
                    type="button"
                    onClick={() => {
                      setPreviewRoute(route);
                      setPreviewKey((k) => k + 1);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-sm border ${
                      previewRoute === route
                        ? 'bg-ucaep-brown text-ucaep-paper border-ucaep-brown'
                        : 'bg-ucaep-paper text-ucaep-brown border-ucaep-brown/20'
                    }`}
                  >
                    {route === '/' ? 'Accueil' : route === '/parcours' ? 'Parcours' : 'Concours'}
                  </button>
                ))}

                <div className="inline-flex border border-ucaep-brown/20 rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1.5 text-xs inline-flex items-center gap-1 ${
                      previewDevice === 'desktop'
                        ? 'bg-ucaep-green text-ucaep-paper'
                        : 'bg-white text-ucaep-brown'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bureau</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1.5 text-xs inline-flex items-center gap-1 ${
                      previewDevice === 'mobile'
                        ? 'bg-ucaep-green text-ucaep-paper'
                        : 'bg-white text-ucaep-brown'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1.5 rounded-sm border border-ucaep-brown/20 text-ucaep-brown hover:bg-ucaep-paper"
                  title="Recharger l'aperçu"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-sm border border-ucaep-brown/20 text-ucaep-brown hover:bg-red-50 hover:text-red-800"
                  title="Fermer l'aperçu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cadre iframe centré */}
            <div className="flex-1 bg-ucaep-brown/10 p-3 sm:p-5 overflow-auto flex justify-center">
              <iframe
                key={`${previewRoute}-${previewKey}`}
                src={previewRoute}
                title="Aperçu visiteur du site public UCAEP"
                className={`bg-white border border-ucaep-brown/20 rounded-sm shadow-lg h-full transition-all duration-200 ${
                  previewDevice === 'mobile' ? 'w-[390px]' : 'w-full'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
