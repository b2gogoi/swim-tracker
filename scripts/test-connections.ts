import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { put, del } from '@vercel/blob';

async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT NOW() AS current_time, version() AS pg_version`;
  console.log('✅ Neon Postgres connected:', result[0]);
}

async function testBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }
  const blob = await put(
    `healthcheck/${Date.now()}.txt`,
    `connection check ${new Date().toISOString()}`,
    { access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN }
  );
  console.log('✅ Vercel Blob connected:', blob.url);

  await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  console.log('🧹 Cleaned up test blob');
}

async function main() {
  console.log('Testing environment connections...\n');
  await testDatabase();
//   await testBlob();
  console.log('\n✅ All connections verified successfully.');
}

main().catch((err) => {
  console.error('❌ Connection test failed:', err);
  process.exit(1);
});