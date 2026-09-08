// Baseline schema — intentionally empty.
// This exists so drizzle-kit has a target to diff against.
// Real tables get added here in a later step.
// db/schema.ts
// import { sql } from 'drizzle-orm';
import {
    pgTable,
    uuid,
    integer,
    text,
    jsonb,
    timestamp,
    uniqueIndex
  } from 'drizzle-orm/pg-core';
  
  export const meets = pgTable('meets', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  });

  export const rawIngestionLog = pgTable('raw_ingestion_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    meetId: uuid('meet_id').references(() => meets.id).notNull(),
    pageNumber: integer('page_number').notNull(),
    rawEventHeader: text('raw_event_header').notNull(),
    rawLineText: text('raw_line_text').notNull(),
    rawTokens: jsonb('raw_tokens').notNull().$type<string[]>(),
    rawExtractedClub: text('raw_extracted_club').notNull(),
    rawExtractedName: text('raw_extracted_name').notNull(),
    rawExtractedTime: text('raw_extracted_time').notNull(),
    boundingBox: jsonb('bounding_box').$type<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(),
    contentHash: text('content_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('raw_ingestion_log_content_hash_idx').on(table.contentHash),
  ]
);  
  