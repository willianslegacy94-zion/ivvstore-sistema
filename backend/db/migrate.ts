import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function ensureMigrationsTable(client: Awaited<ReturnType<typeof pool.connect>>) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL      PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(client: Awaited<ReturnType<typeof pool.connect>>): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>('SELECT filename FROM _migrations');
  return new Set(rows.map(r => r.filename));
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await ensureMigrationsTable(client);
    const applied = await getApplied(client);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  [skip]  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);

      console.log(`  [ok]    ${file}`);
      count++;
    }

    await client.query('COMMIT');
    console.log(`\nMigrations concluídas: ${count} nova(s) aplicada(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nErro na migration — rollback executado:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
