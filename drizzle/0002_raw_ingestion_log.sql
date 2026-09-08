CREATE TABLE "meets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raw_ingestion_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meet_id" uuid,
	"page_number" integer NOT NULL,
	"raw_event_header" text NOT NULL,
	"raw_line_text" text NOT NULL,
	"raw_tokens" jsonb NOT NULL,
	"raw_extracted_club" text NOT NULL,
	"raw_extracted_name" text NOT NULL,
	"raw_extracted_time" text NOT NULL,
	"bounding_box" jsonb,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "raw_ingestion_log" ADD CONSTRAINT "raw_ingestion_log_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "raw_ingestion_log_content_hash_idx" ON "raw_ingestion_log" USING btree ("content_hash");