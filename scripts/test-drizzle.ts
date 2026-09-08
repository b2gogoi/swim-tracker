// test-db.ts
/* import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { db } from '../app/db/db';
import { connectionHealthcheck } from '../app/db/schema';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('Testing connection to Neon via Drizzle ORM...');

  try {
    // 1. Raw query sanity check
    // const rawResult = await db.execute(sql`SELECT NOW() as current_time;`);
    // console.log('Direct SQL Query Success:', rawResult);

    // 2. ORM Insert
   const insertResult = await db
      .insert(connectionHealthcheck)
      .values({ status: 'neon_drizzle_connected' })
      .returning();
    console.log('ORM Insert Success:', insertResult[0]);

    // 3. ORM Query
    const queryResult = await db
      .select()
      .from(connectionHealthcheck)
      .limit(1);
    console.log('ORM Select Success:', queryResult);

    // 4. Cleanup test row
   /*  await db
      .delete(connectionHealthcheck)
      .where(sql`id = ${insertResult[0].id}`);
    console.log('Cleanup Success: Test record removed.');

    console.log('\nVerdict: Drizzle ORM is fully operational with Neon.'); */
    process.exit(0);
  } catch (error) {
    console.error('Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();