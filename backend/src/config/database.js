const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,

  // Supabase PostgreSQL requires SSL
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error(
    'Unexpected error on idle Postgres client:',
    err.message
  );
});

async function query(text, params) {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn('Slow query detected', {
        text,
        duration,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', {
      text,
      error: error.message,
    });

    throw error;
  }
}

module.exports = {
  pool,
  query,
};