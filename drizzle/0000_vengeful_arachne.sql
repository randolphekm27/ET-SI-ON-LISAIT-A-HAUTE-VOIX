CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"category" text NOT NULL,
	"image_key" text DEFAULT 'campus' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'non_lu' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"read_time" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" jsonb NOT NULL,
	"image_key" text DEFAULT 'campus' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "news_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "competition_phases" (
	"id" text PRIMARY KEY NOT NULL,
	"phase_number" integer NOT NULL,
	"title" text NOT NULL,
	"short_description" text NOT NULL,
	"format" text NOT NULL,
	"status_label" text NOT NULL,
	"is_revealed" boolean DEFAULT false NOT NULL,
	"image_key" text NOT NULL,
	"test_details" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_code" text NOT NULL,
	"user_uid" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"birth_date" text NOT NULL,
	"gender" text NOT NULL,
	"institution" text NOT NULL,
	"department" text NOT NULL,
	"study_level" text NOT NULL,
	"student_id" text NOT NULL,
	"motivation" text NOT NULL,
	"reading_experience" text DEFAULT '' NOT NULL,
	"accept_rules" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"synced_to_google_sheets" boolean DEFAULT false NOT NULL,
	"sync_target" text DEFAULT 'local_archive' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "registrations_reference_code_unique" UNIQUE("reference_code"),
	CONSTRAINT "registrations_email_unique" UNIQUE("email"),
	CONSTRAINT "registrations_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_uid_users_uid_fk" FOREIGN KEY ("user_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;