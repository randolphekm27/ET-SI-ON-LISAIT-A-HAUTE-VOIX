import express from 'express';
import crypto from 'node:crypto';
import { isCloudSqlConfigured } from '../src/db/index.ts';
import { isSupabaseAdminConfigured } from './supabase-admin.ts';
import {
  createAnnouncementRecord,
  createNewsRecord,
  isAnnouncementPublic,
  readStore,
  sanitizeAnnouncementForPublic,
  sanitizeNewsForPublic,
  sanitizePhaseForPublic,
  saveContactMessage,
  saveRegistration,
  updateAnnouncementRecord,
  updateNewsRecord,
  updatePhaseRecord,
  updateSettingsRecord,
  updateSiteDisplayRecord,
  normalizeSiteDisplayConfig,
} from './store.ts';
import {
  completeCandidateSubmission,
  enforceSubmissionRateLimit,
  getAdminSubmissionAccess,
  getCandidateSubmissionStatus,
  getSubmissionsPublicConfig,
  handleLocalFileUpload,
  initCandidateSubmission,
  isSubmissionHttpError,
  listAdminSubmissions,
  resolveLocalSubmissionFile,
  updateAdminSubmissionReview,
} from './submissions.ts';
import type {
  MediaAssetKey,
  NewsArticle,
  PublicationStatus,
  RegistrationPayload,
  SubmissionKind,
  SubmissionStatus,
} from '../src/types/competition';

const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000; // la session organisateur dure 8 heures

function getOrganizerCodes(): string[] {
  let envVal = (process.env.ORGANIZER_ACCESS_CODE || '').trim();
  if (
    (envVal.startsWith('"') && envVal.endsWith('"')) ||
    (envVal.startsWith("'") && envVal.endsWith("'"))
  ) {
    envVal = envVal.slice(1, -1).trim();
  }
  if (!envVal) return [];
  return envVal
    .split(',')
    .map((c) => c.trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function isOrganizerCodeValid(inputCode: string): boolean {
  const codes = getOrganizerCodes();
  if (codes.length === 0) return false;
  if (!inputCode || typeof inputCode !== 'string') return false;
  const trimmed = inputCode.trim();
  if (!trimmed) return false;
  // Comparaison exacte (sensible à la casse), en temps constant
  return codes.some((expected) => safeEqual(trimmed, expected));
}

function getTokenSecret(): string | null {
  const codes = getOrganizerCodes();
  if (codes.length === 0) return null;
  return crypto
    .createHash('sha256')
    .update(`ucaep-session:${codes[0]}`)
    .digest('hex');
}

function createAdminToken(): string {
  const secret = getTokenSecret();
  if (!secret) {
    throw new Error('ORGANIZER_ACCESS_CODE non configuré.');
  }
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      iat: now,
      exp: now + ADMIN_SESSION_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const secret = getTokenSecret();
  if (!secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const customHeader = req.headers['x-ucaep-admin-token'];
  const customToken = Array.isArray(customHeader)
    ? customHeader[0]
    : customHeader || '';
  if (customToken.trim() && verifyAdminToken(customToken.trim())) {
    next();
    return;
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (bearerToken && verifyAdminToken(bearerToken)) {
    next();
    return;
  }

  res.status(401).json({ error: 'Connexion organisateur requise.' });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function registerApiRoutes(app: express.Express) {
  // Public API: Announcements (strictly published only)
  app.get('/api/announcements', async (_req, res) => {
    try {
      const store = await readStore();
      const now = new Date();
      const published = store.announcements
        .filter((a) => isAnnouncementPublic(a, now))
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .map(sanitizeAnnouncementForPublic);
      res.json({ announcements: published });
    } catch {
      res.status(500).json({ error: 'Impossible de charger les annonces.' });
    }
  });

  app.get('/api/announcements/:slug', async (req, res) => {
    try {
      const store = await readStore();
      const now = new Date();
      const match = store.announcements.find(
        (a) => a.slug === req.params.slug && isAnnouncementPublic(a, now),
      );
      if (!match) {
        res.status(404).json({ error: 'Annonce introuvable.' });
        return;
      }
      res.json({ announcement: sanitizeAnnouncementForPublic(match) });
    } catch {
      res.status(500).json({ error: 'Impossible de charger cette annonce.' });
    }
  });

  // Public API: Phases (strips unreleased testDetails)
  app.get('/api/phases', async (_req, res) => {
    try {
      const store = await readStore();
      res.json({ phases: store.phases.map(sanitizePhaseForPublic) });
    } catch {
      res.status(500).json({ error: 'Impossible de charger le parcours.' });
    }
  });

  // Public API: Site Display Configuration (Multi-page vs Phase-Focused Single Page)
  app.get('/api/site-config', async (_req, res) => {
    try {
      const store = await readStore();
      const siteConfig = normalizeSiteDisplayConfig(store.settings?.siteDisplay);
      const rawActive =
        store.phases.find((p) => p.id === siteConfig.activePhaseId) ||
        store.phases[0] ||
        null;
      const activePhase = rawActive ? sanitizePhaseForPublic(rawActive) : null;
      const now = new Date();
      const announcements = store.announcements
        .filter((a) => isAnnouncementPublic(a, now))
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, 6)
        .map(sanitizeAnnouncementForPublic);

      res.json({
        siteConfig,
        activePhase,
        phasesSummary: store.phases.map((p) => ({
          id: p.id,
          number: p.number,
          title: p.title,
          format: p.format,
          statusLabel: p.statusLabel,
        })),
        announcements,
      });
    } catch {
      res.status(500).json({ error: 'Impossible de charger la configuration du site.' });
    }
  });

  // Public API: News (strictly published only)
  app.get('/api/news', async (_req, res) => {
    try {
      const store = await readStore();
      const published = store.news
        .filter((n) => n.status === 'published')
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .map(sanitizeNewsForPublic);
      res.json({ news: published });
    } catch {
      res.status(500).json({ error: 'Impossible de charger les actualités.' });
    }
  });

  app.get('/api/news/:slug', async (req, res) => {
    try {
      const store = await readStore();
      const match = store.news.find(
        (n) => n.slug === req.params.slug && n.status === 'published',
      );
      if (!match) {
        res.status(404).json({ error: 'Article introuvable.' });
        return;
      }
      res.json({ article: sanitizeNewsForPublic(match) });
    } catch {
      res.status(500).json({ error: 'Impossible de charger cet article.' });
    }
  });

  // Public API: Candidate Registration
  app.post('/api/registrations', async (req, res) => {
    try {
      const body = req.body as Partial<RegistrationPayload>;

      const requiredStrings: Array<[keyof RegistrationPayload, string]> = [
        ['firstName', 'Indiquez votre prénom pour continuer.'],
        ['lastName', 'Indiquez votre nom pour continuer.'],
        ['email', 'Indiquez votre adresse e-mail pour continuer.'],
        ['phone', 'Indiquez votre numéro de téléphone pour continuer.'],
        ['birthDate', 'Indiquez votre date de naissance pour continuer.'],
        ['institution', 'Précisez votre établissement pour continuer.'],
        ['department', 'Précisez votre filière ou département pour continuer.'],
        ['studyLevel', "Précisez votre niveau d'études pour continuer."],
        ['studentId', 'Indiquez votre numéro matricule pour continuer.'],
        ['motivation', 'Dites-nous en quelques mots ce qui vous donne envie de participer.'],
      ];

      for (const [key, message] of requiredStrings) {
        const val = body[key];
        if (typeof val !== 'string' || val.trim().length === 0) {
          res.status(400).json({ error: message });
          return;
        }
      }

      if (!isValidEmail(body.email || '')) {
        res.status(400).json({ error: 'Cette adresse e-mail ne semble pas correcte.' });
        return;
      }

      const phoneTrim = (body.phone || '').trim();
      if (
        phoneTrim.length < 6 ||
        phoneTrim.length > 30 ||
        !/^[0-9+() \-.]+$/.test(phoneTrim)
      ) {
        res.status(400).json({
          error: 'Indiquez un numéro de téléphone joignable valide.',
        });
        return;
      }

      if (body.firstName!.trim().length > 100 || body.lastName!.trim().length > 100) {
        res.status(400).json({
          error:
            'Le prénom ou le nom dépasse la longueur maximale autorisée (100 caractères).',
        });
        return;
      }

      if (body.studentId!.trim().length > 50) {
        res.status(400).json({
          error: 'Le numéro matricule ne doit pas dépasser 50 caractères.',
        });
        return;
      }

      if (
        body.institution!.trim().length > 150 ||
        body.department!.trim().length > 150
      ) {
        res.status(400).json({
          error: "L'établissement ou la filière dépasse la longueur maximale autorisée.",
        });
        return;
      }

      if ((body.motivation || '').trim().length < 25) {
        res.status(400).json({
          error: 'Dites-nous en au moins 25 caractères ce qui vous donne envie de participer.',
        });
        return;
      }

      if ((body.motivation || '').trim().length > 2500) {
        res.status(400).json({
          error: 'Le texte de motivation ne doit pas dépasser 2500 caractères.',
        });
        return;
      }

      if (body.acceptRules !== true) {
        res.status(400).json({
          error: "Cochez la case d'accord pour valider votre inscription.",
        });
        return;
      }

      const payload: RegistrationPayload = {
        firstName: body.firstName!.trim(),
        lastName: body.lastName!.trim(),
        email: body.email!.trim(),
        phone: body.phone!.trim(),
        birthDate: body.birthDate!.trim(),
        gender:
          body.gender === 'Féminin' || body.gender === 'Masculin'
            ? body.gender
            : 'Préfère ne pas préciser',
        institution: body.institution!.trim(),
        department: body.department!.trim(),
        studyLevel: body.studyLevel!.trim(),
        studentId: body.studentId!.trim(),
        motivation: body.motivation!.trim(),
        readingExperience: (body.readingExperience || '').trim(),
        acceptRules: true,
      };

      const saved = await saveRegistration(payload);
      res.status(201).json({
        saved: true,
        referenceCode: saved.referenceCode,
        candidateName: `${saved.firstName} ${saved.lastName}`,
        department: saved.department,
        studyLevel: saved.studyLevel,
        createdAt: saved.createdAt,
        syncedToGoogleSheets: saved.syncedToGoogleSheets,
        syncTarget: saved.syncTarget,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message });
        return;
      }
      if (err.statusCode === 503) {
        res.status(503).json({ error: err.message });
        return;
      }
      res.status(502).json({
        error:
          err.message ||
          "L'envoi de votre inscription n'a pas abouti. Rien n'a été enregistré, merci de réessayer.",
      });
    }
  });

  // Public API: Contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body as Record<string, string>;
      if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
        res.status(400).json({ error: 'Merci de remplir tous les champs.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Cette adresse e-mail ne semble pas correcte.' });
        return;
      }
      if (name.trim().length > 100) {
        res.status(400).json({ error: 'Le nom ne doit pas dépasser 100 caractères.' });
        return;
      }
      if (subject.trim().length > 150) {
        res.status(400).json({ error: "L'objet ne doit pas dépasser 150 caractères." });
        return;
      }
      if (message.trim().length > 3000) {
        res.status(400).json({ error: 'Le message ne doit pas dépasser 3000 caractères.' });
        return;
      }

      const saved = await saveContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      res.status(201).json({ saved: true, id: saved.id });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err.statusCode === 503) {
        res.status(503).json({ error: err.message });
        return;
      }
      res.status(500).json({
        error:
          err.message ||
          "Votre message n'a pas pu être envoyé pour le moment. Réessayez dans un instant.",
      });
    }
  });

  // Public API: Candidate Submissions (direct-to-storage signed upload & text submission)
  const extractClientIp = (req: express.Request): string => {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  };

  app.get('/api/submissions/config', (_req, res) => {
    res.json(getSubmissionsPublicConfig());
  });

  app.post(
    '/api/submissions/local-upload',
    express.raw({ type: '*/*', limit: '52mb' }),
    async (req, res) => {
      try {
        const headerToken = req.headers['x-upload-token'];
        const token = Array.isArray(headerToken)
          ? headerToken[0] || ''
          : headerToken || '';
        const bodyBuffer = Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(req.body || '');
        const result = await handleLocalFileUpload(token, bodyBuffer);
        res.status(200).json(result);
      } catch (error) {
        if (isSubmissionHttpError(error)) {
          res.status(error.statusCode).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: 'Échec de réception du fichier sur le serveur.' });
      }
    },
  );

  app.get('/api/submissions/local-file', async (req, res) => {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      const file = await resolveLocalSubmissionFile(token);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.fileName.replace(/"/g, '')}"`,
      );
      res.send(file.buffer);
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Impossible de charger ce fichier.' });
    }
  });

  app.post('/api/submissions/status', async (req, res) => {
    try {
      const { referenceCode, email } = (req.body || {}) as {
        referenceCode?: string;
        email?: string;
      };
      enforceSubmissionRateLimit(extractClientIp(req), referenceCode);
      const result = await getCandidateSubmissionStatus({
        referenceCode: referenceCode || '',
        email: email || '',
      });
      res.json(result);
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const err = error as Error;
      console.error('[POST /api/submissions/status]', err?.message || error);
      res.status(500).json({
        error: err?.message || 'Impossible de vérifier votre dossier pour le moment.',
      });
    }
  });

  app.post('/api/submissions/init', async (req, res) => {
    try {
      const body = (req.body || {}) as {
        referenceCode?: string;
        email?: string;
        phaseId?: string;
        kind?: SubmissionKind;
        fileName?: string;
        mimeType?: string;
        sizeBytes?: number;
      };
      enforceSubmissionRateLimit(extractClientIp(req), body.referenceCode);
      const result = await initCandidateSubmission({
        referenceCode: body.referenceCode || '',
        email: body.email || '',
        phaseId: body.phaseId || '',
        kind: body.kind || 'file',
        fileName: body.fileName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
      });
      res.json(result);
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const err = error as Error;
      console.error('[POST /api/submissions/init]', err?.message || error);
      res.status(500).json({
        error: err?.message || 'Impossible de préparer votre dépôt pour le moment.',
      });
    }
  });

  app.post('/api/submissions/complete', async (req, res) => {
    try {
      const body = (req.body || {}) as {
        referenceCode?: string;
        email?: string;
        phaseId?: string;
        kind?: SubmissionKind;
        storagePath?: string;
        fileName?: string;
        mimeType?: string;
        sizeBytes?: number;
        textContent?: string;
      };
      enforceSubmissionRateLimit(extractClientIp(req), body.referenceCode);
      const submission = await completeCandidateSubmission({
        referenceCode: body.referenceCode || '',
        email: body.email || '',
        phaseId: body.phaseId || '',
        kind: body.kind || 'file',
        storagePath: body.storagePath,
        fileName: body.fileName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        textContent: body.textContent,
      });
      res.status(201).json({ ok: true, submission });
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const err = error as Error;
      console.error('[POST /api/submissions/complete]', err?.message || error);
      res.status(500).json({
        error: err?.message || "Impossible d'enregistrer votre dépôt pour le moment.",
      });
    }
  });

  // Organizer CMS Auth (access code)
  app.post('/api/admin/auth', (req, res) => {
    const configuredCodes = getOrganizerCodes();
    if (configuredCodes.length === 0) {
      res.status(503).json({
        error:
          "Le code d'accès organisateur n'est pas configuré sur le serveur (ORGANIZER_ACCESS_CODE manquant).",
      });
      return;
    }
    const { code } = (req.body || {}) as { code?: string };
    if (!code || !isOrganizerCodeValid(code)) {
      res.status(401).json({ error: "Ce code d'accès ne correspond pas." });
      return;
    }
    res.json({ token: createAdminToken() });
  });

  // Organizer CMS State
  app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
    try {
      const dbConfigured = isCloudSqlConfigured() || isSupabaseAdminConfigured();
      const store = await readStore();
      res.json({
        databaseConnected: dbConfigured,
        announcements: store.announcements,
        phases: store.phases,
        news: store.news,
        registrations: store.registrations,
        contacts: store.contacts,
        settings: {
          googleAppsScriptUrl: store.settings.googleAppsScriptUrl,
          siteDisplay: normalizeSiteDisplayConfig(store.settings.siteDisplay),
        },
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || 'Impossible de charger les données.' });
    }
  });

  // Organizer CMS: Create Announcement
  app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
    try {
      const { title, excerpt, content, category, status, scheduledAt, imageKey } =
        req.body as {
          title?: string;
          excerpt?: string;
          content?: string;
          category?: string;
          status?: PublicationStatus;
          scheduledAt?: string;
          imageKey?: MediaAssetKey;
        };

      if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
        res.status(400).json({ error: 'Titre, extrait et contenu sont obligatoires.' });
        return;
      }

      const created = await createAnnouncementRecord({
        title,
        excerpt,
        content,
        category,
        status,
        scheduledAt,
        imageKey,
      });

      res.status(201).json({ announcement: created });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || "Impossible d'enregistrer l'annonce." });
    }
  });

  // Organizer CMS: Update Announcement Status or Content
  app.patch('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
    try {
      const updated = await updateAnnouncementRecord(String(req.params.id), {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        category: req.body.category,
        status: req.body.status,
        scheduledAt: req.body.scheduledAt,
      });
      if (!updated) {
        res.status(404).json({ error: 'Annonce introuvable.' });
        return;
      }
      res.json({ announcement: updated });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || 'Mise à jour impossible.' });
    }
  });

  // Organizer CMS: Update Phase Reveal, Information & Submissions Settings
  app.patch('/api/admin/phases/:id', requireAdmin, async (req, res) => {
    try {
      const updated = await updatePhaseRecord(String(req.params.id), {
        title: req.body.title,
        shortDescription: req.body.shortDescription,
        statusLabel: req.body.statusLabel,
        isRevealed: req.body.isRevealed,
        submissionsOpen: req.body.submissionsOpen,
        submissionDeadline: req.body.submissionDeadline,
        testDetails: req.body.testDetails,
      });
      if (!updated) {
        res.status(404).json({ error: 'Phase introuvable.' });
        return;
      }
      res.json({ phase: updated });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      res
        .status(err.statusCode || 500)
        .json({ error: err.message || 'Mise à jour impossible.' });
    }
  });

  // Organizer CMS: Candidate Submissions List, Signed Download URL & Review
  app.get('/api/admin/submissions', requireAdmin, async (req, res) => {
    try {
      const phaseId =
        typeof req.query.phaseId === 'string' ? req.query.phaseId : undefined;
      const status =
        typeof req.query.status === 'string' ? req.query.status : undefined;
      const result = await listAdminSubmissions({ phaseId, status });
      res.json(result);
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Impossible de charger les dépôts.' });
    }
  });

  app.get('/api/admin/submissions/:id/download', requireAdmin, async (req, res) => {
    try {
      const access = await getAdminSubmissionAccess(String(req.params.id));
      res.json(access);
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Impossible de préparer la lecture du dépôt.' });
    }
  });

  app.patch('/api/admin/submissions/:id', requireAdmin, async (req, res) => {
    try {
      const { status, organizerNote } = (req.body || {}) as {
        status?: SubmissionStatus;
        organizerNote?: string;
      };
      const updated = await updateAdminSubmissionReview(String(req.params.id), {
        status,
        organizerNote,
      });
      res.json({ submission: updated });
    } catch (error) {
      if (isSubmissionHttpError(error)) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Mise à jour du dépôt impossible.' });
    }
  });

  // Organizer CMS: Create News Article
  app.post('/api/admin/news', requireAdmin, async (req, res) => {
    try {
      const { title, category, excerpt, content, imageKey, status } = req.body as {
        title?: string;
        category?: NewsArticle['category'];
        excerpt?: string;
        content?: string;
        imageKey?: MediaAssetKey;
        status?: PublicationStatus;
      };
      if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
        res.status(400).json({ error: 'Titre, extrait et texte sont requis.' });
        return;
      }
      const created = await createNewsRecord({
        title,
        category,
        excerpt,
        content,
        imageKey,
        status,
      });
      res.status(201).json({ article: created });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || "Impossible d'enregistrer l'article." });
    }
  });

  // Organizer CMS: Update News Article
  app.patch('/api/admin/news/:id', requireAdmin, async (req, res) => {
    try {
      const updated = await updateNewsRecord(String(req.params.id), {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        category: req.body.category,
        status: req.body.status,
        imageKey: req.body.imageKey,
      });
      if (!updated) {
        res.status(404).json({ error: 'Article introuvable.' });
        return;
      }
      res.json({ article: updated });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || 'Mise à jour impossible.' });
    }
  });

  // Organizer CMS: Update Google Apps Script webhook URL
  app.patch('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const { googleAppsScriptUrl } = req.body as { googleAppsScriptUrl?: string };
      const updated = await updateSettingsRecord(googleAppsScriptUrl || '');
      res.json({ settings: updated });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || "Impossible d'enregistrer les paramètres." });
    }
  });

  // Organizer CMS: Switch Public Site Architecture (Multi-page vs Phase-focused Single Page)
  app.patch('/api/admin/site-config', requireAdmin, async (req, res) => {
    try {
      const body = (req.body || {}) as {
        mode?: string;
        activePhaseId?: string;
        customNotice?: string;
        alsoRevealPhase?: boolean;
        alsoOpenSubmissions?: boolean;
      };

      const nextConfig = normalizeSiteDisplayConfig({
        mode: body.mode,
        activePhaseId: body.activePhaseId,
        customNotice: body.customNotice,
      });

      const savedConfig = await updateSiteDisplayRecord(nextConfig);
      let updatedPhase = null;

      if (
        savedConfig.mode === 'phase_single_page' &&
        (body.alsoRevealPhase || body.alsoOpenSubmissions)
      ) {
        const isPresentiel = savedConfig.activePhaseId === 'phase-3';
        updatedPhase = await updatePhaseRecord(savedConfig.activePhaseId, {
          ...(body.alsoRevealPhase
            ? { isRevealed: true, statusLabel: 'Ouverte' }
            : {}),
          ...(body.alsoOpenSubmissions && !isPresentiel
            ? { submissionsOpen: true }
            : {}),
        });
      }

      const freshStore = await readStore();
      res.json({
        siteDisplay: savedConfig,
        updatedPhase,
        phases: freshStore.phases,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        error: err.message || "Impossible de mettre à jour le mode d'affichage du site.",
      });
    }
  });

  // Organizer CMS: Test Google Apps Script GET endpoint
  app.post('/api/admin/test-gas', requireAdmin, async (req, res) => {
    const { url } = req.body as { url?: string };
    const target = (url || '').trim();
    if (!target) {
      res.status(400).json({ error: "Veuillez saisir l'URL Google Apps Script." });
      return;
    }
    try {
      const response = await fetch(target, { method: 'GET', redirect: 'follow' });
      const text = await response.text();
      let parsed: { ok?: boolean; service?: string } | null = null;
      try {
        parsed = JSON.parse(text) as { ok?: boolean; service?: string };
      } catch {
        res.status(502).json({
          error:
            "L'URL a renvoyé une page HTML au lieu de JSON. Vérifiez que le déploiement est configuré sur « Qui a accès : Tout le monde » et se termine par /exec.",
        });
        return;
      }
      if (!response.ok || !parsed?.ok) {
        res.status(502).json({
          error: `Réponse inattendue du script Google (HTTP ${response.status}).`,
        });
        return;
      }
      res.json({ ok: true, service: parsed.service || 'Google Apps Script connecté' });
    } catch {
      res.status(502).json({
        error: "Impossible de joindre l'URL Google Apps Script.",
      });
    }
  });

  // Explicit API 404 & JSON error guard so /api/* never returns HTML
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Point de terminaison API introuvable.' });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint API introuvable.' });
  });

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.path.startsWith('/api/')) {
        res.status(500).json({ error: err?.message || 'Erreur interne du serveur.' });
        return;
      }
      next(err);
    },
  );
}
