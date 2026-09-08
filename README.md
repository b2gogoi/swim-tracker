# swim-tracker
Track data across meets

# Schema migration
Node doesn't have a native WebSocket global by default, so the connection never actually establishes — it just hangs.
npm install ws
npm install --save-dev @types/ws


# Infra
# .husky/pre-commit
echo "npm run lint" > .husky/pre-commit

# .husky/commit-msg
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg


npx vercel link
# NEON
 Enable gen_random_uuid() before generating, since Drizzle's defaultRandom() compiles to that Postgres function and Neon doesn't always have pgcrypto enabled by default. Add a one-off raw SQL migration or run this once in Neon's SQL Editor:

CREATE EXTENSION IF NOT EXISTS pgcrypto;

Check:
SELECT * FROM pg_available_extensions WHERE name = 'pgcrypto';
-- installed_version column should not be empty

