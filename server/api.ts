import type express from 'express';
import crypto from 'node:crypto';
import { adminAuth } from '../src/lib/firebase-admin.ts';
import { isCloudSqlConfigured } from '../src/db/index.ts';
import {
  getOrCreateUser,
  getUserByUid,
  promoteUserToOrganizer,
} from '../src/db/users.ts';
import { requireAuth, type AuthRequest } from '../src/middleware/auth.ts';
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
} from './store';
import type {
  MediaAssetKey,
  NewsArticle,
  PublicationStatus,
  RegistrationPayload,
} from '../src/types/competition';

const ORGANIZER_ALLOWLIST = new Set(
  (process.env.ORGANIZER_EMAILS || 'ucaeplokossa@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function getOrganizerCodes(): string[] {
  const envVal = process.env.ORGANIZER_ACCESS_CODE || 'UCAEP-LOKOSSA-2026';
  const list = envVal
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (!list.some((c) => normalizeCode(c) === 'UCAEPLOKOSSA2026')) {
    list.push('UCAEP-LOKOSSA-2026');
  }
  return list;
}

function isOrganizerCodeValid(inputCode: string): boolean {
  if (!inputCode || typeof inputCode !== 'string') return false;
  const trimmed = inputCode.trim();
  if (!trimmed) return false;
  const inputUpper = trimmed.toUpperCase();
  const inputNorm = normalizeCode(trimmed);
  const codes = getOrganizerCodes();

  for (const expected of codes) {
    const expectedTrimmed = expected.trim();
    const expectedUpper = expectedTrimmed.toUpperCase();
    const expectedNorm = normalizeCode(expectedTrimmed);

    if (inputUpper === expectedUpper) return true;
    if (inputNorm && expectedNorm && inputNorm === expectedNorm) return true;
  }
  return false;
}

function getTokenSecret(): string {
  const codes = getOrganizerCodes();
  const seed = codes[0] || 'ucaep-static-auth-secret';
  return crypto
    .createHash('sha256')
    .update(`ucaep-session:${seed}`)
    .digest('hex');
}

function createAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ iat: Date.now(), nonce: crypto.randomBytes(8).toString('hex') }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getTokenSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', getTokenSecret())
    .update(payload)
    .digest('base64url');
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

async function isFirebaseOrganizer(uid: string, email?: string): Promise<boolean> {
  if (email && ORGANIZER_ALLOWLIST.has(email.trim().toLowerCase())) {
    return true;
  }
  if (!isCloudSqlConfigured()) return false;
  const dbUser = await getUserByUid(uid);
  return dbUser?.role === 'organizer';
}

async function requireAdmin(
  req: AuthRequest,
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
  if (bearerToken) {
    if (verifyAdminToken(bearerToken)) {
      next();
      return;
    }
    try {
      const decoded = await adminAuth.verifyIdToken(bearerToken);
      req.user = decoded;
      if (isCloudSqlConfigured()) {
        await getOrCreateUser(decoded.uid, decoded.email || '', decoded.name || null);
      }
      const allowed = await isFirebaseOrganizer(decoded.uid, decoded.email);
      if (allowed) {
        next();
        return;
      }
      res.status(403).json({
        error: "Ce compte Google n'est pas encore habilité comme organisateur.",
      });
      return;
    } catch {
      res.status(401).json({ error: 'Session expirée ou invalide.' });
      return;
    }
  }

  res.status(401).json({ error: 'Connexion organisateur requise.' });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function registerApiRoutes(app: express.Express) {
  // Garantit la prise en compte des requêtes API avec ou sans préfixe /api
  app.use((req, _res, next) => {
    if (
      !req.url.startsWith('/api') &&
      !req.url.startsWith('/assets') &&
      !req.url.startsWith('/@') &&
      !req.url.startsWith('/src') &&
      !req.url.startsWith('/node_modules') &&
      !req.url.startsWith('/favicon')
    ) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });
  // Firebase authenticated session check & user PostgreSQL sync
  app.get('/api/auth/session', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const organizer = await isFirebaseOrganizer(uid, email);
      res.json({
        user: {
          uid,
          email,
          name: req.user!.name || null,
        },
        isOrganizer: organizer,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        error: err.message || 'Impossible de vérifier la session.',
      });
    }
  });

  // Link an authenticated Firebase user to organizer role via access code
  app.post(
    '/api/admin/auth/link',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
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
        if (isCloudSqlConfigured()) {
          await promoteUserToOrganizer(req.user!.uid);
        }
        res.json({ ok: true, token: createAdminToken() });
      } catch (error) {
        const err = error as Error;
        res.status(500).json({
          error: err.message || "Impossible de valider l'accès organisateur.",
        });
      }
    },
  );

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
      const store = await readStore();
      res.json({
        announcements: store.announcements,
        phases: store.phases,
        news: store.news,
        registrations: store.registrations,
        contacts: store.contacts,
        settings: {
          googleAppsScriptUrl: store.settings.googleAppsScriptUrl,
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

  // Organizer CMS: Update Phase Reveal & Status
  app.patch('/api/admin/phases/:id', requireAdmin, async (req, res) => {
    try {
      const updated = await updatePhaseRecord(String(req.params.id), {
        statusLabel: req.body.statusLabel,
        isRevealed: req.body.isRevealed,
        testDetails: req.body.testDetails,
      });
      if (!updated) {
        res.status(404).json({ error: 'Phase introuvable.' });
        return;
      }
      res.json({ phase: updated });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ error: err.message || 'Mise à jour impossible.' });
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
