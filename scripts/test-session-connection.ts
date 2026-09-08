// scripts/test-session-connection.ts
import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('Connecting...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const timeout = setTimeout(() => {
    console.error('❌ Timed out after 10s — connection never resolved');
    process.exit(1);
  }, 10000);

  const result = await pool.query('SELECT 1 as ok');
  clearTimeout(timeout);
  console.log('✅ Session connection works:', result.rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});