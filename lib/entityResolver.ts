// lib/entityResolver.ts
import { db } from '@/db';
import { clubs, clubAliases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface RawSwimRow {
  rawName: string;
  rawClub: string;
  rawTime: string;
  rawAge: string;
}

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s*-\s*/g, '-')   // collapse spaces around hyphens
    .replace(/\s+/g, ' ');       // collapse multiple spaces
}

export class EntityResolver {
  private aliasMap: Map<string, string> = new Map();
  private loaded = false;

  async load(): Promise<void> {
    const rows = await db
      .select({
        aliasText: clubAliases.aliasText,
        canonicalName: clubs.canonicalName,
      })
      .from(clubAliases)
      .innerJoin(clubs, eq(clubAliases.clubId, clubs.id));

    this.aliasMap = new Map(
      rows.map((r) => [normalize(r.aliasText), r.canonicalName])
    );
    this.loaded = true;
  }

  resolveClub(rawClub: string): { raw: string; canonical: string; resolved: boolean } {
    if (!this.loaded) {
      throw new Error('EntityResolver.load() must be called before resolveClub()');
    }
    const key = normalize(rawClub);
    const canonical = this.aliasMap.get(key);
    return {
      raw: rawClub,
      canonical: canonical ?? rawClub.trim(),
      resolved: canonical !== undefined,
    };
  }
}