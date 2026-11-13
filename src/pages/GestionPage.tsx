import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Download, Lock, LogOut, Plus, RefreshCw, Search, Unlock } from 'lucide-react';
import { fetchApiJson } from '../lib/api';
import { formatFrenchDate, usePageSeo } from '../lib/format';
import type {
  Announcement,
  CompetitionPhase,
  ContactMessageRecord,
  MediaAssetKey,
  NewsArticle,
  PublicationStatus,
  RegistrationRecord,
} from '../types/competition';

interface AdminOverview {
  announcements: Announcement[];
  phases: CompetitionPhase[];
  news: NewsArticle[];
  registrations: RegistrationRecord[];
  contacts: ContactMessageRecord[];
  settings: {
    googleAppsScriptUrl: string;
  };
}

const STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmé',
  published: 'Publié',
  archived: 'Archivé',
};

const CANDIDATES_PER_PAGE = 50;

export function GestionPage() {
  usePageSeo(
    'Espace organisateurs',
    'Gestion des annonces, des phases et des inscriptions au concours UCAEP.',
  );

  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem('ucaep_admin_token') || '';
    } catch {
      return '';
    }
  });
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<
    'annonces' | 'actualites' | 'parcours' | 'candidats' | 'config'
  >(() => {
    try {
      const savedTab = sessionStorage.getItem('ucaep_admin_tab');
      if (
        savedTab &&
        ['annonces', 'actualites', 'parcours', 'candidats', 'config'].includes(savedTab)
      ) {
        return savedTab as 'annonces' | 'actualites' | 'parcours' | 'candidats' | 'config';
      }
    } catch {
      // ignore
    }
    return 'annonces';
  });
  const [notice, setNotice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  function selectTab(newTab: 'annonces' | 'actualites' | 'parcours' | 'candidats' | 'config') {
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
    if (!silent) setIsRefreshing(true);
    try {
      const json = await fetchApiJson<AdminOverview>('/api/admin/overview', {
        headers: buildAuthHeaders(undefined, overrideAdminToken),
      });
      setData(json);
      setGasUrl(json.settings.googleAppsScriptUrl || '');
      setLastSyncedAt(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement.';
      if (!silent) setAuthError(msg);
      if (msg.includes('401') || msg.includes('requise') || msg.includes('expirée')) {
        setToken('');
        setData(null);
        try {
          sessionStorage.removeItem('ucaep_admin_token');
        } catch {
          // ignore
        }
      }
    } finally {
      if (!silent) setIsRefreshing(false);
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
      setToken(json.token);
      try {
        sessionStorage.setItem('ucaep_admin_token', json.token);
      } catch {
        // ignore
      }
      await loadOverview(json.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion.');
    }
  }

  function handleLogout() {
    setToken('');
    setData(null);
    setAccessCode('');
    try {
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
    try {
      await fetchApiJson(`/api/admin/phases/${phase.id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          isRevealed: !phase.isRevealed,
          statusLabel: !phase.isRevealed ? 'Ouverte' : 'Verrouillée',
        }),
      });
      await loadOverview();
      setNotice(`Phase ${phase.number} mise à jour avec succès.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Mise à jour impossible.');
    }
  }

  async function handlePhaseStatusLabel(
    phaseId: string,
    statusLabel: CompetitionPhase['statusLabel'],
  ) {
    try {
      await fetchApiJson(`/api/admin/phases/${phaseId}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statusLabel }),
      });
      await loadOverview();
      setNotice('Statut de la phase mis à jour avec succès.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Mise à jour impossible.');
    }
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

  if (!token || !data) {
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Base connectée (Temps réel)</span>
              </div>
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
                ['annonces', 'Annonces'],
                ['actualites', `Actualités (${data.news.length})`],
                ['parcours', 'Phases'],
                ['candidats', `Inscrits (${data.registrations.length})`],
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

        {notice && (
          <div className="p-3.5 text-sm bg-ucaep-green/10 text-ucaep-green border border-ucaep-green/25 rounded-sm">
            {notice}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.phases.map((phase) => (
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
                      value={phase.statusLabel}
                      onChange={(e) =>
                        handlePhaseStatusLabel(
                          phase.id,
                          e.target.value as CompetitionPhase['statusLabel'],
                        )
                      }
                      className="w-full px-3 py-2 text-xs border border-ucaep-brown/25 rounded-sm bg-ucaep-paper"
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
                    onClick={() => handleTogglePhaseReveal(phase)}
                    className={`w-full py-2.5 px-4 text-xs font-semibold rounded-sm inline-flex items-center justify-center gap-2 transition-colors ${
                      phase.isRevealed
                        ? 'bg-ucaep-green text-ucaep-paper'
                        : 'bg-ucaep-ivory text-ucaep-brown'
                    }`}
                  >
                    {phase.isRevealed ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Consignes visibles par tous</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Rendre les consignes visibles</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
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
