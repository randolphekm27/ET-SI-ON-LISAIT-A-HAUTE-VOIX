import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Announcement,
  CompetitionPhase,
  ContactMessageRecord,
  ContactPayload,
  NewsArticle,
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
    officialEmail: '',
  },
  phases: [
    {
      id: 'phase-1',
      number: '01',
      title: 'La Plume',
      shortDescription:
        "Une première étape dédiée à l'écriture personnelle, à la justesse du style et à la clarté de la pensée.",
      format: 'En ligne',
      statusLabel: 'À venir',
      isRevealed: false,
      imageKey: 'plume',
      testDetails: {
        instructionsTitle: 'Consigne officielle — Phase 01 (Confidentiel)',
        theme: 'Sujet communiqué uniquement lors de la révélation officielle.',
        instructions:
          'Les modalités exactes de rédaction, la longueur attendue et le lien de dépôt seront publiés sur la page Annonces au lancement de la phase.',
        submissionNote: 'Dépôt numérique réservé aux candidats inscrits.',
      },
    },
    {
      id: 'phase-2',
      number: '02',
      title: 'La Connaissance',
      shortDescription:
        'Une étape consacrée à la culture générale, à la compréhension de textes et à la curiosité intellectuelle.',
      format: 'En ligne',
      statusLabel: 'Verrouillée',
      isRevealed: false,
      imageKey: 'connaissance',
      testDetails: {
        instructionsTitle: 'Consigne officielle — Phase 02 (Confidentiel)',
        theme: 'Thématiques communiquées après la clôture de la Phase 01.',
        instructions:
          "Le format précis de l'évaluation en ligne sera dévoilé aux candidats retenus selon le calendrier de l'UCAEP.",
        submissionNote: 'Accès réservé aux candidats qualifiés.',
      },
    },
    {
      id: 'phase-3',
      number: '03',
      title: "L'Éloquence",
      shortDescription:
        "La prise de parole en public face au jury et aux étudiants réunis à l'ENSET de Lokossa.",
      format: 'En présentiel',
      statusLabel: 'Verrouillée',
      isRevealed: false,
      imageKey: 'eloquence',
      testDetails: {
        instructionsTitle: 'Consigne officielle — Finale (Confidentiel)',
        theme: 'Sujets dévoilés à l’approche de la finale.',
        instructions:
          "Les règles de passage sur scène, le temps de parole et les critères du jury seront publiés à l'issue des qualifications.",
        submissionNote: "Grande finale sur le campus de l'ENSET de Lokossa.",
      },
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      slug: 'ouverture-des-inscriptions-edition-2026',
      title: 'Ouverture des inscriptions pour les étudiants de l’ENSET',
      excerpt:
        'Le concours « Et si on lisait à haute voix ? » ouvre sa plateforme de candidature en ligne.',
      content:
        "L'UCAEP lance officiellement la campagne d'inscription pour l'édition 2026 du concours « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.\n\nOuvert gratuitement à tous les étudiants régulièrement inscrits à l'ENSET, ce parcours se déploie en trois temps : l'écriture, la connaissance et l'expression orale sur scène.\n\nLes candidats sont invités à remplir le formulaire d'inscription en ligne afin de recevoir les informations officielles dès l'ouverture de la première phase.",
      publishedAt: '2026-11-10T09:00:00.000Z',
      status: 'published',
      category: 'Inscription',
      imageKey: 'hero',
    },
    {
      id: 'ann-2',
      slug: 'calendrier-progressif-des-revelations',
      title: 'Fonctionnement des annonces et révélation progressive des épreuves',
      excerpt:
        'Chaque phase et ses consignes seront publiées étape par étape sur cette page officielle.',
      content:
        "Afin de garantir l'équité entre tous les participants, les intitulés précis, thèmes et consignes des trois épreuves ne sont pas communiqués à l'avance.\n\nChaque étape du parcours sera dévoilée ici même au moment fixé par le comité d'organisation de l'UCAEP. Consultez régulièrement la rubrique Annonces pour suivre le calendrier officiel.",
      publishedAt: '2026-11-12T10:00:00.000Z',
      status: 'published',
      category: 'Organisation',
      imageKey: 'campus',
    },
    {
      id: 'ann-3',
      slug: 'revelation-phase-1-la-plume',
      title: 'Révélation de la Phase 01 : La Plume',
      excerpt:
        'Annonce programmée pour le lancement de la première épreuve écrite.',
      content:
        'Cette publication programmée présentera les instructions officielles de la Phase 01 dès sa mise en ligne par le comité organisateur.',
      publishedAt: '2026-12-01T08:00:00.000Z',
      scheduledAt: '2026-12-01T08:00:00.000Z',
      status: 'scheduled',
      category: 'Phase 01',
      imageKey: 'plume',
    },
    {
      id: 'ann-4',
      slug: 'note-interne-jury-preparation',
      title: 'Note de travail interne — Préparation de la finale',
      excerpt: 'Brouillon interne réservé au bureau UCAEP.',
      content:
        'Document de préparation interne non destiné à la diffusion publique avant validation définitive.',
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
      title: 'À l’ENSET de Lokossa, la lecture reprend la parole',
      category: 'Vie du concours',
      publishedAt: '2026-11-08T14:00:00.000Z',
      readTime: '2 min',
      excerpt:
        'Pourquoi un concours littéraire et oratoire au cœur d’une école normale supérieure technique.',
      content: [
        "À l'ENSET de Lokossa, la maîtrise des savoirs techniques dialogue chaque jour avec l'exigence de transmission. Former de futurs enseignants et cadres suppose aussi de savoir formuler une idée claire, structurer un texte et porter sa voix devant un auditoire.",
        "Avec « Et si on lisait à haute voix ? », l'UCAEP propose un rendez-vous culturel accessible à toutes les filières du campus, sans distinction d'année d'étude.",
        "Le parcours privilégie la sincérité du propos, la précision de la langue et l'aisance de la lecture partagée.",
      ],
      imageKey: 'campus',
      featured: true,
      status: 'published',
    },
    {
      id: 'news-2',
      slug: 'trois-etapes-pour-reveler-les-voix',
      title: 'Trois étapes pour passer de la page à la scène',
      category: 'Coulisses',
      publishedAt: '2026-11-05T11:30:00.000Z',
      readTime: '2 min',
      excerpt:
        'Écrire d’abord, approfondir ensuite, puis convaincre à voix haute devant le public.',
      content: [
        "Le concours a été conçu comme une progression naturelle. Tout commence dans le calme de l'écriture avec La Plume, avant d'éprouver sa culture et sa réactivité lors de La Connaissance.",
        "La troisième phase, L'Éloquence, invite les finalistes à quitter l'écran pour rencontrer la scène et le regard direct du public.",
      ],
      imageKey: 'plume',
      featured: false,
      status: 'published',
    },
    {
      id: 'news-3',
      slug: 'preparer-sa-candidature-etudiant',
      title: 'Préparer sa candidature en quelques minutes',
      category: 'Candidats',
      publishedAt: '2026-11-03T09:15:00.000Z',
      readTime: '1 min',
      excerpt:
        'Ce qu’il faut réunir avant de remplir le formulaire officiel d’inscription.',
      content: [
        "L'inscription est entièrement gratuite et ouverte aux étudiants de l'ENSET de Lokossa.",
        "Munissez-vous simplement de votre numéro matricule étudiant, de votre adresse électronique active et de quelques lignes sur ce qui vous motive à participer.",
      ],
      imageKey: 'connaissance',
      featured: false,
      status: 'published',
    },
    {
      id: 'news-4',
      slug: 'atelier-preparation-prise-de-parole',
      title: 'La voix comme instrument de clarté',
      category: 'Coulisses',
      publishedAt: '2026-10-29T16:00:00.000Z',
      readTime: '2 min',
      excerpt:
        'Lire à haute voix demande autant d’écoute et de souffle que d’assurance.',
      content: [
        "Avant même de monter sur scène, lire à haute voix transforme le rapport au texte : le rythme apparaît, les silences prennent sens et la ponctuation devient respiration.",
        "Les rencontres organisées autour du concours mettent l'accent sur cette écoute collective, fidèle à l'esprit universitaire de Lokossa.",
      ],
      imageKey: 'eloquence',
      featured: false,
      status: 'published',
    },
  ],
  registrations: [],
  contacts: [],
};

let writeQueue = Promise.resolve();

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, 'utf-8');
  try {
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

async function writeStore(data: StoreData): Promise<void> {
  await ensureStoreFile();
  const tmpPath = `${STORE_PATH}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, STORE_PATH);
}

export function withStoreLock<T>(fn: (store: StoreData) => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
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
  return withStoreLock(async (store) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedMatricule = payload.studentId.trim().toUpperCase();

    const duplicate = store.registrations.find(
      (r) =>
        r.email.toLowerCase() === normalizedEmail ||
        (normalizedMatricule && r.studentId.toUpperCase() === normalizedMatricule),
    );
    if (duplicate) {
      const err = new Error(
        'Une candidature existe déjà avec cette adresse e-mail ou ce numéro matricule.',
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

    if (gasUrl) {
      await forwardToGoogleAppsScript(gasUrl, record);
      record.syncedToGoogleSheets = true;
    }

    store.registrations.push(record);
    return record;
  });
}

export async function saveContactMessage(
  payload: ContactPayload,
): Promise<ContactMessageRecord> {
  return withStoreLock(async (store) => {
    const record: ContactMessageRecord = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    store.contacts.push(record);
    return record;
  });
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
