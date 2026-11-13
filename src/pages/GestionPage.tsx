import { useState, type FormEvent } from 'react';
import { Download, Lock, Plus, Unlock } from 'lucide-react';
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
    'Gestion éditoriale des annonces, révélations de phases et inscriptions UCAEP.',
  );

  const [token, setToken] = useState<string>('');
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

  async function loadOverview(authToken: string) {
    const json = await fetchApiJson<AdminOverview>('/api/admin/overview', {
      headers: { 'X-UCAEP-Admin-Token': authToken },
    });
    setData(json);
    setGasUrl(json.settings.googleAppsScriptUrl || '');
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
      await loadOverview(json.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion.');
    }
  }

  async function handleCreateAnnouncement(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    try {
      await fetchApiJson('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-UCAEP-Admin-Token': token,
        },
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
      await loadOverview(token);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Erreur lors de la création.');
    }
  }

  async function handleAnnouncementStatus(id: string, status: PublicationStatus) {
    await fetchApiJson(`/api/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-UCAEP-Admin-Token': token,
      },
      body: JSON.stringify({ status }),
    });
    await loadOverview(token);
  }

  async function handleTogglePhaseReveal(phase: CompetitionPhase) {
    await fetchApiJson(`/api/admin/phases/${phase.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-UCAEP-Admin-Token': token,
      },
      body: JSON.stringify({
        isRevealed: !phase.isRevealed,
        statusLabel: !phase.isRevealed ? 'Ouverte' : 'Verrouillée',
      }),
    });
    await loadOverview(token);
  }

  async function handlePhaseStatusLabel(
    phaseId: string,
    statusLabel: CompetitionPhase['statusLabel'],
  ) {
    await fetchApiJson(`/api/admin/phases/${phaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-UCAEP-Admin-Token': token,
      },
      body: JSON.stringify({ statusLabel }),
    });
    await loadOverview(token);
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    setGasTestMsg('');
    setGasTestError('');
    try {
      await fetchApiJson('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-UCAEP-Admin-Token': token,
        },
        body: JSON.stringify({ googleAppsScriptUrl: gasUrl }),
      });
      setNotice('Configuration Google Apps Script enregistrée.');
      await loadOverview(token);
    } catch (err) {
      setGasTestError(err instanceof Error ? err.message : 'Erreur de sauvegarde.');
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
          headers: {
            'Content-Type': 'application/json',
            'X-UCAEP-Admin-Token': token,
          },
          body: JSON.stringify({ url: gasUrl }),
        },
      );
      setGasTestMsg(`Connexion réussie (${res.service}).`);
    } catch (err) {
      setGasTestError(
        err instanceof Error ? err.message : 'Échec de connexion à Google Apps Script.',
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
      'Email',
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

  if (!token || !data) {
    return (
      <div className="py-20 bg-[#FBF9F5]">
        <div className="max-w-md mx-auto px-4">
          <div className="p-8 bg-white border border-[#4E2A1E]/15 rounded-sm space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
                Comité UCAEP
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                Espace organisateurs
              </h1>
              <p className="text-sm text-[#1A1A1A]/75">
                Gérez les publications (brouillon, programmé, publié, archivé) et le
                dévoilement progressif des phases sans exposer d&apos;informations
                confidentielles.
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
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                >
                  Code d&apos;accès organisateur
                </label>
                <input
                  id="org-code"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Saisir le code comité"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors"
              >
                Accéder à la gestion
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
              Comité UCAEP · Gestion éditoriale
            </p>
            <h1 className="font-serif text-4xl font-semibold text-[#4E2A1E]">
              Tableau de publication
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7E6C8]/45 rounded-sm border border-[#4E2A1E]/12">
            {(
              [
                ['annonces', 'Annonces'],
                ['parcours', 'Phases'],
                ['candidats', `Candidats (${data.registrations.length})`],
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
                  placeholder="Titre court"
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
                    <option value="campus">Visuel Campus</option>
                    <option value="hero">Visuel Lecture</option>
                    <option value="plume">Visuel La Plume</option>
                    <option value="connaissance">Visuel Connaissance</option>
                    <option value="eloquence">Visuel Éloquence</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Extrait court (1 phrase)"
                  value={annExcerpt}
                  onChange={(e) => setAnnExcerpt(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#4E2A1E]/25 rounded-sm"
                />
                <textarea
                  rows={4}
                  placeholder="Contenu complet de l'annonce"
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
              {data.announcements.map((item) => (
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
              ))}
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
                      Statut affiché
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
                        <span>Consignes visibles publiquement</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Dévoiler les consignes</span>
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
                {data.registrations.length} candidature(s) enregistrée(s).
              </p>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!data.registrations.length}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter CSV</span>
              </button>
            </div>

            {data.registrations.length === 0 ? (
              <div className="p-8 bg-white border border-[#4E2A1E]/15 rounded-sm text-sm text-[#1A1A1A]/70">
                Aucune inscription enregistrée pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-[#4E2A1E]/15 rounded-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#4E2A1E]/15 text-xs uppercase tracking-wider text-[#4E2A1E]">
                    <tr>
                      <th className="py-3 px-4">Référence</th>
                      <th className="py-3 px-4">Candidat</th>
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
              Liaison Google Apps Script / Google Sheets
            </h2>
            <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
              Lorsque cette URL Web App Google Apps Script est renseignée, chaque
              nouvelle inscription est transmise côté serveur vers votre feuille Google
              Sheets liée avant toute confirmation au candidat. Sur Vercel, pensez
              également à enregistrer la variable{' '}
              <code className="px-1.5 py-0.5 bg-[#F7E6C8]/60 rounded-sm text-xs">
                GOOGLE_APPS_SCRIPT_URL
              </code>{' '}
              dans les paramètres d&apos;environnement du projet pour une persistance
              permanente.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="gas-url"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                >
                  URL Web App Google Apps Script
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
                  Enregistrer la configuration
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
