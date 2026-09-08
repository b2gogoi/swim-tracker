import { describe, it, expect, beforeAll } from 'vitest';
import { db } from './index';
import { meets, events, clubs, clubAliases, swimmers, results } from './schema';
import { eq } from 'drizzle-orm';

describe('Canonical & relational schema', () => {
  let meetId: string;
  let eventId: string;
  let clubId: string;
  let swimmerId: string;

  beforeAll(async () => {
    const [meet] = await db
      .insert(meets)
      .values({
        name: '27th Masters State Championship, Karnataka',
        location: 'Karnataka',
        startDate: '2026-08-29',
        endDate: '2026-08-30',
        course: 'LC',
      })
      .returning({ id: meets.id });
    meetId = meet.id;

    const [event] = await db
      .insert(events)
      .values({
        meetId,
        eventNumber: 1,
        gender: 'M',
        ageGroupMin: 40,
        ageGroupMax: 44,
        distanceMeters: 400,
        course: 'LC',
        stroke: 'Freestyle',
        rawEventHeader: 'Event 1 Men 40-44 400 LC Meter Freestyle',
      })
      .returning({ id: events.id });
    eventId = event.id;

    const [club] = await db
      .insert(clubs)
      .values({ canonicalName: 'Ray Center' })
      .returning({ id: clubs.id });
    clubId = club.id;

    await db.insert(clubAliases).values({ clubId, aliasText: 'Ray Center' });

    const [swimmer] = await db
      .insert(swimmers)
      .values({ fullName: 'Ashwin V' })
      .returning({ id: swimmers.id });
    swimmerId = swimmer.id;
  });

  it('inserts an official result with a parsed time', async () => {
    const [result] = await db
      .insert(results)
      .values({
        meetId,
        eventId,
        swimmerId,
        clubId,
        ageAtMeet: 42,
        place: 1,
        finalsTimeText: '6:37.39',
        finalsTimeSeconds: '397.39', // 6*60 + 37.39
        status: 'official',
      })
      .returning();

    expect(result.finalsTimeText).toBe('6:37.39');
    expect(Number(result.finalsTimeSeconds)).toBeCloseTo(397.39);
    expect(result.status).toBe('official');
  });

  it('allows a DNF result with no place or parsed time', async () => {
    const [dnfSwimmer] = await db
      .insert(swimmers)
      .values({ fullName: 'Prateek Giriraddi' })
      .returning({ id: swimmers.id });

    const [result] = await db
      .insert(results)
      .values({
        meetId,
        eventId,
        swimmerId: dnfSwimmer.id,
        ageAtMeet: 26,
        finalsTimeText: 'DNF',
        finalsTimeSeconds: null,
        place: null,
        status: 'DNF',
      })
      .returning();

    expect(result.status).toBe('DNF');
    expect(result.finalsTimeSeconds).toBeNull();
    expect(result.place).toBeNull();
  });

  it('enforces the unique (meet, event_number, gender, age_group) constraint', async () => {
    await expect(
      db.insert(events).values({
        meetId,
        eventNumber: 1,
        gender: 'M',
        ageGroupMin: 40,
        ageGroupMax: 44,
        distanceMeters: 400,
        course: 'LC',
        stroke: 'Freestyle',
        rawEventHeader: 'duplicate event',
      })
    ).rejects.toThrow();
  });

  it('enforces unique club alias text', async () => {
    await expect(
      db.insert(clubAliases).values({ clubId, aliasText: 'Ray Center' })
    ).rejects.toThrow();
  });

  it('can query results by the age index', async () => {
    const rows = await db.select().from(results).where(eq(results.ageAtMeet, 42));
    expect(rows.length).toBeGreaterThan(0);
  });
});