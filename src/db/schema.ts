import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type {
  MediaAssetKey,
  NewsArticle,
  PhaseTestDetails,
  PublicationStatus,
} from '../types/competition';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const phases = pgTable('phases', {
  id: text('id').primaryKey(),
  number: text('number').notNull(),
  title: text('title').notNull(),
  shortDescription: text('short_description').notNull(),
  format: text('format').$type<'En ligne' | 'En présentiel'>().notNull(),
  statusLabel: text('status_label')
    .$type<'À venir' | 'Ouverte' | 'En cours' | 'Verrouillée' | 'Clôturée'>()
    .notNull(),
  isRevealed: boolean('is_revealed').notNull().default(false),
  imageKey: text('image_key').$type<MediaAssetKey>().notNull(),
  testDetails: jsonb('test_details').$type<PhaseTestDetails | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  publishedAt: text('published_at').notNull(),
  scheduledAt: text('scheduled_at'),
  status: text('status').$type<PublicationStatus>().notNull().default('draft'),
  category: text('category').notNull(),
  imageKey: text('image_key').$type<MediaAssetKey>().notNull().default('campus'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const newsArticles = pgTable('news_articles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').$type<NewsArticle['category']>().notNull(),
  publishedAt: text('published_at').notNull(),
  readTime: text('read_time').notNull(),
  excerpt: text('excerpt').notNull(),
  content: jsonb('content').$type<string[]>().notNull(),
  imageKey: text('image_key').$type<MediaAssetKey>().notNull().default('campus'),
  featured: boolean('featured').notNull().default(false),
  status: text('status').$type<PublicationStatus>().notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const registrations = pgTable('registrations', {
  id: text('id').primaryKey(),
  referenceCode: text('reference_code').notNull().unique(),
  userUid: text('user_uid').references(() => users.uid),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  birthDate: text('birth_date').notNull(),
  gender: text('gender')
    .$type<'Féminin' | 'Masculin' | 'Préfère ne pas préciser'>()
    .notNull(),
  institution: text('institution').notNull(),
  department: text('department').notNull(),
  studyLevel: text('study_level').notNull(),
  studentId: text('student_id').notNull().unique(),
  motivation: text('motivation').notNull(),
  readingExperience: text('reading_experience').notNull().default(''),
  acceptRules: boolean('accept_rules').notNull().default(true),
  syncedToGoogleSheets: boolean('synced_to_google_sheets').notNull().default(false),
  syncTarget: text('sync_target')
    .$type<'google_apps_script' | 'google_forms' | 'local_archive'>()
    .notNull()
    .default('local_archive'),
  createdAt: text('created_at').notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userUid],
    references: [users.uid],
  }),
}));
