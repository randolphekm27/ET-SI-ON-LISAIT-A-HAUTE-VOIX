import { useState, type FormEvent } from 'react';
import { Download, Lock, LogOut, Plus, Unlock } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
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

export function GestionPage() {
  usePageSeo(
    'Espace organisateurs',
    'Gestion des annonces, des phases et des inscriptions au concours UCAEP.',
  );

  const [token, setToken] = useState<string>('');
  const [firebaseToken, setFirebaseToken] = useState<string>('');
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [needsOrganizerLink, setNeedsOrganizerLink] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<'annonces' | 'parcours' | 'candidats' | 'config'>(
    'annonces',
  );
  const [notice, setNotice] = useState('');

  // Announcement creation form
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState('Officiel');
  const [annExcerpt, setAnnExcerpt] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annStatus, setAnnStatus] = useState<PublicationStatus>('draft');
  const [annScheduledAt, setAnnScheduledAt] = useState('');
  const [annImage, setAnnImage] = useState<MediaAssetKey>('campus');

  // Settings form
  const [gasUrl, setGasUrl] = useState('');
  const [gasTestMsg, setGasTestMsg] = useState('');
  const [gasTestError, setGasTestError] = useState('');

  function buildAuthHeaders(
    extraHeaders?: Record<string, string>,
    overrideAdminToken?: string,
    overrideFirebaseToken?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = { ...(extraHeaders || {}) };
    const effectiveAdmin = overrideAdminToken ?? token;
    const effectiveFirebase = overrideFirebaseToken ?? firebaseToken;
    if (effectiveAdmin) {
      headers['X-UCAEP-Admin-Token'] = effectiveAdmin;
    } else if (effectiveFirebase) {
      headers.Authorization = `Bearer ${effectiveFirebase}`;
    }
    return headers;
  }

  async function loadOverview(
    overrideAdminToken?: string,
    overrideFirebaseToken?: string,
  ) {
    const json = await fetchApiJson<AdminOverview>('/api/admin/overview', {
      headers: buildAuthHeaders(undefined, overrideAdminToken, overrideFirebaseToken),
    });
    setData(json);
    setGasUrl(json.settings.googleAppsScriptUrl || '');
  }

  async function handleGoogleLogin() {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      setFirebaseToken(idToken);
      setGoogleEmail(credential.user.email || '');

      const session = await fetchApiJson<{
        user: { uid: string; email: string; name: string | null };
        isOrganizer: boolean;
      }>('/api/auth/session', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (session.isOrganizer) {
        setNeedsOrganizerLink(false);
        await loadOverview('', idToken);
      } else {
        setNeedsOrganizerLink(true);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Impossible de finaliser la connexion Google.',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError('');
    try {
      if (needsOrganizerLink && firebaseToken) {
        const linked = await fetchApiJson<{ ok: boolean; token: string }>(
          '/api/admin/auth/link',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${firebaseToken}`,
            },
            body: JSON.stringify({ code: accessCode }),
          },
        );
        setToken(linked.token);
        setNeedsOrganizerLink(false);
        await loadOverview(linked.token, firebaseToken);
        return;
      }

      const json = await fetchApiJson<{ token: string }>('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode }),
      });
      setToken(json.token);
      await loadOverview(json.token, '');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion.');
    }
  }

  async function handleLogout() {
    setToken('');
    setFirebaseToken('');
    setGoogleEmail('');
    setNeedsOrganizerLink(false);
    setData(null);
    setAccessCode('');
    try {
      await signOut(auth);
    } catch {
      // ignore if user only signed in with access code
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
      setNotice('Annonce enregistrée.');
      await loadOverview();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Impossible d'enregistrer cette annonce.",
      );
    }
  }

  async function handleAnnouncementStatus(id: string, status: PublicationStatus) {
    await fetchApiJson(`/api/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    await loadOverview();
  }

  async function handleTogglePhaseReveal(phase: CompetitionPhase) {
    await fetchApiJson(`/api/admin/phases/${phase.id}`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        isRevealed: !phase.isRevealed,
        statusLabel: !phase.isRevealed ? 'Ouverte' : 'Verrouillée',
      }),
    });
    await loadOverview();
  }

  async function handlePhaseStatusLabel(
    phaseId: string,
    statusLabel: CompetitionPhase['statusLabel'],
  ) {
    await fetchApiJson(`/api/admin/phases/${phaseId}`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ statusLabel }),
    });
    await loadOverview();
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
      setNotice('Lien Google Sheets enregistré.');
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
      'Date',
      'Prénom',
      'Nom',
      'E-mail',
      'Téléphone',
      'Établissement',
      'Filière',
      'Niveau',
      'Matricule',
    ];
    const rows = data.registrations.map((r) => [
      r.referenceCode,
      r.createdAt,
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.institution,
      r.department,
      r.studyLevel,
      r.studentId,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inscriptions-ucaep-2026.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  if ((!token && !firebaseToken) || !data) {
    return (
      <div className="py-20 bg-[#FBF9F5]">
        <div className="max-w-md mx-auto px-4">
          <div className="p-8 bg-white border border-[#4E2A1E]/15 rounded-sm space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
                Équipe UCAEP
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                Espace organisateurs
              </h1>
              <p className="text-sm text-[#1A1A1A]/75">
                {needsOrganizerLink
                  ? `Compte connecté (${googleEmail}). Saisissez le code de l'équipe une fois pour activer votre accès.`
                  : 'Modifier les annonces, ouvrir ou fermer les phases du concours et suivre les inscriptions reçues.'}
              </p>
            </div>

            {authError && (
              <p className="p-3 text-sm bg-red-50 text-red-900 border border-red-800/20 rounded-sm">
                {authError}
              </p>
            )}

            {!needsOrganizerLink && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full py-3 px-4 text-sm font-semibold rounded-sm border border-[#4E2A1E]/25 bg-[#FBF9F5] text-[#4E2A1E] hover:bg-[#F7E6C8]/50 transition-colors disabled:opacity-50"
                >
                  {googleLoading
                    ? 'Connexion avec Google...'
                    : 'Continuer avec Google'}
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-[#4E2A1E]/12" />
                  <span className="mx-3 text-[11px] uppercase tracking-widest text-[#4E2A1E]/55">
                    ou
                  </span>
                  <div className="flex-grow border-t border-[#4E2A1E]/12" />
                </div>
              </>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="org-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
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
                  className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors"
              >
                {needsOrganizerLink ? 'Activer mon accès' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-14 bg-[#FBF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#4E2A1E]/15 pb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
              Équipe UCAEP · Organisation
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="font-serif text-4xl font-semibold text-[#4E2A1E]">
                Gestion du concours
              </h1>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-[#4E2A1E]/20 text-[#4E2A1E] hover:bg-[#4E2A1E]/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7E6C8]/45 rounded-sm border border-[#4E2A1E]/12">
            {(
              [
                ['annonces', 'Annonces'],
                ['parcours', 'Phases'],
                ['candidats', `Inscrits (${data.registrations.length})`],
                ['config', 'Google Sheets'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  tab === id
                    ? 'bg-[#4E2A1E] text-[#FBF9F5]'
                    : 'text-[#4E2A1E] hover:bg-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div className="p-3.5 text-sm bg-[#2E4D32]/10 text-[#2E4D32] border border-[#2E4D32]/25 rounded-sm">
            {notice}
          </div>
        )}

        {tab === 'annonces' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 p-6 bg-white border border-[#4E2A1E]/15 rounded-sm space-y-5 h-fit">
              <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E] flex items-center gap-2">
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
                  className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Catégorie"
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm"
                  />
                  <select
                    value={annImage}
                    onChange={(e) => setAnnImage(e.target.value as MediaAssetKey)}
                    className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm bg-white"
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
                  className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm"
                />
                <textarea
                  rows={4}
                  placeholder="Texte complet de l'annonce"
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={annStatus}
                    onChange={(e) => setAnnStatus(e.target.value as PublicationStatus)}
                    className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm bg-white"
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
                      className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d]"
                >
                  Enregistrer l&apos;annonce
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {data.announcements.length === 0 ? (
                <div className="p-8 bg-white border border-[#4E2A1E]/15 rounded-sm text-sm text-[#1A1A1A]/70">
                  Il n&apos;y a encore aucune publication ici.
                </div>
              ) : (
                data.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white border border-[#4E2A1E]/15 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-[#4E2A1E]/75 tabular-nums">
                        <span>{STATUS_LABELS[item.status]}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{formatFrenchDate(item.publishedAt)}</span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#1A1A1A]/70">{item.excerpt}</p>
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
                      className="px-3 py-2 text-xs font-medium border border-[#4E2A1E]/25 rounded-sm bg-[#FBF9F5] shrink-0"
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

        {tab === 'parcours' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.phases.map((phase) => (
              <div
                key={phase.id}
                className="p-6 bg-white border border-[#4E2A1E]/15 rounded-sm space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-[#4E2A1E]/75 tabular-nums">
                  <span>Phase {phase.number}</span>
                  <span>{phase.format}</span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
                  {phase.title}
                </h2>
                <p className="text-xs text-[#1A1A1A]/75 leading-relaxed">
                  {phase.shortDescription}
                </p>

                <div className="pt-2 space-y-3 border-t border-[#4E2A1E]/10">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#4E2A1E]">
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
                      className="w-full px-3 py-2 text-xs border border-[#4E2A1E]/25 rounded-sm bg-[#FBF9F5]"
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
                        ? 'bg-[#2E4D32] text-[#FBF9F5]'
                        : 'bg-[#F7E6C8] text-[#4E2A1E]'
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

        {tab === 'candidats' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#1A1A1A]/75 tabular-nums">
                {data.registrations.length} inscription(s) reçue(s).
              </p>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!data.registrations.length}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger en CSV</span>
              </button>
            </div>

            {data.registrations.length === 0 ? (
              <div className="p-8 bg-white border border-[#4E2A1E]/15 rounded-sm text-sm text-[#1A1A1A]/70">
                Personne ne s&apos;est encore inscrit pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-[#4E2A1E]/15 rounded-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#4E2A1E]/15 text-xs uppercase tracking-wider text-[#4E2A1E]">
                    <tr>
                      <th className="py-3 px-4">Référence</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Filière &amp; Niveau</th>
                      <th className="py-3 px-4">Matricule</th>
                      <th className="py-3 px-4">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4E2A1E]/10 tabular-nums">
                    {data.registrations.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 px-4 font-medium">{r.referenceCode}</td>
                        <td className="py-3 px-4">
                          {r.firstName} {r.lastName}
                        </td>
                        <td className="py-3 px-4">
                          {r.department} · {r.studyLevel}
                        </td>
                        <td className="py-3 px-4">{r.studentId}</td>
                        <td className="py-3 px-4 text-xs text-[#1A1A1A]/75">
                          {r.email} · {r.phone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'config' && (
          <div className="max-w-2xl p-6 sm:p-8 bg-white border border-[#4E2A1E]/15 rounded-sm space-y-5">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Lien Google Apps Script / Google Sheets
            </h2>
            <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
              Quand cette adresse Web App est renseignée, chaque inscription envoyée sur
              le site est automatiquement ajoutée dans votre feuille Google Sheets avant
              de confirmer au participant. Sur Vercel, ajoutez aussi la variable{' '}
              <code className="px-1.5 py-0.5 bg-[#F7E6C8]/60 rounded-sm text-xs">
                GOOGLE_APPS_SCRIPT_URL
              </code>{' '}
              dans les paramètres du projet pour la garder en permanence.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="gas-url"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                >
                  Adresse Web App Google Apps Script
                </label>
                <input
                  id="gas-url"
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm"
                />
              </div>
              {gasTestMsg && (
                <p className="p-3 text-xs bg-[#2E4D32]/10 text-[#2E4D32] border border-[#2E4D32]/25 rounded-sm">
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
                  className="px-5 py-2.5 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d]"
                >
                  Enregistrer le lien
                </button>
                <button
                  type="button"
                  onClick={handleTestGas}
                  className="px-5 py-2.5 text-sm font-medium rounded-sm border border-[#4E2A1E]/25 text-[#4E2A1E] hover:bg-[#4E2A1E]/5"
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
