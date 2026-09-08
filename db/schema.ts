// Baseline schema — intentionally empty.
// This exists so drizzle-kit has a target to diff against.
// Real tables get added here in a later step.
// db/schema.ts
// import { sql } from 'drizzle-orm';
import {
    pgTable,
    pgEnum,
    uuid,
    integer,
    text,
    numeric,
    date,
    jsonb,
    timestamp,
    uniqueIndex,
    index
  } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['M', 'F']);
export const courseEnum = pgEnum('course', ['LC', 'SC']);
export const resultStatusEnum = pgEnum('result_status', [
  'official',
  'DQ',
  'DNF',
  'DNS',
  'SCR',
]);
  
  // --- meets (extend your existing table) ---
export const meets = pgTable('meets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  course: courseEnum('course').notNull().default('LC'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});


// --- events ---
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    meetId: uuid('meet_id').notNull().references(() => meets.id),
    eventNumber: integer('event_number').notNull(),
    gender: genderEnum('gender').notNull(),
    ageGroupMin: integer('age_group_min').notNull(),
    ageGroupMax: integer('age_group_max').notNull(),
    distanceMeters: integer('distance_meters').notNull(),
    course: courseEnum('course').notNull(),
    stroke: text('stroke').notNull(), // Freestyle, Backstroke, Breaststroke, Butterfly, IM
    rawEventHeader: text('raw_event_header').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('events_meet_number_agegroup_idx').on(
      table.meetId,
      table.eventNumber,
      table.gender,
      table.ageGroupMin,
      table.ageGroupMax
    ),
    index('events_metadata_idx').on(
      table.gender,
      table.stroke,
      table.distanceMeters
    ),
  ]
);

// --- clubs + aliases ---
export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalName: text('canonical_name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const clubAliases = pgTable(
  'club_aliases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id').notNull().references(() => clubs.id),
    aliasText: text('alias_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex('club_aliases_alias_text_idx').on(table.aliasText)]
);

// --- swimmers ---
export const swimmers = pgTable('swimmers', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- results ---
export const results = pgTable(
  'results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    meetId: uuid('meet_id').notNull().references(() => meets.id),
    eventId: uuid('event_id').notNull().references(() => events.id),
    swimmerId: uuid('swimmer_id').notNull().references(() => swimmers.id),
    clubId: uuid('club_id').references(() => clubs.id), // nullable: may be unresolved at ingest time
    ageAtMeet: integer('age_at_meet').notNull(),
    place: integer('place'), // nullable: DQ/DNF/SCR rows have no place
    finalsTimeText: text('finals_time_text').notNull(), // "6:37.39", "DNF", "DQ"
    finalsTimeSeconds: numeric('finals_time_seconds', {
      precision: 8,
      scale: 2,
    }), // nullable: unparseable for DQ/DNF/SCR
    points: numeric('points', { precision: 6, scale: 2 }),
    status: resultStatusEnum('status').notNull().default('official'),
    rawLogId: uuid('raw_log_id').references(() => rawIngestionLog.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('results_time_idx').on(table.finalsTimeSeconds),
    index('results_age_idx').on(table.ageAtMeet),
    index('results_event_idx').on(table.eventId),
  ]
);


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
  