import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from './index';

describe('Drizzle + Neon connection', () => {
  it('connects and can run a trivial query', async () => {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    expect(Number(result.rows[0].ok)).toBe(1);
  });

  it('has applied the baseline migration', async () => {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      ) AS migration_table_exists
    `);
    expect(result.rows[0].migration_table_exists).toBe(true);
  });
});