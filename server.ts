import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  isAnnouncementPublic,
  readStore,
  sanitizeAnnouncementForPublic,
  sanitizeNewsForPublic,
  sanitizePhaseForPublic,
  saveContactMessage,
  saveRegistration,
  slugify,
  withStoreLock,
} from './server/store';
import type {
  Announcement,
  MediaAssetKey,
  NewsArticle,
  PublicationStatus,
  RegistrationPayload,
} from './src/types/competition';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const ORGANIZER_CODE = process.env.ORGANIZER_ACCESS_CODE || 'UCAEP-LOKOSSA-2026';
const TOKEN_SECRET = crypto
  .createHash('sha256')
  .update(`ucaep-session:${ORGANIZER_CODE}`)
  .digest('hex');

function createAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ iat: Date.now(), nonce: crypto.randomBytes(8).toString('hex') }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: 'Authentification organisateur requise.' });
    return;
  }
  next();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

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
        ['firstName', 'Le prénom est obligatoire.'],
        ['lastName', 'Le nom est obligatoire.'],
        ['email', "L'adresse e-mail est obligatoire."],
        ['phone', 'Le numéro de téléphone est obligatoire.'],
        ['birthDate', 'La date de naissance est obligatoire.'],
        ['institution', "L'établissement est obligatoire."],
        ['department', 'La filière ou le département est obligatoire.'],
        ['studyLevel', "Le niveau d'études est obligatoire."],
        ['studentId', 'Le numéro matricule est obligatoire.'],
        ['motivation', 'La présentation de votre motivation est obligatoire.'],
      ];

      for (const [key, message] of requiredStrings) {
        const val = body[key];
        if (typeof val !== 'string' || val.trim().length === 0) {
          res.status(400).json({ error: message });
          return;
        }
      }

      if (!isValidEmail(body.email || '')) {
        res.status(400).json({ error: "L'adresse e-mail saisie est invalide." });
        return;
      }

      if ((body.motivation || '').trim().length < 25) {
        res.status(400).json({
          error: 'Veuillez préciser votre motivation en au moins 25 caractères.',
        });
        return;
      }

      if (body.acceptRules !== true) {
        res.status(400).json({
          error:
            'Vous devez accepter le règlement du concours pour valider votre inscription.',
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
      res.status(502).json({
        error:
          err.message ||
          "L'enregistrement de votre candidature a échoué. Aucune confirmation n'a été validée ; veuillez réessayer.",
      });
    }
  });

  // Public API: Contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body as Record<string, string>;
      if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
        res.status(400).json({ error: 'Veuillez renseigner tous les champs.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Adresse e-mail invalide.' });
        return;
      }
      const saved = await saveContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      res.status(201).json({ saved: true, id: saved.id });
    } catch {
      res.status(500).json({
        error: "Impossible d'envoyer le message pour le moment. Veuillez réessayer.",
      });
    }
  });

  // Organizer CMS Auth
  app.post('/api/admin/auth', (req, res) => {
    const { code } = req.body as { code?: string };
    if (!code || code.trim() !== ORGANIZER_CODE) {
      res.status(401).json({ error: "Code d'accès organisateur incorrect." });
      return;
    }
    res.json({ token: createAdminToken() });
  });

  // Organizer CMS State
  app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
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
  });

  // Organizer CMS: Create Announcement
  app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
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

    const created = await withStoreLock((store) => {
      const baseSlug = slugify(title) || `annonce-${Date.now()}`;
      const uniqueSlug = store.announcements.some((a) => a.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const item: Announcement = {
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: (category || 'Officiel').trim(),
        status: status || 'draft',
        scheduledAt: status === 'scheduled' && scheduledAt ? scheduledAt : undefined,
        publishedAt: new Date().toISOString(),
        imageKey: imageKey || 'campus',
      };
      store.announcements.unshift(item);
      return item;
    });

    res.status(201).json({ announcement: created });
  });

  // Organizer CMS: Update Announcement Status or Content
  app.patch('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
    const updated = await withStoreLock((store) => {
      const idx = store.announcements.findIndex((a) => a.id === req.params.id);
      if (idx === -1) return null;
      const current = store.announcements[idx];
      const nextStatus = (req.body.status as PublicationStatus) || current.status;
      store.announcements[idx] = {
        ...current,
        title: req.body.title?.trim() || current.title,
        excerpt: req.body.excerpt?.trim() || current.excerpt,
        content: req.body.content?.trim() || current.content,
        category: req.body.category?.trim() || current.category,
        status: nextStatus,
        scheduledAt:
          nextStatus === 'scheduled'
            ? req.body.scheduledAt || current.scheduledAt
            : undefined,
        publishedAt:
          nextStatus === 'published' && current.status !== 'published'
            ? new Date().toISOString()
            : current.publishedAt,
      };
      return store.announcements[idx];
    });
    if (!updated) {
      res.status(404).json({ error: 'Annonce introuvable.' });
      return;
    }
    res.json({ announcement: updated });
  });

  // Organizer CMS: Update Phase Reveal & Status
  app.patch('/api/admin/phases/:id', requireAdmin, async (req, res) => {
    const updated = await withStoreLock((store) => {
      const idx = store.phases.findIndex((p) => p.id === req.params.id);
      if (idx === -1) return null;
      const current = store.phases[idx];
      store.phases[idx] = {
        ...current,
        statusLabel: req.body.statusLabel || current.statusLabel,
        isRevealed:
          typeof req.body.isRevealed === 'boolean'
            ? req.body.isRevealed
            : current.isRevealed,
        testDetails: req.body.testDetails
          ? {
              instructionsTitle:
                req.body.testDetails.instructionsTitle ||
                current.testDetails?.instructionsTitle ||
                '',
              theme: req.body.testDetails.theme || current.testDetails?.theme || '',
              instructions:
                req.body.testDetails.instructions ||
                current.testDetails?.instructions ||
                '',
              submissionNote:
                req.body.testDetails.submissionNote ||
                current.testDetails?.submissionNote ||
                '',
            }
          : current.testDetails,
      };
      return store.phases[idx];
    });
    if (!updated) {
      res.status(404).json({ error: 'Phase introuvable.' });
      return;
    }
    res.json({ phase: updated });
  });

  // Organizer CMS: Create News Article
  app.post('/api/admin/news', requireAdmin, async (req, res) => {
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
    const created = await withStoreLock((store) => {
      const baseSlug = slugify(title) || `actualite-${Date.now()}`;
      const uniqueSlug = store.news.some((n) => n.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;
      const paragraphs = content
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const item: NewsArticle = {
        id: crypto.randomUUID(),
        slug: uniqueSlug,
        title: title.trim(),
        category: category || 'Vie du concours',
        publishedAt: new Date().toISOString(),
        readTime: `${Math.max(1, Math.ceil(content.split(/\s+/).length / 180))} min`,
        excerpt: excerpt.trim(),
        content: paragraphs,
        imageKey: imageKey || 'campus',
        featured: false,
        status: status || 'published',
      };
      store.news.unshift(item);
      return item;
    });
    res.status(201).json({ article: created });
  });

  // Organizer CMS: Update Google Apps Script webhook URL
  app.patch('/api/admin/settings', requireAdmin, async (req, res) => {
    const { googleAppsScriptUrl } = req.body as { googleAppsScriptUrl?: string };
    const updated = await withStoreLock((store) => {
      store.settings.googleAppsScriptUrl = (googleAppsScriptUrl || '').trim();
      return store.settings;
    });
    res.json({ settings: updated });
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

  // Vite / Static Serving
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.argv[1]?.endsWith('server.js') && fs.existsSync(distDir));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UCAEP server running at http://localhost:${PORT}`);
  });
}

startServer();
