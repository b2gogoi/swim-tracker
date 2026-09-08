import { db } from '@/db';
import { rawIngestionLog } from '@/db/schema';
import { computeContentHash } from './content-hash';
import type { ParsedLine } from './types';

export async function ingestLine(line: ParsedLine) {
  const contentHash = computeContentHash({
    meetId: line.meetId,
    pageNumber: line.pageNumber,
    rawLineText: line.rawLineText,
  });

  const result = await db
    .insert(rawIngestionLog)
    .values({ ...line, contentHash })
    .onConflictDoNothing({ target: rawIngestionLog.contentHash })
    .returning({ id: rawIngestionLog.id });

  if (result.length === 0) {
    console.log(
      `Skipped duplicate: page ${line.pageNumber}, "${line.rawLineText.slice(0, 40)}..."`
    );
  }
  return result[0]?.id ?? null;
}