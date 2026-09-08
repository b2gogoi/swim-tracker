import { createHash } from 'crypto';

export function computeContentHash(params: {
  meetId: string;
  pageNumber: number;
  rawLineText: string;
}): string {
  const normalized = `${params.meetId}|${params.pageNumber}|${params.rawLineText.trim()}`;
  return createHash('sha256').update(normalized).digest('hex');
}