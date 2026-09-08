// lib/entityResolver.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { clubs, clubAliases } from '@/db/schema';
import { EntityResolver } from './entityResolver';

describe('EntityResolver', () => {
  let resolver: EntityResolver;

  beforeAll(async () => {
    const [club] = await db
      .insert(clubs)
      .values({ canonicalName: 'Cult Bellandur' })
      .returning({ id: clubs.id });

    await db.insert(clubAliases).values([
      { clubId: club.id, aliasText: 'Cult Bellandur' },
      { clubId: club.id, aliasText: 'NA (Cult - Bellandur)' },
    ]);

    resolver = new EntityResolver();
    await resolver.load();
  });

  it('resolves an exact-match alias', () => {
    const result = resolver.resolveClub('Cult Bellandur');
    expect(result.canonical).toBe('Cult Bellandur');
    expect(result.resolved).toBe(true);
  });

  it('resolves the real punctuation-variant club string from the PDF', () => {
    // Actual printed text: "NA (Cult - Bellandur)" — space before the hyphen
    const result = resolver.resolveClub('NA (Cult - Bellandur)');
    expect(result.canonical).toBe('Cult Bellandur');
    expect(result.resolved).toBe(true);
  });

  it('flags a genuinely unmapped club instead of guessing', () => {
    const result = resolver.resolveClub('Some Brand New Club');
    expect(result.resolved).toBe(false);
    expect(result.canonical).toBe('Some Brand New Club');
  });
});