import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { asc, desc, eq, or, sql } from 'drizzle-orm';
import { db, isCloudSqlConfigured } from '../src/db/index.ts';
import {
  announcements as announcementsTable,
  appSettings as appSettingsTable,
  contactMessages as contactMessagesTable,
  newsArticles as newsArticlesTable,
  phases as phasesTable,
  registrations as registrationsTable,
} from '../src/db/schema.ts';
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
} from '../src/types/competition';

interface StoreData {
  announcements: Announcement[];
  phases: CompetitionPhase[];
  news: NewsArticle[];
  registrations: RegistrationRecord[];
  contacts: ContactMessageRecord[];
  settings: {
    googleAppsScriptUrl: string;
    googleFormActionUrl: string;
    officialEmail: string;
  };
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'ucaep-data')
  : path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const DEFAULT_STORE: StoreData = {
  settings: {
    googleAppsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    googleFormActionUrl: process.env.GOOGLE_FORM_ACTION_URL || '',
    officialEmail: 'ucaeplokossa@gmail.com',
  },
  phases: [
    {
      id: 'phase-1',
      number: '01',
      title: 'La Plume',
      shortDescription:
        "Nous allons commencer par l'écriture et l'expression personnelle, tranquillement depuis chez vous.",
      format: 'En ligne',
      statusLabel: 'À venir',
      isRevealed: false,
      imageKey: 'plume',
      testDetails: {
        instructionsTitle: 'Consigne — Phase 01 (Confidentiel)',
        theme: 'Sujet communiqué uniquement lors du lancement officiel.',
        instructions:
          'Les consignes exactes et le lien de dépôt seront publiés sur la page Annonces au démarrage de la phase.',
        submissionNote: 'Dépôt en ligne réservé aux étudiants inscrits.',
      },
    },
    {
      id: 'phase-2',
      number: '02',
      title: 'La Connaissance',
      shortDescription:
        'Ensuite, nous passerons aux idées, à la lecture et au partage des savoirs.',
      format: 'En ligne',
      statusLabel: 'Verrouillée',
      isRevealed: false,
      imageKey: 'connaissance',
      testDetails: {
        instructionsTitle: 'Consigne — Phase 02 (Confidentiel)',
        theme: 'Thématiques communiquées après la Phase 01.',
        instructions:
          'Le fonctionnement précis de cette étape sera partagé avec les candidats retenus au moment voulu.',
        submissionNote: 'Accès réservé aux candidats qualifiés.',
      },
    },
    {
      id: 'phase-3',
      number: '03',
      title: "L'Éloquence",
      shortDescription:
        'Pour terminer, place à la prise de parole et à la rencontre avec le public sur le campus.',
      format: 'En présentiel',
      statusLabel: 'Verrouillée',
      isRevealed: false,
      imageKey: 'eloquence',
      testDetails: {
        instructionsTitle: 'Consigne — Finale (Confidentiel)',
        theme: "Sujets annoncés à l'approche de la finale.",
        instructions:
          'Les consignes de passage sur scène seront communiquées après les qualifications.',
        submissionNote: "Finale en personne à l'ENSET de Lokossa.",
      },
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      slug: 'ouverture-des-inscriptions-edition-2026',
      title: "Les inscriptions sont ouvertes à l'ENSET",
      excerpt:
        "Vous pouvez dès maintenant remplir votre fiche d'inscription en ligne pour participer.",
      content:
        "Nous ouvrons les inscriptions pour l'édition 2026 du concours « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.\n\nLa participation est gratuite et ouverte à tous les étudiants de l'école, quelle que soit votre filière ou votre année d'étude.\n\nSi vous avez envie d'essayer, remplissez simplement le formulaire en ligne avant le vendredi 20 novembre 2026. Nous publierons ici toutes les informations pour la suite.",
      publishedAt: '2026-11-10T09:00:00.000Z',
      status: 'published',
      category: 'Inscription',
      imageKey: 'hero',
    },
    {
      id: 'ann-2',
      slug: 'calendrier-progressif-des-revelations',
      title: 'Comment nous allons annoncer les épreuves',
      excerpt:
        "Chaque étape sera dévoilée ici au fur et à mesure, pour que tout le monde parte sur un pied d'égalité.",
      content:
        "Pour que personne n'ait d'avance sur les autres, nous ne publions pas les sujets et consignes des trois phases dès aujourd'hui.\n\nNous dévoilerons chaque étape ici même, une annonce après l'autre. Pensez à repasser sur cette page de temps en temps pour suivre le fil du concours.",
      publishedAt: '2026-11-12T10:00:00.000Z',
      status: 'published',
      category: 'Organisation',
      imageKey: 'campus',
    },
    {
      id: 'ann-3',
      slug: 'revelation-phase-1-la-plume',
      title: 'Lancement de la Phase 01 : La Plume',
      excerpt: 'Publication programmée pour démarrer la première étape.',
      content:
        "Cette annonce présentera les consignes de la Phase 01 dès sa mise en ligne par l'équipe.",
      publishedAt: '2026-12-01T08:00:00.000Z',
      scheduledAt: '2026-12-01T08:00:00.000Z',
      status: 'scheduled',
      category: 'Phase 01',
      imageKey: 'plume',
    },
    {
      id: 'ann-4',
      slug: 'note-interne-jury-preparation',
      title: 'Brouillon — Organisation de la finale',
      excerpt: "Note interne de l'équipe UCAEP.",
      content: "Document de travail interne en attente de validation par l'équipe.",
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
      title: "Pourquoi on lance ce concours à l'ENSET de Lokossa",
      category: 'Vie du concours',
      publishedAt: '2026-11-08T14:00:00.000Z',
      readTime: '2 min',
      excerpt:
        'Entre les cours et les ateliers, on avait envie de créer un moment pour écrire, lire et parler ensemble.',
      content: [
        "À l'ENSET de Lokossa, nos journées tournent beaucoup autour des matières techniques et scientifiques. Mais savoir expliquer une idée, écrire clairement et parler devant un groupe sert dans toutes les filières.",
        "Avec « Et si on lisait à haute voix ? », notre équipe UCAEP veut simplement ouvrir un espace ouvert à tout le monde, sans pression ni jargon.",
        'Que vous écriviez déjà dans vos cahiers ou que ce soit votre toute première fois, vous avez votre place.',
      ],
      imageKey: 'campus',
      featured: true,
      status: 'published',
    },
    {
      id: 'news-2',
      slug: 'trois-etapes-pour-reveler-les-voix',
      title: "De votre cahier jusqu'à la scène : comment tout s'enchaîne",
      category: 'Coulisses',
      publishedAt: '2026-11-05T11:30:00.000Z',
      readTime: '2 min',
      excerpt:
        "Écrire d'abord au calme, partager ensuite ce qu'on sait, puis prendre la parole devant le campus.",
      content: [
        "On a voulu un parcours progressif. On commence calmement par l'écrit avec La Plume, avant de passer à la lecture et à la culture générale dans La Connaissance.",
        "Pour la dernière phase, L'Éloquence, on se retrouve en personne devant le public pour écouter les finalistes à voix haute.",
      ],
      imageKey: 'plume',
      featured: false,
      status: 'published',
    },
    {
      id: 'news-3',
      slug: 'preparer-sa-candidature-etudiant',
      title: 'Avant de vous inscrire, prenez une minute',
      category: 'Candidats',
      publishedAt: '2026-11-03T09:15:00.000Z',
      readTime: '1 min',
      excerpt:
        "Ce qu'il vous faut sous la main pour remplir votre formulaire sans stress.",
      content: [
        "L'inscription est gratuite et ouverte aux étudiants de l'ENSET de Lokossa.",
        'Ayez simplement votre numéro matricule, une adresse e-mail que vous consultez régulièrement et deux ou trois phrases pour expliquer ce qui vous donne envie de participer.',
      ],
      imageKey: 'connaissance',
      featured: false,
      status: 'published',
    },
    {
      id: 'news-4',
      slug: 'atelier-preparation-prise-de-parole',
      title: 'Lire à haute voix, ça change quoi ?',
      category: 'Coulisses',
      publishedAt: '2026-10-29T16:00:00.000Z',
      readTime: '2 min',
      excerpt:
        'Quand on passe de la lecture silencieuse à la voix haute, le texte prend un autre rythme.',
      content: [
        "Lire un texte à voix haute oblige à ralentir, à respirer aux bons endroits et à faire attention à ce qu'on veut vraiment transmettre.",
        "C'est ce goût du partage et de l'écoute qu'on veut faire vivre sur le campus cette année.",
      ],
      imageKey: 'eloquence',
      featured: false,
      status: 'published',
    },
  ],
  registrations: [],
  contacts: [],
};

let seedPromise: Promise<void> | null = null;
let writeQueue = Promise.resolve();

async function ensureDbSeeded(): Promise<void> {
  if (!isCloudSqlConfigured()) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
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
      } catch (error) {
        seedPromise = null;
        console.error('Failed to seed initial competition data:', error);
        throw new Error('Impossible d’initialiser les données du concours.', {
          cause: error,
        });
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

async function readJsonStore(): Promise<StoreData> {
  try {
    await ensureStoreFile();
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
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
      },
      phases: parsed.phases?.length ? parsed.phases : DEFAULT_STORE.phases,
      announcements: parsed.announcements?.length
        ? parsed.announcements
        : DEFAULT_STORE.announcements,
      news: parsed.news?.length ? parsed.news : DEFAULT_STORE.news,
      registrations: parsed.registrations || [],
      contacts: parsed.contacts || [],
    };
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

async function writeJsonStore(data: StoreData): Promise<void> {
  await ensureStoreFile();
  const tmpPath = `${STORE_PATH}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, STORE_PATH);
}

function withJsonStoreLock<T>(fn: (store: StoreData) => Promise<T> | T): Promise<T> {
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

export async function readStore(): Promise<StoreData> {
  if (!isCloudSqlConfigured()) {
    return readJsonStore();
  }

  try {
    await ensureDbSeeded();
    const [phaseRows, announcementRows, newsRows, registrationRows, contactRows, settingsRows] =
      await Promise.all([
        db.select().from(phasesTable).orderBy(asc(phasesTable.sortOrder)),
        db.select().from(announcementsTable).orderBy(desc(announcementsTable.publishedAt)),
        db.select().from(newsArticlesTable).orderBy(desc(newsArticlesTable.publishedAt)),
        db.select().from(registrationsTable).orderBy(desc(registrationsTable.createdAt)),
        db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.createdAt)),
        db.select().from(appSettingsTable),
      ]);

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

    return {
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
      },
    };
  } catch (error) {
    console.error('Database readStore failed:', error);
    throw new Error('Impossible de charger les données du concours.', {
      cause: error,
    });
  }
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
  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const baseSlug = slugify(input.title) || `annonce-${Date.now()}`;
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
    const baseSlug = slugify(input.title) || `annonce-${Date.now()}`;
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
    console.error('Database createAnnouncementRecord failed:', error);
    throw new Error("Impossible d'enregistrer cette annonce.", { cause: error });
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
    console.error('Database updateAnnouncementRecord failed:', error);
    throw new Error("Impossible de mettre à jour cette annonce.", { cause: error });
  }
}

export async function updatePhaseRecord(
  id: string,
  patch: {
    statusLabel?: CompetitionPhase['statusLabel'];
    isRevealed?: boolean;
    testDetails?: Partial<PhaseTestDetails>;
  },
): Promise<CompetitionPhase | null> {
  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const idx = store.phases.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const current = store.phases[idx];
      store.phases[idx] = {
        ...current,
        statusLabel: patch.statusLabel || current.statusLabel,
        isRevealed:
          typeof patch.isRevealed === 'boolean' ? patch.isRevealed : current.isRevealed,
        testDetails: patch.testDetails
          ? {
              instructionsTitle:
                patch.testDetails.instructionsTitle ||
                current.testDetails?.instructionsTitle ||
                '',
              theme: patch.testDetails.theme || current.testDetails?.theme || '',
              instructions:
                patch.testDetails.instructions ||
                current.testDetails?.instructions ||
                '',
              submissionNote:
                patch.testDetails.submissionNote ||
                current.testDetails?.submissionNote ||
                '',
            }
          : current.testDetails,
      };
      return store.phases[idx];
    });
  }

  try {
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
            patch.testDetails.instructionsTitle ||
            current.testDetails?.instructionsTitle ||
            '',
          theme: patch.testDetails.theme || current.testDetails?.theme || '',
          instructions:
            patch.testDetails.instructions || current.testDetails?.instructions || '',
          submissionNote:
            patch.testDetails.submissionNote ||
            current.testDetails?.submissionNote ||
            '',
        }
      : current.testDetails;

    const updated = await db
      .update(phasesTable)
      .set({
        statusLabel: patch.statusLabel || current.statusLabel,
        isRevealed:
          typeof patch.isRevealed === 'boolean' ? patch.isRevealed : current.isRevealed,
        testDetails: nextDetails,
        updatedAt: new Date(),
      })
      .where(eq(phasesTable.id, id))
      .returning();

    return updated[0] ? mapPhaseRow(updated[0]) : null;
  } catch (error) {
    console.error('Database updatePhaseRecord failed:', error);
    throw new Error('Impossible de mettre à jour cette phase.', { cause: error });
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

  if (!isCloudSqlConfigured()) {
    return withJsonStoreLock((store) => {
      const baseSlug = slugify(input.title) || `actualite-${Date.now()}`;
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
    const baseSlug = slugify(input.title) || `actualite-${Date.now()}`;
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
    console.error('Database createNewsRecord failed:', error);
    throw new Error("Impossible d'enregistrer cet article.", { cause: error });
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
    console.error('Database updateNewsRecord error:', (error as Error).message);
    throw new Error('Impossible de mettre à jour cet article.', { cause: error });
  }
}

export async function updateSettingsRecord(googleAppsScriptUrl: string) {
  const cleanUrl = googleAppsScriptUrl.trim();
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
    console.error('Database updateSettingsRecord failed:', error);
    throw new Error("Impossible d'enregistrer les paramètres.", { cause: error });
  }
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
    return {
      id: phase.id,
      number: phase.number,
      title: phase.title,
      shortDescription: phase.shortDescription,
      format: phase.format,
      statusLabel: phase.statusLabel,
      isRevealed: false,
      imageKey: phase.imageKey,
      testDetails: null,
    };
  }
  return phase;
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

export async function saveRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationRecord> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedMatricule = payload.studentId.trim().toUpperCase();

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

    return record;
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.statusCode === 409) {
      throw err;
    }
    console.error('Database saveRegistration error:', err.message);
    throw new Error(
      "L'enregistrement de votre inscription n'a pas abouti. Merci de réessayer dans un instant.",
      { cause: error },
    );
  }
}

export async function saveContactMessage(
  payload: ContactPayload,
): Promise<ContactMessageRecord> {
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
        createdAt: new Date().toISOString(),
      };
      store.contacts.push(record);
      return record;
    });
  }

  try {
    await ensureDbSeeded();
    const record: ContactMessageRecord = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await db.insert(contactMessagesTable).values({
      id: record.id,
      name: record.name,
      email: record.email,
      subject: record.subject,
      message: record.message,
      status: 'non_lu',
      createdAt: new Date(),
    });
    return record;
  } catch (error) {
    console.error('Database saveContactMessage error:', (error as Error).message);
    throw new Error("Impossible d'enregistrer votre message pour le moment.", {
      cause: error,
    });
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
