// lib/ingestion/ingest-row.ts
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { rawIngestionLog, results, clubs } from '@/db/schema';
import { EntityResolver } from '../entityResolver';
import { computeContentHash } from './content-hash';
import { parseTimeToSeconds } from './parse-time';
import type { ParsedLine } from './types';

interface IngestRowParams {
  line: ParsedLine;
  eventId: string;
  swimmerId: string;
  ageAtMeet: number;
  place: number | null;
  resolver: EntityResolver; // pass in an already-.load()ed resolver
}

export async function ingestRow(params: IngestRowParams) {
  const { line, eventId, swimmerId, ageAtMeet, place, resolver } = params;

  const contentHash = computeContentHash({
    meetId: line.meetId,
    pageNumber: line.pageNumber,
    rawLineText: line.rawLineText,
  });

  const resolvedClub = resolver.resolveClub(line.rawExtractedClub);
  const timeSeconds = parseTimeToSeconds(line.rawExtractedTime);
  const status = ['DQ', 'DNF', 'DNS', 'SCR'].includes(line.rawExtractedTime)
    ? (line.rawExtractedTime as 'DQ' | 'DNF' | 'DNS')
    : 'official';

  return db.transaction(async (tx) => {
    // 1. Write immutable original to raw_ingestion_log (idempotent via content_hash)
    const [rawLog] = await tx
      .insert(rawIngestionLog)
      .values({ ...line, contentHash })
      .onConflictDoNothing({ target: rawIngestionLog.contentHash })
      .returning({ id: rawIngestionLog.id });

    // Already ingested — skip creating a duplicate result too
    if (!rawLog) {
      return { skipped: true as const };
    }

    // 2. Find-or-create the canonical club (resolvedClub.canonical may be
    //    a genuinely new, never-before-seen name if resolver.resolved was false)
    const [club] = await tx
      .insert(clubs)
      .values({ canonicalName: resolvedClub.canonical })
      .onConflictDoNothing({ target: clubs.canonicalName })
      .returning({ id: clubs.id });

    const clubId =
      club?.id ??
      (
        await tx
          .select({ id: clubs.id })
          .from(clubs)
          .where(eq(clubs.canonicalName, resolvedClub.canonical))
          .limit(1)
      )[0].id;

    // 3. Write standardized entity to canonical results
    const [result] = await tx
      .insert(results)
      .values({
        meetId: line.meetId,
        eventId,
        swimmerId,
        clubId,
        ageAtMeet,
        place,
        finalsTimeText: line.rawExtractedTime,
        finalsTimeSeconds: timeSeconds !== null ? String(timeSeconds) : null,
        status,
        rawLogId: rawLog.id,
      })
      .returning();

    return { skipped: false as const, rawLogId: rawLog.id, resultId: result.id };
  });
}