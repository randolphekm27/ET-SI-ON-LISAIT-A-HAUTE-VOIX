// server.ts
import express from "express";
import path2 from "node:path";
import fs2 from "node:fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// server/api.ts
import crypto2 from "node:crypto";

// server/store.ts
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
var DATA_DIR = process.env.VERCEL ? path.join("/tmp", "ucaep-data") : path.resolve(process.cwd(), "data");
var STORE_PATH = path.join(DATA_DIR, "store.json");
var DEFAULT_STORE = {
  settings: {
    googleAppsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || "",
    googleFormActionUrl: process.env.GOOGLE_FORM_ACTION_URL || "",
    officialEmail: "ucaeplokossa@gmail.com"
  },
  phases: [
    {
      id: "phase-1",
      number: "01",
      title: "La Plume",
      shortDescription: "Nous allons commencer par l'\xE9criture et l'expression personnelle, tranquillement depuis chez vous.",
      format: "En ligne",
      statusLabel: "\xC0 venir",
      isRevealed: false,
      imageKey: "plume",
      testDetails: {
        instructionsTitle: "Consigne \u2014 Phase 01 (Confidentiel)",
        theme: "Sujet communiqu\xE9 uniquement lors du lancement officiel.",
        instructions: "Les consignes exactes et le lien de d\xE9p\xF4t seront publi\xE9s sur la page Annonces au d\xE9marrage de la phase.",
        submissionNote: "D\xE9p\xF4t en ligne r\xE9serv\xE9 aux \xE9tudiants inscrits."
      }
    },
    {
      id: "phase-2",
      number: "02",
      title: "La Connaissance",
      shortDescription: "Ensuite, nous passerons aux id\xE9es, \xE0 la lecture et au partage des savoirs.",
      format: "En ligne",
      statusLabel: "Verrouill\xE9e",
      isRevealed: false,
      imageKey: "connaissance",
      testDetails: {
        instructionsTitle: "Consigne \u2014 Phase 02 (Confidentiel)",
        theme: "Th\xE9matiques communiqu\xE9es apr\xE8s la Phase 01.",
        instructions: "Le fonctionnement pr\xE9cis de cette \xE9tape sera partag\xE9 avec les candidats retenus au moment voulu.",
        submissionNote: "Acc\xE8s r\xE9serv\xE9 aux candidats qualifi\xE9s."
      }
    },
    {
      id: "phase-3",
      number: "03",
      title: "L'\xC9loquence",
      shortDescription: "Pour terminer, place \xE0 la prise de parole et \xE0 la rencontre avec le public sur le campus.",
      format: "En pr\xE9sentiel",
      statusLabel: "Verrouill\xE9e",
      isRevealed: false,
      imageKey: "eloquence",
      testDetails: {
        instructionsTitle: "Consigne \u2014 Finale (Confidentiel)",
        theme: "Sujets annonc\xE9s \xE0 l'approche de la finale.",
        instructions: "Les consignes de passage sur sc\xE8ne seront communiqu\xE9es apr\xE8s les qualifications.",
        submissionNote: "Finale en personne \xE0 l'ENSET de Lokossa."
      }
    }
  ],
  announcements: [
    {
      id: "ann-1",
      slug: "ouverture-des-inscriptions-edition-2026",
      title: "Les inscriptions sont ouvertes \xE0 l'ENSET",
      excerpt: "Vous pouvez d\xE8s maintenant remplir votre fiche d'inscription en ligne pour participer.",
      content: "Nous ouvrons les inscriptions pour l'\xE9dition 2026 du concours \xAB Et si on lisait \xE0 haute voix ? \xBB \xE0 l'ENSET de Lokossa.\n\nLa participation est gratuite et ouverte \xE0 tous les \xE9tudiants de l'\xE9cole, quelle que soit votre fili\xE8re ou votre ann\xE9e d'\xE9tude.\n\nSi vous avez envie d'essayer, remplissez simplement le formulaire en ligne avant le vendredi 20 novembre 2026. Nous publierons ici toutes les informations pour la suite.",
      publishedAt: "2026-11-10T09:00:00.000Z",
      status: "published",
      category: "Inscription",
      imageKey: "hero"
    },
    {
      id: "ann-2",
      slug: "calendrier-progressif-des-revelations",
      title: "Comment nous allons annoncer les \xE9preuves",
      excerpt: "Chaque \xE9tape sera d\xE9voil\xE9e ici au fur et \xE0 mesure, pour que tout le monde parte sur un pied d'\xE9galit\xE9.",
      content: "Pour que personne n'ait d'avance sur les autres, nous ne publions pas les sujets et consignes des trois phases d\xE8s aujourd'hui.\n\nNous d\xE9voilerons chaque \xE9tape ici m\xEAme, une annonce apr\xE8s l'autre. Pensez \xE0 repasser sur cette page de temps en temps pour suivre le fil du concours.",
      publishedAt: "2026-11-12T10:00:00.000Z",
      status: "published",
      category: "Organisation",
      imageKey: "campus"
    },
    {
      id: "ann-3",
      slug: "revelation-phase-1-la-plume",
      title: "Lancement de la Phase 01 : La Plume",
      excerpt: "Publication programm\xE9e pour d\xE9marrer la premi\xE8re \xE9tape.",
      content: "Cette annonce pr\xE9sentera les consignes de la Phase 01 d\xE8s sa mise en ligne par l'\xE9quipe.",
      publishedAt: "2026-12-01T08:00:00.000Z",
      scheduledAt: "2026-12-01T08:00:00.000Z",
      status: "scheduled",
      category: "Phase 01",
      imageKey: "plume"
    },
    {
      id: "ann-4",
      slug: "note-interne-jury-preparation",
      title: "Brouillon \u2014 Organisation de la finale",
      excerpt: "Note interne de l'\xE9quipe UCAEP.",
      content: "Document de travail interne en attente de validation par l'\xE9quipe.",
      publishedAt: "2026-11-12T12:00:00.000Z",
      status: "draft",
      category: "Interne",
      imageKey: "eloquence"
    }
  ],
  news: [
    {
      id: "news-1",
      slug: "lancement-culturel-enset-lokossa",
      title: "Pourquoi on lance ce concours \xE0 l'ENSET de Lokossa",
      category: "Vie du concours",
      publishedAt: "2026-11-08T14:00:00.000Z",
      readTime: "2 min",
      excerpt: "Entre les cours et les ateliers, on avait envie de cr\xE9er un moment pour \xE9crire, lire et parler ensemble.",
      content: [
        "\xC0 l'ENSET de Lokossa, nos journ\xE9es tournent beaucoup autour des mati\xE8res techniques et scientifiques. Mais savoir expliquer une id\xE9e, \xE9crire clairement et parler devant un groupe sert dans toutes les fili\xE8res.",
        "Avec \xAB Et si on lisait \xE0 haute voix ? \xBB, notre \xE9quipe UCAEP veut simplement ouvrir un espace ouvert \xE0 tout le monde, sans pression ni jargon.",
        "Que vous \xE9criviez d\xE9j\xE0 dans vos cahiers ou que ce soit votre toute premi\xE8re fois, vous avez votre place."
      ],
      imageKey: "campus",
      featured: true,
      status: "published"
    },
    {
      id: "news-2",
      slug: "trois-etapes-pour-reveler-les-voix",
      title: "De votre cahier jusqu'\xE0 la sc\xE8ne : comment tout s'encha\xEEne",
      category: "Coulisses",
      publishedAt: "2026-11-05T11:30:00.000Z",
      readTime: "2 min",
      excerpt: "\xC9crire d'abord au calme, partager ensuite ce qu'on sait, puis prendre la parole devant le campus.",
      content: [
        "On a voulu un parcours progressif. On commence calmement par l'\xE9crit avec La Plume, avant de passer \xE0 la lecture et \xE0 la culture g\xE9n\xE9rale dans La Connaissance.",
        "Pour la derni\xE8re phase, L'\xC9loquence, on se retrouve en personne devant le public pour \xE9couter les finalistes \xE0 voix haute."
      ],
      imageKey: "plume",
      featured: false,
      status: "published"
    },
    {
      id: "news-3",
      slug: "preparer-sa-candidature-etudiant",
      title: "Avant de vous inscrire, prenez une minute",
      category: "Candidats",
      publishedAt: "2026-11-03T09:15:00.000Z",
      readTime: "1 min",
      excerpt: "Ce qu'il vous faut sous la main pour remplir votre formulaire sans stress.",
      content: [
        "L'inscription est gratuite et ouverte aux \xE9tudiants de l'ENSET de Lokossa.",
        "Ayez simplement votre num\xE9ro matricule, une adresse e-mail que vous consultez r\xE9guli\xE8rement et deux ou trois phrases pour expliquer ce qui vous donne envie de participer."
      ],
      imageKey: "connaissance",
      featured: false,
      status: "published"
    },
    {
      id: "news-4",
      slug: "atelier-preparation-prise-de-parole",
      title: "Lire \xE0 haute voix, \xE7a change quoi ?",
      category: "Coulisses",
      publishedAt: "2026-10-29T16:00:00.000Z",
      readTime: "2 min",
      excerpt: "Quand on passe de la lecture silencieuse \xE0 la voix haute, le texte prend un autre rythme.",
      content: [
        "Lire un texte \xE0 voix haute oblige \xE0 ralentir, \xE0 respirer aux bons endroits et \xE0 faire attention \xE0 ce qu'on veut vraiment transmettre.",
        "C'est ce go\xFBt du partage et de l'\xE9coute qu'on veut faire vivre sur le campus cette ann\xE9e."
      ],
      imageKey: "eloquence",
      featured: false,
      status: "published"
    }
  ],
  registrations: [],
  contacts: []
};
var writeQueue = Promise.resolve();
async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf-8");
  }
}
async function readStore() {
  try {
    await ensureStoreFile();
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      settings: {
        ...DEFAULT_STORE.settings,
        ...parsed.settings || {},
        googleAppsScriptUrl: parsed.settings?.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || "",
        googleFormActionUrl: parsed.settings?.googleFormActionUrl || process.env.GOOGLE_FORM_ACTION_URL || ""
      },
      phases: parsed.phases?.length ? parsed.phases : DEFAULT_STORE.phases,
      announcements: parsed.announcements?.length ? parsed.announcements : DEFAULT_STORE.announcements,
      news: parsed.news?.length ? parsed.news : DEFAULT_STORE.news,
      registrations: parsed.registrations || [],
      contacts: parsed.contacts || []
    };
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}
async function writeStore(data) {
  await ensureStoreFile();
  const tmpPath = `${STORE_PATH}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, STORE_PATH);
}
function withStoreLock(fn) {
  const next = writeQueue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });
  writeQueue = next.then(
    () => void 0,
    () => void 0
  );
  return next;
}
function isAnnouncementPublic(a, now = /* @__PURE__ */ new Date()) {
  if (a.status === "published") return true;
  if (a.status === "scheduled" && a.scheduledAt) {
    const scheduledTime = Date.parse(a.scheduledAt);
    return !Number.isNaN(scheduledTime) && scheduledTime <= now.getTime();
  }
  return false;
}
function sanitizeAnnouncementForPublic(a) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    publishedAt: a.scheduledAt && a.status === "scheduled" ? a.scheduledAt : a.publishedAt,
    category: a.category,
    imageKey: a.imageKey
  };
}
function sanitizePhaseForPublic(phase) {
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
      testDetails: null
    };
  }
  return phase;
}
function sanitizeNewsForPublic(article) {
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
    featured: article.featured
  };
}
async function forwardToGoogleAppsScript(url, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12e3);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({
        source: "ucaep-concours-web",
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
        readingExperience: payload.readingExperience
      }),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Google Apps Script HTTP ${response.status}`);
    }
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("R\xE9ponse invalide re\xE7ue de Google Apps Script.");
    }
    if (!parsed || parsed.ok !== true) {
      throw new Error(parsed?.error || "Google Apps Script a refus\xE9 la sauvegarde.");
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}
async function saveRegistration(payload) {
  return withStoreLock(async (store) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedMatricule = payload.studentId.trim().toUpperCase();
    const duplicate = store.registrations.find(
      (r) => r.email.toLowerCase() === normalizedEmail || normalizedMatricule && r.studentId.toUpperCase() === normalizedMatricule
    );
    if (duplicate) {
      const err = new Error(
        "Une inscription existe d\xE9j\xE0 avec cette adresse e-mail ou ce num\xE9ro matricule."
      );
      err.statusCode = 409;
      throw err;
    }
    const seq = String(store.registrations.length + 1).padStart(4, "0");
    const referenceCode = `UCAEP-2026-${seq}`;
    const gasUrl = store.settings.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || "";
    const record = {
      ...payload,
      email: normalizedEmail,
      studentId: normalizedMatricule,
      id: crypto.randomUUID(),
      referenceCode,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      syncedToGoogleSheets: false,
      syncTarget: gasUrl ? "google_apps_script" : "local_archive"
    };
    if (gasUrl) {
      await forwardToGoogleAppsScript(gasUrl, record);
      record.syncedToGoogleSheets = true;
    }
    store.registrations.push(record);
    return record;
  });
}
async function saveContactMessage(payload) {
  return withStoreLock(async (store) => {
    const record = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.contacts.push(record);
    return record;
  });
}
function slugify(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72);
}

// server/api.ts
function getOrganizerCode() {
  return (process.env.ORGANIZER_ACCESS_CODE || "UCAEP-LOKOSSA-2026").trim();
}
function getTokenSecret() {
  return crypto2.createHash("sha256").update(`ucaep-session:${getOrganizerCode()}`).digest("hex");
}
function createAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({ iat: Date.now(), nonce: crypto2.randomBytes(8).toString("hex") })
  ).toString("base64url");
  const sig = crypto2.createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyAdminToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto2.createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
  if (sig.length !== expected.length) return false;
  return crypto2.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
function requireAdmin(req, res, next) {
  const customHeader = req.headers["x-ucaep-admin-token"];
  const customToken = Array.isArray(customHeader) ? customHeader[0] : customHeader || "";
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const token = customToken.trim() || bearerToken;
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: "Connexion organisateur requise." });
    return;
  }
  next();
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function registerApiRoutes(app) {
  app.get("/api/announcements", async (_req, res) => {
    try {
      const store = await readStore();
      const now = /* @__PURE__ */ new Date();
      const published = store.announcements.filter((a) => isAnnouncementPublic(a, now)).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map(sanitizeAnnouncementForPublic);
      res.json({ announcements: published });
    } catch {
      res.status(500).json({ error: "Impossible de charger les annonces." });
    }
  });
  app.get("/api/announcements/:slug", async (req, res) => {
    try {
      const store = await readStore();
      const now = /* @__PURE__ */ new Date();
      const match = store.announcements.find(
        (a) => a.slug === req.params.slug && isAnnouncementPublic(a, now)
      );
      if (!match) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }
      res.json({ announcement: sanitizeAnnouncementForPublic(match) });
    } catch {
      res.status(500).json({ error: "Impossible de charger cette annonce." });
    }
  });
  app.get("/api/phases", async (_req, res) => {
    try {
      const store = await readStore();
      res.json({ phases: store.phases.map(sanitizePhaseForPublic) });
    } catch {
      res.status(500).json({ error: "Impossible de charger le parcours." });
    }
  });
  app.get("/api/news", async (_req, res) => {
    try {
      const store = await readStore();
      const published = store.news.filter((n) => n.status === "published").sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map(sanitizeNewsForPublic);
      res.json({ news: published });
    } catch {
      res.status(500).json({ error: "Impossible de charger les actualit\xE9s." });
    }
  });
  app.get("/api/news/:slug", async (req, res) => {
    try {
      const store = await readStore();
      const match = store.news.find(
        (n) => n.slug === req.params.slug && n.status === "published"
      );
      if (!match) {
        res.status(404).json({ error: "Article introuvable." });
        return;
      }
      res.json({ article: sanitizeNewsForPublic(match) });
    } catch {
      res.status(500).json({ error: "Impossible de charger cet article." });
    }
  });
  app.post("/api/registrations", async (req, res) => {
    try {
      const body = req.body;
      const requiredStrings = [
        ["firstName", "Indiquez votre pr\xE9nom pour continuer."],
        ["lastName", "Indiquez votre nom pour continuer."],
        ["email", "Indiquez votre adresse e-mail pour continuer."],
        ["phone", "Indiquez votre num\xE9ro de t\xE9l\xE9phone pour continuer."],
        ["birthDate", "Indiquez votre date de naissance pour continuer."],
        ["institution", "Pr\xE9cisez votre \xE9tablissement pour continuer."],
        ["department", "Pr\xE9cisez votre fili\xE8re ou d\xE9partement pour continuer."],
        ["studyLevel", "Pr\xE9cisez votre niveau d'\xE9tudes pour continuer."],
        ["studentId", "Indiquez votre num\xE9ro matricule pour continuer."],
        ["motivation", "Dites-nous en quelques mots ce qui vous donne envie de participer."]
      ];
      for (const [key, message] of requiredStrings) {
        const val = body[key];
        if (typeof val !== "string" || val.trim().length === 0) {
          res.status(400).json({ error: message });
          return;
        }
      }
      if (!isValidEmail(body.email || "")) {
        res.status(400).json({ error: "Cette adresse e-mail ne semble pas correcte." });
        return;
      }
      if ((body.motivation || "").trim().length < 25) {
        res.status(400).json({
          error: "Dites-nous en au moins 25 caract\xE8res ce qui vous donne envie de participer."
        });
        return;
      }
      if (body.acceptRules !== true) {
        res.status(400).json({
          error: "Cochez la case d'accord pour valider votre inscription."
        });
        return;
      }
      const payload = {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        birthDate: body.birthDate.trim(),
        gender: body.gender === "F\xE9minin" || body.gender === "Masculin" ? body.gender : "Pr\xE9f\xE8re ne pas pr\xE9ciser",
        institution: body.institution.trim(),
        department: body.department.trim(),
        studyLevel: body.studyLevel.trim(),
        studentId: body.studentId.trim(),
        motivation: body.motivation.trim(),
        readingExperience: (body.readingExperience || "").trim(),
        acceptRules: true
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
        syncTarget: saved.syncTarget
      });
    } catch (error) {
      const err = error;
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(502).json({
        error: err.message || "L'envoi de votre inscription n'a pas abouti. Rien n'a \xE9t\xE9 enregistr\xE9, merci de r\xE9essayer."
      });
    }
  });
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
        res.status(400).json({ error: "Merci de remplir tous les champs." });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: "Cette adresse e-mail ne semble pas correcte." });
        return;
      }
      const saved = await saveContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      });
      res.status(201).json({ saved: true, id: saved.id });
    } catch {
      res.status(500).json({
        error: "Votre message n'a pas pu \xEAtre envoy\xE9 pour le moment. R\xE9essayez dans un instant."
      });
    }
  });
  app.post("/api/admin/auth", (req, res) => {
    const { code } = req.body || {};
    if (!code || code.trim() !== getOrganizerCode()) {
      res.status(401).json({ error: "Ce code d'acc\xE8s ne correspond pas." });
      return;
    }
    res.json({ token: createAdminToken() });
  });
  app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
    const store = await readStore();
    res.json({
      announcements: store.announcements,
      phases: store.phases,
      news: store.news,
      registrations: store.registrations,
      contacts: store.contacts,
      settings: {
        googleAppsScriptUrl: store.settings.googleAppsScriptUrl
      }
    });
  });
  app.post("/api/admin/announcements", requireAdmin, async (req, res) => {
    const { title, excerpt, content, category, status, scheduledAt, imageKey } = req.body;
    if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
      res.status(400).json({ error: "Titre, extrait et contenu sont obligatoires." });
      return;
    }
    const created = await withStoreLock((store) => {
      const baseSlug = slugify(title) || `annonce-${Date.now()}`;
      const uniqueSlug = store.announcements.some((a) => a.slug === baseSlug) ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
      const item = {
        id: crypto2.randomUUID(),
        slug: uniqueSlug,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: (category || "Officiel").trim(),
        status: status || "draft",
        scheduledAt: status === "scheduled" && scheduledAt ? scheduledAt : void 0,
        publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        imageKey: imageKey || "campus"
      };
      store.announcements.unshift(item);
      return item;
    });
    res.status(201).json({ announcement: created });
  });
  app.patch("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
    const updated = await withStoreLock((store) => {
      const idx = store.announcements.findIndex((a) => a.id === req.params.id);
      if (idx === -1) return null;
      const current = store.announcements[idx];
      const nextStatus = req.body.status || current.status;
      store.announcements[idx] = {
        ...current,
        title: req.body.title?.trim() || current.title,
        excerpt: req.body.excerpt?.trim() || current.excerpt,
        content: req.body.content?.trim() || current.content,
        category: req.body.category?.trim() || current.category,
        status: nextStatus,
        scheduledAt: nextStatus === "scheduled" ? req.body.scheduledAt || current.scheduledAt : void 0,
        publishedAt: nextStatus === "published" && current.status !== "published" ? (/* @__PURE__ */ new Date()).toISOString() : current.publishedAt
      };
      return store.announcements[idx];
    });
    if (!updated) {
      res.status(404).json({ error: "Annonce introuvable." });
      return;
    }
    res.json({ announcement: updated });
  });
  app.patch("/api/admin/phases/:id", requireAdmin, async (req, res) => {
    const updated = await withStoreLock((store) => {
      const idx = store.phases.findIndex((p) => p.id === req.params.id);
      if (idx === -1) return null;
      const current = store.phases[idx];
      store.phases[idx] = {
        ...current,
        statusLabel: req.body.statusLabel || current.statusLabel,
        isRevealed: typeof req.body.isRevealed === "boolean" ? req.body.isRevealed : current.isRevealed,
        testDetails: req.body.testDetails ? {
          instructionsTitle: req.body.testDetails.instructionsTitle || current.testDetails?.instructionsTitle || "",
          theme: req.body.testDetails.theme || current.testDetails?.theme || "",
          instructions: req.body.testDetails.instructions || current.testDetails?.instructions || "",
          submissionNote: req.body.testDetails.submissionNote || current.testDetails?.submissionNote || ""
        } : current.testDetails
      };
      return store.phases[idx];
    });
    if (!updated) {
      res.status(404).json({ error: "Phase introuvable." });
      return;
    }
    res.json({ phase: updated });
  });
  app.post("/api/admin/news", requireAdmin, async (req, res) => {
    const { title, category, excerpt, content, imageKey, status } = req.body;
    if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
      res.status(400).json({ error: "Titre, extrait et texte sont requis." });
      return;
    }
    const created = await withStoreLock((store) => {
      const baseSlug = slugify(title) || `actualite-${Date.now()}`;
      const uniqueSlug = store.news.some((n) => n.slug === baseSlug) ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
      const paragraphs = content.split(/\n+/).map((p) => p.trim()).filter(Boolean);
      const item = {
        id: crypto2.randomUUID(),
        slug: uniqueSlug,
        title: title.trim(),
        category: category || "Vie du concours",
        publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        readTime: `${Math.max(1, Math.ceil(content.split(/\s+/).length / 180))} min`,
        excerpt: excerpt.trim(),
        content: paragraphs,
        imageKey: imageKey || "campus",
        featured: false,
        status: status || "published"
      };
      store.news.unshift(item);
      return item;
    });
    res.status(201).json({ article: created });
  });
  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    const { googleAppsScriptUrl } = req.body;
    const updated = await withStoreLock((store) => {
      store.settings.googleAppsScriptUrl = (googleAppsScriptUrl || "").trim();
      return store.settings;
    });
    res.json({ settings: updated });
  });
  app.post("/api/admin/test-gas", requireAdmin, async (req, res) => {
    const { url } = req.body;
    const target = (url || "").trim();
    if (!target) {
      res.status(400).json({ error: "Veuillez saisir l'URL Google Apps Script." });
      return;
    }
    try {
      const response = await fetch(target, { method: "GET", redirect: "follow" });
      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        res.status(502).json({
          error: "L'URL a renvoy\xE9 une page HTML au lieu de JSON. V\xE9rifiez que le d\xE9ploiement est configur\xE9 sur \xAB Qui a acc\xE8s : Tout le monde \xBB et se termine par /exec."
        });
        return;
      }
      if (!response.ok || !parsed?.ok) {
        res.status(502).json({
          error: `R\xE9ponse inattendue du script Google (HTTP ${response.status}).`
        });
        return;
      }
      res.json({ ok: true, service: parsed.service || "Google Apps Script connect\xE9" });
    } catch {
      res.status(502).json({
        error: "Impossible de joindre l'URL Google Apps Script."
      });
    }
  });
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "Point de terminaison API introuvable." });
  });
  app.use(
    (err, req, res, next) => {
      if (req.path.startsWith("/api/")) {
        res.status(500).json({ error: err?.message || "Erreur interne du serveur." });
        return;
      }
      next(err);
    }
  );
}

// server.ts
dotenv.config();
var PORT = Number(process.env.PORT) || 3e3;
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  registerApiRoutes(app);
  const distDir = path2.resolve(process.cwd(), "dist");
  const isProd = process.env.NODE_ENV === "production" || process.argv[1]?.endsWith("server.js") && fs2.existsSync(distDir);
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distDir, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UCAEP server running at http://localhost:${PORT}`);
  });
}
startServer();
