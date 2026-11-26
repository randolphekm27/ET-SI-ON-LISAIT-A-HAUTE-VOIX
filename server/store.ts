import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { asc, desc, eq, or, sql } from 'drizzle-orm';
import { db, getCleanDatabaseUrl, isCloudSqlConfigured } from '../src/db/index.ts';
import {
  ensureDatabaseSchemaReady,
  isSchemaDriftError,
} from '../src/db/schema-sync.ts';
import {
  announcements as announcementsTable,
  appSettings as appSettingsTable,
  contactMessages as contactMessagesTable,
  newsArticles as newsArticlesTable,
  phases as phasesTable,
  registrations as registrationsTable,
} from '../src/db/schema.ts';
import {
  getSupabaseAdmin,
  getSupabaseServerDiagnostics,
  isSupabaseAdminConfigured,
} from './supabase-admin.ts';
import {
  createAnnouncementViaSupabaseRest,
  createNewsViaSupabaseRest,
  isContactStatusCheckError,
  isNetworkOrDnsError,
  isPgFallbackEligibleError,
  isSafeHttpUrl,
  markPreferSupabaseRest,
  markRegistrationSyncedViaSupabaseRest,
  normalizeContactStatusFromDb,
  parseSiteDisplayValue,
  readStoreViaSupabaseRest,
  saveContactViaSupabaseRest,
  saveRegistrationViaSupabaseRest,
  shouldUseSupabaseRestFallback,
  TREATED_DB_STATUSES,
  UNREAD_DB_STATUSES,
  updateAnnouncementViaSupabaseRest,
  updateContactStatusViaSupabaseRest,
  updateNewsViaSupabaseRest,
  updatePhaseViaSupabaseRest,
  updateSettingsViaSupabaseRest,
  updateSiteDisplayViaSupabaseRest,
} from './supabase-db.ts';
import type {
  Announcement,
  CompetitionPhase,
  ContactMessageRecord,
  ContactPayload,
  MediaAssetKey,
  NewsArticle,
  PhaseTestDetails,
  PublicAnnouncement,
  PublicNewsArticle,
  PublicationStatus,
  RegistrationPayload,
  RegistrationRecord,
  SiteDisplayConfig,
  SubmissionKind,
  SubmissionStatus,
} from '../src/types/competition';

export { isSafeHttpUrl };

export function normalizeSiteDisplayConfig(raw: unknown): SiteDisplayConfig {
  return parseSiteDisplayValue(raw);
}

export interface LocalSubmissionRecord {
  id: string;
  registrationId: string;
  phaseId: string;
  kind: SubmissionKind;
  storagePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  textContent: string | null;
  status: SubmissionStatus;
  organizerNote: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreData {
  announcements: Announcement[];
  phases: CompetitionPhase[];
  news: NewsArticle[];
  registrations: RegistrationRecord[];
  contacts: ContactMessageRecord[];
  submissions?: LocalSubmissionRecord[];
  settings: {
    googleAppsScriptUrl: string;
    googleFormActionUrl: string;
    officialEmail: string;
    siteDisplay: SiteDisplayConfig;
  };
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'ucaep-data')
  : path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export function getLocalDataDir(): string {
  return DATA_DIR;
}

const DEFAULT_STORE: StoreData = {
  settings: {
    googleAppsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    googleFormActionUrl: process.env.GOOGLE_FORM_ACTION_URL || '',
    officialEmail: 'ucaeplokossa@gmail.com',
    siteDisplay: {
      mode: 'multi_page',
      activePhaseId: 'phase-1',
      customNotice: '',
      externalForms: {},
    },
  },
  phases: [
    {
      id: 'phase-1',
      number: '01',
      title: 'La Plume',
      shortDescription:
        "Vous commencez chez vous : vous rédigez deux textes personnels en français puis vous les lisez face caméra (jusqu'à 5 minutes par épreuve). Cette première phase en ligne vérifie la sincérité de votre écriture et votre aisance de lecture.",
      format: 'En ligne',
      statusLabel: 'Ouverte',
      isRevealed: true,
      submissionsOpen: false,
      submissionDeadline: null,
      imageKey: 'plume',
      testDetails: {
        instructionsTitle:
          'Phase 01 — La Plume : deux créations personnelles et leur lecture filmée',
        theme:
          'Épreuve 1 : « Je suis… » · Épreuve 2 : « Les mots que l’on n’ose pas dire »',
        instructions:
          "Pour cette première étape en ligne, vous rédigez deux textes entièrement personnels, puis vous vous filmez en train de les lire à haute voix (avec un simple téléphone dans un endroit calme, jusqu'à 5 minutes par vidéo). La première épreuve (« Je suis… ») vous propose de vous présenter au-delà de votre filière ou de votre état civil. La seconde (« Les mots que l'on n'ose pas dire ») vous invite à formuler une pensée, un merci ou une réflexion gardée pour vous. Vos productions sont notées sur 20 points sous code anonyme.",
        submissionNote:
          'Phase qualificative en ligne · Deux textes originaux et deux vidéos sous code UCAEP · Jusqu’à 5 minutes par prestation.',
      },
    },
    {
      id: 'phase-2',
      number: '02',
      title: 'La Connaissance',
      shortDescription:
        "Si vous êtes retenu après La Plume, vous passez de l'écriture personnelle à la transmission : vous préparez deux exposés clairs et accessibles avec leurs vidéos (jusqu'à 5 minutes) pour expliquer une notion scientifique et réfléchir au rôle de l'école.",
      format: 'En ligne',
      statusLabel: 'Verrouillée',
      isRevealed: false,
      submissionsOpen: false,
      submissionDeadline: null,
      imageKey: 'connaissance',
      testDetails: {
        instructionsTitle:
          'Phase 02 — La Connaissance : vulgarisation scientifique et réflexion sur le savoir',
        theme:
          "Épreuve 3 : « La science dans notre quotidien » · Épreuve 4 : « L'école, le savoir et l'avenir »",
        instructions:
          "Ouverte au Jour 6 aux candidats qualifiés de La Plume, cette deuxième phase en ligne met votre clarté pédagogique à l'épreuve. Vous rédigez d'abord une explication accessible d'un phénomène de la vie courante, puis un texte argumenté sur le sens de l'école et du savoir, avant de les présenter en vidéo (jusqu'à 5 minutes par présentation). Le jury évalue l'exactitude de vos idées, la simplicité des exemples et la qualité de l'exposé.",
        submissionNote:
          'Phase qualificative en ligne · Deux dossiers explicatifs et deux vidéos sous code UCAEP · Sélection des finalistes.',
      },
    },
    {
      id: 'phase-3',
      number: '03',
      title: "L'Éloquence",
      shortDescription:
        "La finale réunit les candidats qualifiés en présentiel à l'ENSET de Lokossa. Après deux journées d'ateliers pratiques de diction (Jours 12 et 13), vous prenez la parole sur scène devant le jury et vos camarades.",
      format: 'En présentiel',
      statusLabel: 'Verrouillée',
      isRevealed: false,
      submissionsOpen: false,
      submissionDeadline: null,
      imageKey: 'eloquence',
      testDetails: {
        instructionsTitle:
          "Phase 03 — L'Éloquence : Grande Finale en présentiel à l'ENSET de Lokossa",
        theme:
          "Épreuve 5 : « La parole que le monde doit entendre » · Épreuve 6 : « Le défi de l'inattendu »",
        instructions:
          "Après deux journées d'ateliers de diction, de souffle et de posture (Jours 12 et 13), vous montez sur scène au Jour 14 sans aucun dépôt vidéo en ligne. Vous présentez d'abord un discours préparé sur un sujet libre qui vous tient à cœur, puis vous relevez un exercice d'improvisation sur un thème remis le jour même après un court temps de préparation.",
        submissionNote:
          "Finale en présentiel à l'ENSET de Lokossa (sans élimination en cours de soirée) · Remise des attestations.",
      },
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      slug: 'ouverture-des-inscriptions-edition-2026',
      title: "Ouverture des inscriptions pour l'édition 2026 à l'ENSET de Lokossa",
      excerpt:
        "Tous les étudiants de l'ENSET de Lokossa peuvent s'inscrire gratuitement en ligne jusqu'au vendredi 20 novembre 2026 et recevoir aussitôt leur code candidat.",
      content:
        "La Session Théâtre de l'UCAEP ouvre les inscriptions pour l'édition 2026 du concours « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.\n\nLa participation est entièrement gratuite et ouverte à tous les étudiants inscrits à l'établissement, quelle que soit leur spécialité technique ou scientifique et sans expérience théâtrale préalable.\n\nDès que vous validez le formulaire en ligne (avant le vendredi 20 novembre 2026), un code d'anonymat personnel vous est attribué. Conservez-le précieusement : c'est lui qui vous permettra de déposer vos productions en ligne sans que les membres du jury connaissent votre nom.",
      publishedAt: '2026-11-10T09:00:00.000Z',
      status: 'published',
      category: 'Inscription',
      imageKey: 'hero',
    },
    {
      id: 'ann-2',
      slug: 'calendrier-progressif-des-revelations',
      title: 'Pourquoi les consignes des phases sont publiées étape par étape',
      excerpt:
        "Les sujets de chaque nouvelle étape sont dévoilés au même moment pour tous afin que chacun prépare ses productions dans les mêmes conditions.",
      content:
        "Le concours suit une progression en trois étapes : d'abord La Plume (en ligne), puis La Connaissance (en ligne), et enfin L'Éloquence (en présentiel à l'ENSET de Lokossa).\n\nPour que personne ne prenne d'avance injustifiée et que tous les étudiants disposent exactement du même temps de préparation, les sujets et les liens de dépôt de chaque phase sont activés simultanément au calendrier officiel. Vous retrouverez ici chaque mise à jour ainsi que sur le canal d'information des inscrits.",
      publishedAt: '2026-11-12T10:00:00.000Z',
      status: 'published',
      category: 'Organisation',
      imageKey: 'campus',
    },
    {
      id: 'ann-3',
      slug: 'revelation-phase-1-la-plume',
      title: 'Lancement de la Phase 01 : La Plume',
      excerpt:
        "Note programmée pour accompagner l'ouverture des dépôts en ligne de la première phase.",
      content:
        "Cette communication annoncera l'ouverture effective des consignes et de l'espace de dépôt pour la Phase 01 (La Plume) dès sa mise en ligne par l'équipe organisatrice.",
      publishedAt: '2026-12-01T08:00:00.000Z',
      scheduledAt: '2026-12-01T08:00:00.000Z',
      status: 'scheduled',
      category: 'Phase 01',
      imageKey: 'plume',
    },
    {
      id: 'ann-4',
      slug: 'note-interne-jury-preparation',
      title: 'Brouillon — Organisation de la finale en présentiel',
      excerpt: "Note de préparation interne de la Session Théâtre UCAEP.",
      content:
        "Document de coordination interne en attente de validation avant publication.",
      publishedAt: '2026-11-12T12:00:00.000Z',
      status: 'draft',
      category: 'Interne',
      imageKey: 'eloquence',
    },
  ],
  news: [
    {
      id: 'news-1',
      slug: 'lancement-culturel-enset-lokossa',
      title: "Pourquoi lire à haute voix quand on étudie les sciences et techniques à l'ENSET ?",
      category: 'Vie du concours',
      publishedAt: '2026-11-08T14:00:00.000Z',
      readTime: '2 min',
      excerpt:
        "Même dans une formation scientifique ou technique, savoir rédiger clairement, vulgariser une idée et convaincre à l'oral change la manière d'apprendre et d'enseigner.",
      content: [
        "À l'ENSET de Lokossa, votre quotidien est fait de cours techniques, de démonstrations, de schémas et de travaux pratiques. Pourtant, dès qu'il s'agit de soutenir un mémoire, de préparer un cours devant une classe ou d'expliquer un projet technique, une autre compétence devient décisive : savoir formuler clairement sa pensée et la porter à voix haute.",
        "Avec « Et si on lisait à haute voix ? », la Session Théâtre de l'UCAEP vous propose un parcours progressif gratuit en trois temps : rédiger un texte personnel, vulgariser une notion scientifique ou éducative, puis prendre la parole devant un public.",
        "L'objectif n'est pas de réserver l'exercice aux habitués des clubs littéraires ou théâtraux : au contraire, chaque étudiant de l'établissement peut y participer pour apprendre étape par étape, avec des critères transparents et un accompagnement pratique.",
      ],
      imageKey: 'campus',
      featured: true,
      status: 'published',
    },
    {
      id: 'news-2',
      slug: 'trois-etapes-pour-reveler-les-voix',
      title: 'Comment s’enchaînent les deux phases en ligne et la finale sur le campus',
      category: 'Coulisses',
      publishedAt: '2026-11-05T11:30:00.000Z',
      readTime: '2 min',
      excerpt:
        "De chez vous en vidéo jusqu'à la scène de l'ENSET de Lokossa : vue d'ensemble du cheminement sur trois semaines.",
      content: [
        "Pour que chacun puisse participer sans contrainte de déplacement au début, les deux premières phases se passent entièrement en ligne. Vous commencez avec La Plume en rédigeant deux textes personnels lus ensuite face caméra, avant d'aborder La Connaissance autour de la vulgarisation et du rôle du savoir.",
        "Entre chaque étape, les copies sont évaluées en double lecture sous code candidat anonyme. Les finalistes bénéficient enfin de deux jours d'ateliers pratiques de diction sur le campus avant de monter sur scène pour L'Éloquence, devant le jury et les étudiants.",
      ],
      imageKey: 'plume',
      featured: false,
      status: 'published',
    },
    {
      id: 'news-3',
      slug: 'preparer-sa-candidature-etudiant',
      title: 'Préparer son inscription et comprendre le code d’anonymat UCAEP',
      category: 'Candidats',
      publishedAt: '2026-11-03T09:15:00.000Z',
      readTime: '1 min',
      excerpt:
        "Ce qu'il vous faut sous la main pour vous inscrire en deux minutes et protéger votre anonymat devant le jury.",
      content: [
        "L'inscription est gratuite et réservée aux étudiants régulièrement inscrits à l'ENSET de Lokossa, quelle que soit la filière.",
        "Avant de remplir le formulaire, gardez à portée de main votre numéro matricule, une adresse e-mail que vous consultez souvent et quelques phrases expliquant ce qui vous donne envie de participer. Dès l'envoi, la plateforme vous remet un code UCAEP personnel : c'est uniquement sous ce numéro que vos productions seront transmises aux correcteurs.",
      ],
      imageKey: 'connaissance',
      featured: false,
      status: 'published',
    },
    {
      id: 'news-4',
      slug: 'atelier-preparation-prise-de-parole',
      title: 'Pourquoi relire son propre texte à haute voix avant d’allumer la caméra',
      category: 'Coulisses',
      publishedAt: '2026-10-29T16:00:00.000Z',
      readTime: '2 min',
      excerpt:
        'Un passage lu à voix haute révèle immédiatement les phrases trop longues, les silences utiles et la clarté réelle de votre propos.',
      content: [
        "Quand on relit un texte seulement dans sa tête, on ne remarque pas toujours une phrase trop longue ou un enchaînement confus. Le lire à haute voix oblige à respirer, à poser des pauses et à vérifier si l'idée reste compréhensible dès la première écoute.",
        "Comme les présentations vidéo durent jusqu'à 5 minutes au maximum, cette habitude vous aide aussi à garder un débit posé et naturel — une qualité aussi utile face caméra que devant une future classe ou un jury de soutenance.",
      ],
      imageKey: 'eloquence',
      featured: false,
      status: 'published',
    },
  ],
  registrations: [],
  contacts: [],
  submissions: [],
};

let seedPromise: Promise<void> | null = null;
let isDbSeeded = false;
let writeQueue = Promise.resolve();
let cachedStore: StoreData | null = null;
let inMemoryJsonStore: StoreData | null = null;

async function ensureDbSeeded(): Promise<void> {
  if (!isCloudSqlConfigured() || isDbSeeded) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        await ensureDatabaseSchemaReady();
        const existingPhases = await db
          .select({ id: phasesTable.id })
          .from(phasesTable)
          .limit(1);

        if (existingPhases.length === 0) {
          await db
            .insert(phasesTable)
            .values(
              DEFAULT_STORE.phases.map((p, idx) => ({
                id: p.id,
                number: parseInt(p.number, 10) || idx + 1,
                title: p.title,
                shortDescription: p.shortDescription,
                format: p.format,
                statusLabel: p.statusLabel,
                isRevealed: p.isRevealed,
                submissionsOpen: Boolean(p.submissionsOpen),
                submissionDeadline: p.submissionDeadline ? new Date(p.submissionDeadline) : null,
                imageKey: p.imageKey,
                testDetails: p.testDetails || null,
                sortOrder: idx + 1,
              })),
            )
            .onConflictDoNothing();
        }

        const existingAnnouncements = await db
          .select({ id: announcementsTable.id })
          .from(announcementsTable)
          .limit(1);

        if (existingAnnouncements.length === 0) {
          await db
            .insert(announcementsTable)
            .values(
              DEFAULT_STORE.announcements.map((a) => ({
                id: crypto.randomUUID(),
                slug: a.slug,
                title: a.title,
                excerpt: a.excerpt,
                content: a.content,
                publishedAt: new Date(a.publishedAt),
                scheduledAt: a.scheduledAt ? new Date(a.scheduledAt) : null,
                status: a.status,
                category: a.category,
                imageKey: a.imageKey,
              })),
            )
            .onConflictDoNothing();
        }

        const existingNews = await db
          .select({ id: newsArticlesTable.id })
          .from(newsArticlesTable)
          .limit(1);

        if (existingNews.length === 0) {
          await db
            .insert(newsArticlesTable)
            .values(
              DEFAULT_STORE.news.map((n) => ({
                id: crypto.randomUUID(),
                slug: n.slug,
                title: n.title,
                category: n.category,
                publishedAt: new Date(n.publishedAt),
                readTime: n.readTime,
                excerpt: n.excerpt,
                content: n.content,
                imageKey: n.imageKey,
                featured: Boolean(n.featured),
                status: n.status,
              })),
            )
            .onConflictDoNothing();
        }

        if (process.env.GOOGLE_APPS_SCRIPT_URL) {
          await db
            .insert(appSettingsTable)
            .values({
              key: 'googleAppsScriptUrl',
              value: { url: process.env.GOOGLE_APPS_SCRIPT_URL },
            })
            .onConflictDoNothing();
        }

        isDbSeeded = true;
      } catch (error) {
        seedPromise = null;
        console.warn('Initial seed check non bloquant:', (error as Error).message);
      }
    })();
  }
  await seedPromise;
}

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
  }
}

export async function readJsonStore(): Promise<StoreData> {
  try {
    await ensureStoreFile();
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const rawPhases = parsed.phases?.length ? parsed.phases : DEFAULT_STORE.phases;
    const normalizedPhases = rawPhases.map((p) => ({
      ...p,
      submissionsOpen: Boolean(p.submissionsOpen),
      submissionDeadline: p.submissionDeadline ?? null,
    }));
    const loaded: StoreData = {
      settings: {
        ...DEFAULT_STORE.settings,
        ...(parsed.settings || {}),
        googleAppsScriptUrl:
          parsed.settings?.googleAppsScriptUrl ||
          process.env.GOOGLE_APPS_SCRIPT_URL ||
          '',
        googleFormActionUrl:
          parsed.settings?.googleFormActionUrl ||
          process.env.GOOGLE_FORM_ACTION_URL ||
          '',
        siteDisplay: normalizeSiteDisplayConfig(parsed.settings?.siteDisplay),
      },
      phases: normalizedPhases,
      announcements: parsed.announcements?.length
        ? parsed.announcements
        : DEFAULT_STORE.announcements,
      news: parsed.news?.length ? parsed.news : DEFAULT_STORE.news,
      registrations: parsed.registrations || [],
      contacts: parsed.contacts || [],
      submissions: parsed.submissions || [],
    };
    inMemoryJsonStore = loaded;
    return loaded;
  } catch {
    if (inMemoryJsonStore) {
      return inMemoryJsonStore;
    }
    return structuredClone(DEFAULT_STORE);
  }
}

async function writeJsonStore(data: StoreData): Promise<void> {
  inMemoryJsonStore = data;
  await ensureStoreFile();
  const tmpPath = `${STORE_PATH}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  try {
    await fs.rename(tmpPath, STORE_PATH);
  } catch {
    // Sur Windows, si le fichier cible est temporairement verrouillé par un indexeur ou antivirus,
    // on écrit directement pour éviter de perdre des modifications.
    try {
      await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      await fs.unlink(tmpPath).catch(() => {});
    } catch {
      // Ignorer si l'écriture directe est également retenue brièvement
    }
  }
}

export function withJsonStoreLock<T>(fn: (store: StoreData) => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(async () => {
    const store = await readJsonStore();
    const result = await fn(store);
    await writeJsonStore(store);
    return result;
  });
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function mapAnnouncementRow(row: typeof announcementsTable.$inferSelect): Announcement {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : String(row.publishedAt),
    scheduledAt: row.scheduledAt ? (row.scheduledAt instanceof Date ? row.scheduledAt.toISOString() : String(row.scheduledAt)) : undefined,
    status: row.status,
    category: row.category,
    imageKey: row.imageKey,
  };
}

function mapPhaseRow(row: typeof phasesTable.$inferSelect): CompetitionPhase {
  return {
    id: row.id,
    number: String(row.number).padStart(2, '0'),
    title: row.title,
    shortDescription: row.shortDescription,
    format: row.format,
    statusLabel: row.statusLabel,
    isRevealed: row.isRevealed,
    submissionsOpen: Boolean(row.submissionsOpen),
    submissionDeadline: row.submissionDeadline
      ? row.submissionDeadline instanceof Date
        ? row.submissionDeadline.toISOString()
        : String(row.submissionDeadline)
      : null,
    imageKey: row.imageKey,
    testDetails: row.testDetails || null,
  };
}

function mapNewsRow(row: typeof newsArticlesTable.$inferSelect): NewsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : String(row.publishedAt),
    readTime: row.readTime,
    excerpt: row.excerpt,
    content: Array.isArray(row.content) ? row.content : [],
    imageKey: row.imageKey,
    featured: row.featured,
    status: row.status,
  };
}

function mapRegistrationRow(
  row: typeof registrationsTable.$inferSelect,
): RegistrationRecord {
  return {
    id: row.id,
    referenceCode: row.referenceCode,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    birthDate: row.birthDate,
    gender: row.gender,
    institution: row.institution,
    department: row.department,
    studyLevel: row.studyLevel,
    studentId: row.studentId,
    motivation: row.motivation,
    readingExperience: row.readingExperience,
    acceptRules: row.acceptRules,
    syncedToGoogleSheets: row.syncedToGoogleSheets,
    syncTarget: row.syncTarget,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function extractErrorDetail(err: unknown): string {
  if (!err) return 'Erreur inconnue';
  const e = err as any;
  const cause = e.cause || {};
  const causeMsg = cause.message || (typeof cause === 'string' ? cause : '');
  const mainMsg = e.message || String(err);
  const code = cause.code || e.code;
  const detail = cause.detail || e.detail;

  const parts: string[] = [];
  if (causeMsg && causeMsg !== mainMsg) {
    parts.push(causeMsg);
  } else {
    parts.push(mainMsg);
  }
  if (code) parts.push(`Code: ${code}`);
  if (detail) parts.push(`Détail: ${detail}`);

  return parts.join(' — ');
}

function getDefaultStoreSlices() {
  return {
    phases: DEFAULT_STORE.phases,
    announcements: DEFAULT_STORE.announcements,
    news: DEFAULT_STORE.news,
  };
}

export async function readStore(): Promise<StoreData> {
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    const restData = await readStoreViaSupabaseRest(getDefaultStoreSlices());
    cachedStore = restData;
    return restData;
  }

  if (!isCloudSqlConfigured()) {
    return readJsonStore();
  }

  let lastError: unknown = null;
  const maxAttempts = 3;

  try {
    await ensureDatabaseSchemaReady();
  } catch (schemaErr) {
    if (isPgFallbackEligibleError(schemaErr) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      const restData = await readStoreViaSupabaseRest(getDefaultStoreSlices());
      cachedStore = restData;
      return restData;
    }
    console.warn('Vérification initiale du schéma PostgreSQL :', extractErrorDetail(schemaErr));
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let phaseRows = await db.select().from(phasesTable).orderBy(asc(phasesTable.sortOrder));
      if (phaseRows.length === 0) {
        await ensureDbSeeded();
        phaseRows = await db.select().from(phasesTable).orderBy(asc(phasesTable.sortOrder));
      }
      const announcementRows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.publishedAt));
      const newsRows = await db.select().from(newsArticlesTable).orderBy(desc(newsArticlesTable.publishedAt));
      const registrationRows = await db.select().from(registrationsTable).orderBy(desc(registrationsTable.createdAt));
      const contactRows = await db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.createdAt));
      const settingsRows = await db.select().from(appSettingsTable);

      const settingsMap = new Map(
        settingsRows.map((s) => [
          s.key,
          typeof s.value === 'string'
            ? s.value
            : typeof s.value === 'object' && s.value !== null
              ? (s.value as { url?: string; value?: string }).url || (s.value as { url?: string; value?: string }).value || JSON.stringify(s.value)
              : String(s.value || ''),
        ]),
      );
      const rawSiteDisplayRow = settingsRows.find((s) => s.key === 'siteDisplay')?.value;

      const storeData: StoreData = {
        phases: phaseRows.map(mapPhaseRow),
        announcements: announcementRows.map(mapAnnouncementRow),
        news: newsRows.map(mapNewsRow),
        registrations: registrationRows.map(mapRegistrationRow),
        contacts: contactRows.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          subject: c.subject,
          message: c.message,
          status: normalizeContactStatusFromDb(c.status),
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
        })),
        settings: {
          googleAppsScriptUrl:
            settingsMap.get('googleAppsScriptUrl') ||
            process.env.GOOGLE_APPS_SCRIPT_URL ||
            '',
          googleFormActionUrl:
            settingsMap.get('googleFormActionUrl') ||
            process.env.GOOGLE_FORM_ACTION_URL ||
            '',
          officialEmail: 'ucaeplokossa@gmail.com',
          siteDisplay: normalizeSiteDisplayConfig(rawSiteDisplayRow),
        },
      };

      cachedStore = storeData;
      return storeData;
    } catch (error) {
      lastError = error;
      if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
        markPreferSupabaseRest();
        const restData = await readStoreViaSupabaseRest(getDefaultStoreSlices());
        cachedStore = restData;
        return restData;
      }
      console.warn(
        `Tentative ${attempt}/${maxAttempts} lecture PostgreSQL échouée:`,
        extractErrorDetail(error),
      );
      if (attempt < maxAttempts) {
        if (isSchemaDriftError(error)) {
          await ensureDatabaseSchemaReady(true).catch(() => {});
        } else {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  }

  // Si nous avons des données récentes en mémoire cache, on les sert plutôt que de bloquer l'affichage
  if (cachedStore && cachedStore.registrations.length > 0) {
    console.warn('Utilisation du cache mémoire de secours pour préserver les tables affichées.');
    return cachedStore;
  }

  const detail = extractErrorDetail(lastError);

  // Ne jamais écraser silencieusement avec un store JSON vide lorsque PostgreSQL est configuré
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const dbUrl = getCleanDatabaseUrl();
    const isDirectSupabaseHost = /@db\.[a-z0-9]+\.supabase\.(co|com)/i.test(dbUrl);
    if (isNetworkOrDnsError(lastError) && isDirectSupabaseHost && !isSupabaseAdminConfigured()) {
      const diag = getSupabaseServerDiagnostics();
      const missing: string[] = [];
      if (!diag.hasUrl) missing.push('SUPABASE_URL');
      if (!diag.hasSecretKey) missing.push('SUPABASE_SECRET_KEY');
      throw new Error(
        `Connexion directe impossible sur Vercel (${detail}).\n\n` +
          `Cause : l'hôte db.*.supabase.co est en IPv6 uniquement (incompatible avec Vercel), et le relais HTTPS Supabase n'a pas pu prendre le relais (${missing.join(' / ') || 'clé secrète'} manquant).\n\n` +
          `Correctif dans Vercel → Settings → Environment Variables :\n` +
          `1. Ajoutez SUPABASE_SECRET_KEY (clé "secret" / "service_role" de Supabase)\n` +
          `2. Ou remplacez DATABASE_URL par l'URL Transaction Pooler (port 6543, aws-0-eu-west-1.pooler.supabase.com)\n` +
          `3. Puis lancez un Redeploy sur Vercel.`,
      );
    }
    throw new Error(`Connexion à la base de données momentanément indisponible (${detail}). Les tables sont préservées.`);
  }

  return readJsonStore();
}

export async function createAnnouncementRecord(input: {
  title: string;
  excerpt: string;
  content: string;
  category?: string;
  status?: PublicationStatus;
  scheduledAt?: string;
  imageKey?: MediaAssetKey;
}): Promise<Announcement> {
  const baseSlug = slugify(input.title) || `annonce-${Date.now()}`;
  const restInput = {
    slug: baseSlug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content.trim(),
    category: (input.category || 'Officiel').trim(),
    status: input.status || ('draft' as PublicationStatus),
    scheduledAt: input.scheduledAt,
    imageKey: input.imageKey || ('campus' as MediaAssetKey),
  };

  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return createAnnouncementViaSupabaseRest(restInput);
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const uniqueSlug = store.announcements.some((a) => a.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const item: Announcement = {
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: input.title.trim(),
        excerpt: input.excerpt.trim(),
        content: input.content.trim(),
        category: (input.category || 'Officiel').trim(),
        status: input.status || 'draft',
        scheduledAt:
          input.status === 'scheduled' && input.scheduledAt ? input.scheduledAt : undefined,
        publishedAt: new Date().toISOString(),
        imageKey: input.imageKey || 'campus',
      };
      store.announcements.unshift(item);
      return item;
    });
  }

  try {
    await ensureDbSeeded();
    const existingSlug = await db
      .select({ id: announcementsTable.id })
      .from(announcementsTable)
      .where(eq(announcementsTable.slug, baseSlug))
      .limit(1);
    const uniqueSlug =
      existingSlug.length > 0
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

    const inserted = await db
      .insert(announcementsTable)
      .values({
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: input.title.trim(),
        excerpt: input.excerpt.trim(),
        content: input.content.trim(),
        category: (input.category || 'Officiel').trim(),
        status: input.status || 'draft',
        scheduledAt:
          input.status === 'scheduled' && input.scheduledAt ? new Date(input.scheduledAt) : null,
        publishedAt: new Date(),
        imageKey: input.imageKey || 'campus',
      })
      .returning();

    return mapAnnouncementRow(inserted[0]);
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return createAnnouncementViaSupabaseRest(restInput);
    }
    console.warn('Database createAnnouncementRecord failed, bascule sur JSON:', error);
    return withJsonStoreLock((store) => {
      const uniqueSlug = store.announcements.some((a) => a.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const item: Announcement = {
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: input.title.trim(),
        excerpt: input.excerpt.trim(),
        content: input.content.trim(),
        category: (input.category || 'Officiel').trim(),
        status: input.status || 'draft',
        scheduledAt:
          input.status === 'scheduled' && input.scheduledAt ? input.scheduledAt : undefined,
        publishedAt: new Date().toISOString(),
        imageKey: input.imageKey || 'campus',
      };
      store.announcements.unshift(item);
      return item;
    });
  }
}

export async function updateAnnouncementRecord(
  id: string,
  patch: {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    status?: PublicationStatus;
    scheduledAt?: string;
  },
): Promise<Announcement | null> {
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return updateAnnouncementViaSupabaseRest(id, patch);
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const idx = store.announcements.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      const current = store.announcements[idx];
      const nextStatus = patch.status || current.status;
      store.announcements[idx] = {
        ...current,
        title: patch.title?.trim() || current.title,
        excerpt: patch.excerpt?.trim() || current.excerpt,
        content: patch.content?.trim() || current.content,
        category: patch.category?.trim() || current.category,
        status: nextStatus,
        scheduledAt:
          nextStatus === 'scheduled'
            ? patch.scheduledAt || current.scheduledAt
            : undefined,
        publishedAt:
          nextStatus === 'published' && current.status !== 'published'
            ? new Date().toISOString()
            : current.publishedAt,
      };
      return store.announcements[idx];
    });
  }

  try {
    await ensureDbSeeded();
    const rows = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.id, id))
      .limit(1);
    if (!rows[0]) return null;
    const current = rows[0];
    const nextStatus = patch.status || current.status;

    const updated = await db
      .update(announcementsTable)
      .set({
        title: patch.title?.trim() || current.title,
        excerpt: patch.excerpt?.trim() || current.excerpt,
        content: patch.content?.trim() || current.content,
        category: patch.category?.trim() || current.category,
        status: nextStatus,
        scheduledAt:
          nextStatus === 'scheduled'
            ? patch.scheduledAt ? new Date(patch.scheduledAt) : current.scheduledAt
            : null,
        publishedAt:
          nextStatus === 'published' && current.status !== 'published'
            ? new Date()
            : current.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(announcementsTable.id, id))
      .returning();

    return updated[0] ? mapAnnouncementRow(updated[0]) : null;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return updateAnnouncementViaSupabaseRest(id, patch);
    }
    console.warn('Database updateAnnouncementRecord failed, bascule sur JSON:', error);
    return withJsonStoreLock((store) => {
      const idx = store.announcements.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      const current = store.announcements[idx];
      const nextStatus = patch.status || current.status;
      store.announcements[idx] = {
        ...current,
        title: patch.title?.trim() || current.title,
        excerpt: patch.excerpt?.trim() || current.excerpt,
        content: patch.content?.trim() || current.content,
        category: patch.category?.trim() || current.category,
        status: nextStatus,
        scheduledAt:
          nextStatus === 'scheduled'
            ? patch.scheduledAt || current.scheduledAt
            : undefined,
        publishedAt:
          nextStatus === 'published' && current.status !== 'published'
            ? new Date().toISOString()
            : current.publishedAt,
      };
      return store.announcements[idx];
    });
  }
}

export async function updatePhaseRecord(
  id: string,
  patch: {
    title?: string;
    shortDescription?: string;
    statusLabel?: CompetitionPhase['statusLabel'];
    isRevealed?: boolean;
    submissionsOpen?: boolean;
    submissionDeadline?: string | null;
    testDetails?: Partial<PhaseTestDetails>;
  },
): Promise<CompetitionPhase | null> {
  const parsedDeadline =
    patch.submissionDeadline === undefined
      ? undefined
      : patch.submissionDeadline === null || patch.submissionDeadline === ''
        ? null
        : new Date(patch.submissionDeadline);

  if (parsedDeadline instanceof Date && Number.isNaN(parsedDeadline.getTime())) {
    const err = new Error('La date limite de dépôt est invalide.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return updatePhaseViaSupabaseRest(id, {
      title: patch.title,
      shortDescription: patch.shortDescription,
      statusLabel: patch.statusLabel,
      isRevealed: patch.isRevealed,
      submissionsOpen: patch.submissionsOpen,
      submissionDeadline: parsedDeadline,
      testDetails: patch.testDetails,
    });
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const idx = store.phases.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const current = store.phases[idx];
      const nextOpen =
        current.format === 'En présentiel' || current.id === 'phase-3'
          ? false
          : typeof patch.submissionsOpen === 'boolean'
            ? patch.submissionsOpen
            : Boolean(current.submissionsOpen);
      store.phases[idx] = {
        ...current,
        title: patch.title?.trim() || current.title,
        shortDescription: patch.shortDescription?.trim() || current.shortDescription,
        statusLabel: patch.statusLabel || current.statusLabel,
        isRevealed:
          typeof patch.isRevealed === 'boolean' ? patch.isRevealed : current.isRevealed,
        submissionsOpen: nextOpen,
        submissionDeadline:
          parsedDeadline === undefined
            ? current.submissionDeadline ?? null
            : parsedDeadline
              ? parsedDeadline.toISOString()
              : null,
        testDetails: patch.testDetails
          ? {
              instructionsTitle:
                patch.testDetails.instructionsTitle !== undefined
                  ? patch.testDetails.instructionsTitle
                  : current.testDetails?.instructionsTitle || '',
              theme:
                patch.testDetails.theme !== undefined
                  ? patch.testDetails.theme
                  : current.testDetails?.theme || '',
              instructions:
                patch.testDetails.instructions !== undefined
                  ? patch.testDetails.instructions
                  : current.testDetails?.instructions || '',
              submissionNote:
                patch.testDetails.submissionNote !== undefined
                  ? patch.testDetails.submissionNote
                  : current.testDetails?.submissionNote || '',
            }
          : current.testDetails,
      };
      return store.phases[idx];
    });
  }

  const runDbUpdate = async (): Promise<CompetitionPhase | null> => {
    await ensureDbSeeded();
    const rows = await db
      .select()
      .from(phasesTable)
      .where(eq(phasesTable.id, id))
      .limit(1);
    if (!rows[0]) return null;
    const current = rows[0];

    const nextDetails: PhaseTestDetails | null = patch.testDetails
      ? {
          instructionsTitle:
            patch.testDetails.instructionsTitle !== undefined
              ? patch.testDetails.instructionsTitle
              : current.testDetails?.instructionsTitle || '',
          theme:
            patch.testDetails.theme !== undefined
              ? patch.testDetails.theme
              : current.testDetails?.theme || '',
          instructions:
            patch.testDetails.instructions !== undefined
              ? patch.testDetails.instructions
              : current.testDetails?.instructions || '',
          submissionNote:
            patch.testDetails.submissionNote !== undefined
              ? patch.testDetails.submissionNote
              : current.testDetails?.submissionNote || '',
        }
      : current.testDetails;

    const nextOpen =
      current.format === 'En présentiel' || current.id === 'phase-3'
        ? false
        : typeof patch.submissionsOpen === 'boolean'
          ? patch.submissionsOpen
          : Boolean(current.submissionsOpen);

    const updated = await db
      .update(phasesTable)
      .set({
        title: patch.title?.trim() || current.title,
        shortDescription: patch.shortDescription?.trim() || current.shortDescription,
        statusLabel: patch.statusLabel || current.statusLabel,
        isRevealed:
          typeof patch.isRevealed === 'boolean' ? patch.isRevealed : current.isRevealed,
        submissionsOpen: nextOpen,
        submissionDeadline:
          parsedDeadline === undefined ? current.submissionDeadline : parsedDeadline,
        testDetails: nextDetails,
        updatedAt: new Date(),
      })
      .where(eq(phasesTable.id, id))
      .returning();

    const result = updated[0] ? mapPhaseRow(updated[0]) : null;
    if (result) {
      withJsonStoreLock((store) => {
        const idx = store.phases.findIndex((p) => p.id === id);
        if (idx !== -1) {
          store.phases[idx] = result;
        }
      }).catch(() => {});
    }
    return result;
  };

  try {
    return await runDbUpdate();
  } catch (error) {
    if (isSchemaDriftError(error)) {
      try {
        await ensureDatabaseSchemaReady(true);
        return await runDbUpdate();
      } catch (retryErr) {
        error = retryErr;
      }
    }

    if (isSupabaseAdminConfigured()) {
      if (isPgFallbackEligibleError(error)) {
        markPreferSupabaseRest();
      }
      return updatePhaseViaSupabaseRest(id, {
        title: patch.title,
        shortDescription: patch.shortDescription,
        statusLabel: patch.statusLabel,
        isRevealed: patch.isRevealed,
        submissionsOpen: patch.submissionsOpen,
        submissionDeadline: parsedDeadline,
        testDetails: patch.testDetails,
      });
    }

    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error(
        `Impossible de mettre à jour la phase dans la base (${extractErrorDetail(error)}).`,
      );
    }

    console.warn('Database updatePhaseRecord failed, bascule sur JSON:', error);
    return withJsonStoreLock((store) => {
      const idx = store.phases.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const current = store.phases[idx];
      const nextOpen =
        current.format === 'En présentiel' || current.id === 'phase-3'
          ? false
          : typeof patch.submissionsOpen === 'boolean'
            ? patch.submissionsOpen
            : Boolean(current.submissionsOpen);
      store.phases[idx] = {
        ...current,
        title: patch.title?.trim() || current.title,
        shortDescription: patch.shortDescription?.trim() || current.shortDescription,
        statusLabel: patch.statusLabel || current.statusLabel,
        isRevealed:
          typeof patch.isRevealed === 'boolean' ? patch.isRevealed : current.isRevealed,
        submissionsOpen: nextOpen,
        submissionDeadline:
          parsedDeadline === undefined
            ? current.submissionDeadline ?? null
            : parsedDeadline
              ? parsedDeadline.toISOString()
              : null,
        testDetails: patch.testDetails
          ? {
              instructionsTitle:
                patch.testDetails.instructionsTitle !== undefined
                  ? patch.testDetails.instructionsTitle
                  : current.testDetails?.instructionsTitle || '',
              theme:
                patch.testDetails.theme !== undefined
                  ? patch.testDetails.theme
                  : current.testDetails?.theme || '',
              instructions:
                patch.testDetails.instructions !== undefined
                  ? patch.testDetails.instructions
                  : current.testDetails?.instructions || '',
              submissionNote:
                patch.testDetails.submissionNote !== undefined
                  ? patch.testDetails.submissionNote
                  : current.testDetails?.submissionNote || '',
            }
          : current.testDetails,
      };
      return store.phases[idx];
    });
  }
}

export async function createNewsRecord(input: {
  title: string;
  category?: NewsArticle['category'];
  excerpt: string;
  content: string;
  imageKey?: MediaAssetKey;
  status?: PublicationStatus;
}): Promise<NewsArticle> {
  const paragraphs = input.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const readTime = `${Math.max(1, Math.ceil(input.content.split(/\s+/).length / 180))} min`;
  const baseSlug = slugify(input.title) || `actualite-${Date.now()}`;
  const restInput = {
    slug: baseSlug,
    title: input.title.trim(),
    category: input.category || ('Vie du concours' as NewsArticle['category']),
    excerpt: input.excerpt.trim(),
    paragraphs,
    readTime,
    imageKey: input.imageKey || ('campus' as MediaAssetKey),
    status: input.status || ('published' as PublicationStatus),
  };

  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return createNewsViaSupabaseRest(restInput);
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const uniqueSlug = store.news.some((n) => n.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;
      const item: NewsArticle = {
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: input.title.trim(),
        category: input.category || 'Vie du concours',
        publishedAt: new Date().toISOString(),
        readTime,
        excerpt: input.excerpt.trim(),
        content: paragraphs,
        imageKey: input.imageKey || 'campus',
        featured: false,
        status: input.status || 'published',
      };
      store.news.unshift(item);
      return item;
    });
  }

  try {
    await ensureDbSeeded();
    const existingSlug = await db
      .select({ id: newsArticlesTable.id })
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.slug, baseSlug))
      .limit(1);
    const uniqueSlug =
      existingSlug.length > 0
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

    const inserted = await db
      .insert(newsArticlesTable)
      .values({
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: input.title.trim(),
        category: input.category || 'Vie du concours',
        publishedAt: new Date(),
        readTime,
        excerpt: input.excerpt.trim(),
        content: paragraphs,
        imageKey: input.imageKey || 'campus',
        featured: false,
        status: input.status || 'published',
      })
      .returning();

    return mapNewsRow(inserted[0]);
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return createNewsViaSupabaseRest(restInput);
    }
    console.warn('Database createNewsRecord failed, bascule sur JSON:', error);
    return withJsonStoreLock((store) => {
      const uniqueSlug = store.news.some((n) => n.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;
      const item: NewsArticle = {
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: input.title.trim(),
        category: input.category || 'Vie du concours',
        publishedAt: new Date().toISOString(),
        readTime,
        excerpt: input.excerpt.trim(),
        content: paragraphs,
        imageKey: input.imageKey || 'campus',
        featured: false,
        status: input.status || 'published',
      };
      store.news.unshift(item);
      return item;
    });
  }
}

export async function updateNewsRecord(
  id: string,
  patch: {
    title?: string;
    excerpt?: string;
    content?: string | string[];
    category?: NewsArticle['category'];
    status?: PublicationStatus;
    imageKey?: MediaAssetKey;
  },
): Promise<NewsArticle | null> {
  const paragraphs =
    typeof patch.content === 'string'
      ? patch.content
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean)
      : Array.isArray(patch.content)
        ? patch.content
        : undefined;

  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return updateNewsViaSupabaseRest(id, {
      title: patch.title,
      excerpt: patch.excerpt,
      paragraphs,
      category: patch.category,
      status: patch.status,
      imageKey: patch.imageKey,
    });
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const idx = store.news.findIndex((n) => n.id === id);
      if (idx === -1) return null;
      const current = store.news[idx];
      store.news[idx] = {
        ...current,
        title: patch.title?.trim() || current.title,
        excerpt: patch.excerpt?.trim() || current.excerpt,
        content: paragraphs || current.content,
        category: patch.category || current.category,
        status: patch.status || current.status,
        imageKey: patch.imageKey || current.imageKey,
      };
      return store.news[idx];
    });
  }

  try {
    await ensureDbSeeded();
    const rows = await db
      .select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, id))
      .limit(1);
    if (!rows[0]) return null;
    const current = rows[0];

    const updated = await db
      .update(newsArticlesTable)
      .set({
        title: patch.title?.trim() || current.title,
        excerpt: patch.excerpt?.trim() || current.excerpt,
        content: paragraphs || current.content,
        category: patch.category || current.category,
        status: patch.status || current.status,
        imageKey: patch.imageKey || current.imageKey,
      })
      .where(eq(newsArticlesTable.id, id))
      .returning();

    return updated[0] ? mapNewsRow(updated[0]) : null;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return updateNewsViaSupabaseRest(id, {
        title: patch.title,
        excerpt: patch.excerpt,
        paragraphs,
        category: patch.category,
        status: patch.status,
        imageKey: patch.imageKey,
      });
    }
    console.warn('Database updateNewsRecord error, bascule sur JSON:', (error as Error).message);
    return withJsonStoreLock((store) => {
      const idx = store.news.findIndex((n) => n.id === id);
      if (idx === -1) return null;
      const current = store.news[idx];
      store.news[idx] = {
        ...current,
        title: patch.title?.trim() || current.title,
        excerpt: patch.excerpt?.trim() || current.excerpt,
        content: paragraphs || current.content,
        category: patch.category || current.category,
        status: patch.status || current.status,
        imageKey: patch.imageKey || current.imageKey,
      };
      return store.news[idx];
    });
  }
}

export async function updateSettingsRecord(googleAppsScriptUrl: string) {
  const cleanUrl = googleAppsScriptUrl.trim();
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return updateSettingsViaSupabaseRest(cleanUrl);
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      store.settings.googleAppsScriptUrl = cleanUrl;
      return store.settings;
    });
  }

  try {
    await ensureDbSeeded();
    await db
      .insert(appSettingsTable)
      .values({
        key: 'googleAppsScriptUrl',
        value: { url: cleanUrl },
      })
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: {
          value: { url: cleanUrl },
          updatedAt: new Date(),
        },
      });
    return {
      googleAppsScriptUrl: cleanUrl,
      googleFormActionUrl: process.env.GOOGLE_FORM_ACTION_URL || '',
      officialEmail: 'ucaeplokossa@gmail.com',
    };
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return updateSettingsViaSupabaseRest(cleanUrl);
    }
    console.warn('Database updateSettingsRecord failed, bascule sur JSON:', error);
    return withJsonStoreLock((store) => {
      store.settings.googleAppsScriptUrl = cleanUrl;
      return store.settings;
    });
  }
}

export async function getSiteDisplayConfig(): Promise<SiteDisplayConfig> {
  try {
    const store = await readStore();
    return normalizeSiteDisplayConfig(store.settings?.siteDisplay);
  } catch {
    const jsonStore = await readJsonStore();
    return normalizeSiteDisplayConfig(jsonStore.settings?.siteDisplay);
  }
}

export async function updateSiteDisplayRecord(
  config: SiteDisplayConfig,
): Promise<SiteDisplayConfig> {
  const normalized = normalizeSiteDisplayConfig(config);

  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    const saved = await updateSiteDisplayViaSupabaseRest(normalized);
    if (cachedStore) {
      cachedStore.settings.siteDisplay = saved;
    }
    withJsonStoreLock((store) => {
      store.settings.siteDisplay = saved;
    }).catch(() => {});
    return saved;
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      store.settings.siteDisplay = normalized;
      if (cachedStore) {
        cachedStore.settings.siteDisplay = normalized;
      }
      return normalized;
    });
  }

  try {
    await ensureDbSeeded();
    await db
      .insert(appSettingsTable)
      .values({
        key: 'siteDisplay',
        value: normalized as unknown as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: {
          value: normalized as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });
    if (cachedStore) {
      cachedStore.settings.siteDisplay = normalized;
    }
    withJsonStoreLock((store) => {
      store.settings.siteDisplay = normalized;
    }).catch(() => {});
    return normalized;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      const saved = await updateSiteDisplayViaSupabaseRest(normalized);
      if (cachedStore) {
        cachedStore.settings.siteDisplay = saved;
      }
      return saved;
    }
    console.warn('Database updateSiteDisplayRecord failed, bascule sur JSON:', error);
    return withJsonStoreLock((store) => {
      store.settings.siteDisplay = normalized;
      return normalized;
    });
  }
}

const RECONCILE_ACTIVE_EXTERNAL_KEY = 'reconcile_open_active_external_v1';
let reconcilePromise: Promise<void> | null = null;
let reconcileDone = false;

async function hasReconcileMarker(): Promise<boolean> {
  if (reconcileDone) return true;
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('site_settings')
      .select('key')
      .eq('key', RECONCILE_ACTIVE_EXTERNAL_KEY)
      .maybeSingle();
    if (!error && data?.key) {
      reconcileDone = true;
      return true;
    }
    return false;
  }

  if (!isCloudSqlConfigured()) {
    const store = await readJsonStore();
    const flags = store.settings as unknown as Record<string, unknown>;
    if (flags?.[RECONCILE_ACTIVE_EXTERNAL_KEY]) {
      reconcileDone = true;
      return true;
    }
    return false;
  }

  try {
    await ensureDbSeeded();
    const rows = await db
      .select({ key: appSettingsTable.key })
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, RECONCILE_ACTIVE_EXTERNAL_KEY))
      .limit(1);
    if (rows[0]?.key) {
      reconcileDone = true;
      return true;
    }
    return false;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      const admin = getSupabaseAdmin();
      const { data } = await admin
        .from('site_settings')
        .select('key')
        .eq('key', RECONCILE_ACTIVE_EXTERNAL_KEY)
        .maybeSingle();
      if (data?.key) {
        reconcileDone = true;
        return true;
      }
    }
    return false;
  }
}

async function persistReconcileMarker(): Promise<void> {
  const payload = { done: true, at: new Date().toISOString() };
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    const admin = getSupabaseAdmin();
    await admin.from('site_settings').upsert(
      {
        key: RECONCILE_ACTIVE_EXTERNAL_KEY,
        value: payload,
        updated_at: payload.at,
      },
      { onConflict: 'key' },
    );
    reconcileDone = true;
    return;
  }

  if (!isCloudSqlConfigured()) {
    await withJsonStoreLock((store) => {
      (store.settings as unknown as Record<string, unknown>)[RECONCILE_ACTIVE_EXTERNAL_KEY] =
        payload;
    });
    reconcileDone = true;
    return;
  }

  try {
    await ensureDbSeeded();
    await db
      .insert(appSettingsTable)
      .values({
        key: RECONCILE_ACTIVE_EXTERNAL_KEY,
        value: payload,
      })
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: { value: payload, updatedAt: new Date() },
      });
    reconcileDone = true;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      const admin = getSupabaseAdmin();
      await admin.from('site_settings').upsert(
        {
          key: RECONCILE_ACTIVE_EXTERNAL_KEY,
          value: payload,
          updated_at: payload.at,
        },
        { onConflict: 'key' },
      );
      reconcileDone = true;
    }
  }
}

export async function reconcileActiveExternalFormPhasesOnce(): Promise<void> {
  if (reconcileDone) return;
  if (!reconcilePromise) {
    reconcilePromise = (async () => {
      try {
        const alreadyDone = await hasReconcileMarker();
        if (alreadyDone) return;

        const store = await readStore();
        const externalForms =
          normalizeSiteDisplayConfig(store.settings?.siteDisplay).externalForms || {};
        let touched = false;

        for (const phaseId of ['phase-1', 'phase-2'] as const) {
          const cfg = externalForms[phaseId];
          const phase = store.phases.find((p) => p.id === phaseId);
          if (
            cfg?.enabled &&
            phase &&
            phase.format !== 'En présentiel' &&
            phase.statusLabel === 'Ouverte' &&
            phase.isRevealed &&
            !phase.submissionsOpen
          ) {
            await updatePhaseRecord(phaseId, { submissionsOpen: true });
            touched = true;
          }
        }

        if (touched) {
          cachedStore = null;
        }
        await persistReconcileMarker();
      } catch (err) {
        reconcilePromise = null;
        console.warn('reconcileActiveExternalFormPhasesOnce non bloquant:', err);
      }
    })();
  }
  await reconcilePromise;
}

export function isAnnouncementPublic(a: Announcement, now = new Date()): boolean {
  if (a.status === 'published') return true;
  if (a.status === 'scheduled' && a.scheduledAt) {
    const scheduledTime = Date.parse(a.scheduledAt);
    return !Number.isNaN(scheduledTime) && scheduledTime <= now.getTime();
  }
  return false;
}

export function sanitizeAnnouncementForPublic(a: Announcement): PublicAnnouncement {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    publishedAt: a.scheduledAt && a.status === 'scheduled' ? a.scheduledAt : a.publishedAt,
    category: a.category,
    imageKey: a.imageKey,
  };
}

export function sanitizePhaseForPublic(phase: CompetitionPhase): CompetitionPhase {
  if (!phase.isRevealed) {
    const progressiveDescription =
      phase.id === 'phase-1'
        ? "Première étape en ligne (Jours 1 à 3) : vous rédigez deux textes personnels et vous les présentez en vidéo (jusqu'à 5 minutes). Les intitulés exacts sont dévoilés au lancement officiel."
        : phase.id === 'phase-2'
          ? "Deuxième étape en ligne (Jours 6 à 9) : réservée aux candidats retenus après La Plume, elle porte sur la vulgarisation et l'explication claire en vidéo. Les deux sujets sont masqués jusqu'à l'ouverture de la phase."
          : phase.id === 'phase-3'
            ? "Grande Finale en présentiel à l'ENSET de Lokossa (Jour 14), précédée de deux journées d'ateliers pratiques (Jours 12 et 13). Les sujets détaillés seront communiqués aux finalistes en temps utile."
            : phase.shortDescription;

    return {
      id: phase.id,
      number: phase.number,
      title: phase.title,
      shortDescription: progressiveDescription,
      format: phase.format,
      statusLabel: phase.statusLabel,
      isRevealed: false,
      submissionsOpen: Boolean(phase.submissionsOpen),
      submissionDeadline: phase.submissionDeadline ?? null,
      imageKey: phase.imageKey,
      testDetails: null,
    };
  }
  return {
    ...phase,
    submissionsOpen: Boolean(phase.submissionsOpen),
    submissionDeadline: phase.submissionDeadline ?? null,
  };
}

export function sanitizeNewsForPublic(article: NewsArticle): PublicNewsArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    publishedAt: article.publishedAt,
    readTime: article.readTime,
    excerpt: article.excerpt,
    content: article.content,
    imageKey: article.imageKey,
    featured: article.featured,
  };
}

async function forwardToGoogleAppsScript(
  url: string,
  payload: RegistrationRecord,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        source: 'ucaep-concours-web',
        referenceCode: payload.referenceCode,
        createdAt: payload.createdAt,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        birthDate: payload.birthDate,
        gender: payload.gender,
        institution: payload.institution,
        department: payload.department,
        studyLevel: payload.studyLevel,
        studentId: payload.studentId,
        motivation: payload.motivation,
        readingExperience: payload.readingExperience,
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Google Apps Script HTTP ${response.status}`);
    }
    let parsed: { ok?: boolean; error?: string } | null = null;
    try {
      parsed = JSON.parse(text) as { ok?: boolean; error?: string };
    } catch {
      throw new Error('Réponse invalide reçue de Google Apps Script.');
    }
    if (!parsed || parsed.ok !== true) {
      throw new Error(parsed?.error || 'Google Apps Script a refusé la sauvegarde.');
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

async function saveRegistrationViaRestFlow(
  payload: RegistrationPayload,
  normalizedEmail: string,
  normalizedMatricule: string,
): Promise<RegistrationRecord> {
  const { record, gasUrl } = await saveRegistrationViaSupabaseRest(
    payload,
    normalizedEmail,
    normalizedMatricule,
  );

  if (gasUrl) {
    try {
      await forwardToGoogleAppsScript(gasUrl, record);
      record.syncedToGoogleSheets = true;
      await markRegistrationSyncedViaSupabaseRest(record.id).catch(() => {});
    } catch {
      console.error('Google Sheets sync skipped or failed for ID:', record.id);
    }
  }

  if (cachedStore) {
    const existsInCache = cachedStore.registrations.some((r) => r.id === record.id);
    if (!existsInCache) {
      cachedStore.registrations.unshift(record);
    }
  }

  withJsonStoreLock(async (store) => {
    const idx = store.registrations.findIndex((r) => r.id === record.id);
    if (idx === -1) {
      store.registrations.unshift(record);
    } else {
      store.registrations[idx] = record;
    }
  }).catch(() => {});

  return record;
}

export async function saveRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationRecord> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedMatricule = payload.studentId.trim().toUpperCase();

  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return saveRegistrationViaRestFlow(payload, normalizedEmail, normalizedMatricule);
  }

  if (!isCloudSqlConfigured()) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const err = new Error(
        "La base de données n'est pas configurée sur le serveur. Les inscriptions sont temporairement suspendues.",
      );
      (err as Error & { statusCode?: number }).statusCode = 503;
      throw err;
    }

    return withJsonStoreLock(async (store) => {
      const duplicate = store.registrations.find(
        (r) =>
          r.email.toLowerCase() === normalizedEmail ||
          (normalizedMatricule && r.studentId.toUpperCase() === normalizedMatricule),
      );
      if (duplicate) {
        const err = new Error(
          'Une inscription existe déjà avec cette adresse e-mail ou ce numéro matricule.',
        );
        (err as Error & { statusCode?: number }).statusCode = 409;
        throw err;
      }

      const seq = String(store.registrations.length + 1).padStart(4, '0');
      const referenceCode = `UCAEP-2026-${seq}`;
      const gasUrl =
        store.settings.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '';

      const record: RegistrationRecord = {
        ...payload,
        email: normalizedEmail,
        studentId: normalizedMatricule,
        id: crypto.randomUUID(),
        referenceCode,
        createdAt: new Date().toISOString(),
        syncedToGoogleSheets: false,
        syncTarget: gasUrl ? 'google_apps_script' : 'local_archive',
      };

      store.registrations.push(record);

      if (gasUrl) {
        try {
          await forwardToGoogleAppsScript(gasUrl, record);
          record.syncedToGoogleSheets = true;
        } catch {
          console.error('Google Sheets sync skipped or failed in local store mode');
        }
      }

      return record;
    });
  }

  try {
    await ensureDbSeeded();

    const duplicates = await db
      .select({ id: registrationsTable.id })
      .from(registrationsTable)
      .where(
        or(
          eq(registrationsTable.email, normalizedEmail),
          eq(registrationsTable.studentId, normalizedMatricule),
        ),
      )
      .limit(1);

    if (duplicates.length > 0) {
      const err = new Error(
        'Une inscription existe déjà avec cette adresse e-mail ou ce numéro matricule.',
      );
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    let seqNumber = 1;
    try {
      const seqResult = await db.execute<{ seq: string | number }>(
        sql`SELECT nextval('public.registration_reference_seq')::int AS seq`,
      );
      const val = seqResult.rows?.[0]?.seq;
      if (val !== undefined && val !== null) {
        seqNumber = Number(val);
      }
    } catch {
      try {
        const seqResult2 = await db.execute<{ seq: string | number }>(
          sql`SELECT nextval('public.registration_ref_seq')::int AS seq`,
        );
        const val2 = seqResult2.rows?.[0]?.seq;
        if (val2 !== undefined && val2 !== null) {
          seqNumber = Number(val2);
        }
      } catch {
        const [{ total }] = await db
          .select({ total: sql<number>`count(*)::int` })
          .from(registrationsTable);
        seqNumber = (total || 0) + 1;
      }
    }

    const referenceCode = `UCAEP-2026-${String(seqNumber).padStart(4, '0')}`;

    const gasRow = await db
      .select({ value: appSettingsTable.value })
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, 'googleAppsScriptUrl'))
      .limit(1);

    const rawGas = gasRow[0]?.value;
    const gasUrl =
      (typeof rawGas === 'string'
        ? rawGas
        : (rawGas as { url?: string } | null)?.url) ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      '';

    const record: RegistrationRecord = {
      ...payload,
      email: normalizedEmail,
      studentId: normalizedMatricule,
      id: crypto.randomUUID(),
      referenceCode,
      createdAt: new Date().toISOString(),
      syncedToGoogleSheets: false,
      syncTarget: gasUrl ? 'google_apps_script' : 'local_archive',
    };

    // 1. Insertion prioritaire dans PostgreSQL (Supabase)
    await db.insert(registrationsTable).values({
      id: record.id,
      referenceCode: record.referenceCode,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      birthDate: record.birthDate,
      gender: record.gender,
      institution: record.institution,
      department: record.department,
      studyLevel: record.studyLevel,
      studentId: record.studentId,
      motivation: record.motivation,
      readingExperience: record.readingExperience,
      acceptRules: record.acceptRules,
      status: 'registered',
      syncedToGoogleSheets: false,
      syncTarget: record.syncTarget,
      createdAt: new Date(),
    });

    // 2. Synchronisation secondaire et non bloquante avec Google Sheets
    if (gasUrl) {
      try {
        await forwardToGoogleAppsScript(gasUrl, record);
        record.syncedToGoogleSheets = true;
        await db
          .update(registrationsTable)
          .set({ syncedToGoogleSheets: true })
          .where(eq(registrationsTable.id, record.id));
      } catch {
        console.error('Google Sheets sync skipped or failed for ID:', record.id);
      }
    }

    // 3. Sauvegarde miroir dans le cache mémoire et le magasin local
    if (cachedStore) {
      const existsInCache = cachedStore.registrations.some((r) => r.id === record.id);
      if (!existsInCache) {
        cachedStore.registrations.unshift(record);
      }
    }

    withJsonStoreLock(async (store) => {
      const idx = store.registrations.findIndex((r) => r.id === record.id);
      if (idx === -1) {
        store.registrations.unshift(record);
      } else {
        store.registrations[idx] = record;
      }
    }).catch(() => {});

    return record;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return saveRegistrationViaRestFlow(payload, normalizedEmail, normalizedMatricule);
    }

    const err = error as Error & { statusCode?: number; code?: string; constraint?: string };
    if (err.statusCode === 409 || err.code === '23505') {
      const duplicateMsg = err.constraint?.includes('student_id')
        ? 'Une inscription existe déjà avec ce numéro matricule.'
        : 'Une inscription existe déjà avec cette adresse e-mail.';
      const conflictErr = new Error(err.message?.includes('déjà') ? err.message : duplicateMsg);
      (conflictErr as Error & { statusCode?: number }).statusCode = 409;
      throw conflictErr;
    }
    console.warn('Database saveRegistration error:', err.message);

    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const dbErr = new Error(
        "L'enregistrement dans la base de données n'a pas pu aboutir pour le moment. Veuillez réessayer.",
      );
      (dbErr as Error & { statusCode?: number }).statusCode = 500;
      throw dbErr;
    }

    return withJsonStoreLock(async (store) => {
      const duplicate = store.registrations.find(
        (r) =>
          r.email.toLowerCase() === normalizedEmail ||
          (normalizedMatricule && r.studentId.toUpperCase() === normalizedMatricule),
      );
      if (duplicate) {
        const conflictErr = new Error(
          'Une inscription existe déjà avec cette adresse e-mail ou ce numéro matricule.',
        );
        (conflictErr as Error & { statusCode?: number }).statusCode = 409;
        throw conflictErr;
      }
      const seq = String(store.registrations.length + 1).padStart(4, '0');
      const referenceCode = `UCAEP-2026-${seq}`;
      const gasUrl =
        store.settings.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '';

      const record: RegistrationRecord = {
        ...payload,
        email: normalizedEmail,
        studentId: normalizedMatricule,
        id: crypto.randomUUID(),
        referenceCode,
        createdAt: new Date().toISOString(),
        syncedToGoogleSheets: false,
        syncTarget: gasUrl ? 'google_apps_script' : 'local_archive',
      };
      store.registrations.push(record);

      if (gasUrl) {
        try {
          await forwardToGoogleAppsScript(gasUrl, record);
          record.syncedToGoogleSheets = true;
        } catch {
          // ignore
        }
      }
      return record;
    });
  }
}

export async function saveContactMessage(
  payload: ContactPayload,
): Promise<ContactMessageRecord> {
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    return saveContactViaSupabaseRest(payload);
  }

  if (!isCloudSqlConfigured()) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const err = new Error(
        "La base de données n'est pas configurée sur le serveur. L'envoi de messages est temporairement suspendu.",
      );
      (err as Error & { statusCode?: number }).statusCode = 503;
      throw err;
    }
    return withJsonStoreLock(async (store) => {
      const record: ContactMessageRecord = {
        ...payload,
        id: crypto.randomUUID(),
        status: 'non_lu',
        createdAt: new Date().toISOString(),
      };
      store.contacts.push(record);
      return record;
    });
  }

  try {
    await ensureDbSeeded();
    const recordId = crypto.randomUUID();
    const createdDate = new Date();
    let insertedRow: typeof contactMessagesTable.$inferSelect | undefined;

    // 1) Essai sans préciser status pour laisser PostgreSQL appliquer son DEFAULT
    try {
      const rows = await db
        .insert(contactMessagesTable)
        .values({
          id: recordId,
          name: payload.name,
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
          createdAt: createdDate,
        })
        .returning();
      insertedRow = rows[0];
    } catch (defaultErr) {
      if (!isContactStatusCheckError(defaultErr)) {
        throw defaultErr;
      }
      // 2) Repli sur les valeurs candidates si une contrainte CHECK existe sans DEFAULT compatible
      let lastCheckErr: unknown = defaultErr;
      for (const candidateStatus of UNREAD_DB_STATUSES) {
        try {
          const rows = await db
            .insert(contactMessagesTable)
            .values({
              id: recordId,
              name: payload.name,
              email: payload.email,
              subject: payload.subject,
              message: payload.message,
              status: candidateStatus,
              createdAt: createdDate,
            })
            .returning();
          insertedRow = rows[0];
          break;
        } catch (err) {
          lastCheckErr = err;
          if (!isContactStatusCheckError(err)) {
            throw err;
          }
        }
      }
      if (!insertedRow) {
        throw lastCheckErr;
      }
    }

    const record: ContactMessageRecord = {
      ...payload,
      id: insertedRow?.id || recordId,
      status: normalizeContactStatusFromDb(insertedRow?.status),
      createdAt:
        insertedRow?.createdAt instanceof Date
          ? insertedRow.createdAt.toISOString()
          : createdDate.toISOString(),
    };

    withJsonStoreLock((store) => {
      store.contacts.push(record);
    }).catch(() => {});

    return record;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return saveContactViaSupabaseRest(payload);
    }
    console.error('Database saveContactMessage error:', (error as Error).message);
    throw new Error("Impossible d'enregistrer votre message pour le moment.", {
      cause: error,
    });
  }
}

export async function updateContactStatusRecord(
  id: string,
  status: 'non_lu' | 'traite',
): Promise<ContactMessageRecord | null> {
  if (shouldUseSupabaseRestFallback() || (!isCloudSqlConfigured() && isSupabaseAdminConfigured())) {
    const updated = await updateContactStatusViaSupabaseRest(id, status);
    if (updated && cachedStore) {
      const idx = cachedStore.contacts.findIndex((c) => c.id === id);
      if (idx >= 0) cachedStore.contacts[idx] = updated;
    }
    return updated;
  }

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const idx = store.contacts.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      store.contacts[idx] = { ...store.contacts[idx], status };
      if (cachedStore) {
        const cIdx = cachedStore.contacts.findIndex((c) => c.id === id);
        if (cIdx >= 0) cachedStore.contacts[cIdx] = store.contacts[idx];
      }
      return store.contacts[idx];
    });
  }

  try {
    await ensureDbSeeded();
    const candidates = status === 'traite' ? TREATED_DB_STATUSES : UNREAD_DB_STATUSES;
    let updatedRow: typeof contactMessagesTable.$inferSelect | undefined;
    let foundAny = true;

    for (const candidate of candidates) {
      try {
        const rows = await db
          .update(contactMessagesTable)
          .set({ status: candidate })
          .where(eq(contactMessagesTable.id, id))
          .returning();
        if (rows.length === 0) {
          foundAny = false;
          break;
        }
        updatedRow = rows[0];
        break;
      } catch (err) {
        if (!isContactStatusCheckError(err)) {
          throw err;
        }
      }
    }

    if (!foundAny) return null;
    if (!updatedRow) {
      throw new Error('Impossible de mettre à jour ce statut dans la base.');
    }

    const mapped: ContactMessageRecord = {
      id: updatedRow.id,
      name: updatedRow.name,
      email: updatedRow.email,
      subject: updatedRow.subject,
      message: updatedRow.message,
      status: normalizeContactStatusFromDb(updatedRow.status),
      createdAt:
        updatedRow.createdAt instanceof Date
          ? updatedRow.createdAt.toISOString()
          : String(updatedRow.createdAt),
    };
    if (cachedStore) {
      const idx = cachedStore.contacts.findIndex((c) => c.id === id);
      if (idx >= 0) cachedStore.contacts[idx] = mapped;
    }
    withJsonStoreLock((store) => {
      const idx = store.contacts.findIndex((c) => c.id === id);
      if (idx >= 0) store.contacts[idx] = mapped;
    }).catch(() => {});
    return mapped;
  } catch (error) {
    if (isPgFallbackEligibleError(error) && isSupabaseAdminConfigured()) {
      markPreferSupabaseRest();
      return updateContactStatusViaSupabaseRest(id, status);
    }
    throw new Error('Impossible de mettre à jour ce message.', { cause: error });
  }
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export type { StoreData, PublicationStatus };
