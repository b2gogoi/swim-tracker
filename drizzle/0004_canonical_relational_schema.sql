CREATE TYPE "public"."course" AS ENUM('LC', 'SC');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F');--> statement-breakpoint
CREATE TYPE "public"."result_status" AS ENUM('official', 'DQ', 'DNF', 'DNS', 'SCR');--> statement-breakpoint
CREATE TABLE "club_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"alias_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "clubs_canonical_name_unique" UNIQUE("canonical_name")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meet_id" uuid NOT NULL,
	"event_number" integer NOT NULL,
	"gender" "gender" NOT NULL,
	"age_group_min" integer NOT NULL,
	"age_group_max" integer NOT NULL,
	"distance_meters" integer NOT NULL,
	"course" "course" NOT NULL,
	"stroke" text NOT NULL,
	"raw_event_header" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meet_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"swimmer_id" uuid NOT NULL,
	"club_id" uuid,
	"age_at_meet" integer NOT NULL,
	"place" integer,
	"finals_time_text" text NOT NULL,
	"finals_time_seconds" numeric(8, 2),
	"points" numeric(6, 2),
	"status" "result_status" DEFAULT 'official' NOT NULL,
	"raw_log_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "swimmers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "meets" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "meets" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "meets" ADD COLUMN "end_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "meets" ADD COLUMN "course" "course" DEFAULT 'LC' NOT NULL;--> statement-breakpoint
ALTER TABLE "club_aliases" ADD CONSTRAINT "club_aliases_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_swimmer_id_swimmers_id_fk" FOREIGN KEY ("swimmer_id") REFERENCES "public"."swimmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_raw_log_id_raw_ingestion_log_id_fk" FOREIGN KEY ("raw_log_id") REFERENCES "public"."raw_ingestion_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_aliases_alias_text_idx" ON "club_aliases" USING btree ("alias_text");--> statement-breakpoint
CREATE UNIQUE INDEX "events_meet_number_agegroup_idx" ON "events" USING btree ("meet_id","event_number","gender","age_group_min","age_group_max");--> statement-breakpoint
CREATE INDEX "events_metadata_idx" ON "events" USING btree ("gender","stroke","distance_meters");--> statement-breakpoint
CREATE INDEX "results_time_idx" ON "results" USING btree ("finals_time_seconds");--> statement-breakpoint
CREATE INDEX "results_age_idx" ON "results" USING btree ("age_at_meet");--> statement-breakpoint
CREATE INDEX "results_event_idx" ON "results" USING btree ("event_id");