import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

// Create a single shared pool
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 10,              // optional: pool size
  idleTimeoutMillis: 0  // optional: never force-close idle
});

// Optional: quick connectivity check on startup (logs only)
pool.connect()
  .then(client => {
    return client
      .query('SELECT 1')
      .then(() => {
        console.log('[db] Connected to PostgreSQL');
        client.release();
      })
      .catch(err => {
        client.release();
        console.error('[db] Ping failed:', err.message);
      });
  })
  .catch(err => {
    console.error('[db] Pool connect error:', err.message);
  });

// Graceful shutdown (optional)
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('[db] Pool closed');
  } finally {
    process.exit(0);
  }
});
