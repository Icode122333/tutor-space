/**
 * Apply payment_provider migration to remote Supabase.
 * Requires DATABASE_URL in .env (Supabase → Settings → Database → Connection string → URI)
 *
 * Run: npm run db:migrate:payment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
    console.error(
        'Missing DATABASE_URL in .env\n' +
            'Get it from Supabase Dashboard → Project Settings → Database → Connection string (URI)\n' +
            'Example: postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres',
    );
    process.exit(1);
}

const migrationPath = path.join(
    root,
    'supabase/migrations/20260612000000_add_payment_provider.sql',
);
const sql = fs.readFileSync(migrationPath, 'utf8');

const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
});

try {
    await client.connect();
    console.log('Connected. Applying payment_provider migration…');
    await client.query(sql);
    console.log('Migration applied successfully.');
} catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
} finally {
    await client.end();
}
